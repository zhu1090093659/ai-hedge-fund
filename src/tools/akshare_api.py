"""
AKShare API wrappers for fetching A-share market data.
Provides functions compatible with the existing API structure.
"""

import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from src.data.models import (
    Price, 
    FinancialMetrics, 
    LineItem, 
    CompanyNews, 
    InsiderTrade,
    PriceResponse,
    CompanyNewsResponse
)
from src.data.cache import get_cache

# Global cache instance
_cache = get_cache()

def is_ashare_ticker(ticker: str) -> bool:
    """Check if a ticker is an A-share stock code."""
    if "." not in ticker:
        return False
    code, exchange = ticker.split(".")
    return (exchange in ["SH", "SZ"] and code.isdigit() and len(code) == 6)

def get_prices(ticker: str, start_date: str, end_date: str) -> list[Price]:
    """Fetch A-share price data using akshare"""
    # Check cache first
    if cached_data := _cache.get_prices(ticker):
        # Filter cached data by date range and convert to Price objects
        filtered_data = [Price(**price) for price in cached_data if start_date <= price["time"] <= end_date]
        if filtered_data:
            return filtered_data
            
    try:
        code = ticker.split(".")[0]
        
        # Get daily price data - akshare uses different date format
        start_date_formatted = datetime.strptime(start_date, "%Y-%m-%d").strftime("%Y%m%d")
        end_date_formatted = datetime.strptime(end_date, "%Y-%m-%d").strftime("%Y%m%d")
        
        df = ak.stock_zh_a_hist(
            symbol=code, 
            period="daily", 
            start_date=start_date_formatted, 
            end_date=end_date_formatted,
            adjust="qfq"  # Using front-adjusted prices
        )
        
        # Convert to our Price model format
        prices = []
        for _, row in df.iterrows():
            # Handle column name mapping from Chinese to English
            prices.append(Price(
                open=float(row['开盘']),  # Open
                close=float(row['收盘']),  # Close 
                high=float(row['最高']),  # High
                low=float(row['最低']),  # Low
                volume=int(row['成交量']),  # Volume
                time=row['日期'].strftime("%Y-%m-%d") if isinstance(row['日期'], datetime) else row['日期']
            ))
        
        # Cache the results as dicts
        _cache.set_prices(ticker, [p.model_dump() for p in prices])
        return prices
    except Exception as e:
        print(f"Error fetching A-share price data for {ticker}: {e}")
        return []

