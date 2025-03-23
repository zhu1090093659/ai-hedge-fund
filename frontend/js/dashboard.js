/**
 * Dashboard functionality for AI Hedge Fund
 */
const Dashboard = {
    /**
     * Initialize dashboard components
     */
    init: function() {
        const self = this; // 保存this引用，避免在事件处理程序中丢失上下文
        
        this.loadPortfolioSummary();
        this.loadWatchlist();
        this.loadRecentAnalyses();
        this.loadMarketIndices();
        
        // 为顶部的Add按钮添加事件监听器
        const addToWatchlistBtn = document.getElementById('addToWatchlist');
        if (addToWatchlistBtn) {
            addToWatchlistBtn.addEventListener('click', function() {
                self.showAddToWatchlistPrompt();
            });
        }
        
        // 为空watchlist中的Add Stocks按钮添加事件监听器
        const emptyWatchlistAddBtn = document.getElementById('emptyWatchlistAdd');
        if (emptyWatchlistAddBtn) {
            emptyWatchlistAddBtn.addEventListener('click', function() {
                self.showAddToWatchlistPrompt();
            });
        }
        
        // 为Run Analysis按钮添加事件监听器
        const emptyAnalysisGoBtn = document.getElementById('emptyAnalysisGo');
        if (emptyAnalysisGoBtn) {
            emptyAnalysisGoBtn.addEventListener('click', function() {
                // 导航到分析页面
                window.location.href = 'analysis.html';
            });
        }
        
        // 为Market Overview的切换按钮添加事件监听器
        const marketTabs = document.querySelectorAll('.market-tab');
        marketTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有标签的active类
                marketTabs.forEach(t => t.classList.remove('active'));
                
                // 为点击的标签添加active类
                this.classList.add('active');
                
                // 显示/隐藏相关指数
                const market = this.dataset.market;
                self.toggleMarketIndices(market);
            });
        });
    },
    
    /**
     * Load portfolio summary data
     */
    loadPortfolioSummary: function() {
        // Get portfolio data
        const portfolio = Utils.getPortfolio();
        
        // Calculate total value and positions value
        let totalPositionValue = 0;
        
        // This is a simplified calculation - in reality, we'd need current prices
        for (const [ticker, position] of Object.entries(portfolio.positions)) {
            if (position.long) {
                totalPositionValue += position.long * position.long_cost_basis;
            }
            if (position.short) {
                // For short positions, consider short_margin_used
                totalPositionValue += position.short_margin_used;
            }
        }
        
        const totalValue = portfolio.cash + totalPositionValue;
        
        // Update the UI
        document.getElementById('totalValue').textContent = Utils.formatCurrency(totalValue);
        document.getElementById('cashValue').textContent = Utils.formatCurrency(portfolio.cash);
        document.getElementById('investedValue').textContent = Utils.formatCurrency(totalPositionValue);
        
        // Calculate daily change (mock data for now)
        const dailyChange = 0.0126; // +1.26%
        const dailyChangeElement = document.getElementById('dailyChange');
        dailyChangeElement.textContent = Utils.formatPercentage(dailyChange, 2, true);
        dailyChangeElement.classList.add(dailyChange >= 0 ? 'positive' : 'negative');
        
        // Create/update portfolio chart
        this.createPortfolioValueChart();
    },
    
    /**
     * Create portfolio value chart
     */
    createPortfolioValueChart: function() {
        // Mock data for now - in a real app you would fetch this
        // or create it from actual trade history
        const days = 90;
        const portfolioData = [];
        const startValue = 100000;
        let currentValue = startValue;
        
        const now = new Date();
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            // Add some randomness for mock data
            const dailyChange = (Math.random() * 2 - 0.5) / 100; // Between -0.5% and 1.5%
            currentValue = currentValue * (1 + dailyChange);
            
            portfolioData.push({
                Date: date.toISOString().split('T')[0],
                'Portfolio Value': currentValue
            });
        }
        
        Charts.createPortfolioChart('portfolioChart', portfolioData);
    },
    
    /**
     * Load watchlist data
     */
    loadWatchlist: function() {
        const self = this; // 保存this引用
        const watchlistTable = document.getElementById('watchlistTable');
        if (!watchlistTable) return;
        
        const watchlist = Utils.getWatchlist();
        
        // Clear existing content
        watchlistTable.innerHTML = '';
        
        if (watchlist.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" class="px-4 py-6 text-center">
                    <div class="flex flex-col items-center">
                        <i class="ti ti-list-search text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                        <p class="text-sm text-gray-500 dark:text-secondary-400 mb-3">Your watchlist is empty</p>
                        <button id="dynamicEmptyWatchlistAdd" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700">
                            <i class="ti ti-plus"></i> Add Stocks
                        </button>
                    </div>
                </td>
            `;
            watchlistTable.appendChild(row);
            
            // Add event listener to the dynamically created button
            const dynamicBtn = watchlistTable.querySelector('#dynamicEmptyWatchlistAdd');
            if (dynamicBtn) {
                dynamicBtn.addEventListener('click', function() {
                    self.showAddToWatchlistPrompt();
                });
            }
            return;
        }
        
        // Load data for each ticker
        for (const ticker of watchlist) {
            this.loadWatchlistItem(ticker, watchlistTable);
        }
    },
    
    /**
     * Load data for a single watchlist item
     * @param {string} ticker - Ticker symbol
     * @param {HTMLElement} container - Container element
     */
    loadWatchlistItem: function(ticker, container) {
        // Create placeholder row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ticker}</td>
            <td>Loading...</td>
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
        container.appendChild(row);
        
        // Add event listeners
        row.querySelector('.analyze-btn').addEventListener('click', () => {
            // Navigate to analysis tab and populate ticker
            document.querySelector('[data-section="analysis"]').click();
            document.getElementById('analysisTickers').value = ticker;
        });
        
        row.querySelector('.remove-btn').addEventListener('click', () => {
            Utils.removeFromWatchlist(ticker);
        });
        
        // Fetch price data
        const { startDate, endDate } = Utils.getDefaultDates();
        
        API.get(`${CONFIG.API.ENDPOINTS.PRICES}/${ticker}`, {
            start_date: startDate,
            end_date: endDate
        })
        .then(data => {
            if (!data || data.length === 0) {
                row.querySelector('td:nth-child(2)').textContent = 'N/A';
                row.querySelector('td:nth-child(3)').textContent = 'N/A';
                return;
            }
            
            // Get latest price
            const latest = data[data.length - 1];
            const previousDay = data.length > 1 ? data[data.length - 2] : null;
            
            // Calculate change
            let change = 0;
            let changePercent = 0;
            if (previousDay) {
                change = latest.close - previousDay.close;
                changePercent = change / previousDay.close;
            }
            
            // Update row
            row.querySelector('td:nth-child(2)').textContent = Utils.formatCurrency(latest.close, Utils.getTickerCurrency(ticker));
            
            const changeCell = row.querySelector('td:nth-child(3)');
            changeCell.textContent = Utils.formatPercentage(changePercent, 2, true);
            changeCell.classList.add(changePercent >= 0 ? 'positive' : 'negative');
            
            // Add mock AI signal
            const signals = ['bullish', 'neutral', 'bearish'];
            const randomSignal = signals[Math.floor(Math.random() * signals.length)];
            const signalCell = row.querySelector('td:nth-child(4)');
            const signalColor = randomSignal === 'bullish' ? 'positive' : (randomSignal === 'bearish' ? 'negative' : '');
            
            signalCell.textContent = randomSignal.charAt(0).toUpperCase() + randomSignal.slice(1);
            if (signalColor) {
                signalCell.classList.add(signalColor);
            }
        })
        .catch(error => {
            console.error(`Error loading data for ${ticker}:`, error);
            row.querySelector('td:nth-child(2)').textContent = 'Error';
            row.querySelector('td:nth-child(3)').textContent = 'Error';
        });
    },
    
    /**
     * Show prompt to add a ticker to watchlist
     */
    showAddToWatchlistPrompt: function() {
        const ticker = prompt('Enter ticker symbol (e.g., AAPL, 600519.SH):');
        if (!ticker) return;
        
        if (Utils.isValidTicker(ticker.trim().toUpperCase())) {
            Utils.addToWatchlist(ticker.trim().toUpperCase());
        } else {
            Utils.showToast('Invalid ticker format', 'error');
        }
    },
    
    /**
     * Load recent analyses
     */
    loadRecentAnalyses: function() {
        const self = this; // 保存this引用
        const analysesContainer = document.getElementById('recentAnalysesList');
        if (!analysesContainer) return;
        
        const recentAnalyses = Utils.getRecentAnalyses();
        
        // Clear existing content
        analysesContainer.innerHTML = '';
        
        if (recentAnalyses.length === 0) {
            analysesContainer.innerHTML = `
                <div class="empty-state flex flex-col items-center justify-center py-8">
                    <i class="ti ti-robot text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                    <p class="text-sm text-gray-500 dark:text-secondary-400 mb-3">No recent analyses</p>
                    <button id="emptyAnalysisGo" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700">
                        <i class="ti ti-robot"></i> Run Analysis
                    </button>
                </div>
            `;
            
            // Add event listener
            const emptyAnalysisGoBtn = analysesContainer.querySelector('#emptyAnalysisGo');
            if (emptyAnalysisGoBtn) {
                emptyAnalysisGoBtn.addEventListener('click', function() {
                    // 导航到分析页面
                    window.location.href = 'analysis.html';
                });
            }
            return;
        }
        
        // Display recent analyses
        for (const analysis of recentAnalyses.slice(0, 5)) {
            const analysisItem = document.createElement('div');
            analysisItem.className = 'analysis-item';
            
            // Format tickers string
            let tickersStr = '';
            if (analysis.tickers && analysis.tickers.length > 0) {
                tickersStr = analysis.tickers.join(', ');
                if (tickersStr.length > 25) {
                    tickersStr = tickersStr.substring(0, 22) + '...';
                }
            }
            
            analysisItem.innerHTML = `
                <div class="analysis-header">
                    <span class="analysis-date">${Utils.formatDate(analysis.date)}</span>
                    <span class="analysis-tickers">${tickersStr}</span>
                </div>
                <div class="analysis-body">
                    <div class="analysis-signals">
                        ${this.formatAnalysisSignals(analysis)}
                    </div>
                </div>
                <div class="analysis-actions">
                    <button class="btn-icon view-analysis" data-id="${analysis.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            
            analysesContainer.appendChild(analysisItem);
            
            // Add event listener
            analysisItem.querySelector('.view-analysis').addEventListener('click', () => {
                // Navigate to analysis tab and load analysis details
                document.querySelector('[data-section="analysis"]').click();
                Analysis.loadSavedAnalysis(analysis.id);
            });
        }
    },
    
    /**
     * Format analysis signals for display
     * @param {Object} analysis - Analysis data
     * @returns {string} HTML for signals
     */
    formatAnalysisSignals: function(analysis) {
        if (!analysis.result || !analysis.result.decisions) {
            return '<span class="no-signals">No signals available</span>';
        }
        
        let html = '';
        for (const [ticker, decision] of Object.entries(analysis.result.decisions)) {
            const actionClass = decision.action === 'buy' || decision.action === 'cover' ? 'positive' : 
                               (decision.action === 'sell' || decision.action === 'short' ? 'negative' : '');
            
            html += `
                <div class="signal">
                    <span class="signal-ticker">${ticker}</span>
                    <span class="signal-action ${actionClass}">${decision.action.toUpperCase()}</span>
                    <span class="signal-confidence">${decision.confidence.toFixed(1)}%</span>
                </div>
            `;
        }
        
        return html;
    },
    
    /**
     * Load market indices
     */
    loadMarketIndices: function() {
        // Load US market indices
        this.loadUsMarketIndices();
        
        // Load China market indices
        this.loadChinaMarketIndices();
        
        // Default to showing US market
        this.toggleMarketIndices('us');
    },
    
    /**
     * Toggle market indices display
     * @param {string} market - Market to show (us, china)
     */
    toggleMarketIndices: function(market) {
        const indices = document.querySelectorAll('.market-index');
        
        indices.forEach(index => {
            const id = index.id;
            if (market === 'us' && (id.includes('sp500') || id.includes('nasdaq') || id.includes('russell'))) {
                index.style.display = '';
            } else if (market === 'china' && (id.includes('sse') || id.includes('szse') || id.includes('csi300'))) {
                index.style.display = '';
            } else {
                index.style.display = 'none';
            }
        });
    },
    
    /**
     * Load US market indices
     */
    loadUsMarketIndices: function() {
        const indices = [
            { id: 'index-sp500', symbol: '^GSPC' },
            { id: 'index-nasdaq', symbol: '^IXIC' },
            { id: 'index-dji', symbol: '^DJI' }
        ];
        
        // 获取当前日期
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        
        // 获取7天前的日期作为起始日期
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // 为每个指数获取数据
        indices.forEach(index => {
            API.getPrices(index.symbol, startDateStr, endDate)
                .then(data => {
                    if (data && data.length >= 2) {
                        // 获取最新和前一天的收盘价
                        const latestData = data[data.length - 1];
                        const previousData = data[data.length - 2];
                        
                        // 计算指数值和变化
                        const value = latestData.close;
                        const previousValue = previousData.close;
                        const change = ((value - previousValue) / previousValue) * 100;
                        
                        // 更新UI
                        this.updateIndexDisplay(index.id, {
                            value: value,
                            previousValue: previousValue,
                            change: change
                        });
                    }
                })
                .catch(error => {
                    console.error(`获取指数数据失败: ${index.symbol}`, error);
                });
        });
    },
    
    /**
     * Load China market indices
     */
    loadChinaMarketIndices: function() {
        const indices = [
            { id: 'index-sse', symbol: '000001.SH' },
            { id: 'index-szse', symbol: '399001.SZ' },
            { id: 'index-csi300', symbol: '000300.SH' }
        ];
        
        // 获取当前日期
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        
        // 获取7天前的日期作为起始日期
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // 为每个指数获取数据
        indices.forEach(index => {
            API.getPrices(index.symbol, startDateStr, endDate)
                .then(data => {
                    if (data && data.length >= 2) {
                        // 获取最新和前一天的收盘价
                        const latestData = data[data.length - 1];
                        const previousData = data[data.length - 2];
                        
                        // 计算指数值和变化
                        const value = latestData.close;
                        const previousValue = previousData.close;
                        const change = ((value - previousValue) / previousValue) * 100;
                        
                        // 更新UI
                        this.updateIndexDisplay(index.id, {
                            value: value,
                            previousValue: previousValue,
                            change: change
                        });
                    }
                })
                .catch(error => {
                    console.error(`获取指数数据失败: ${index.symbol}`, error);
                });
        });
    },
    
    /**
     * Update index display
     * @param {string} id - Element ID
     * @param {Object} data - Index data
     */
    updateIndexDisplay: function(id, data) {
        const element = document.getElementById(id);
        if (!element) return;
        
        const valueElement = element.querySelector('.index-value');
        const changeElement = element.querySelector('.index-change');
        
        // 显示指数值，保留两位小数
        valueElement.textContent = data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        // 计算指数点数变化
        const pointChange = data.previousValue ? (data.value - data.previousValue) : 0;
        
        // 显示指数点数变化和百分比变化
        const changeText = `${pointChange >= 0 ? '+' : ''}${pointChange.toFixed(2)} (${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%)`;
        changeElement.textContent = changeText;
        
        // 设置颜色
        if (data.change >= 0) {
            changeElement.classList.remove('text-danger-500');
            changeElement.classList.add('text-success-500');
        } else {
            changeElement.classList.remove('text-success-500');
            changeElement.classList.add('text-danger-500');
        }
    }
};
