/**
 * Utility functions for AI Hedge Fund dashboard
 */
const Utils = {
    /**
     * Format currency values
     * @param {number} value - Value to format
     * @param {string} currency - Currency code (USD, CNY, etc.)
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted currency string
     */
    formatCurrency: function(value, currency = 'USD', decimals = 2) {
        if (value === undefined || value === null) return '--';
        
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        
        return formatter.format(value);
    },
    
    /**
     * Format percentage values
     * @param {number} value - Value to format (0.1 = 10%)
     * @param {number} decimals - Number of decimal places
     * @param {boolean} includeSign - Whether to include + sign for positive values
     * @returns {string} Formatted percentage string
     */
    formatPercentage: function(value, decimals = 2, includeSign = true) {
        if (value === undefined || value === null) return '--';
        
        const sign = includeSign && value > 0 ? '+' : '';
        return `${sign}${(value * 100).toFixed(decimals)}%`;
    },
    
    /**
     * Format large numbers with K, M, B suffixes
     * @param {number} value - Value to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number string
     */
    formatNumber: function(value, decimals = 0) {
        if (value === undefined || value === null) return '--';
        
        if (Math.abs(value) >= 1e9) {
            return (value / 1e9).toFixed(decimals) + 'B';
        } else if (Math.abs(value) >= 1e6) {
            return (value / 1e6).toFixed(decimals) + 'M';
        } else if (Math.abs(value) >= 1e3) {
            return (value / 1e3).toFixed(decimals) + 'K';
        } else {
            return value.toFixed(decimals);
        }
    },
    
    /**
     * Format date to the configured format
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate: function(date) {
        if (!date) return '--';
        
        const settings = this.getSettings();
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) return '--';
        
        switch (settings.dateFormat) {
            case 'MM/DD/YYYY':
                return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`;
            case 'DD/MM/YYYY':
                return `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
            case 'YYYY-MM-DD':
            default:
                return dateObj.toISOString().split('T')[0];
        }
    },
    
    /**
     * Get a date N days/months/years ago
     * @param {number} value - Number of time units
     * @param {string} unit - Time unit (day, month, year)
     * @returns {string} Formatted date string
     */
    getDateAgo: function(value, unit = 'day') {
        const date = new Date();
        
        switch (unit.toLowerCase()) {
            case 'day':
                date.setDate(date.getDate() - value);
                break;
            case 'month':
                date.setMonth(date.getMonth() - value);
                break;
            case 'year':
                date.setFullYear(date.getFullYear() - value);
                break;
        }
        
        return this.formatDate(date);
    },
    
    /**
     * Get user settings with default fallbacks
     * @returns {Object} User settings
     */
    getSettings: function() {
        const defaultSettings = {
            theme: CONFIG.DEFAULTS.THEME,
            dateFormat: CONFIG.DEFAULTS.DATE_FORMAT,
            chartColorScheme: CONFIG.DEFAULTS.CHART_COLOR_SCHEME,
            defaultMarket: CONFIG.DEFAULTS.MARKET,
            defaultModel: CONFIG.DEFAULTS.MODEL_NAME,
            defaultModelProvider: CONFIG.DEFAULTS.MODEL_PROVIDER,
            defaultAnalysts: CONFIG.DEFAULTS.ANALYSTS,
            apiEndpoint: CONFIG.API.BASE_URL
        };
        
        const storedSettings = localStorage.getItem(CONFIG.STORAGE.SETTINGS);
        if (!storedSettings) return defaultSettings;
        
        try {
            const parsedSettings = JSON.parse(storedSettings);
            return { ...defaultSettings, ...parsedSettings };
        } catch (error) {
            return defaultSettings;
        }
    },
    
    /**
     * Save user settings
     * @param {Object} settings - Settings to save
     */
    saveSettings: function(settings) {
        localStorage.setItem(CONFIG.STORAGE.SETTINGS, JSON.stringify(settings));
        
        // Apply theme immediately if changed
        if (settings.theme) {
            this.applyTheme(settings.theme);
        }
        
        // Show success message
        this.showToast('Settings saved successfully', 'success');
    },
    
    /**
     * Apply theme to the document
     * @param {string} theme - Theme name (light, dark, system)
     */
    applyTheme: function(theme = 'system') {
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        // Store the theme preference
        localStorage.setItem(CONFIG.STORAGE.THEME, theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    },
    
    /**
     * Get portfolio data from localStorage
     * @returns {Object} Portfolio data
     */
    getPortfolio: function() {
        const defaultPortfolio = {
            cash: CONFIG.DEFAULTS.INITIAL_CAPITAL,
            margin_used: 0,
            positions: {},
            realized_gains: {}
        };
        
        const storedPortfolio = localStorage.getItem(CONFIG.STORAGE.PORTFOLIO);
        if (!storedPortfolio) return defaultPortfolio;
        
        try {
            return JSON.parse(storedPortfolio);
        } catch (error) {
            return defaultPortfolio;
        }
    },
    
    /**
     * Save portfolio data to localStorage
     * @param {Object} portfolio - Portfolio data
     */
    savePortfolio: function(portfolio) {
        localStorage.setItem(CONFIG.STORAGE.PORTFOLIO, JSON.stringify(portfolio));
    },
    
    /**
     * Get watchlist data from localStorage
     * @returns {Array} Watchlist items
     */
    getWatchlist: function() {
        const storedWatchlist = localStorage.getItem(CONFIG.STORAGE.WATCHLIST);
        if (!storedWatchlist) return [];
        
        try {
            return JSON.parse(storedWatchlist);
        } catch (error) {
            return [];
        }
    },
    
    /**
     * Save watchlist data to localStorage
     * @param {Array} watchlist - Watchlist items
     */
    saveWatchlist: function(watchlist) {
        localStorage.setItem(CONFIG.STORAGE.WATCHLIST, JSON.stringify(watchlist));
    },
    
    /**
     * Add ticker to watchlist
     * @param {string} ticker - Ticker symbol
     */
    addToWatchlist: function(ticker) {
        const watchlist = this.getWatchlist();
        if (watchlist.includes(ticker)) {
            this.showToast(`${ticker} is already in your watchlist`, 'info');
            return;
        }
        
        watchlist.push(ticker);
        this.saveWatchlist(watchlist);
        this.showToast(`${ticker} added to watchlist`, 'success');
        
        // Refresh watchlist if on dashboard
        if (document.getElementById('dashboard').classList.contains('active')) {
            Dashboard.loadWatchlist();
        }
    },
    
    /**
     * Remove ticker from watchlist
     * @param {string} ticker - Ticker symbol
     */
    removeFromWatchlist: function(ticker) {
        const watchlist = this.getWatchlist();
        const index = watchlist.indexOf(ticker);
        
        if (index === -1) return;
        
        watchlist.splice(index, 1);
        this.saveWatchlist(watchlist);
        this.showToast(`${ticker} removed from watchlist`, 'success');
        
        // Refresh watchlist if on dashboard
        if (document.getElementById('dashboard').classList.contains('active')) {
            Dashboard.loadWatchlist();
        }
    },
    
    /**
     * Get recent analyses from localStorage
     * @returns {Array} Recent analyses
     */
    getRecentAnalyses: function() {
        const storedAnalyses = localStorage.getItem(CONFIG.STORAGE.RECENT_ANALYSES);
        if (!storedAnalyses) return [];
        
        try {
            return JSON.parse(storedAnalyses);
        } catch (error) {
            return [];
        }
    },
    
    /**
     * Save analysis to recent analyses
     * @param {Object} analysis - Analysis data
     */
    saveRecentAnalysis: function(analysis) {
        const recentAnalyses = this.getRecentAnalyses();
        
        // Add to beginning of array
        recentAnalyses.unshift({
            id: `analysis_${Date.now()}`,
            date: new Date().toISOString(),
            ...analysis
        });
        
        // Limit to 10 recent analyses
        if (recentAnalyses.length > 10) {
            recentAnalyses.length = 10;
        }
        
        localStorage.setItem(CONFIG.STORAGE.RECENT_ANALYSES, JSON.stringify(recentAnalyses));
        
        // Refresh recent analyses if on dashboard
        if (document.getElementById('dashboard').classList.contains('active')) {
            Dashboard.loadRecentAnalyses();
        }
    },
    
    /**
     * Download data as JSON file
     * @param {Object} data - Data to download
     * @param {string} filename - Filename
     */
    downloadJSON: function(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    },
    
    /**
     * Download data as CSV file
     * @param {Array} data - Array of objects
     * @param {string} filename - Filename
     */
    downloadCSV: function(data, filename) {
        if (!data || data.length === 0) {
            this.showToast('No data to download', 'error');
            return;
        }
        
        // Get headers from first object
        const headers = Object.keys(data[0]);
        
        // Convert data to CSV
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Handle values with commas
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            }).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
    },
    
    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Notification type (success, error, info, warning)
     */
    showToast: function(message, type = 'info') {
        if (typeof Toastify !== 'function') {
            console.error('Toastify library not loaded');
            alert(message);
            return;
        }
        
        const bgColors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        Toastify({
            text: message,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: {
                background: bgColors[type] || bgColors.info
            }
        }).showToast();
    },
    
    /**
     * Get color scheme based on settings
     * @returns {Object} Color scheme
     */
    getColorScheme: function() {
        const settings = this.getSettings();
        return CONFIG.CHART_COLORS[settings.chartColorScheme] || CONFIG.CHART_COLORS.DEFAULT;
    },
    
    /**
     * Validate a ticker format
     * @param {string} ticker - Ticker to validate
     * @returns {boolean} Is ticker valid
     */
    isValidTicker: function(ticker) {
        if (!ticker) return false;
        
        // US stock format (1-5 alphabetic characters)
        if (/^[A-Za-z]{1,5}$/.test(ticker)) {
            return true;
        }
        
        // A-share format (6 digits followed by .SH or .SZ)
        if (/^\d{6}\.(SH|SZ)$/.test(ticker)) {
            return true;
        }
        
        return false;
    },
    
    /**
     * Parse ticker string with multiple tickers
     * @param {string} tickerString - Comma-separated ticker string
     * @returns {Array} Array of valid tickers
     */
    parseTickers: function(tickerString) {
        if (!tickerString) return [];
        
        const tickers = tickerString.split(',')
            .map(ticker => ticker.trim().toUpperCase())
            .filter(ticker => this.isValidTicker(ticker));
            
        return [...new Set(tickers)]; // Remove duplicates
    },
    
    /**
     * Get default dates for analysis/backtest
     * @returns {Object} Start and end dates
     */
    getDefaultDates: function() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        
        return {
            startDate: this.formatDate(startDate),
            endDate: this.formatDate(endDate)
        };
    },
    
    /**
     * Determine if a ticker is an A-share
     * @param {string} ticker - Ticker symbol
     * @returns {boolean} Is A-share
     */
    isAShare: function(ticker) {
        return /^\d{6}\.(SH|SZ)$/.test(ticker);
    },
    
    /**
     * Get market designation for a ticker
     * @param {string} ticker - Ticker symbol
     * @returns {string} Market designation
     */
    getTickerMarket: function(ticker) {
        return this.isAShare(ticker) ? 'ASHARE' : 'US';
    },
    
    /**
     * Get currency for a ticker's market
     * @param {string} ticker - Ticker symbol
     * @returns {string} Currency code
     */
    getTickerCurrency: function(ticker) {
        return this.isAShare(ticker) ? 'CNY' : 'USD';
    }
};