def get_financial_metrics(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[FinancialMetrics]:
    """Fetch A-share financial metrics using akshare"""
    # Check cache first
    if cached_data := _cache.get_financial_metrics(ticker):
        # Filter cached data by date and limit
        filtered_data = [FinancialMetrics(**metric) for metric in cached_data if metric["report_period"] <= end_date]
        filtered_data.sort(key=lambda x: x.report_period, reverse=True)
        if filtered_data:
            return filtered_data[:limit]
    
    try:
        code = ticker.split(".")[0]
        
        # Get financial indicators
        # Note: akshare provides financial data through different functions
        # based on what metrics you want
        
        # Income statement
        income_df = ak.stock_financial_report_sina(symbol=code, report_type="利润表")
        
        # Balance sheet
        balance_df = ak.stock_financial_report_sina(symbol=code, report_type="资产负债表")
        
        # Cash flow statement
        cashflow_df = ak.stock_financial_report_sina(symbol=code, report_type="现金流量表")
        
        # Financial ratios
        ratio_df = ak.stock_financial_analysis_indicator(symbol=code)
        
        # Market data for current metrics like P/E ratio
        market_df = ak.stock_a_lg_indicator(symbol=code)
        
        # Merge data by report period
        # This requires careful alignment of dates across datasets
        
        # Get available report periods
        report_periods = sorted(income_df.columns.tolist(), reverse=True)[:limit]
        
        # Create metrics for each period
        financial_metrics = []
        for report_period in report_periods:
            if report_period > end_date:
                continue

            # Extract data for this period
            income_data = income_df[report_period] if report_period in income_df.columns else pd.Series()
            balance_data = balance_df[report_period] if report_period in balance_df.columns else pd.Series()
            cashflow_data = cashflow_df[report_period] if report_period in cashflow_df.columns else pd.Series()
            
            # Get market data (most recent only)
            market_cap = float(market_df.loc["总市值"].iloc[0]) if "总市值" in market_df.index else None
            pe_ratio = float(market_df.loc["市盈率-动态"].iloc[0]) if "市盈率-动态" in market_df.index else None
            pb_ratio = float(market_df.loc["市净率"].iloc[0]) if "市净率" in market_df.index else None
            
            # Map financial data to our model
            # This requires translating Chinese field names to English metrics
            net_income = float(income_data.loc["净利润"]) if "净利润" in income_data.index else None
            revenue = float(income_data.loc["营业收入"]) if "营业收入" in income_data.index else None
            operating_income = float(income_data.loc["营业利润"]) if "营业利润" in income_data.index else None
            
            total_assets = float(balance_data.loc["资产总计"]) if "资产总计" in balance_data.index else None
            total_liabilities = float(balance_data.loc["负债合计"]) if "负债合计" in balance_data.index else None
            shareholders_equity = float(balance_data.loc["所有者权益(或股东权益)合计"]) if "所有者权益(或股东权益)合计" in balance_data.index else None
            
            # Calculate ratios
            if net_income and revenue and revenue > 0:
                net_margin = net_income / revenue
            else:
                net_margin = None
                
            if operating_income and revenue and revenue > 0:
                operating_margin = operating_income / revenue
            else:
                operating_margin = None
                
            if net_income and shareholders_equity and shareholders_equity > 0:
                return_on_equity = net_income / shareholders_equity
            else:
                return_on_equity = None
                
            if net_income and total_assets and total_assets > 0:
                return_on_assets = net_income / total_assets
            else:
                return_on_assets = None
                
            # Create FinancialMetrics object
            metric = FinancialMetrics(
                ticker=ticker,
                report_period=report_period,
                period=period,
                currency="CNY",  # Chinese Yuan
                market_cap=market_cap,
                price_to_earnings_ratio=pe_ratio,
                price_to_book_ratio=pb_ratio,
                net_margin=net_margin,
                operating_margin=operating_margin,
                return_on_equity=return_on_equity,
                return_on_assets=return_on_assets,
                # Fill in other metrics as available
                # Using None for metrics we can't get directly
                enterprise_value=None,
                price_to_sales_ratio=None,
                enterprise_value_to_ebitda_ratio=None,
                enterprise_value_to_revenue_ratio=None,
                free_cash_flow_yield=None,
                peg_ratio=None,
                gross_margin=None,
                return_on_invested_capital=None,
                asset_turnover=None,
                inventory_turnover=None,
                receivables_turnover=None,
                days_sales_outstanding=None,
                operating_cycle=None,
                working_capital_turnover=None,
                current_ratio=None,
                quick_ratio=None,
                cash_ratio=None,
                operating_cash_flow_ratio=None,
                debt_to_equity=None,
                debt_to_assets=None,
                interest_coverage=None,
                revenue_growth=None,
                earnings_growth=None,
                book_value_growth=None,
                earnings_per_share_growth=None,
                free_cash_flow_growth=None,
                operating_income_growth=None,
                ebitda_growth=None,
                payout_ratio=None,
                earnings_per_share=None,
                book_value_per_share=None,
                free_cash_flow_per_share=None,
            )
            
            financial_metrics.append(metric)
        
        # Cache the results as dicts
        _cache.set_financial_metrics(ticker, [m.model_dump() for m in financial_metrics])
        return financial_metrics
    except Exception as e:
        print(f"Error fetching A-share financial metrics for {ticker}: {e}")
        return []

def search_line_items(
    ticker: str,
    line_items: list[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[LineItem]:
    """Fetch A-share financial line items using akshare"""
    try:
        code = ticker.split(".")[0]
        
        # Map line item names to their Chinese equivalents in akshare
        line_item_map = {
            "revenue": "营业收入",
            "net_income": "净利润",
            "operating_income": "营业利润",
            "gross_margin": None,  # Needs calculation
            "operating_margin": None,  # Needs calculation
            "free_cash_flow": None,  # Needs calculation
            "capital_expenditure": "购建固定资产、无形资产和其他长期资产支付的现金",
            "cash_and_equivalents": "货币资金",
            "total_debt": None,  # May require summing multiple items
            "shareholders_equity": "所有者权益(或股东权益)合计",
            "outstanding_shares": None,  # Needs another API call
            "research_and_development": "研发费用",
            "total_assets": "资产总计",
            "total_liabilities": "负债合计",
            "working_capital": None,  # Needs calculation
            "dividends_and_other_cash_distributions": "分配股利、利润或偿付利息支付的现金",
            "depreciation_and_amortization": "固定资产折旧、油气资产折耗、生产性生物资产折旧",
            "ebit": None,  # Needs calculation
            "ebitda": None,  # Needs calculation
            "return_on_invested_capital": None,  # Needs calculation
            "debt_to_equity": None,  # Needs calculation
            "issuance_or_purchase_of_equity_shares": None,  # May need another source
        }
        
        # Get financial statements
        income_df = ak.stock_financial_report_sina(symbol=code, report_type="利润表")
        balance_df = ak.stock_financial_report_sina(symbol=code, report_type="资产负债表")
        cashflow_df = ak.stock_financial_report_sina(symbol=code, report_type="现金流量表")
        
        # Get share info if needed
        shares_df = None
        if "outstanding_shares" in line_items:
            # This is a different call to get share structure
            shares_df = ak.stock_zh_a_structure(symbol=code)
        
        # Get available report periods
        report_periods = sorted(income_df.columns.tolist(), reverse=True)[:limit]
        
        # Create line items for each period
        all_line_items = []
        for report_period in report_periods:
            if report_period > end_date:
                continue
                
            # Create base line item with required fields
            line_item = LineItem(
                ticker=ticker,
                report_period=report_period,
                period=period,
                currency="CNY",  # Chinese Yuan
            )
            
            # Add requested line items
            for item_name in line_items:
                # Skip items we can't map
                if item_name not in line_item_map or line_item_map[item_name] is None:
                    continue
                    
                # Get values from appropriate statement
                if line_item_map[item_name] in income_df.index:
                    value = income_df.loc[line_item_map[item_name], report_period]
                    setattr(line_item, item_name, float(value) if pd.notna(value) else None)
                elif line_item_map[item_name] in balance_df.index:
                    value = balance_df.loc[line_item_map[item_name], report_period]
                    setattr(line_item, item_name, float(value) if pd.notna(value) else None)
                elif line_item_map[item_name] in cashflow_df.index:
                    value = cashflow_df.loc[line_item_map[item_name], report_period]
                    setattr(line_item, item_name, float(value) if pd.notna(value) else None)
            
            # Handle special calculations
            if "free_cash_flow" in line_items:
                # FCF = Operating Cash Flow - Capital Expenditures
                op_cash_flow = cashflow_df.loc["经营活动产生的现金流量净额", report_period] if "经营活动产生的现金流量净额" in cashflow_df.index else None
                capex = cashflow_df.loc["购建固定资产、无形资产和其他长期资产支付的现金", report_period] if "购建固定资产、无形资产和其他长期资产支付的现金" in cashflow_df.index else None
                
                if op_cash_flow is not None and capex is not None:
                    line_item.free_cash_flow = float(op_cash_flow) - float(capex)
                else:
                    line_item.free_cash_flow = None
            
            if "outstanding_shares" in line_items and shares_df is not None:
                # Get most recent share count
                if not shares_df.empty:
                    line_item.outstanding_shares = float(shares_df.iloc[0]["总股本"])
                else:
                    line_item.outstanding_shares = None
            
            if "working_capital" in line_items:
                # Working Capital = Current Assets - Current Liabilities
                current_assets = balance_df.loc["流动资产合计", report_period] if "流动资产合计" in balance_df.index else None
                current_liabilities = balance_df.loc["流动负债合计", report_period] if "流动负债合计" in balance_df.index else None
                
                if current_assets is not None and current_liabilities is not None:
                    line_item.working_capital = float(current_assets) - float(current_liabilities)
                else:
                    line_item.working_capital = None
                    
            if "ebit" in line_items:
                # EBIT = Net Income + Interest + Taxes
                net_income = income_df.loc["净利润", report_period] if "净利润" in income_df.index else None
                interest = income_df.loc["财务费用", report_period] if "财务费用" in income_df.index else None
                taxes = income_df.loc["所得税费用", report_period] if "所得税费用" in income_df.index else None
                
                if net_income is not None and interest is not None and taxes is not None:
                    line_item.ebit = float(net_income) + float(interest) + float(taxes)
                else:
                    line_item.ebit = None
                    
            if "ebitda" in line_items:
                # EBITDA = EBIT + Depreciation + Amortization
                if hasattr(line_item, "ebit") and line_item.ebit is not None:
                    depreciation = cashflow_df.loc["固定资产折旧、油气资产折耗、生产性生物资产折旧", report_period] if "固定资产折旧、油气资产折耗、生产性生物资产折旧" in cashflow_df.index else None
                    
                    if depreciation is not None:
                        line_item.ebitda = line_item.ebit + float(depreciation)
                    else:
                        line_item.ebitda = None
                else:
                    line_item.ebitda = None
            
            all_line_items.append(line_item)
        
        return all_line_items
    except Exception as e:
        print(f"Error fetching A-share line items for {ticker}: {e}")
        return []

def get_insider_trades(
    ticker: str,
    end_date: str,
    start_date: str = None,
    limit: int = 1000,
) -> list[InsiderTrade]:
    """Fetch A-share insider trades using akshare"""
    try:
        code = ticker.split(".")[0]
        
        # Get insider trading data
        # Using executive increase/decrease in holdings as a proxy
        df = ak.stock_em_executive_hold(symbol=code)
        
        # Convert to our InsiderTrade model
        trades = []
        for _, row in df.iterrows():
            # Convert date format if needed
            filing_date = row["变动截止日"].strftime("%Y-%m-%d") if isinstance(row["变动截止日"], datetime) else row["变动截止日"]
            
            # Skip if outside date range
            if start_date and filing_date < start_date:
                continue
            if filing_date > end_date:
                continue
                
            # Determine if it's a buy or sell based on change
            shares_change = row["变动数量"]
            
            trades.append(InsiderTrade(
                ticker=ticker,
                issuer=ticker,
                name=row["高管姓名"],
                title=row["职务"],
                is_board_director="董事" in row["职务"] if "职务" in row else None,
                transaction_date=filing_date,
                transaction_shares=float(shares_change) if pd.notna(shares_change) else None,
                transaction_price_per_share=None,  # Not always available
                transaction_value=None,  # Calculated if price is available
                shares_owned_before_transaction=None,
                shares_owned_after_transaction=row["变动后持股数"],
                security_title="A股",
                filing_date=filing_date,
            ))
            
            if len(trades) >= limit:
                break
        
        # Cache the results
        _cache.set_insider_trades(ticker, [trade.model_dump() for trade in trades])
        return trades
    except Exception as e:
        print(f"Error fetching A-share insider trades for {ticker}: {e}")
        return []

def get_company_news(
    ticker: str,
    end_date: str,
    start_date: str = None,
    limit: int = 1000,
) -> list[CompanyNews]:
    """Fetch A-share company news using akshare"""
    try:
        code = ticker.split(".")[0]
        
        # Get company announcements
        df = ak.stock_notice_report(symbol=code)
        
        # Convert to our CompanyNews model
        news = []
        for _, row in df.iterrows():
            news_date = row["日期"] if isinstance(row["日期"], str) else row["日期"].strftime("%Y-%m-%d")
            
            # Skip if outside date range
            if start_date and news_date < start_date:
                continue
            if news_date > end_date:
                continue
                
            # Simple sentiment analysis based on title
            # This is very basic - in production you would use a proper NLP model
            positive_words = ["增长", "盈利", "利好", "上涨", "突破", "提升"]
            negative_words = ["下跌", "亏损", "风险", "下降", "违规", "处罚"]
            
            sentiment = "neutral"
            title = row["标题"]
            if any(word in title for word in positive_words):
                sentiment = "positive"
            elif any(word in title for word in negative_words):
                sentiment = "negative"
                
            news.append(CompanyNews(
                ticker=ticker,
                title=title,
                author="公司公告",  # Company announcement
                source="上海证券交易所" if ticker.endswith(".SH") else "深圳证券交易所",  # Exchange based on ticker
                date=news_date,
                url=row["URL"] if "URL" in row else "",
                sentiment=sentiment,
            ))
            
            if len(news) >= limit:
                break
        
        # Cache the results
        _cache.set_company_news(ticker, [n.model_dump() for n in news])
        return news
    except Exception as e:
        print(f"Error fetching A-share company news for {ticker}: {e}")
        return []

def get_market_cap(
    ticker: str,
    end_date: str,
) -> float:
    """Fetch A-share market cap using akshare"""
    try:
        code = ticker.split(".")[0]
        
        # Get market data
        df = ak.stock_a_lg_indicator(symbol=code)
        
        # Extract market cap
        if "总市值" in df.index:
            return float(df.loc["总市值"].iloc[0])
        else:
            return None
    except Exception as e:
        print(f"Error fetching A-share market cap for {ticker}: {e}")
        return None
