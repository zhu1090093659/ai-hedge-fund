import os
import pandas as pd
import requests
from datetime import datetime, timedelta
import numpy as np
import akshare as ak

from src.data.cache import get_cache
from src.data.models import (
    CompanyNews,
    CompanyNewsResponse,
    FinancialMetrics,
    FinancialMetricsResponse,
    Price,
    PriceResponse,
    LineItem,
    LineItemResponse,
    InsiderTrade,
    InsiderTradeResponse,
)

# Import akshare wrapper
from src.tools.akshare_api import (
    is_ashare_ticker,
    get_prices as get_ashare_prices,
    get_financial_metrics as get_ashare_financial_metrics,
    search_line_items as search_ashare_line_items,
    get_insider_trades as get_ashare_insider_trades,
    get_company_news as get_ashare_company_news,
    get_market_cap as get_ashare_market_cap,
)

# Global cache instance
_cache = get_cache()


def get_prices(ticker: str, start_date: str, end_date: str) -> list[Price]:
    """Fetch price data from cache or API, supporting both US stocks and A-shares."""
    # 处理美股指数
    if ticker.startswith("^"):
        return get_us_index_prices(ticker, start_date, end_date)
    
    # Determine if this is an A-share ticker
    if is_ashare_ticker(ticker):
        return get_ashare_prices(ticker, start_date, end_date)
    
    # Original US stock implementation
    # 将字符串日期转换为datetime.date对象
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
    
    # Check cache first
    if cached_data := _cache.get_prices(ticker):
        # Filter cached data by date range and convert to Price objects
        filtered_data = []
        for price in cached_data:
            # 将price["time"]转换为datetime.date对象进行比较
            if isinstance(price["time"], str):
                price_date = datetime.strptime(price["time"], "%Y-%m-%d").date()
            else:
                price_date = price["time"]
                
            if start_date_obj <= price_date <= end_date_obj:
                filtered_data.append(Price(**price))
                
        if filtered_data:
            return filtered_data

    # If not in cache or no data in range, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    url = f"https://api.financialdatasets.ai/prices/?ticker={ticker}&interval=day&interval_multiplier=1&start_date={start_date}&end_date={end_date}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")

    # Parse response with Pydantic model
    price_response = PriceResponse(**response.json())
    prices = price_response.prices

    if not prices:
        return []

    # Cache the results as dicts
    _cache.set_prices(ticker, [p.model_dump() for p in prices])
    return prices


