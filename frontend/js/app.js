/**
 * Main application for AI Hedge Fund
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('正在初始化页面...');
    
    // 初始化导航
    initNavigation();
    
    // 确保正确显示导航
    fixNavigationDisplay();
    
    // 应用当前页面的高亮效果
    refreshActiveNavLinks();
    
    // 用中文替换页面中的英文文本
    localizePageText();
    
    // 根据当前页面初始化特定功能
    initCurrentPage();
    
    // 确保App初始化函数中正确调用了所有需要的组件初始化函数，特别是自选列表相关的功能
    initApp();
});

/**
 * 初始化导航链接
 */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    // 将移动菜单按钮的事件处理程序附加到移动导航
    const mobileMenuButton = document.querySelector('[data-hs-overlay="#mobile-menu"]');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            console.log('移动菜单按钮点击');
            if (mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.remove('hidden');
            } else {
                mobileMenu.classList.add('hidden');
            }
        });
    }
    
    // 为关闭按钮添加事件处理程序
    const closeButton = document.querySelector('#mobile-menu [data-hs-overlay="#mobile-menu"]');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            mobileMenu.classList.add('hidden');
        });
    }
}

/**
 * 根据当前页面初始化特定功能
 */
function initCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('初始化当前页面:', currentPage);
    
    if (currentPage === 'index.html' || currentPage === '') {
        // 初始化仪表板
        if (typeof Dashboard !== 'undefined') {
            Dashboard.init();
        }
    } else if (currentPage === 'analysis.html') {
        // 初始化分析页面
        if (typeof Analysis !== 'undefined') {
            Analysis.init();
        }
    } else if (currentPage === 'backtest.html') {
        // 初始化回测页面
        if (typeof Backtest !== 'undefined') {
            Backtest.init();
        }
    } else if (currentPage === 'portfolio.html') {
        // 初始化投资组合页面
        if (typeof Portfolio !== 'undefined') {
            Portfolio.init();
        }
        
        // 为"运行分析"按钮添加事件监听器
        document.getElementById('emptyPortfolioAnalyze')?.addEventListener('click', function() {
            window.location.href = 'analysis.html';
        });
    } else if (currentPage === 'settings.html') {
        // 初始化设置页面
        if (typeof Settings !== 'undefined') {
            Settings.init();
        }
    }
}

/**
 * App初始化
 */
function initApp() {
    console.log('应用程序初始化开始...');
    
    // 初始化工具提示和弹出框
    initTooltips();
    
    // 初始化主题切换
    initThemeToggle();
    
    // 确保Utils已初始化
    if (typeof Utils !== 'undefined') {
        console.log('工具类已加载');
    } else {
        console.error('工具类未加载！');
    }
    
    // 确保API已初始化
    if (typeof API !== 'undefined') {
        console.log('API类已加载，基础URL:', API.getBaseUrl());
        
        // 检测API连接
        API.checkConnection().then(connected => {
            if (connected) {
                console.log('API连接成功，继续初始化应用');
                initPageSpecificFeatures();
            } else {
                console.error('API连接失败，尝试使用本地数据');
                // 显示连接错误提示
                const connectionError = document.createElement('div');
                connectionError.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
                connectionError.innerHTML = `
                    <div class="flex items-center">
                        <i class="ti ti-alert-circle text-xl mr-2"></i>
                        <div>
                            <p class="font-bold">后端连接失败</p>
                            <p class="text-sm">请确保后端服务已启动并运行在 ${API.getBaseUrl()}</p>
                        </div>
                    </div>
                `;
                document.body.appendChild(connectionError);
                
                // 仍然初始化页面，但使用本地数据
                initPageSpecificFeatures();
            }
        });
    } else {
        console.error('API类未加载！');
    }
    
    console.log('应用程序初始化完成');
}

/**
 * 初始化页面特定功能
 */
