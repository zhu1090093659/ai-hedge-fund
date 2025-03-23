/**
 * 自选股票列表管理模块
 * 负责获取、显示和管理用户的自选股票列表
 */

const Watchlist = {
    /**
     * 初始化自选股票列表
     */
    init: function() {
        console.log('初始化自选股票列表...');
        this.loadWatchlist();
        this.setupEventListeners();
    },

    /**
     * 加载自选股票列表
     */
    loadWatchlist: function() {
        console.log('加载自选股票列表...');
        
        // 从本地存储获取自选列表
        const watchlist = Utils.getWatchlist();
        
        // 获取DOM元素
        const watchlistTable = document.getElementById('watchlistTable');
        const emptyWatchlist = document.getElementById('emptyWatchlist');
        
        if (!watchlistTable || !emptyWatchlist) {
            console.error('找不到自选列表DOM元素');
            return;
        }
        
        // 如果自选列表为空，显示空状态
        if (!watchlist || watchlist.length === 0) {
            watchlistTable.style.display = 'none';
            emptyWatchlist.style.display = '';
            return;
        }
        
        // 否则，隐藏空状态并显示自选列表
        watchlistTable.style.display = '';
        emptyWatchlist.style.display = 'none';
        
        // 清空表格内容（保留表头）
        const tbody = watchlistTable.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
        } else {
            console.error('找不到自选列表表格体');
            return;
        }
        
        // 获取当前日期和前一天的日期（用于获取最近的价格数据）
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 为每个自选股票创建行
        let loadedCount = 0;
        watchlist.forEach((ticker, index) => {
            // 创建占位行
            const row = document.createElement('tr');
            row.id = `watchlist-row-${ticker}`;
            row.classList.add('hover:bg-secondary-100', 'dark:hover:bg-secondary-700');
            
            row.innerHTML = `
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <div class="ticker-icon bg-gray-200 dark:bg-secondary-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium">
                            ${ticker.charAt(0)}
                        </div>
                        <div>
                            <div class="text-md font-semibold">${ticker}</div>
                            <div class="animate-pulse bg-gray-200 dark:bg-secondary-700 h-4 w-20 rounded mt-1"></div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <div class="animate-pulse bg-gray-200 dark:bg-secondary-700 h-6 w-20 rounded"></div>
                </td>
                <td class="px-4 py-3">
                    <div class="animate-pulse bg-gray-200 dark:bg-secondary-700 h-6 w-16 rounded"></div>
                </td>
                <td class="px-4 py-3 text-right">
                    <button type="button" class="analyze-btn py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                        <i class="ti ti-chart-bar text-lg"></i> 分析
                    </button>
                    <button type="button" class="remove-btn ml-1 py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                        <i class="ti ti-trash text-lg"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // 获取股票数据
            Promise.all([
                API.getTickerInfo(ticker).catch(() => null),
                API.getPrices(ticker, startDate, endDate).catch(() => null)
            ]).then(([tickerInfo, pricesData]) => {
                // 更新行内容
                this.updateWatchlistRow(row, ticker, tickerInfo, pricesData);
                
                // 更新加载计数
                loadedCount++;
                if (loadedCount === watchlist.length) {
                    console.log('自选列表全部加载完成');
                }
            }).catch(error => {
                console.error(`加载${ticker}数据失败:`, error);
                
                // 更新为错误状态
                row.innerHTML = `
                    <td class="px-4 py-3">
                        <div class="flex items-center">
                            <div class="ticker-icon bg-gray-200 dark:bg-secondary-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium">
                                ${ticker.charAt(0)}
                            </div>
                            <div>
                                <div class="text-md font-semibold">${ticker}</div>
                                <div class="text-sm text-gray-500 dark:text-secondary-400">加载失败</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3">--</td>
                    <td class="px-4 py-3">--</td>
                    <td class="px-4 py-3 text-right">
                        <button type="button" class="analyze-btn py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                            <i class="ti ti-chart-bar text-lg"></i> 分析
                        </button>
                        <button type="button" class="remove-btn ml-1 py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                            <i class="ti ti-trash text-lg"></i>
                        </button>
                    </td>
                `;
                
                // 更新加载计数
                loadedCount++;
            });
        });
    },
    
    /**
     * 更新自选列表行的内容
     * @param {HTMLElement} row - 行元素
     * @param {string} ticker - 股票代码
     * @param {Object} tickerInfo - 股票信息
     * @param {Array} pricesData - 价格数据
     */
    updateWatchlistRow: function(row, ticker, tickerInfo, pricesData) {
        // 如果没有数据，显示错误状态
        if (!tickerInfo && !pricesData) {
            row.innerHTML = `
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <div class="ticker-icon bg-gray-200 dark:bg-secondary-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 font-medium">
                            ${ticker.charAt(0)}
                        </div>
                        <div>
                            <div class="text-md font-semibold">${ticker}</div>
                            <div class="text-sm text-gray-500 dark:text-secondary-400">数据不可用</div>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">--</td>
                <td class="px-4 py-3">--</td>
                <td class="px-4 py-3 text-right">
                    <button type="button" class="analyze-btn py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                        <i class="ti ti-chart-bar text-lg"></i> 分析
                    </button>
                    <button type="button" class="remove-btn ml-1 py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                        <i class="ti ti-trash text-lg"></i>
                    </button>
                </td>
            `;
            return;
        }
        
        // 提取股票名称和价格数据
        const companyName = tickerInfo ? tickerInfo.name || ticker : ticker;
        
        let latestPrice = '--';
        let change = 0;
        let changePercent = 0;
        let priceDisplay = '--';
        let changeDisplay = '--';
        let changeClass = '';
        
        if (pricesData && pricesData.length > 0) {
            // 获取最新价格和变化
            const latest = pricesData[pricesData.length - 1];
            const previous = pricesData.length > 1 ? pricesData[pricesData.length - 2] : pricesData[0];
            
            latestPrice = latest.close;
            change = latestPrice - previous.close;
            changePercent = (change / previous.close) * 100;
            
            // 准备显示数据
            const currency = Utils.getTickerCurrency(ticker);
            priceDisplay = Utils.formatCurrency(latestPrice, currency);
            changeDisplay = `${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
            changeClass = change >= 0 ? 'text-green-500' : 'text-red-500';
        }
        
        // 更新行内容
        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <div class="ticker-icon bg-primary-100 dark:bg-primary-900 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-primary-700 dark:text-primary-300 font-medium">
                        ${ticker.charAt(0)}
                    </div>
                    <div>
                        <div class="text-md font-semibold">${ticker}</div>
                        <div class="text-sm text-gray-500 dark:text-secondary-400">${companyName}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 font-medium">${priceDisplay}</td>
            <td class="px-4 py-3 ${changeClass} font-medium">${changeDisplay}</td>
            <td class="px-4 py-3 text-right">
                <button type="button" class="analyze-btn py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                    <i class="ti ti-chart-bar text-lg"></i> 分析
                </button>
                <button type="button" class="remove-btn ml-1 py-1.5 px-2.5 inline-flex items-center gap-x-1 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" data-ticker="${ticker}">
                    <i class="ti ti-trash text-lg"></i>
                </button>
            </td>
        `;
        
        // 添加点击事件处理
        row.addEventListener('click', (event) => {
            // 如果点击的是按钮，不触发行点击事件
            if (event.target.closest('button')) {
                return;
            }
            
            // 显示股票详情模态框
            this.showTickerDetails(ticker);
        });
    },
    
    /**
     * 设置事件监听器
     */
    setupEventListeners: function() {
        // 添加股票按钮
        const addToWatchlistBtn = document.getElementById('addToWatchlist');
        if (addToWatchlistBtn) {
            addToWatchlistBtn.addEventListener('click', () => {
                this.promptAddToWatchlist();
            });
        }
        
        // 空状态添加按钮
        const emptyWatchlistAddBtn = document.getElementById('emptyWatchlistAdd');
        if (emptyWatchlistAddBtn) {
            emptyWatchlistAddBtn.addEventListener('click', () => {
                this.promptAddToWatchlist();
            });
        }
        
        // 使用事件委托处理表格中的按钮点击
        const watchlistTable = document.getElementById('watchlistTable');
        if (watchlistTable) {
            watchlistTable.addEventListener('click', (event) => {
                let target = event.target;
                
                // 如果点击的是图标，获取父按钮
                if (target.tagName.toLowerCase() === 'i') {
                    target = target.parentElement;
                }
                
                // 处理删除按钮点击
                if (target.classList.contains('remove-btn')) {
                    const ticker = target.dataset.ticker;
                    this.removeFromWatchlist(ticker);
                }
                
                // 注意：分析按钮点击事件现在完全由watchlist-actions.js处理
                // 此处不再处理analyze-btn的点击事件
            });
        }
    },
    
    /**
     * 提示用户添加股票到自选列表
     */
    promptAddToWatchlist: function() {
        const ticker = prompt('请输入股票代码 (例如: AAPL, 600519.SH):');
        if (!ticker) return;
        
        // 验证股票代码格式
        if (Utils.isValidTicker(ticker.trim().toUpperCase())) {
            this.addToWatchlist(ticker.trim().toUpperCase());
        } else {
            Utils.showToast('无效的股票代码格式', 'error');
        }
    },
    
    /**
     * 添加股票到自选列表
     * @param {string} ticker - 股票代码
     */
    addToWatchlist: function(ticker) {
        Utils.addToWatchlist(ticker);
        Utils.showToast(`已添加 ${ticker} 到自选列表`, 'success');
        this.loadWatchlist(); // 重新加载自选列表
    },
    
    /**
     * 从自选列表中移除股票
     * @param {string} ticker - 股票代码
     */
    removeFromWatchlist: function(ticker) {
        Utils.removeFromWatchlist(ticker);
        Utils.showToast(`已从自选列表中移除 ${ticker}`, 'info');
        this.loadWatchlist(); // 重新加载自选列表
    },
    
    /**
     * 显示股票详情模态框
     * @param {string} ticker - 股票代码
     */
    showTickerDetails: function(ticker) {
        console.log('显示股票详情:', ticker);
        
        // 获取模态框元素
        const modal = document.getElementById('tickerModal');
        const modalTickerSymbol = document.getElementById('modalTickerSymbol');
        
        if (!modal || !modalTickerSymbol) {
            console.error('找不到股票详情模态框元素');
            return;
        }
        
        // 设置股票代码
        modalTickerSymbol.textContent = ticker;
        
        // 打开模态框
        if (typeof HSOverlay !== 'undefined') {
            HSOverlay.open(modal);
        } else {
            modal.classList.remove('hidden');
        }
        
        // TODO: 加载并显示股票详细数据
        // 这里可以添加加载股票详细信息的代码，如价格图表、财务指标等
    }
};

// 当页面加载完成时初始化自选列表
document.addEventListener('DOMContentLoaded', function() {
    Watchlist.init();
});
