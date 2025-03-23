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
            
            // If simulation is enabled and we're in development mode, return mock data
            if (CONFIG.API.SIMULATION && CONFIG.ENV === 'development') {
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
            
            // If simulation is enabled and we're in development mode, return mock data
            if (CONFIG.API.SIMULATION && CONFIG.ENV === 'development') {
                return this.getMockData(endpoint, data);
            }
            
            throw error;
        }
    },

    /**
     * Check the status of a long-running task
     * @param {string} taskId - The ID of the task to check
     * @returns {Promise<Object>} Task status information
     */
    checkTaskStatus: async function(taskId) {
        return this.get(`${CONFIG.API.ENDPOINTS.TASK}/${taskId}`);
    },

    /**
     * Poll a task until it completes or fails
     * @param {string} taskId - The ID of the task to poll
     * @param {function} onProgress - Callback for progress updates
     * @param {function} onComplete - Callback for task completion
     * @param {function} onError - Callback for task errors
     * @param {number} interval - Polling interval in milliseconds
     */
    pollTask: function(taskId, onProgress, onComplete, onError, interval = 2000) {
        const checkStatus = () => {
            this.checkTaskStatus(taskId)
                .then(response => {
                    // Update progress
                    if (onProgress) {
                        onProgress(response.progress);
                    }
                    
                    if (response.status === 'completed') {
                        // Task completed
                        if (onComplete) {
                            onComplete(response.result);
                        }
                    } else if (response.status === 'error') {
                        // Task failed
                        if (onError) {
                            onError(response.error);
                        }
                    } else {
                        // Task still running, poll again after the interval
                        setTimeout(checkStatus, interval);
                    }
                })
                .catch(error => {
                    if (onError) {
                        onError(error.message);
                    }
                });
        };
        
        // Start polling
        setTimeout(checkStatus, interval);
    },

    /**
     * Validate ticker format (US or A-share)
     * @param {string} ticker - Ticker to validate
     * @returns {boolean} Whether the ticker format is valid
     */
    validateTickerFormat: function(ticker) {
        // US ticker: 1-5 alphabetic characters
        const usRegex = /^[A-Za-z]{1,5}$/;
        
        // A-share ticker: 6 digits followed by .SH or .SZ
        const aShareRegex = /^\d{6}\.(SH|SZ)$/;
        
        return usRegex.test(ticker) || aShareRegex.test(ticker);
    },

    /**
     * Get information about a ticker
     * @param {string} ticker - Ticker symbol
     * @returns {Promise<Object>} Ticker information
     */
    getTickerInfo: function(ticker) {
        return this.get(`${CONFIG.API.ENDPOINTS.TICKER_INFO}/${ticker}`);
    },

    /**
     * Get available analysts
     * @returns {Promise<Array>} List of available analysts
     */
    getAnalysts: function() {
        return this.get(CONFIG.API.ENDPOINTS.ANALYSTS);
    },

    /**
     * Get available models
     * @returns {Promise<Array>} List of available models
     */
    getModels: function() {
        return this.get(CONFIG.API.ENDPOINTS.MODELS);
    },

    /**
     * Get stock data for a ticker
     * @param {string} ticker - Ticker symbol
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Stock data
     */
    getStockData: function(ticker, startDate, endDate) {
        return this.get(`${CONFIG.API.ENDPOINTS.STOCK_DATA}/${ticker}`, {
            start_date: startDate,
            end_date: endDate
        });
    },

    /**
     * Get price data for a ticker
     * @param {string} ticker - Ticker symbol
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} Price data
     */
    getPrices: function(ticker, startDate, endDate) {
        return this.get(`${CONFIG.API.ENDPOINTS.PRICES}/${ticker}`, {
            start_date: startDate,
            end_date: endDate
        });
    },

    /**
     * Get financial metrics for a ticker
     * @param {string} ticker - Ticker symbol
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Array>} Financial metrics
     */
    getFinancials: function(ticker, endDate) {
        return this.get(`${CONFIG.API.ENDPOINTS.FINANCIALS}/${ticker}`, {
            end_date: endDate
        });
    },

    /**
     * Get news for a ticker
     * @param {string} ticker - Ticker symbol
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {number} limit - Maximum number of news items to return
     * @returns {Promise<Array>} News items
     */
    getNews: function(ticker, startDate, endDate, limit = 50) {
        return this.get(`${CONFIG.API.ENDPOINTS.NEWS}/${ticker}`, {
            start_date: startDate,
            end_date: endDate,
            limit: limit
        });
    },

    /**
     * Get insider trades for a ticker
     * @param {string} ticker - Ticker symbol
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {number} limit - Maximum number of insider trades to return
     * @returns {Promise<Array>} Insider trades
     */
    getInsiderTrades: function(ticker, startDate, endDate, limit = 50) {
        return this.get(`${CONFIG.API.ENDPOINTS.INSIDER_TRADES}/${ticker}`, {
            start_date: startDate,
            end_date: endDate,
            limit: limit
        });
    },

    /**
     * Run stock analysis
     * @param {Array} tickers - List of ticker symbols
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {Array} selectedAnalysts - List of selected analyst IDs
     * @param {string} modelName - Name of the LLM model to use
     * @param {string} modelProvider - Provider of the LLM model
     * @returns {Promise<Object>} Task information
     */
    runAnalysis: function(tickers, startDate, endDate, selectedAnalysts, modelName, modelProvider) {
        return this.post(CONFIG.API.ENDPOINTS.ANALYZE, {
            tickers: tickers,
            start_date: startDate,
            end_date: endDate,
            selected_analysts: selectedAnalysts,
            model_name: modelName,
            model_provider: modelProvider
        });
    },

    /**
     * Run backtest
     * @param {Array} tickers - List of ticker symbols
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {number} initialCapital - Initial capital
     * @param {number} marginRequirement - Margin requirement
     * @param {Array} selectedAnalysts - List of selected analyst IDs
     * @param {string} modelName - Name of the LLM model to use
     * @param {string} modelProvider - Provider of the LLM model
     * @returns {Promise<Object>} Task information
     */
    runBacktest: function(tickers, startDate, endDate, initialCapital, marginRequirement, selectedAnalysts, modelName, modelProvider) {
        return this.post(CONFIG.API.ENDPOINTS.BACKTEST, {
            tickers: tickers,
            start_date: startDate,
            end_date: endDate,
            initial_capital: initialCapital,
            margin_requirement: marginRequirement,
            selected_analysts: selectedAnalysts,
            model_name: modelName,
            model_provider: modelProvider
        });
    },

    /**
     * Update portfolio state
     * @param {Object} portfolio - Portfolio state
     * @returns {Promise<Object>} Updated portfolio state
     */
    updatePortfolio: function(portfolio) {
        return this.post(CONFIG.API.ENDPOINTS.PORTFOLIO, portfolio);
    },

    /**
     * Get mock data for development when API is not available
     * This is retained for compatibility during development
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Object} Mock data
     */
    getMockData: function(endpoint, params) {
        // See original implementation for mock data
        console.warn('Using mock data for endpoint:', endpoint);
        return {};
    }
};