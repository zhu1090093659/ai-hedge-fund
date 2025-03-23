/**
 * 专门处理index.html页面按钮点击事件
 * 确保主页上的"添加股票"、"切换市场"和"运行分析"按钮正常工作
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化首页按钮事件...');
    
    // 1. 处理添加股票按钮
    const addToWatchlistBtn = document.getElementById('addToWatchlist');
    if (addToWatchlistBtn) {
        console.log('找到添加股票按钮');
        addToWatchlistBtn.addEventListener('click', function(event) {
            console.log('添加股票按钮被点击');
            event.preventDefault();
            addStockToWatchlist();
        });
    }
    
    // 处理空白自选列表中的添加股票按钮
    const emptyWatchlistAddBtn = document.getElementById('emptyWatchlistAdd');
    if (emptyWatchlistAddBtn) {
        console.log('找到空白自选列表添加按钮');
        emptyWatchlistAddBtn.addEventListener('click', function(event) {
            console.log('空白自选列表添加按钮被点击');
            event.preventDefault();
            addStockToWatchlist();
        });
    }
    
    // 2. 处理运行分析按钮
    const emptyAnalysisGoBtn = document.getElementById('emptyAnalysisGo');
    if (emptyAnalysisGoBtn) {
        console.log('找到运行分析按钮');
        emptyAnalysisGoBtn.addEventListener('click', function(event) {
            console.log('运行分析按钮被点击');
            event.preventDefault();
            window.location.href = 'analysis.html';
        });
    }
    
    // 3. 处理市场切换按钮
    const marketTabs = document.querySelectorAll('.market-tab');
    console.log(`找到 ${marketTabs.length} 个市场选项卡`);
    marketTabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            const market = this.dataset.market;
            console.log('市场选项卡被点击:', market);
            event.preventDefault();
            
            // 移除所有标签的活动状态
            marketTabs.forEach(t => {
                t.classList.remove('active');
                t.classList.remove('bg-primary-100');
                t.classList.remove('text-primary-700');
                t.classList.add('border-gray-200');
                t.classList.add('text-gray-700');
            });
            
            // 为当前选中的标签添加活动状态
            this.classList.add('active');
            this.classList.add('bg-primary-100');
            this.classList.add('text-primary-700');
            this.classList.remove('border-gray-200');
            this.classList.remove('text-gray-700');
            
            // 切换市场指数显示
            toggleMarketIndices(market);
        });
    });
    
    // 辅助函数
    
    /**
     * 添加股票到自选列表
     */
    function addStockToWatchlist() {
        const ticker = prompt('请输入股票代码 (例如: AAPL, 600519.SH):');
        if (!ticker) return;
        
        // 使用我们刚添加的isValidTicker函数验证股票代码
        if (Utils.isValidTicker(ticker.trim().toUpperCase())) {
            console.log('添加有效股票:', ticker.trim().toUpperCase());
            Utils.addToWatchlist(ticker.trim().toUpperCase());
            
            // 如果Dashboard对象存在，使用它的loadWatchlist方法
            if (typeof Dashboard !== 'undefined' && typeof Dashboard.loadWatchlist === 'function') {
                Dashboard.loadWatchlist();
            } else {
                // 否则刷新页面以显示更新的自选列表
                window.location.reload();
            }
            
            Utils.showToast(`已添加 ${ticker.trim().toUpperCase()} 到自选列表`, 'success');
        } else {
            Utils.showToast('无效的股票代码格式', 'error');
        }
    }
    
    /**
     * 切换市场指数显示
     * @param {string} market - 要显示的市场 (us, china)
     */
    function toggleMarketIndices(market) {
        console.log('切换市场指数显示:', market);
        
        const indices = {
            us: ['index-sp500', 'index-nasdaq', 'index-russell'],
            china: ['index-sse', 'index-szse', 'index-csi300']
        };
        
        // 显示所选市场的指数
        indices[market].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = '';
                element.classList.remove('hidden');
            }
        });
        
        // 隐藏其他市场的指数
        const otherMarket = market === 'us' ? 'china' : 'us';
        indices[otherMarket].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
                element.classList.add('hidden');
            }
        });
    }
});
