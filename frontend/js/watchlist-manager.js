/**
 * 自选股统一管理模块
 * 整合了utils.js、watchlist.js、watchlist-actions.js和index-actions.js中的自选股相关功能
 */

const WatchlistManager = {
    /**
     * 初始化自选股管理功能
     */
    init: function() {
        console.log('初始化自选股管理模块...');
        
        // 加载自选股列表
        this.loadWatchlist();
        
        // 设置事件监听器
        this.setupEventListeners();
        
        // 注册DOM变更观察器，处理动态添加的内容
        this.setupMutationObserver();
    },
    
    /**
     * 加载自选股列表到界面
     */
    loadWatchlist: function() {
        console.log('加载自选股列表...');
        
        // 获取自选列表数据
        const watchlist = this.getWatchlist();
        
        // 获取相关DOM元素
        const watchlistTable = document.getElementById('watchlistTable');
        if (!watchlistTable) {
            console.log('未找到watchlistTable元素，可能不在首页');
            return;
        }
        
        // 清空表格内容
        watchlistTable.innerHTML = '';
        
        // 如果自选列表为空，显示空状态
        if (!watchlist || watchlist.length === 0) {
            this.showEmptyState(watchlistTable);
            return;
        }
        
        // 显示自选股数据
        this.renderWatchlist(watchlist, watchlistTable);
    },
    
    /**
     * 显示空自选列表状态
     * @param {HTMLElement} container - 容器元素
     */
    showEmptyState: function(container) {
        container.innerHTML = `
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
        
        // 为空状态下的添加按钮绑定事件
        const addBtn = document.getElementById('emptyWatchlistAdd');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.promptAddToWatchlist();
            });
        }
    },
    
    /**
     * 渲染自选列表内容
     * @param {Array} watchlist - 自选列表数据
     * @param {HTMLElement} container - 容器元素
     */
    renderWatchlist: function(watchlist, container) {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 为每个自选股创建行
        for (const ticker of watchlist) {
            // 创建具有占位数据的行
            const row = document.createElement('tr');
            row.className = 'hover:bg-secondary-100 dark:hover:bg-secondary-700';
            row.innerHTML = `
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        <div class="ticker-icon bg-primary-100 dark:bg-primary-800/50 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-primary-700 dark:text-primary-300 font-medium">
                            ${ticker.charAt(0)}
                        </div>
                        <div>
                            <div class="text-md font-semibold">${ticker}</div>
                            <div class="text-sm text-gray-500 dark:text-secondary-400">加载中...</div>
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
            
            container.appendChild(row);
            
            // 获取股票数据并更新
            this.loadTickerData(ticker, row, startDate, endDate);
        }
        
        // 确保绑定事件处理器
        this.bindRowEventHandlers();
    },
    
    /**
     * 加载股票数据
     * @param {string} ticker - 股票代码
     * @param {HTMLElement} row - 表格行元素
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     */
    loadTickerData: function(ticker, row, startDate, endDate) {
        // 如果API对象存在，获取股票信息和价格数据
        if (typeof API !== 'undefined') {
            // 并行请求股票信息和价格数据
            Promise.all([
                API.getTickerInfo(ticker).catch(() => null),
                API.getPrices(ticker, startDate, endDate).catch(() => null)
            ])
            .then(([tickerInfo, pricesData]) => {
                this.updateRowWithData(row, ticker, tickerInfo, pricesData);
            })
            .catch(error => {
                console.error(`加载${ticker}数据失败:`, error);
                this.updateRowWithError(row, ticker);
            });
        } else {
            // 如果API不可用，使用模拟数据
            this.updateRowWithMockData(row, ticker);
        }
    },
    
    /**
     * 用获取的数据更新行
     * @param {HTMLElement} row - 表格行元素
     * @param {string} ticker - 股票代码
     * @param {Object} tickerInfo - 股票信息
     * @param {Array} pricesData - 价格数据
     */
    updateRowWithData: function(row, ticker, tickerInfo, pricesData) {
        // 提取公司名称和价格数据
        const companyName = tickerInfo ? (tickerInfo.name || ticker) : ticker;
        
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
            const currency = this.getTickerCurrency(ticker);
            priceDisplay = this.formatCurrency(latestPrice, currency);
            changeDisplay = `${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`;
            changeClass = change >= 0 ? 'text-green-500' : 'text-red-500';
        }
        
        // 更新行内容
        const firstCell = row.querySelector('td:first-child');
        if (firstCell) {
            firstCell.innerHTML = `
                <div class="flex items-center">
                    <div class="ticker-icon bg-primary-100 dark:bg-primary-900 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-primary-700 dark:text-primary-300 font-medium">
                        ${ticker.charAt(0)}
                    </div>
                    <div>
                        <div class="text-md font-semibold">${ticker}</div>
                        <div class="text-sm text-gray-500 dark:text-secondary-400">${companyName}</div>
                    </div>
                </div>
            `;
        }
        
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
            cells[1].textContent = priceDisplay;
            cells[1].className = "px-4 py-3 font-medium";
            
            cells[2].textContent = changeDisplay;
            cells[2].className = `px-4 py-3 ${changeClass} font-medium`;
        }
    },
    
    /**
     * 用错误状态更新行
     * @param {HTMLElement} row - 表格行元素
     * @param {string} ticker - 股票代码
     */
    updateRowWithError: function(row, ticker) {
        const firstCell = row.querySelector('td:first-child');
        if (firstCell) {
            const nameDiv = firstCell.querySelector('div > div:nth-child(2) > div:nth-child(2)');
            if (nameDiv) {
                nameDiv.textContent = '数据加载失败';
            }
        }
    },
    
    /**
     * 用模拟数据更新行
     * @param {HTMLElement} row - 表格行元素
     * @param {string} ticker - 股票代码
     */
    updateRowWithMockData: function(row, ticker) {
        // 生成随机价格和涨跌幅
        const price = Math.random() * 100 + 50;
        const change = (Math.random() * 10) - 5;
        const changePercent = (change / price) * 100;
        const isPositive = change >= 0;
        
        // 更新行内容
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
            cells[1].textContent = `$${price.toFixed(2)}`;
            cells[1].className = "px-4 py-3 font-medium";
            
            cells[2].textContent = `${isPositive ? '+' : ''}${changePercent.toFixed(2)}%`;
            cells[2].className = `px-4 py-3 ${isPositive ? 'text-green-500' : 'text-red-500'} font-medium`;
        }
        
        const nameDiv = row.querySelector('td:first-child div > div:nth-child(2) > div:nth-child(2)');
        if (nameDiv) {
            nameDiv.textContent = '模拟数据';
        }
    },
    
    /**
     * 绑定行事件处理器
     */
    bindRowEventHandlers: function() {
        // 绑定分析按钮
        document.querySelectorAll('.analyze-btn').forEach(btn => {
            if (!btn.hasAttribute('data-event-bound')) {
                btn.setAttribute('data-event-bound', 'true');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止事件冒泡
                    const ticker = btn.getAttribute('data-ticker');
                    if (ticker) {
                        // 将股票代码保存到localStorage，以便分析页面加载时使用
                        localStorage.setItem('pending_analysis_ticker', ticker);
                        window.location.href = `analysis.html?ticker=${ticker}`;
                    }
                });
            }
        });
        
        // 绑定删除按钮
        document.querySelectorAll('.remove-btn').forEach(btn => {
            if (!btn.hasAttribute('data-event-bound')) {
                btn.setAttribute('data-event-bound', 'true');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 防止事件冒泡
                    const ticker = btn.getAttribute('data-ticker');
                    if (ticker) {
                        this.removeFromWatchlist(ticker);
                    }
                });
            }
        });
        
        // 为行添加点击事件（显示详情）
        document.querySelectorAll('#watchlistTable tr').forEach(row => {
            if (!row.hasAttribute('data-event-bound')) {
                row.setAttribute('data-event-bound', 'true');
                row.addEventListener('click', (e) => {
                    // 如果点击的是按钮，不触发行点击事件
                    if (e.target.closest('button')) {
                        return;
                    }
                    
                    // 从行中获取股票代码
                    const tickerElement = row.querySelector('.text-md.font-semibold');
                    if (tickerElement) {
                        const ticker = tickerElement.textContent;
                        if (ticker) {
                            this.showTickerDetails(ticker);
                        }
                    }
                });
            }
        });
    },
    
    /**
     * 设置事件监听器
     */
    setupEventListeners: function() {
        // 为添加股票按钮添加事件
        const addToWatchlistBtn = document.getElementById('addToWatchlist');
        if (addToWatchlistBtn) {
            addToWatchlistBtn.addEventListener('click', () => {
                this.promptAddToWatchlist();
            });
        }
        
        // 为表格容器添加委托事件监听器，处理动态添加的元素
        const watchlistTable = document.getElementById('watchlistTable');
        if (watchlistTable) {
            // 使用事件委托处理按钮点击
            watchlistTable.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                
                const ticker = target.getAttribute('data-ticker');
                if (!ticker) return;
                
                if (target.classList.contains('analyze-btn')) {
                    // 处理分析按钮点击
                    localStorage.setItem('pending_analysis_ticker', ticker);
                    window.location.href = `analysis.html?ticker=${ticker}`;
                } else if (target.classList.contains('remove-btn')) {
                    // 处理删除按钮点击
                    this.removeFromWatchlist(ticker);
                }
            });
        }
    },
    
    /**
     * 设置DOM变更观察器，处理动态添加的内容
     */
    setupMutationObserver: function() {
        // 创建一个MutationObserver实例
        const observer = new MutationObserver((mutations) => {
            let needsRebind = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 检查是否添加了新的行或按钮
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // 元素节点
                            // 检查是否是表格行
                            if (node.tagName === 'TR') {
                                needsRebind = true;
                                break;
                            }
                            
                            // 检查是否包含分析或删除按钮
                            if (node.querySelector && 
                                (node.querySelector('.analyze-btn') || 
                                 node.querySelector('.remove-btn'))) {
                                needsRebind = true;
                                break;
                            }
                        }
                    }
                }
                
                if (needsRebind) break;
            }
            
            // 如果需要重新绑定事件
            if (needsRebind) {
                this.bindRowEventHandlers();
            }
        });
        
        // 监听表格的变化
        const watchlistTable = document.getElementById('watchlistTable');
        if (watchlistTable) {
            observer.observe(watchlistTable, {
                childList: true,
                subtree: true
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
        if (this.isValidTicker(ticker.trim().toUpperCase())) {
            this.addToWatchlist(ticker.trim().toUpperCase());
        } else {
            this.showToast('无效的股票代码格式', 'error');
        }
    },
    
    /**
     * 添加股票到自选列表
     * @param {string} ticker - 股票代码
     */
    addToWatchlist: function(ticker) {
        // 获取当前自选列表
        const watchlist = this.getWatchlist();
        const normalizedTicker = ticker.trim().toUpperCase();
        
        // 检查是否已存在
        if (watchlist.includes(normalizedTicker)) {
            this.showToast(`${normalizedTicker} 已在您的自选列表中`, 'info');
            return;
        }
        
        // 添加到列表
        watchlist.push(normalizedTicker);
        this.saveWatchlist(watchlist);
        
        // 显示成功提示
        this.showToast(`${normalizedTicker} 已添加到自选列表`, 'success');
        
        // 重新加载自选列表
        this.loadWatchlist();
    },
    
    /**
     * 从自选列表中移除股票
     * @param {string} ticker - 股票代码
     */
    removeFromWatchlist: function(ticker) {
        const watchlist = this.getWatchlist();
        const index = watchlist.indexOf(ticker);
        
        if (index === -1) {
            this.showToast(`${ticker} 不在您的自选列表中`, 'error');
            return;
        }
        
        // 从列表中移除
        watchlist.splice(index, 1);
        this.saveWatchlist(watchlist);
        
        // 显示成功提示
        this.showToast(`${ticker} 已从自选列表中移除`, 'success');
        
        // 重新加载自选列表
        this.loadWatchlist();
    },
    
    /**
     * 显示股票详情模态框
     * @param {string} ticker - 股票代码
     */
    showTickerDetails: function(ticker) {
        console.log('显示股票详情:', ticker);
        
        // 查找模态框元素
        const modal = document.getElementById('tickerModal');
        const modalTickerSymbol = document.getElementById('modalTickerSymbol');
        
        if (!modal || !modalTickerSymbol) {
            console.error('找不到模态框元素');
            return;
        }
        
        // 设置股票代码
        modalTickerSymbol.textContent = ticker;
        
        // 显示模态框
        if (typeof HSOverlay !== 'undefined') {
            HSOverlay.open(modal);
        } else {
            // 如果HSOverlay不可用，用原生方法显示
            modal.classList.remove('hidden');
        }
        
        // 加载模态框中的数据 (假设这个函数在其他地方已定义)
        if (typeof loadTickerModalData === 'function') {
            loadTickerModalData(ticker);
        }
    },
    
    /**
     * 获取自选列表
     * @returns {Array} 自选列表
     */
    getWatchlist: function() {
        // 首先尝试获取CONFIG中定义的存储键
        let storageKey = 'ai-hedge-fund-watchlist';
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE && CONFIG.STORAGE.WATCHLIST) {
            storageKey = CONFIG.STORAGE.WATCHLIST;
        }
        
        const storedWatchlist = localStorage.getItem(storageKey);
        if (!storedWatchlist) return [];
        
        try {
            return JSON.parse(storedWatchlist);
        } catch (error) {
            console.error('解析自选列表时出错:', error);
            return [];
        }
    },
    
    /**
     * 保存自选列表
     * @param {Array} watchlist - 自选列表
     */
    saveWatchlist: function(watchlist) {
        // 首先尝试获取CONFIG中定义的存储键
        let storageKey = 'ai-hedge-fund-watchlist';
        if (typeof CONFIG !== 'undefined' && CONFIG.STORAGE && CONFIG.STORAGE.WATCHLIST) {
            storageKey = CONFIG.STORAGE.WATCHLIST;
        }
        
        localStorage.setItem(storageKey, JSON.stringify(watchlist));
    },
    
    /**
     * 验证股票代码格式
     * @param {string} ticker - 股票代码
     * @returns {boolean} 是否有效
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
     * 获取股票的货币类型
     * @param {string} ticker - 股票代码
     * @returns {string} 货币代码
     */
    getTickerCurrency: function(ticker) {
        // 如果是A股，返回CNY，否则返回USD
        return /^\d{6}\.(SH|SZ)$/.test(ticker) ? 'CNY' : 'USD';
    },
    
    /**
     * 格式化货币值
     * @param {number} value - 要格式化的值
     * @param {string} currency - 货币代码 (USD, CNY等)
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的货币字符串
     */
    formatCurrency: function(value, currency = 'USD', decimals = 2) {
        if (value === undefined || value === null) return '--';
        
        // 尝试使用Intl.NumberFormat
        try {
            const formatter = new Intl.NumberFormat('zh-CN', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            
            return formatter.format(value);
        } catch (e) {
            // 降级处理
            const symbol = currency === 'CNY' ? '¥' : '$';
            return `${symbol}${parseFloat(value).toFixed(decimals)}`;
        }
    },
    
    /**
     * 显示提示信息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 (success, error, info, warning)
     */
    showToast: function(message, type = 'info') {
        // 如果存在Utils.showToast，使用它
        if (typeof Utils !== 'undefined' && typeof Utils.showToast === 'function') {
            Utils.showToast(message, type);
            return;
        }
        
        // 如果存在Toastify，使用它
        if (typeof Toastify === 'function') {
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
            return;
        }
        
        // 降级到alert
        alert(message);
    }
};

// 当页面加载完成时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化WatchlistManager');
    WatchlistManager.init();
});

// 导出全局变量
window.WatchlistManager = WatchlistManager;