function initPageSpecificFeatures() {
    // 设置页面特定的初始化
    const pagePath = window.location.pathname;
    
    if (pagePath.includes('index.html') || pagePath.endsWith('/')) {
        console.log('初始化首页...');
        
        // 市场数据
        if (typeof MarketData !== 'undefined') {
            MarketData.init();
        }
        
        // 自选列表
        if (typeof Watchlist !== 'undefined') {
            Watchlist.init();
            console.log('自选列表已初始化');
        } else {
            // 如果Watchlist模块不存在，使用Utils中的方法刷新自选列表
            console.log('使用Utils刷新自选列表');
            if (typeof Utils !== 'undefined' && typeof Utils.refreshWatchlistTable === 'function') {
                Utils.refreshWatchlistTable();
            }
        }
        
        // 确保自选列表操作被初始化
        // 这里不需要显式调用，watchlist-actions.js已经有自己的DOMContentLoaded事件监听器
        console.log('自选列表操作脚本状态检查');
        if (document.querySelector('.analyze-btn')) {
            console.log('发现分析按钮，确保事件绑定正确');
            
            // 确保按钮有正确的data-ticker属性
            document.querySelectorAll('.analyze-btn').forEach(btn => {
                if (!btn.dataset.ticker) {
                    console.warn('发现没有ticker属性的分析按钮');
                } else {
                    console.log('分析按钮ticker:', btn.dataset.ticker);
                }
                
                // 确保分析按钮有点击事件
                btn.onclick = function() {
                    const ticker = this.dataset.ticker;
                    if (ticker) {
                        console.log('分析按钮点击:', ticker);
                        window.location.href = `analysis.html?ticker=${ticker}`;
                    }
                };
            });
        }
        
        // 为添加股票按钮添加事件监听器
        const addToWatchlistBtn = document.getElementById('addToWatchlist');
        if (addToWatchlistBtn) {
            console.log('为添加股票按钮添加事件监听器');
            addToWatchlistBtn.onclick = function() {
                console.log('添加股票按钮点击');
                const ticker = prompt('请输入股票代码 (例如: AAPL, 600519.SH):');
                if (!ticker) return;
                
                if (Utils.isValidTicker(ticker.trim().toUpperCase())) {
                    Utils.addToWatchlist(ticker.trim().toUpperCase());
                } else {
                    Utils.showToast('无效的股票代码格式', 'error');
                }
            };
        }
    } else if (pagePath.includes('analysis.html')) {
        console.log('初始化分析页面...');
        
        // 分析页面
        if (typeof AnalysisApp !== 'undefined') {
            AnalysisApp.init();
        }
    }
}

/**
 * 用中文替换页面中的英文文本
 */
function localizePageText() {
    // 定义英文到中文的映射
    const translations = {
        // 导航和标签页
        'Dashboard': '控制面板',
        'AI Analysis': 'AI分析',
        'Backtesting': '回测',
        'Portfolio': '投资组合',
        'Settings': '设置',
        'Overview': '概览',
        'Chart': '图表',
        'Financials': '财务',
        'News': '新闻',
        'Analysis': '分析',
        
        // 按钮和操作
        'Search': '搜索',
        'Close': '关闭',
        'Save': '保存',
        'Cancel': '取消',
        'Add': '添加',
        'Remove': '删除',
        'Edit': '编辑',
        'Run': '运行',
        'Test': '测试',
        'Reset': '重置',
        'Export': '导出',
        'Import': '导入',
        'Apply': '应用',
        
        // 其他常见 UI 文本
        'Loading...': '加载中...',
        'No data available': '没有可用数据',
        'Add to Watchlist': '添加到自选',
        'Analyze Stock': '分析股票',
        'Toggle navigation': '切换导航',
        'Your portfolio is empty': '您的投资组合为空',
        'Run Analysis': '运行分析',
        
        // 时间文本
        '1M': '1月',
        '3M': '3月',
        '6M': '6月',
        '1Y': '1年',
        '5Y': '5年'
    };
    
    // 找到所有文本节点并替换它们
    const textNodes = [];
    const walk = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        null, 
        false
    );
    
    let node;
    while(node = walk.nextNode()) {
        if (node.nodeValue.trim()) {
            textNodes.push(node);
        }
    }
    
    // 替换文本
    for(let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        let text = node.nodeValue;
        
        // 检查并替换翻译字典中的所有项目
        for(const [english, chinese] of Object.entries(translations)) {
            // 使用正则表达式确保我们替换的是完整的单词
            const regex = new RegExp(`\\b${english}\\b`, 'g');
            text = text.replace(regex, chinese);
        }
        
        node.nodeValue = text;
    }
    
    // 此外，更新元素的属性（如按钮、标签等）
    // 更新占位符文本
    const inputs = document.querySelectorAll('input[placeholder]');
    inputs.forEach(input => {
        const placeholder = input.getAttribute('placeholder');
        if (placeholder && placeholder.includes('e.g.')) {
            input.setAttribute('placeholder', placeholder.replace('e.g.', '如:'));
        }
        if (placeholder && placeholder.includes('AAPL, MSFT')) {
            input.setAttribute('placeholder', placeholder.replace('AAPL, MSFT', 'AAPL, 600519.SH'));
        }
    });
    
    // 更新按钮和链接的标题属性
    const elementsWithTitle = document.querySelectorAll('[title]');
    elementsWithTitle.forEach(element => {
        const title = element.getAttribute('title');
        for(const [english, chinese] of Object.entries(translations)) {
            if (title && title.includes(english)) {
                element.setAttribute('title', title.replace(english, chinese));
            }
        }
    });
}