def get_financial_metrics(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[FinancialMetrics]:
    """Fetch financial metrics from cache or API, supporting both US stocks and A-shares."""
    # Determine if this is an A-share ticker
    if is_ashare_ticker(ticker):
        return get_ashare_financial_metrics(ticker, end_date, period, limit)
    
    # Original US stock implementation
    # Check cache first
    if cached_data := _cache.get_financial_metrics(ticker):
        # Filter cached data by date and limit
        filtered_data = [FinancialMetrics(**metric) for metric in cached_data if metric["report_period"] <= end_date]
        filtered_data.sort(key=lambda x: x.report_period, reverse=True)
        if filtered_data:
            return filtered_data[:limit]

    # If not in cache or insufficient data, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    url = f"https://api.financialdatasets.ai/financial-metrics/?ticker={ticker}&report_period_lte={end_date}&limit={limit}&period={period}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")

    # Parse response with Pydantic model
    metrics_response = FinancialMetricsResponse(**response.json())
    # Return the FinancialMetrics objects directly instead of converting to dict
    financial_metrics = metrics_response.financial_metrics

    if not financial_metrics:
        return []

    # Cache the results as dicts
    _cache.set_financial_metrics(ticker, [m.model_dump() for m in financial_metrics])
    return financial_metrics


def search_line_items(
    ticker: str,
    line_items: list[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[LineItem]:
    """Fetch line items, supporting both US stocks and A-shares."""
    # Determine if this is an A-share ticker
    if is_ashare_ticker(ticker):
        return search_ashare_line_items(ticker, line_items, end_date, period, limit)
    
    # Original US stock implementation
    # If not in cache or insufficient data, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    url = "https://api.financialdatasets.ai/financials/search/line-items"

    body = {
        "tickers": [ticker],
        "line_items": line_items,
        "end_date": end_date,
        "period": period,
        "limit": limit,
    }
    response = requests.post(url, headers=headers, json=body)
    if response.status_code != 200:
        raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")
    data = response.json()
    response_model = LineItemResponse(**data)
    search_results = response_model.search_results
    if not search_results:
        return []

    # Cache the results
    return search_results[:limit]


def get_insider_trades(
    ticker: str,
    end_date: str,
    start_date: str | None = None,
    limit: int = 1000,
) -> list[InsiderTrade]:
    """Fetch insider trades, supporting both US stocks and A-shares."""
    # Determine if this is an A-share ticker
    if is_ashare_ticker(ticker):
        return get_ashare_insider_trades(ticker, end_date, start_date, limit)
    
    # Original US stock implementation
    # Check cache first
    if cached_data := _cache.get_insider_trades(ticker):
        # Filter cached data by date range
        filtered_data = [InsiderTrade(**trade) for trade in cached_data 
                        if (start_date is None or (trade.get("transaction_date") or trade["filing_date"]) >= start_date)
                        and (trade.get("transaction_date") or trade["filing_date"]) <= end_date]
        filtered_data.sort(key=lambda x: x.transaction_date or x.filing_date, reverse=True)
        if filtered_data:
            return filtered_data

    # If not in cache or insufficient data, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    all_trades = []
    current_end_date = end_date
    
    while True:
        url = f"https://api.financialdatasets.ai/insider-trades/?ticker={ticker}&filing_date_lte={current_end_date}"
        if start_date:
            url += f"&filing_date_gte={start_date}"
        url += f"&limit={limit}"
        
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")
        
        data = response.json()
        response_model = InsiderTradeResponse(**data)
        insider_trades = response_model.insider_trades
        
        if not insider_trades:
            break
            
        all_trades.extend(insider_trades)
        
        # Only continue pagination if we have a start_date and got a full page
        if not start_date or len(insider_trades) < limit:
            break
            
        # Update end_date to the oldest filing date from current batch for next iteration
        current_end_date = min(trade.filing_date for trade in insider_trades).split('T')[0]
        
        # If we've reached or passed the start_date, we can stop
        if current_end_date <= start_date:
            break

    if not all_trades:
        return []

    # Cache the results
    _cache.set_insider_trades(ticker, [trade.model_dump() for trade in all_trades])
    return all_trades


def get_company_news(
    ticker: str,
    end_date: str,
    start_date: str | None = None,
    limit: int = 1000,
) -> list[CompanyNews]:
    """Fetch company news, supporting both US stocks and A-shares."""
    # Determine if this is an A-share ticker
    if is_ashare_ticker(ticker):
        return get_ashare_company_news(ticker, end_date, start_date, limit)
    
    # Original US stock implementation
    # Check cache first
    if cached_data := _cache.get_company_news(ticker):
        # Filter cached data by date range
        filtered_data = [CompanyNews(**news) for news in cached_data 
                        if (start_date is None or news["date"] >= start_date)
                        and news["date"] <= end_date]
        filtered_data.sort(key=lambda x: x.date, reverse=True)
        if filtered_data:
            return filtered_data

    # If not in cache or insufficient data, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    all_news = []
    current_end_date = end_date
    
    while True:
        url = f"https://api.financialdatasets.ai/news/?ticker={ticker}&end_date={current_end_date}"
        if start_date:
            url += f"&start_date={start_date}"
        url += f"&limit={limit}"
        
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")
        
        data = response.json()
        response_model = CompanyNewsResponse(**data)
        company_news = response_model.news
        
        if not company_news:
            break
            
        all_news.extend(company_news)
        
        # Only continue pagination if we have a start_date and got a full page
        if not start_date or len(company_news) < limit:
            break
            
        # Update end_date to the oldest date from current batch for next iteration
        current_end_date = min(news.date for news in company_news).split('T')[0]
        
        # If we've reached or passed the start_date, we can stop
        if current_end_date <= start_date:
            break

    if not all_news:
        return []

    # Cache the results
    _cache.set_company_news(ticker, [news.model_dump() for news in all_news])
    return all_news


def get_market_cap(
    ticker: str,
    end_date: str,
) -> float | None:
    """Fetch market cap, supporting both US stocks and A-shares."""
    # Determine if this is an A-share ticker
    if is_ashare_ticker(ticker):
        return get_ashare_market_cap(ticker, end_date)
    
    # Original US stock implementation
    financial_metrics = get_financial_metrics(ticker, end_date)
    if not financial_metrics:
        return None
        
    market_cap = financial_metrics[0].market_cap
    if not market_cap:
        return None

    return market_cap


def prices_to_df(prices: list[Price]) -> pd.DataFrame:
    """Convert prices to a DataFrame."""
    df = pd.DataFrame([p.model_dump() for p in prices])
    df["Date"] = pd.to_datetime(df["time"])
    df.set_index("Date", inplace=True)
    numeric_cols = ["open", "close", "high", "low", "volume"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df.sort_index(inplace=True)
    return df


def get_us_index_prices(ticker: str, start_date: str, end_date: str) -> list[Price]:
    """获取美股指数数据"""
    # 指数代码映射
    index_mapping = {
        "^GSPC": ".INX",    # 标普500
        "^IXIC": ".IXIC",   # 纳斯达克综合指数
        "^DJI": ".DJI",     # 道琼斯工业平均指数
        "^NDX": ".NDX",     # 纳斯达克100
    }
    
    # 检查缓存
    if cached_data := _cache.get_prices(ticker):
        # 将字符串日期转换为datetime.date对象进行比较
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        # 过滤缓存数据
        filtered_data = []
        for price in cached_data:
            if isinstance(price["time"], str):
                price_date = datetime.strptime(price["time"], "%Y-%m-%d").date()
            else:
                price_date = price["time"]
                
            if start_date_obj <= price_date <= end_date_obj:
                filtered_data.append(Price(**price))
                
        if filtered_data:
            return filtered_data
    
    # 获取akshare使用的指数代码
    ak_symbol = index_mapping.get(ticker)
    if not ak_symbol:
        raise Exception(f"不支持的美股指数: {ticker}")
    
    try:
        # 获取指数数据
        df = ak.index_us_stock_sina(symbol=ak_symbol)
        
        # 确保df有日期列并排序
        if 'date' not in df.columns:
            # 如果没有日期列，我们使用当前日期
            df['date'] = datetime.now().strftime("%Y-%m-%d")
        
        # 按日期排序
        df = df.sort_values(by='date')
        
        # 转换为Price对象列表
        prices = []
        for _, row in df.iterrows():
            # 处理volume字段，确保能正确处理整数和字符串类型
            volume_value = row["volume"]
            if isinstance(volume_value, str):
                volume = int(volume_value.replace(",", ""))
            else:
                volume = int(volume_value)
            
            # 创建Price对象
            price_date = row['date']
            if isinstance(price_date, str):
                time_str = price_date
            else:
                time_str = price_date.strftime("%Y-%m-%d")
                
            prices.append(Price(
                open=float(row["open"]),
                close=float(row["close"]),
                high=float(row["high"]),
                low=float(row["low"]),
                volume=volume,
                time=time_str
            ))
        
        # 过滤日期范围
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        filtered_prices = []
        for price in prices:
            price_date = datetime.strptime(price.time, "%Y-%m-%d").date()
            if start_date_obj <= price_date <= end_date_obj:
                filtered_prices.append(price)
        
        # 缓存数据
        _cache.set_prices(ticker, [price.model_dump() for price in prices])
        
        return filtered_prices
    except Exception as e:
        print(f"获取美股指数数据失败: {ticker} - {str(e)}")
        return []


# Update the get_price_data function to use the new functions
def get_price_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    prices = get_prices(ticker, start_date, end_date)
    return prices_to_df(prices)