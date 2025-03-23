"""
Test module for A-share functionality.
Run this script to verify A-share data retrieval works correctly.
"""

import sys
import os
from datetime import datetime, timedelta
import pandas as pd
from dotenv import load_dotenv

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from src.tools.api import (
    get_prices, 
    get_financial_metrics, 
    search_line_items,
    get_insider_trades,
    get_company_news,
    get_market_cap
)

# Test tickers
US_TICKER = "AAPL"
ASHARE_TICKER = "600519.SH"  # Kweichow Moutai

# Test date range (3 months)
end_date = datetime.now().strftime("%Y-%m-%d")
start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")

def test_prices():
    """Test price data retrieval for A-shares"""
    print(f"\n=== Testing get_prices for {ASHARE_TICKER} ===")
    prices = get_prices(ASHARE_TICKER, start_date, end_date)
    
    if prices:
        print(f"✓ Successfully retrieved {len(prices)} price records")
        print(f"First record: {prices[0].model_dump()}")
        print(f"Last record: {prices[-1].model_dump()}")
    else:
        print(f"✗ Failed to retrieve prices for {ASHARE_TICKER}")

def test_financial_metrics():
    """Test financial metrics retrieval for A-shares"""
    print(f"\n=== Testing get_financial_metrics for {ASHARE_TICKER} ===")
    metrics = get_financial_metrics(ASHARE_TICKER, end_date)
    
    if metrics:
        print(f"✓ Successfully retrieved {len(metrics)} financial metrics records")
        # Display key financial metrics
        for metric in metrics[:1]:  # Show first record only
            print(f"Report period: {metric.report_period}")
            print(f"Market cap: {metric.market_cap}")
            print(f"P/E ratio: {metric.price_to_earnings_ratio}")
            print(f"P/B ratio: {metric.price_to_book_ratio}")
            print(f"ROE: {metric.return_on_equity}")
            print(f"Operating margin: {metric.operating_margin}")
    else:
        print(f"✗ Failed to retrieve financial metrics for {ASHARE_TICKER}")

def test_line_items():
    """Test line items retrieval for A-shares"""
    print(f"\n=== Testing search_line_items for {ASHARE_TICKER} ===")
    line_items = search_line_items(
        ASHARE_TICKER,
        [
            "revenue",
            "net_income",
            "operating_income",
            "free_cash_flow",
            "total_assets",
            "total_liabilities",
            "shareholders_equity",
            "working_capital",
        ],
        end_date
    )
    
    if line_items:
        print(f"✓ Successfully retrieved {len(line_items)} line item records")
        # Display key financial line items
        for item in line_items[:1]:  # Show first record only
            print(f"Report period: {item.report_period}")
            for field in ["revenue", "net_income", "operating_income", "free_cash_flow"]:
                if hasattr(item, field):
                    print(f"{field}: {getattr(item, field)}")
    else:
        print(f"✗ Failed to retrieve line items for {ASHARE_TICKER}")

def test_insider_trades():
    """Test insider trades retrieval for A-shares"""
    print(f"\n=== Testing get_insider_trades for {ASHARE_TICKER} ===")
    trades = get_insider_trades(ASHARE_TICKER, end_date, start_date=start_date)
    
    if trades:
        print(f"✓ Successfully retrieved {len(trades)} insider trade records")
        # Display key insider trade details
        for trade in trades[:3]:  # Show first few records
            print(f"Filing date: {trade.filing_date}")
            print(f"Name: {trade.name}")
            print(f"Title: {trade.title}")
            print(f"Transaction shares: {trade.transaction_shares}")
            print("---")
    else:
        print(f"✗ No insider trades found for {ASHARE_TICKER} in date range")

def test_company_news():
    """Test company news retrieval for A-shares"""
    print(f"\n=== Testing get_company_news for {ASHARE_TICKER} ===")
    news = get_company_news(ASHARE_TICKER, end_date, start_date=start_date)
    
    if news:
        print(f"✓ Successfully retrieved {len(news)} company news records")
        # Display key news details
        for item in news[:3]:  # Show first few records
            print(f"Date: {item.date}")
            print(f"Title: {item.title}")
            print(f"Sentiment: {item.sentiment}")
            print("---")
    else:
        print(f"✗ No company news found for {ASHARE_TICKER} in date range")

def test_market_cap():
    """Test market cap retrieval for A-shares"""
    print(f"\n=== Testing get_market_cap for {ASHARE_TICKER} ===")
    market_cap = get_market_cap(ASHARE_TICKER, end_date)
    
    if market_cap:
        print(f"✓ Successfully retrieved market cap: {market_cap:,}")
    else:
        print(f"✗ Failed to retrieve market cap for {ASHARE_TICKER}")


def run_all_tests():
    """Run all A-share tests"""
    print(f"Running A-share tests for {ASHARE_TICKER}")
    print(f"Date range: {start_date} to {end_date}")
    
    test_prices()
    test_financial_metrics()
    test_line_items()
    test_insider_trades()
    test_company_news()
    test_market_cap()


if __name__ == "__main__":
    run_all_tests()