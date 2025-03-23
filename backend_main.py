import sys
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import logging
import asyncio
from enum import Enum

# Add project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the AI Hedge Fund modules
from src.utils.analysts import ANALYST_ORDER
from src.llm.models import LLM_ORDER, get_model_info
from src.tools.api import (
    get_prices, 
    get_financial_metrics, 
    search_line_items,
    get_insider_trades,
    get_company_news,
    get_market_cap,
    prices_to_df
)
from src.tools.akshare_api import is_ashare_ticker
from src.main import run_hedge_fund, validate_ticker
from src.backtester import Backtester

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("api")

# Initialize FastAPI app
app = FastAPI(
    title="AI Hedge Fund API",
    description="API for AI-powered hedge fund with support for US stocks and Chinese A-shares",
    version="1.0.0",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background tasks dict to store long-running tasks
background_tasks = {}

# ---- Pydantic Models ----

class TickerType(str, Enum):
    US = "US"
    ASHARE = "A-SHARE"

class TickerInfo(BaseModel):
    ticker: str
    name: Optional[str] = None
    type: TickerType
    exchange: Optional[str] = None
    valid: bool

class AnalystInfo(BaseModel):
    id: str
    display_name: str

class ModelInfo(BaseModel):
    model_name: str
    display_name: str
    provider: str

class AnalysisRequest(BaseModel):
    tickers: List[str]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    selected_analysts: List[str]
    model_name: str
    model_provider: str

class BacktestRequest(BaseModel):
    tickers: List[str]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    initial_capital: float = 100000.0
    margin_requirement: float = 0.0
    selected_analysts: List[str]
    model_name: str
    model_provider: str

class TaskStatus(BaseModel):
    task_id: str
    status: str
    progress: float = 0.0
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class StockData(BaseModel):
    ticker: str
    prices: Dict[str, Any]
    metrics: Dict[str, Any]
    market_cap: Optional[float] = None
    
class PortfolioPosition(BaseModel):
    long: int = 0
    short: int = 0
    long_cost_basis: float = 0.0
    short_cost_basis: float = 0.0
    short_margin_used: float = 0.0
    
class PortfolioState(BaseModel):
    cash: float
    margin_used: float = 0.0
    positions: Dict[str, PortfolioPosition]
    realized_gains: Dict[str, Dict[str, float]]

# ----- Helper Functions -----

def determine_ticker_type(ticker: str) -> TickerInfo:
    """Determine ticker type and validate format"""
    is_valid = validate_ticker(ticker)
    
    if is_ashare_ticker(ticker):
        exchange = ticker.split(".")[1]
        return TickerInfo(
            ticker=ticker,
            type=TickerType.ASHARE,
            exchange=exchange,
            valid=is_valid
        )
    else:
        return TickerInfo(
            ticker=ticker,
            type=TickerType.US,
            exchange="US",
            valid=is_valid
        )

def get_default_dates():
    """Get default date range: end_date = today, start_date = 3 months ago"""
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
    return start_date, end_date

async def run_analysis_task(
    task_id: str,
    tickers: List[str],
    start_date: str,
    end_date: str,
    selected_analysts: List[str],
    model_name: str, 
    model_provider: str
):
    """Run hedge fund analysis as a background task"""
    try:
        # Initialize task status
        background_tasks[task_id]["status"] = "running"
        background_tasks[task_id]["progress"] = 0.0
        
        # Initialize portfolio
        portfolio = {
            "cash": 100000.0,
            "margin_requirement": 0.0,
            "positions": {
                ticker: {
                    "long": 0,
                    "short": 0,
                    "long_cost_basis": 0.0,
                    "short_cost_basis": 0.0,
                    "short_margin_used": 0.0,
                } for ticker in tickers
            },
            "realized_gains": {
                ticker: {
                    "long": 0.0,
                    "short": 0.0,
                } for ticker in tickers
            }
        }
        
        # Run the hedge fund analysis
        result = run_hedge_fund(
            tickers=tickers,
            start_date=start_date,
            end_date=end_date,
            portfolio=portfolio,
            show_reasoning=True,
            selected_analysts=selected_analysts,
            model_name=model_name,
            model_provider=model_provider,
        )
        
        # Update task with result
        background_tasks[task_id]["status"] = "completed"
        background_tasks[task_id]["progress"] = 1.0
        background_tasks[task_id]["result"] = result
        
    except Exception as e:
        # Log the error and update task status
        logger.exception(f"Error running analysis: {e}")
        background_tasks[task_id]["status"] = "error"
        background_tasks[task_id]["error"] = str(e)

async def run_backtest_task(
    task_id: str,
    tickers: List[str],
    start_date: str,
    end_date: str,
    initial_capital: float,
    margin_requirement: float,
    selected_analysts: List[str],
    model_name: str,
    model_provider: str
):
    """Run backtesting as a background task"""
    try:
        # Initialize task status
        background_tasks[task_id]["status"] = "running"
        background_tasks[task_id]["progress"] = 0.0
        
        # Create backtester
        backtester = Backtester(
            agent=run_hedge_fund,
            tickers=tickers,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            model_name=model_name,
            model_provider=model_provider,
            selected_analysts=selected_analysts,
            initial_margin_requirement=margin_requirement,
        )
        
        # Run backtest
        performance_metrics = backtester.run_backtest()
        performance_df = backtester.analyze_performance()
        
        # Convert portfolio values to dict for JSON serialization
        portfolio_values = [value for value in backtester.portfolio_values]
        
        # Prepare the result
        result = {
            "portfolio_values": portfolio_values,
            "performance_metrics": performance_metrics,
            "final_portfolio": {
                "cash": backtester.portfolio["cash"],
                "positions": backtester.portfolio["positions"],
                "realized_gains": backtester.portfolio["realized_gains"],
            }
        }
        
        # Update task with result
        background_tasks[task_id]["status"] = "completed"
        background_tasks[task_id]["progress"] = 1.0
        background_tasks[task_id]["result"] = result
        
    except Exception as e:
        # Log the error and update task status
        logger.exception(f"Error running backtest: {e}")
        background_tasks[task_id]["status"] = "error"
        background_tasks[task_id]["error"] = str(e)

# ----- API Endpoints -----

@app.get("/", tags=["Status"])
async def root():
    """API status check endpoint"""
    return {"status": "online", "message": "AI Hedge Fund API is running"}

@app.get("/api/ticker-info/{ticker}", response_model=TickerInfo, tags=["Tickers"])
async def get_ticker_info(ticker: str):
    """Get information about a ticker symbol"""
    return determine_ticker_type(ticker)

@app.post("/api/validate-tickers", response_model=List[TickerInfo], tags=["Tickers"])
async def validate_tickers(tickers: List[str]):
    """Validate a list of ticker symbols"""
    return [determine_ticker_type(ticker) for ticker in tickers]

@app.get("/api/analysts", response_model=List[AnalystInfo], tags=["Configuration"])
async def get_analysts():
    """Get available analysts"""
    analysts = []
    for display, value in ANALYST_ORDER:
        analysts.append(AnalystInfo(id=value, display_name=display))
    return analysts

@app.get("/api/models", response_model=List[ModelInfo], tags=["Configuration"])
async def get_models():
    """Get available models"""
    models = []
    for display, value, provider in LLM_ORDER:
        models.append(ModelInfo(
            model_name=value,
            display_name=display,
            provider=provider
        ))
    return models

@app.get("/api/stock/{ticker}", response_model=StockData, tags=["Stock Data"])
async def get_stock_data(
    ticker: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get comprehensive stock data for a ticker"""
    # Validate ticker
    ticker_info = determine_ticker_type(ticker)
    if not ticker_info.valid:
        raise HTTPException(status_code=400, detail=f"Invalid ticker format: {ticker}")
    
    # Use default dates if not provided
    if not start_date or not end_date:
        start_date, end_date = get_default_dates()
    
    try:
        # Get price data
        prices = get_prices(ticker, start_date, end_date)
        prices_df = prices_to_df(prices)
        
        # Get financial metrics
        metrics = get_financial_metrics(ticker, end_date, limit=5)
        
        # Get market cap
        market_cap = get_market_cap(ticker, end_date)
        
        # Format data for response
        return StockData(
            ticker=ticker,
            prices=prices_df.reset_index().to_dict(orient="records"),
            metrics=[m.model_dump() for m in metrics],
            market_cap=market_cap
        )
    except Exception as e:
        logger.exception(f"Error getting stock data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prices/{ticker}", tags=["Stock Data"])
async def get_price_data(
    ticker: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get historical price data for a ticker"""
    # Validate ticker
    ticker_info = determine_ticker_type(ticker)
    if not ticker_info.valid:
        raise HTTPException(status_code=400, detail=f"Invalid ticker format: {ticker}")
    
    # Use default dates if not provided
    if not start_date or not end_date:
        start_date, end_date = get_default_dates()
    
    # 验证日期不能超过当前日期
    current_date = datetime.now().strftime("%Y-%m-%d")
    if end_date > current_date:
        end_date = current_date
        logger.warning(f"请求的结束日期超过当前日期，已自动调整为当前日期: {current_date}")
    if start_date > current_date:
        raise HTTPException(status_code=400, detail=f"开始日期不能超过当前日期: {start_date} > {current_date}")
    
    try:
        prices = get_prices(ticker, start_date, end_date)
        prices_df = prices_to_df(prices)
        return prices_df.reset_index().to_dict(orient="records")
    except Exception as e:
        logger.exception(f"Error getting price data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/financials/{ticker}", tags=["Stock Data"])
async def get_financials(
    ticker: str,
    end_date: Optional[str] = None
):
    """Get financial metrics for a ticker"""
    # Validate ticker
    ticker_info = determine_ticker_type(ticker)
    if not ticker_info.valid:
        raise HTTPException(status_code=400, detail=f"Invalid ticker format: {ticker}")
    
    # Use default end date if not provided
    if not end_date:
        _, end_date = get_default_dates()
    
    try:
        metrics = get_financial_metrics(ticker, end_date, limit=10)
        return [m.model_dump() for m in metrics]
    except Exception as e:
        logger.exception(f"Error getting financial metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/{ticker}", tags=["Stock Data"])
async def get_news(
    ticker: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50
):
    """Get news for a ticker"""
    # Validate ticker
    ticker_info = determine_ticker_type(ticker)
    if not ticker_info.valid:
        raise HTTPException(status_code=400, detail=f"Invalid ticker format: {ticker}")
    
    # Use default dates if not provided
    if not start_date or not end_date:
        start_date, end_date = get_default_dates()
    
    try:
        news = get_company_news(ticker, end_date, start_date, limit)
        return [n.model_dump() for n in news]
    except Exception as e:
        logger.exception(f"Error getting news: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/insider-trades/{ticker}", tags=["Stock Data"])
async def get_insider_activity(
    ticker: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50
):
    """Get insider trading activities for a ticker"""
    # Validate ticker
    ticker_info = determine_ticker_type(ticker)
    if not ticker_info.valid:
        raise HTTPException(status_code=400, detail=f"Invalid ticker format: {ticker}")
    
    # Use default dates if not provided
    if not start_date or not end_date:
        start_date, end_date = get_default_dates()
    
    try:
        trades = get_insider_trades(ticker, end_date, start_date, limit)
        return [t.model_dump() for t in trades]
    except Exception as e:
        logger.exception(f"Error getting insider trades: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze", response_model=TaskStatus, tags=["Analysis"])
async def analyze_stocks(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """Start a stock analysis task"""
    # Validate tickers
    invalid_tickers = []
    for ticker in request.tickers:
        if not validate_ticker(ticker):
            invalid_tickers.append(ticker)
    
    if invalid_tickers:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid ticker format: {', '.join(invalid_tickers)}"
        )
    
    # Use default dates if not provided
    if not request.start_date or not request.end_date:
        start_date, end_date = get_default_dates()
    else:
        start_date, end_date = request.start_date, request.end_date
    
    # 验证日期不能超过当前日期
    current_date = datetime.now().strftime("%Y-%m-%d")
    if end_date > current_date:
        end_date = current_date
        logger.warning(f"请求的结束日期超过当前日期，已自动调整为当前日期: {current_date}")
    if start_date > current_date:
        raise HTTPException(status_code=400, detail=f"开始日期不能超过当前日期: {start_date} > {current_date}")
    
    # Generate a task ID
    task_id = f"analysis_{datetime.now().strftime('%Y%m%d%H%M%S')}_{'-'.join(request.tickers)}"
    
    # Initialize task status
    background_tasks[task_id] = {
        "status": "pending",
        "progress": 0.0,
        "result": None,
        "error": None,
    }
    
    # Start the background task
    background_tasks.add_task(
        run_analysis_task,
        task_id,
        request.tickers,
        start_date,
        end_date,
        request.selected_analysts,
        request.model_name,
        request.model_provider,
    )
    
    return TaskStatus(
        task_id=task_id,
        status="pending",
        progress=0.0
    )

@app.post("/api/backtest", response_model=TaskStatus, tags=["Backtesting"])
async def run_backtest(
    request: BacktestRequest,
    background_tasks: BackgroundTasks
):
    """Start a backtesting task"""
    # Validate tickers
    invalid_tickers = []
    for ticker in request.tickers:
        if not validate_ticker(ticker):
            invalid_tickers.append(ticker)
    
    if invalid_tickers:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid ticker format: {', '.join(invalid_tickers)}"
        )
    
    # Use default dates if not provided
    if not request.start_date or not request.end_date:
        start_date, end_date = get_default_dates()
    else:
        start_date, end_date = request.start_date, request.end_date
    
    # 验证日期不能超过当前日期
    current_date = datetime.now().strftime("%Y-%m-%d")
    if end_date > current_date:
        end_date = current_date
        logger.warning(f"请求的结束日期超过当前日期，已自动调整为当前日期: {current_date}")
    if start_date > current_date:
        raise HTTPException(status_code=400, detail=f"开始日期不能超过当前日期: {start_date} > {current_date}")
    
    # Generate a task ID
    task_id = f"backtest_{datetime.now().strftime('%Y%m%d%H%M%S')}_{'-'.join(request.tickers)}"
    
    # Initialize task status
    background_tasks[task_id] = {
        "status": "pending",
        "progress": 0.0,
        "result": None,
        "error": None,
    }
    
    # Start the background task
    background_tasks.add_task(
        run_backtest_task,
        task_id,
        request.tickers,
        start_date,
        end_date,
        request.initial_capital,
        request.margin_requirement,
        request.selected_analysts,
        request.model_name,
        request.model_provider,
    )
    
    return TaskStatus(
        task_id=task_id,
        status="pending",
        progress=0.0
    )

@app.get("/api/task/{task_id}", response_model=TaskStatus, tags=["Tasks"])
async def get_task_status(task_id: str):
    """Get the status of a task"""
    if task_id not in background_tasks:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    
    task = background_tasks[task_id]
    return TaskStatus(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        result=task["result"],
        error=task["error"]
    )

@app.post("/api/portfolio", response_model=PortfolioState, tags=["Portfolio"])
async def update_portfolio(portfolio: PortfolioState):
    """Update portfolio state (for simulation or API testing)"""
    return portfolio

# ---- Run the FastAPI app ----
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8092)
