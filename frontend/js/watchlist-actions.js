/**
 * 处理自选列表中的分析按钮和其他交互功能
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Watchlist actions initialized');
    
    // 为自选列表中的分析按钮添加事件委托
    const watchlistTable = document.getElementById('watchlistTable');
    if (watchlistTable) {
        watchlistTable.addEventListener('click', function(event) {
            // 查找被点击的分析按钮
            let target = event.target;
            
            // 如果点击的是图标，需要向上查找按钮元素
            if (target.tagName.toLowerCase() === 'i') {
                target = target.parentElement;
            }
            
            // 检查是否点击了分析按钮
            if (target.classList.contains('analyze-btn')) {
                const ticker = target.dataset.ticker;
                console.log('分析按钮被点击，股票代码:', ticker);
                
                // 直接导航到分析页面并传递股票代码
                window.location.href = `analysis.html?ticker=${encodeURIComponent(ticker)}`;
            }
        });
    }
});
