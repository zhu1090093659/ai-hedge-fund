/**
 * API utilities for interacting with the AI Hedge Fund backend
 */
const API = {
    /**
     * Get the API base URL from config or localStorage
     * @returns {string} The API base URL
     */
    getBaseUrl: function() {
        const storedEndpoint = localStorage.getItem(CONFIG.STORAGE.API_ENDPOINT);
        return storedEndpoint || CONFIG.API.BASE_URL;
    },

    /**
     * Get the API key from localStorage if available
     * @returns {string|null} The API key or null if not set
     */
    getApiKey: function() {
        return localStorage.getItem(CONFIG.STORAGE.API_KEY);
    },

    /**
     * Build headers for API requests
     * @returns {Object} Headers object
     */
    getHeaders: function() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const apiKey = this.getApiKey();
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        return headers;
    },

    /**
     * Make a GET request to the API
     * @param {string} endpoint - API endpoint to call
     * @param {Object} params - URL parameters
     * @returns {Promise<any>} API response
     */
    get: async function(endpoint, params = {}) {
        try {
            const url = new URL(`${this.getBaseUrl()}${endpoint}`);
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
                timeout: CONFIG.API.TIMEOUT
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            
            // If simulation is enabled, return mock data for development
            if (CONFIG.API.SIMULATION) {
                return this.getMockData(endpoint, params);
            }
            
            throw error;
        }
    },

    /**
     * Make a POST request to the API
     * @param {string} endpoint - API endpoint to call
     * @param {Object} data - Request body
     * @returns {Promise<any>} API response
     */
    post: async function(endpoint, data = {}) {
        try {
            const url = `${this.getBaseUrl()}${endpoint}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
                timeout: CONFIG.API.TIMEOUT
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            
            // If simulation is enabled, return mock data for development
            if (CONFIG.API.SIMULATION) {
                return this.getMockData(endpoint, data);
            }
            
            throw error;
        }
    },

    /**
     * Get mock data for development when API is not available
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Object} Mock data
     */
    getMockData: function(endpoint, params) {
        if (endpoint.includes(CONFIG.API.ENDPOINTS.TICKER_INFO)) {
            const ticker = endpoint.split('/').pop();
            return this.getMockTickerInfo(ticker);
        }
        
        if (endpoint === CONFIG.API.ENDPOINTS.VALIDATE_TICKERS) {
            return params.map(ticker => this.getMockTickerInfo(ticker));
        }
        
        if (endpoint === CONFIG.API.ENDPOINTS.ANALYSTS) {
            return this.getMockAnalysts();
        }
        
        if (endpoint === CONFIG.API.ENDPOINTS.MODELS) {
            return this.getMockModels();
        }
        
        if (endpoint.includes(CONFIG.API.ENDPOINTS.STOCK_DATA)) {
            const ticker = endpoint.split('/').pop();
            return this.getMockStockData(ticker);
        }
        
        if (endpoint.includes(CONFIG.API.ENDPOINTS.PRICES)) {
            const ticker = endpoint.split('/').pop();
            return this.getMockPrices(ticker);
        }
        
        if (endpoint.includes(CONFIG.API.ENDPOINTS.NEWS)) {
            const ticker = endpoint.split('/').pop();
            return this.getMockNews(ticker);
        }
        
        if (endpoint === CONFIG.API.ENDPOINTS.ANALYZE) {
            return this.getMockAnalysisTask();
        }
        
        if (endpoint === CONFIG.API.ENDPOINTS.BACKTEST) {
            return this.getMockBacktestTask();
        }
        
        if (endpoint.includes(CONFIG.API.ENDPOINTS.TASK)) {
            const taskId = endpoint.split('/').pop();
            if (taskId.includes('analysis')) {
                return this.getMockAnalysisResult();
            } else if (taskId.includes('backtest')) {
                return this.getMockBacktestResult();
            }
        }
        
        // Default empty response
        return {};
    },

    /**
     * Get mock ticker info
     * @param {string} ticker - Ticker symbol
     * @returns {Object} Mock ticker info
     */
    getMockTickerInfo: function(ticker) {
        if (ticker.includes('.SH') || ticker.includes('.SZ')) {
            return {
                ticker: ticker,
                name: `A-Share Company ${ticker}`,
                type: 'A-SHARE',
                exchange: ticker.includes('.SH') ? 'SH' : 'SZ',
                valid: true
            };
        } else {
            return {
                ticker: ticker,
                name: `US Company ${ticker}`,
                type: 'US',
                exchange: 'US',
                valid: true
            };
        }
    },

    /**
     * Get mock analysts
     * @returns {Array} Mock analysts
     */
    getMockAnalysts: function() {
        return [
            { id: 'warren_buffett', display_name: 'Warren Buffett' },
            { id: 'bill_ackman', display_name: 'Bill Ackman' },
            { id: 'cathie_wood', display_name: 'Cathie Wood' },
            { id: 'ben_graham', display_name: 'Ben Graham' },
            { id: 'charlie_munger', display_name: 'Charlie Munger' },
            { id: 'fundamentals_analyst', display_name: 'Fundamentals Analyst' },
            { id: 'technical_analyst', display_name: 'Technical Analyst' },
            { id: 'sentiment_analyst', display_name: 'Sentiment Analyst' },
            { id: 'valuation_analyst', display_name: 'Valuation Analyst' }
        ];
    },

    /**
     * Get mock models
     * @returns {Array} Mock models
     */
    getMockModels: function() {
        return [
            { model_name: 'gpt-4o', display_name: '[openai] gpt-4o', provider: 'OpenAI' },
            { model_name: 'gpt-4.5-preview', display_name: '[openai] gpt-4.5', provider: 'OpenAI' },
            { model_name: 'claude-3-5-sonnet-latest', display_name: '[anthropic] claude-3.5-sonnet', provider: 'Anthropic' },
            { model_name: 'claude-3-7-sonnet-latest', display_name: '[anthropic] claude-3.7-sonnet', provider: 'Anthropic' },
            { model_name: 'llama-3.3-70b-versatile', display_name: '[groq] llama-3.3 70b', provider: 'Groq' }
        ];
    },

    /**
     * Get mock stock data
     * @param {string} ticker - Ticker symbol
     * @returns {Object} Mock stock data
     */
    getMockStockData: function(ticker) {
        return {
            ticker: ticker,
            prices: this.getMockPrices(ticker),
            metrics: [
                {
                    ticker: ticker,
                    report_period: '2023-12-31',
                    period: 'annual',
                    currency: ticker.includes('.S') ? 'CNY' : 'USD',
                    market_cap: 1000000000,
                    price_to_earnings_ratio: 20.5,
                    price_to_book_ratio: 4.2,
                    price_to_sales_ratio: 5.1,
                    net_margin: 0.15,
                    operating_margin: 0.2,
                    return_on_equity: 0.18,
                    return_on_assets: 0.09,
                    debt_to_equity: 0.5
                }
            ],
            market_cap: 1000000000
        };
    },

    /**
     * Get mock price data
     * @param {string} ticker - Ticker symbol
     * @returns {Array} Mock price data
     */
    getMockPrices: function(ticker) {
        const prices = [];
        const basePrice = ticker.includes('.S') ? 50 : 150;
        const now = new Date();
        
        // Generate 90 days of price data
        for (let i = 90; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Add some randomness to price
            const randomFactor = 0.5 + Math.random();
            const dayPrice = basePrice * randomFactor;
            
            prices.push({
                Date: date.toISOString().split('T')[0],
                open: dayPrice * 0.99,
                close: dayPrice,
                high: dayPrice * 1.02,
                low: dayPrice * 0.98,
                volume: Math.floor(1000000 * Math.random())
            });
        }
        
        return prices;
    },

    /**
     * Get mock news items
     * @param {string} ticker - Ticker symbol
     * @returns {Array} Mock news
     */
    getMockNews: function(ticker) {
        const news = [];
        const now = new Date();
        
        // Generate 20 news items
        for (let i = 0; i < 20; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i * 2);
            
            news.push({
                ticker: ticker,
                title: `${ticker} announces new product line expansion`,
                author: 'Financial News Reporter',
                source: 'Market News',
                date: date.toISOString().split('T')[0],
                url: '#',
                sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
            });
        }
        
        return news;
    },

    /**
     * Get mock analysis task
     * @returns {Object} Mock task
     */
    getMockAnalysisTask: function() {
        return {
            task_id: `analysis_${Date.now()}_mock`,
            status: 'pending',
            progress: 0.0
        };
    },

    /**
     * Get mock backtest task
     * @returns {Object} Mock task
     */
    getMockBacktestTask: function() {
        return {
            task_id: `backtest_${Date.now()}_mock`,
            status: 'pending',
            progress: 0.0
        };
    },

    /**
     * Get mock analysis result
     * @returns {Object} Mock analysis result
     */
    getMockAnalysisResult: function() {
        return {
            task_id: `analysis_${Date.now()}_mock`,
            status: 'completed',
            progress: 1.0,
            result: {
                decisions: {
                    'AAPL': {
                        action: 'buy',
                        quantity: 10,
                        confidence: 85.5,
                        reasoning: 'Strong financials and positive technical indicators suggest upward momentum.'
                    },
                    'MSFT': {
                        action: 'hold',
                        quantity: 0,
                        confidence: 60.2,
                        reasoning: 'Current valuation is fair but not compelling.'
                    },
                    '600519.SH': {
                        action: 'buy',
                        quantity: 5,
                        confidence: 92.7,
                        reasoning: 'Strong growth prospects and dominant market position.'
                    }
                },
                analyst_signals: {
                    'warren_buffett_agent': {
                        'AAPL': {
                            signal: 'bullish',
                            confidence: 80.5,
                            reasoning: 'Exceptional business with strong moat and reasonable valuation.'
                        },
                        'MSFT': {
                            signal: 'neutral',
                            confidence: 65.7,
                            reasoning: 'Good business but current price is slightly high.'
                        },
                        '600519.SH': {
                            signal: 'bullish',
                            confidence: 88.9,
                            reasoning: 'Strong brand moat and excellent returns on capital.'
                        }
                    },
                    'technical_analyst_agent': {
                        'AAPL': {
                            signal: 'bullish',
                            confidence: 75.3,
                            reasoning: 'Positive momentum with strong support levels.'
                        },
                        'MSFT': {
                            signal: 'neutral',
                            confidence: 55.8,
                            reasoning: 'Consolidating in range with no clear direction.'
                        },
                        '600519.SH': {
                            signal: 'bullish',
                            confidence: 82.4,
                            reasoning: 'Breaking out of resistance with increasing volume.'
                        }
                    }
                }
            }
        };
    },

    /**
     * Get mock backtest result
     * @returns {Object} Mock backtest result
     */
    getMockBacktestResult: function() {
        return {
            task_id: `backtest_${Date.now()}_mock`,
            status: 'completed',
            progress: 1.0,
            result: {
                portfolio_values: this.getMockPortfolioValues(),
                performance_metrics: {
                    sharpe_ratio: 1.82,
                    sortino_ratio: 2.31,
                    max_drawdown: -12.5,
                    win_rate: 65.8
                },
                final_portfolio: {
                    cash: 42589.25,
                    positions: {
                        'AAPL': {
                            long: 50,
                            short: 0,
                            long_cost_basis: 145.75,
                            short_cost_basis: 0
                        },
                        'MSFT': {
                            long: 25,
                            short: 0,
                            long_cost_basis: 285.50,
                            short_cost_basis: 0
                        }
                    },
                    realized_gains: {
                        'AAPL': {
                            long: 2580.50,
                            short: 0
                        },
                        'MSFT': {
                            long: 1245.75,
                            short: 0
                        }
                    }
                }
            }
        };
    },

    /**
     * Get mock portfolio values for backtesting
     * @returns {Array} Mock portfolio values
     */
    getMockPortfolioValues: function() {
        const values = [];
        const now = new Date();
        let portfolioValue = 100000;
        
        // Generate 90 days of portfolio values
        for (let i = 90; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Add some randomness to simulate gains/losses
            const dailyReturn = (Math.random() * 0.03) - 0.01;  // Between -1% and 2%
            portfolioValue = portfolioValue * (1 + dailyReturn);
            
            values.push({
                Date: date.toISOString().split('T')[0],
                'Portfolio Value': portfolioValue,
                'Long Exposure': portfolioValue * 0.7 * (1 + (Math.random() * 0.1) - 0.05),
                'Short Exposure': portfolioValue * 0.1 * (1 + (Math.random() * 0.1) - 0.05),
                'Gross Exposure': portfolioValue * 0.8,
                'Net Exposure': portfolioValue * 0.6,
                'Long/Short Ratio': 7
            });
        }
        
        return values;
    }
};
