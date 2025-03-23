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
    formatPercentage: function(value, decimals = 2, includeSign = false) {
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
                return `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`;
            case 'DD/MM/YYYY':
                return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
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
            console.error('Error parsing settings:', error);
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
            document.body.classList.toggle('dark-mode', prefersDark);
        } else {
            document.documentElement.setAttribute('data-theme', theme);
            document.body.classList.toggle('dark-mode', theme === 'dark');
        }
        
        // Store the theme preference
        localStorage.setItem(CONFIG.STORAGE.THEME, theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const moonIcon = themeToggle.querySelector('.ti-moon');
            const sunIcon = themeToggle.querySelector('.ti-sun');
            
            if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                if (moonIcon) moonIcon.classList.add('hidden');
                if (sunIcon) sunIcon.classList.remove('hidden');
            } else {
                if (moonIcon) moonIcon.classList.remove('hidden');
                if (sunIcon) sunIcon.classList.add('hidden');
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
            console.error('Error parsing portfolio:', error);
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
     * Get recent analyses from localStorage
     * @returns {Array} Recent analyses
     */
    getRecentAnalyses: function() {
        const storedAnalyses = localStorage.getItem(CONFIG.STORAGE.RECENT_ANALYSES);
        if (!storedAnalyses) return [];
        
        try {
            return JSON.parse(storedAnalyses);
        } catch (error) {
            console.error('Error parsing recent analyses:', error);
            return [];
        }
    },
    
    /**
     * Save analysis to recent analyses
     * @param {Object} analysis - Analysis data
     */
    saveRecentAnalysis: function(analysis) {
        if (!analysis) return;
        
        const recentAnalyses = this.getRecentAnalyses();
        
        // Create a unique ID if not provided
        if (!analysis.id) {
            analysis.id = `analysis_${Date.now()}`;
        }
        
        // Add timestamp if not provided
        if (!analysis.date) {
            analysis.date = new Date().toISOString();
        }
        
        // Add to beginning of array
        recentAnalyses.unshift(analysis);
        
        // Limit to 10 recent analyses
        if (recentAnalyses.length > 10) {
            recentAnalyses.length = 10;
        }
        
        localStorage.setItem(CONFIG.STORAGE.RECENT_ANALYSES, JSON.stringify(recentAnalyses));
        
        // Refresh recent analyses if on dashboard
        if (document.getElementById('dashboard') && document.getElementById('dashboard').classList.contains('active')) {
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
        
        let iconClass = '';
        switch (type) {
            case 'success':
                iconClass = 'ti-check';
                break;
            case 'error':
                iconClass = 'ti-x';
                break;
            case 'warning':
                iconClass = 'ti-alert-triangle';
                break;
            case 'info':
            default:
                iconClass = 'ti-info-circle';
        }
        
        // 翻译常用的英文消息到中文
        const translations = {
            'Analysis started': '分析已开始',
            'Analysis completed': '分析已完成',
            'Analysis cancelled': '分析已取消',
            'Error': '错误',
            'Success': '成功',
            'Warning': '警告',
            'Info': '信息',
            'Settings saved': '设置已保存',
            'Connection test successful': '连接测试成功',
            'Connection test failed': '连接测试失败',
            'Invalid API endpoint': '无效的API端点',
            'Invalid ticker format': '无效的股票代码格式',
            'Please enter at least one ticker': '请至少输入一个股票代码',
            'Please select at least one analyst': '请至少选择一个分析师',
            'Please select a model': '请选择一个模型',
            'Please select a date range': '请选择日期范围',
            'Start date must be before end date': '开始日期必须在结束日期之前',
            'No data available': '没有可用数据',
            'Added to watchlist': '已添加到自选',
            'Removed from watchlist': '已从自选删除',
            'Already in watchlist': '已在自选中',
            'Not in watchlist': '不在自选中'
        };
        
        // 尝试翻译常用的英文消息
        for (const [english, chinese] of Object.entries(translations)) {
            if (message.includes(english)) {
                message = message.replace(english, chinese);
            }
        }
        
        Toastify({
            text: `<i class="${iconClass} mr-2"></i> ${message}`,
            escapeMarkup: false,
            duration: 3000,
            gravity: 'top',
            position: 'right',
            style: {
                background: bgColors[type] || bgColors.info
            }
        }).showToast();
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
     * Get text for a specific key
     * @param {string} key - Text key
     * @param {Object} params - Replacement parameters
     * @returns {string} Localized text
     */
    getText: function(key, params = {}) {
        // Text mapping
        const textMap = {
            // Common UI text
            'loading': '加载中...',
            'error': '错误',
            'success': '成功',
            'warning': '警告',
            'info': '信息',
            'save': '保存',
            'cancel': '取消',
            'close': '关闭',
            'add': '添加',
            'remove': '删除',
            'edit': '编辑',
            'search': '搜索',
            'filter': '筛选',
            'refresh': '刷新',
            'retry': '重试',
            'reset': '重置',
            
            // Specific feature text
            'run_analysis': '运行分析',
            'cancel_analysis': '取消分析',
            'analysis_in_progress': '分析正在进行中...',
            'analysis_cancelled': '分析已取消',
            'analysis_completed': '分析已完成',
            'analysis_failed': '分析失败',
            'no_analysis_running': '没有正在运行的分析。使用表单启动一个。',
            
            // Error messages
            'error_invalid_ticker': '无效的股票代码格式',
            'error_empty_ticker': '请至少输入一个股票代码',
            'error_no_analysts': '请至少选择一个分析师',
            'error_no_model': '请选择一个AI模型',
            'error_date_range': '开始日期必须在结束日期之前',
            'error_api_connection': 'API连接失败，请检查设置',
            
            // Text with parameters
            'ticker_added': '${ticker} 已添加到自选列表',
            'ticker_removed': '${ticker} 已从自选列表删除',
            'analysis_started': '分析开始：${tickers}',
            'max_tickers_warning': '请最多输入${count}个股票代码以获得最佳性能'
        };
        
        // Get text
        let text = textMap[key] || key;
        
        // Replace parameters
        for (const [param, value] of Object.entries(params)) {
            text = text.replace(`\${${param}}`, value);
        }
        
        return text;
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
     * Get currency for a ticker's market
     * @param {string} ticker - Ticker symbol
     * @returns {string} Currency code
     */
    getTickerCurrency: function(ticker) {
        return this.isAShare(ticker) ? 'CNY' : 'USD';
    },
    
    /**
     * 验证股票代码格式是否正确
     * @param {string} ticker - 股票代码
     * @returns {boolean} 是否为有效的股票代码
     */
    isValidTicker: function(ticker) {
        if (!ticker || typeof ticker !== 'string') return false;
        
        // 美股格式 (例如: AAPL, MSFT)
        const usPattern = /^[A-Z]{1,5}$/;
        
        // A股格式 (例如: 600519.SH, 000858.SZ)
        const cnPattern = /^\d{6}\.(SH|SZ)$/;
        
        return usPattern.test(ticker) || cnPattern.test(ticker);
    },
    
    /**
     * 直接刷新自选列表表格
     */
    refreshWatchlistTable: function() {
        const watchlistTable = document.getElementById('watchlistTable');
        if (!watchlistTable) return;
        
        const watchlist = this.getWatchlist();
        watchlistTable.innerHTML = '';
        
        if (watchlist.length === 0) {
            watchlistTable.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-6 text-center">
                        <div class="flex flex-col items-center">
                            <i class="ti ti-list-search text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                            <p class="text-sm text-gray-500 dark:text-secondary-400 mb-3">您的自选股列表为空</p>
                            <button id="emptyWatchlistAdd" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700">
                                <i class="ti ti-plus"></i> 添加股票
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            // 为新添加的按钮绑定事件
            const emptyWatchlistAddBtn = document.getElementById('emptyWatchlistAdd');
            if (emptyWatchlistAddBtn) {
                emptyWatchlistAddBtn.onclick = function() {
                    const ticker = prompt('请输入股票代码 (例如: AAPL, 600519.SH):');
                    if (!ticker) return;
                    
                    if (Utils.isValidTicker(ticker.trim().toUpperCase())) {
                        Utils.addToWatchlist(ticker.trim().toUpperCase());
                    } else {
                        Utils.showToast('无效的股票代码格式', 'error');
                    }
                };
            }
            return;
        }
        
        for (const ticker of watchlist) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ticker}</td>
                <td>--</td>
                <td>--</td>
                <td>--</td>
                <td>
                    <button class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none analyze-btn" data-ticker="${ticker}">
                        <i class="ti ti-robot"></i>
                    </button>
                    <button class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none remove-btn" data-ticker="${ticker}">
                        <i class="ti ti-trash"></i>
                    </button>
                </td>
            `;
            watchlistTable.appendChild(row);
        }
        
        // 为分析按钮和删除按钮绑定事件
        document.querySelectorAll('.analyze-btn').forEach(btn => {
            btn.onclick = function() {
                const ticker = this.getAttribute('data-ticker');
                if (ticker) {
                    window.location.href = `analysis.html?ticker=${ticker}`;
                }
            };
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.onclick = function() {
                const ticker = this.getAttribute('data-ticker');
                if (ticker) {
                    Utils.removeFromWatchlist(ticker);
                }
            };
        });
    }
};