/**
 * 修复导航显示问题
 * 这是关键函数，确保侧边栏在大屏幕上可见
 */
function fixNavigationDisplay() {
    // 获取所有侧边栏 - 查找隐藏和非隐藏变体以处理所有可能的状态
    const sidebars = [
        document.querySelector('aside.hidden.lg\\:flex'),
        document.querySelector('aside.lg\\:flex')
    ];
    
    // 处理所有找到的侧边栏
    sidebars.forEach(sidebar => {
        if (!sidebar) return;
        
        console.log('修复侧边栏显示');
        
        // 根据屏幕宽度强制设置正确的类
        if (window.innerWidth >= 1024) { // lg断点通常为1024px
            sidebar.classList.remove('hidden');
            sidebar.classList.add('flex');
            sidebar.classList.add('lg:flex'); // 确保大屏幕显示样式
        } else {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('flex');
        }
    });
    
    // 添加全局窗口大小调整监听器（使用单个监听器）
    if (!window.sidebarResizeListenerAdded) {
        window.addEventListener('resize', () => {
            const sidebars = [
                document.querySelector('aside.hidden.lg\\:flex'),
                document.querySelector('aside.lg\\:flex')
            ];
            
            sidebars.forEach(sidebar => {
                if (!sidebar) return;
                
                if (window.innerWidth >= 1024) {
                    sidebar.classList.remove('hidden');
                    sidebar.classList.add('flex');
                    sidebar.classList.add('lg:flex'); // 确保大屏幕显示样式
                } else {
                    sidebar.classList.add('hidden');
                    sidebar.classList.remove('flex');
                }
            });
        });
        
        window.sidebarResizeListenerAdded = true;
    }
    
    // 确保移动菜单按钮正常工作
    const mobileMenuButton = document.querySelector('[data-hs-overlay="#mobile-menu"]');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // 页面加载时执行一次重新应用导航链接的样式
    refreshActiveNavLinks();
}

/**
 * 修复导航高亮显示问题
 * 此函数确保当前页面的导航链接正确高亮显示
 */
function refreshActiveNavLinks() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    // 获取当前页面
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('当前页面:', currentPage);
    
    // 合并所有链接
    const allLinks = [...sidebarLinks, ...mobileLinks];
    
    // 先重置所有链接样式
    allLinks.forEach(link => {
        // 移除所有可能的活动状态类
        link.classList.remove('gradient-btn', 'bg-primary-500', 'text-white', 'hover:bg-primary-600', 'dark:hover:bg-primary-700');
        
        // 添加默认样式
        if (!link.classList.contains('text-secondary-700')) {
            link.classList.add('text-secondary-700');
        }
        if (!link.classList.contains('dark:text-white')) {
            link.classList.add('dark:text-white');
        }
        if (!link.classList.contains('hover:bg-gray-100')) {
            link.classList.add('hover:bg-gray-100');
        }
        if (!link.classList.contains('dark:hover:bg-secondary-700')) {
            link.classList.add('dark:hover:bg-secondary-700');
        }
    });
    
    // 为当前页面链接设置活动样式
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            console.log('设置活动链接:', href);
            
            // 移除默认样式
            link.classList.remove('text-secondary-700', 'hover:bg-gray-100', 'dark:hover:bg-secondary-700');
            
            // 添加活动样式 - 使用gradient-btn类以保持一致性
            link.classList.add('gradient-btn', 'text-white', 'hover:bg-primary-600', 'dark:hover:bg-primary-700');
            
            // 确保文本可见性
            const textSpan = link.querySelector('span');
            if (textSpan) {
                textSpan.style.display = 'inline';
                textSpan.style.color = 'white';
            }
        }
    });
}

// 添加页面可见性变化监听器，确保在页面切换时重新应用导航栏
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        setTimeout(() => {
            fixNavigationDisplay();
            refreshActiveNavLinks();
        }, 100);
    }
});

// 确保在每个页面加载完成后都调用导航栏修复函数
window.addEventListener('load', () => {
    setTimeout(() => {
        fixNavigationDisplay();
        refreshActiveNavLinks();
        localizePageText();
    }, 100);
});

// 添加页面路由变化监听器（适用于单页应用）
window.addEventListener('popstate', () => {
    setTimeout(() => {
        fixNavigationDisplay();
        refreshActiveNavLinks();
    }, 100);
});

// 在DOM准备就绪时运行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化应用
    initApp();
    
    // 在所有页面上确保导航栏正常工作
    fixNavigationDisplay();
    refreshActiveNavLinks();
});

// 添加页面显示处理程序以在页面间导航时修复导航
window.addEventListener('pageshow', function(event) {
    // 即使在后退/前进导航时也修复导航
    setTimeout(() => {
        fixNavigationDisplay();
        refreshActiveNavLinks();
    }, 50);
});