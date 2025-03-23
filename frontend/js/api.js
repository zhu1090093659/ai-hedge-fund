/**
 * Enhanced API utilities for interacting with the AI Hedge Fund backend
 */
const API = {
    /**
     * Get the API base URL from config or localStorage
     * @returns {string} The API base URL
     */
    getBaseUrl: function() {
        const storedEndpoint = localStorage.getItem(CONFIG.STORAGE.API_ENDPOINT);
        const baseUrl = storedEndpoint || CONFIG.API.BASE_URL;
        console.log('使用API基础URL:', baseUrl);
        return baseUrl;
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
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        const apiKey = this.getApiKey();
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        console.log('API请求头:', headers);
        return headers;
    },
    
    /**
     * 检测API连接状态
     * @returns {Promise<boolean>} 连接是否成功
     */
    checkConnection: async function() {
        try {
            console.log('正在检测API连接...');
            const url = `${this.getBaseUrl()}/`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`API连接检测超时`);
                controller.abort();
            }, 5000); // 使用较短的超时时间
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log('API连接成功');
                Utils.showToast('后端连接成功', 'success');
                return true;
            } else {
                console.error('API连接失败:', response.status, response.statusText);
                Utils.showToast(`后端连接失败: ${response.status} ${response.statusText}`, 'error');
                return false;
            }
        } catch (error) {
            console.error('API连接检测错误:', error.name, error.message);
            Utils.showToast(`后端连接失败: ${error.message}`, 'error');
            return false;
        }
    },

    /**
     * Make a GET request to the API with enhanced error handling
     * @param {string} endpoint - API endpoint to call
     * @param {Object} params - URL parameters
     * @param {number} retryCount - Number of retries on failure (default: 0)
     * @returns {Promise<any>} API response
     */
    get: async function(endpoint, params = {}, retryCount = 0) {
        try {
            const url = new URL(`${this.getBaseUrl()}${endpoint}`);
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });

            console.log(`开始API GET请求: ${url.toString()}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`API请求超时: ${url.toString()}`);
                controller.abort();
            }, CONFIG.API.TIMEOUT);

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`API响应错误 (${endpoint}):`, response.status, response.statusText);
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`API GET请求成功 (${endpoint}):`, data);
            return data;
        } catch (error) {
            console.error(`API GET错误 (${endpoint}):`, error.name, error.message);
            
            // Handle timeout errors specifically
            if (error.name === 'AbortError') {
                Utils.showToast('请求超时，请重试', 'error');
                throw new Error('请求超时');
            }
            
            // Retry logic for network errors
            if ((error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) && retryCount < CONFIG.API.MAX_RETRIES) {
                console.log(`网络错误，正在重试 (${retryCount + 1}/${CONFIG.API.MAX_RETRIES})...`);
                Utils.showToast(`网络错误，正在重试 (${retryCount + 1}/${CONFIG.API.MAX_RETRIES})...`, 'warning');
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(this.get(endpoint, params, retryCount + 1));
                    }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
                });
            }
            
            throw error;
        }
    },

    /**
     * Make a POST request to the API with enhanced error handling
     * @param {string} endpoint - API endpoint to call
     * @param {Object} data - Request body
     * @param {number} retryCount - Number of retries on failure (default: 0)
     * @returns {Promise<any>} API response
     */
    post: async function(endpoint, data = {}, retryCount = 0) {
        try {
            const url = `${this.getBaseUrl()}${endpoint}`;
            
            console.log(`开始API POST请求: ${url}`, data);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log(`API请求超时: ${url}`);
                controller.abort();
            }, CONFIG.API.TIMEOUT);

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`API响应错误 (${endpoint}):`, response.status, response.statusText);
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API Error: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log(`API POST请求成功 (${endpoint}):`, responseData);
            return responseData;
        } catch (error) {
            console.error(`API POST错误 (${endpoint}):`, error.name, error.message);
            
            // Handle timeout errors specifically
            if (error.name === 'AbortError') {
                Utils.showToast('请求超时，请重试', 'error');
                throw new Error('请求超时');
            }
            
            // Retry logic for network errors
            if ((error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) && retryCount < CONFIG.API.MAX_RETRIES) {
                console.log(`网络错误，正在重试 (${retryCount + 1}/${CONFIG.API.MAX_RETRIES})...`);
                Utils.showToast(`网络错误，正在重试 (${retryCount + 1}/${CONFIG.API.MAX_RETRIES})...`, 'warning');
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(this.post(endpoint, data, retryCount + 1));
                    }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
                });
            }
            
            throw error;
        }
    },

    /**
     * Check the status of a long-running task with improved error handling
     * @param {string} taskId - The ID of the task to check
     * @returns {Promise<Object>} Task status information
     */
    checkTaskStatus: async function(taskId) {
        return this.get(`${CONFIG.API.ENDPOINTS.TASK}/${taskId}`);
    },

    /**
     * Enhanced polling for a task until it completes or fails
     * @param {string} taskId - The ID of the task to poll
     * @param {function} onProgress - Callback for progress updates
     * @param {function} onComplete - Callback for task completion
     * @param {function} onError - Callback for task errors
     * @param {number} interval - Polling interval in milliseconds
     * @returns {Object} polling control - contains a cancel method
     */
    pollTask: function(taskId, onProgress, onComplete, onError, interval = 2000) {
        let isCancelled = false;
        let timeoutId = null;
        
        const checkStatus = () => {
            if (isCancelled) return;
            
            this.checkTaskStatus(taskId)
                .then(response => {
                    // Update progress
                    if (onProgress && !isCancelled) {
                        onProgress(response.progress);
                    }
                    
                    if (response.status === 'completed') {
                        // Task completed
                        if (onComplete && !isCancelled) {
                            onComplete(response.result);
                        }
                    } else if (response.status === 'error') {
                        // Task failed
                        if (onError && !isCancelled) {
                            onError(response.error);
                        }
                    } else if (!isCancelled) {
                        // Task still running, poll again after the interval
                        timeoutId = setTimeout(checkStatus, interval);
                    }
                })
                .catch(error => {
                    if (onError && !isCancelled) {
                        onError(error.message);
                    }
                });
        };
        
        // Start polling
        timeoutId = setTimeout(checkStatus, interval);
        
        // Return an object with a cancel method
        return {
            cancel: function() {
                isCancelled = true;
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            }
        };
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
    }
};