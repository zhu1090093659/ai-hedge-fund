/**
 * 处理自选列表中的分析按钮和其他交互功能
 */

// 确保调试信息全面显示
const DEBUG = true;

function debugLog(...args) {
    if (DEBUG) {
        console.log('[Watchlist Actions]', ...args);
    }
}

// 当DOM加载完成时初始化
document.addEventListener('DOMContentLoaded', function() {
    debugLog('初始化开始');
    initAnalyzeButtonHandlers();
    debugLog('初始化完成');
});

// 在页面完全加载后再次尝试初始化（以防DOM未完全就绪）
window.addEventListener('load', function() {
    debugLog('页面完全加载，重新检查分析按钮');
    initAnalyzeButtonHandlers();
    
    // 延迟2秒后再次检查，确保动态加载的内容也能绑定事件
    setTimeout(function() {
        debugLog('延迟检查分析按钮');
        initAnalyzeButtonHandlers();
    }, 2000);
});

/**
 * 初始化分析按钮处理器
 */
function initAnalyzeButtonHandlers() {
    debugLog('初始化分析按钮处理器');
    
    // 1. 设置表格级别的事件委托（主要方法）
    setupTableDelegation();
    
    // 2. 直接绑定现有按钮（备份方法）
    bindAnalyzeButtons();
    
    // 3. 设置变更观察器，处理动态添加的按钮
    setupMutationObserver();
    
    debugLog('分析按钮处理器初始化完成');
}

/**
 * 设置表格级别的事件委托
 */
function setupTableDelegation() {
    const watchlistTable = document.getElementById('watchlistTable');
    if (!watchlistTable) {
        debugLog('找不到自选列表表格，跳过委托设置');
        return;
    }
    
    // 移除之前可能绑定的事件处理器，防止重复
    watchlistTable.removeEventListener('click', watchlistTableClickHandler);
    
    // 添加新的事件处理器
    watchlistTable.addEventListener('click', watchlistTableClickHandler);
    debugLog('已设置watchlistTable委托处理器');
}

/**
 * 表格点击事件处理函数
 */
function watchlistTableClickHandler(event) {
    // 查找被点击的分析按钮
    let target = event.target;
    
    // 如果点击的是图标，需要向上查找按钮元素
    if (target.tagName.toLowerCase() === 'i') {
        target = target.parentElement;
    }
    
    // 检查是否点击了分析按钮
    if (target.classList.contains('analyze-btn')) {
        debugLog('通过委托捕获到分析按钮点击');
        handleAnalyzeButtonClick(event, target);
    }
}

/**
 * 处理分析按钮点击
 */
function handleAnalyzeButtonClick(event, button) {
    event.preventDefault();
    event.stopPropagation();
    
    const ticker = button.dataset.ticker;
    debugLog('分析按钮被点击，股票代码:', ticker);
    
    if (!ticker) {
        console.error('分析按钮没有股票代码数据属性');
        if (typeof Utils !== 'undefined') {
            Utils.showToast('无法识别股票代码', 'error');
        }
        return;
    }
    
    // 显示加载提示
    if (typeof Utils !== 'undefined') {
        Utils.showToast(`正在准备${ticker}的分析...`, 'info');
    }
    
    // 设置本地存储，确保分析页面可以获取到数据
    try {
        localStorage.setItem('pending_analysis_ticker', ticker);
        debugLog('已将待分析股票代码保存到localStorage:', ticker);
    } catch (e) {
        console.error('保存到localStorage失败:', e);
    }
    
    // 直接导航到分析页面并传递股票代码
    const analysisUrl = `analysis.html?ticker=${encodeURIComponent(ticker)}&t=${Date.now()}`;
    debugLog(`导航到分析页面: ${analysisUrl}`);
    
    // 使用location.href进行跳转，确保页面完全刷新
    window.location.href = analysisUrl;
}

/**
 * 为所有分析按钮绑定点击事件
 */
function bindAnalyzeButtons() {
    const analyzeButtons = document.querySelectorAll('.analyze-btn');
    debugLog(`找到${analyzeButtons.length}个分析按钮，正在绑定事件...`);
    
    analyzeButtons.forEach(function(button) {
        // 检查按钮是否已经绑定过事件（使用自定义属性标记）
        if (!button.dataset.eventBound) {
            const ticker = button.dataset.ticker;
            
            // 移除可能存在的旧事件处理器
            button.removeEventListener('click', function(){});
            
            // 直接绑定点击事件（作为备份，以防委托不工作）
            button.addEventListener('click', function(e) {
                debugLog('分析按钮直接点击，股票代码:', ticker);
                handleAnalyzeButtonClick(e, button);
            });
            
            // 标记按钮已绑定事件
            button.dataset.eventBound = 'true';
            debugLog(`已为按钮绑定事件: ${ticker}`);
        }
    });
}

/**
 * 设置变更观察器
 */
function setupMutationObserver() {
    const watchlistTable = document.getElementById('watchlistTable');
    if (!watchlistTable) {
        debugLog('找不到自选列表表格，跳过观察器设置');
        return;
    }
    
    // 创建新的观察器
    const observer = new MutationObserver(function(mutations) {
        let shouldRebind = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // 检查添加的节点中是否包含分析按钮或其父元素
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // 元素节点
                        if (node.classList && node.classList.contains('analyze-btn')) {
                            shouldRebind = true;
                        } else if (node.querySelector && node.querySelector('.analyze-btn')) {
                            shouldRebind = true;
                        }
                    }
                });
            }
        });
        
        if (shouldRebind) {
            debugLog('检测到DOM变化，重新绑定分析按钮');
            bindAnalyzeButtons();
        }
    });
    
    // 开始观察
    observer.observe(watchlistTable, {
        childList: true,
        subtree: true
    });
    
    debugLog('已设置watchlistTable变更观察器');
}
