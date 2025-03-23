/**
 * 处理Dashboard页面的交互功能
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard interactions initialized');
    
    // 检查Dashboard对象是否已初始化
    if (typeof Dashboard !== 'undefined') {
        console.log('Dashboard对象已加载，将使用Dashboard.js中的事件处理');
        return; // 如果Dashboard对象已定义，则退出并使用其事件处理
    }
    
    // 以下代码仅在Dashboard对象未定义时执行（作为备用）
    console.log('Dashboard对象未加载，将使用backup事件处理');
    
    // 1. 处理Add Stocks按钮
    const addToWatchlistBtn = document.getElementById('addToWatchlist');
    if (addToWatchlistBtn) {
        console.log('Found addToWatchlist button');
        addToWatchlistBtn.onclick = function() {
            console.log('Add to watchlist clicked');
            const ticker = prompt('请输入股票代码 (例如: AAPL, 600519.SH):');
            if (!ticker) return;
            
            if (Utils.isValidTicker(ticker.trim().toUpperCase())) {
                Utils.addToWatchlist(ticker.trim().toUpperCase());
                loadWatchlist(); // 重新加载watchlist
            } else {
                Utils.showToast('无效的股票代码格式', 'error');
            }
        };
    }
    
    // 为空watchlist中的Add Stocks按钮添加事件监听器
    const emptyWatchlistAddBtn = document.getElementById('emptyWatchlistAdd');
    if (emptyWatchlistAddBtn) {
        console.log('Found emptyWatchlistAdd button');
        emptyWatchlistAddBtn.onclick = function() {
            console.log('Empty watchlist add button clicked');
            const ticker = prompt('请输入股票代码 (例如: AAPL, 600519.SH):');
            if (!ticker) return;
            
            if (Utils.isValidTicker(ticker.trim().toUpperCase())) {
                Utils.addToWatchlist(ticker.trim().toUpperCase());
                loadWatchlist(); // 重新加载watchlist
            } else {
                Utils.showToast('无效的股票代码格式', 'error');
            }
        };
    }
    
    // 2. 处理Run Analysis按钮
    const emptyAnalysisGoBtn = document.getElementById('emptyAnalysisGo');
    if (emptyAnalysisGoBtn) {
        console.log('Found emptyAnalysisGo button');
        emptyAnalysisGoBtn.onclick = function() {
            console.log('Run analysis button clicked');
            window.location.href = 'analysis.html';
        };
    }
    
    // 3. 处理Market Overview切换
    const marketTabs = document.querySelectorAll('.market-tab');
    console.log('Found market tabs:', marketTabs.length);
    marketTabs.forEach(tab => {
        tab.onclick = function() {
            console.log('Market tab clicked:', this.dataset.market);
            // 移除所有标签的active类
            marketTabs.forEach(t => {
                t.classList.remove('active');
                t.classList.remove('bg-primary-100');
                t.classList.remove('text-primary-700');
                t.classList.add('border-gray-200');
                t.classList.add('text-gray-700');
            });
            
            // 为点击的标签添加active类
            this.classList.add('active');
            this.classList.add('bg-primary-100');
            this.classList.add('text-primary-700');
            this.classList.remove('border-gray-200');
            this.classList.remove('text-gray-700');
            
            // 显示/隐藏相关指数
            const market = this.dataset.market;
            toggleMarketIndices(market);
        };
    });
    
    // 辅助函数：切换市场指数显示
    function toggleMarketIndices(market) {
        console.log('Toggling market indices for:', market);
        if (market === 'us') {
            // 显示美国市场指数
            document.getElementById('index-sp500').style.display = '';
            document.getElementById('index-nasdaq').style.display = '';
            document.getElementById('index-russell').style.display = '';
            
            // 隐藏中国市场指数
            document.getElementById('index-sse').style.display = 'none';
            document.getElementById('index-szse').style.display = 'none';
            document.getElementById('index-csi300').style.display = 'none';
        } else if (market === 'china') {
            // 隐藏美国市场指数
            document.getElementById('index-sp500').style.display = 'none';
            document.getElementById('index-nasdaq').style.display = 'none';
            document.getElementById('index-russell').style.display = 'none';
            
            // 显示中国市场指数
            document.getElementById('index-sse').style.display = '';
            document.getElementById('index-szse').style.display = '';
            document.getElementById('index-csi300').style.display = '';
        }
    }
    
    // 为了确保可以显示市场数据，添加一个简单的加载watchlist功能
    function loadWatchlist() {
        // 简单实现，实际功能通过Dashboard.js处理
        const watchlistTable = document.getElementById('watchlistTable');
        if (!watchlistTable) return;
        
        const watchlist = Utils.getWatchlist();
        watchlistTable.innerHTML = '';
        
        if (watchlist.length === 0) {
            watchlistTable.innerHTML = `
                <tr>
                    <td colspan="5" class="px-4 py-6 text-center">
                        <div class="flex flex-col items-center">
                            <i class="ti ti-list-search text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                            <p class="text-sm text-gray-500 dark:text-secondary-400 mb-3">您的自选股列表为空</p>
                            <button id="dynamicEmptyWatchlistAdd" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700">
                                <i class="ti ti-plus"></i> 添加股票
                            </button>
                        </div>
                    </td>
                </tr>
            `;
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
    }
});
