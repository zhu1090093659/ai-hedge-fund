/**
 * 处理Dashboard页面的交互功能
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard interactions initialized');
    
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
                Dashboard.loadWatchlist(); // 重新加载watchlist
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
                Dashboard.loadWatchlist(); // 重新加载watchlist
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
});
