/**
 * Main application for AI Hedge Fund
 */
<<<<<<< HEAD

/**
 * 初始化导航链接
 */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
=======
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
});
/**
 * 初始化导航链接
 */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
>>>>>>> d6ff652e3e6fe08ea0d5a4a7b260317bde96c045
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
<<<<<<< HEAD
=======
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
>>>>>>> d6ff652e3e6fe08ea0d5a4a7b260317bde96c045
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
    
    // 查找所有文本节点
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
 * Fix navigation sidebar display issues
 * This is the key function that ensures the sidebar is visible on large screens
 */
function fixNavigationDisplay() {
    // Get all sidebars - look for both hidden and non-hidden variants 
    // to handle all possible states
    const sidebars = [
        document.querySelector('aside.hidden.lg\\:flex'),
        document.querySelector('aside.lg\\:flex')
    ];
    
    // Process all found sidebars
    sidebars.forEach(sidebar => {
        if (!sidebar) return;
        
        console.log('Fixing sidebar display');
        
        // Force the correct classes based on screen width
        if (window.innerWidth >= 1024) { // lg breakpoint is typically 1024px
            sidebar.classList.remove('hidden');
            sidebar.classList.add('flex');
            sidebar.classList.add('lg:flex'); // 确保大屏幕显示样式
        } else {
            sidebar.classList.add('hidden');
            sidebar.classList.remove('flex');
        }
    });
    
    // Add global window resize listener (use a single listener)
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
    
    // Ensure mobile menu button works correctly
    const mobileMenuButton = document.querySelector('[data-hs-overlay="#mobile-menu"]');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // 强制重新应用导航链接的样式 - 页面加载时执行一次
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
<<<<<<< HEAD
=======
            
            // 确保文本可见性
            const textSpan = link.querySelector('span');
            if (textSpan) {
                textSpan.style.display = 'inline';
                textSpan.style.color = 'white';
            }
>>>>>>> d6ff652e3e6fe08ea0d5a4a7b260317bde96c045
        }
    });
}

<<<<<<< HEAD
function initApp() {
    console.log('初始化 AI Hedge Fund 仪表板...');
    
    // 初始化图表配置
    if (typeof Charts !== 'undefined') {
        Charts.init();
    }
    
    // 检查API连接
    checkApiConnection();
    
    // 应用已保存的主题或默认主题
    const savedTheme = localStorage.getItem(CONFIG.STORAGE.THEME) || CONFIG.DEFAULTS.THEME;
    Utils.applyTheme(savedTheme);
    
    // 初始化导航
    initNavigation();
    
    // 初始化搜索功能
    initSearch();
    
    // 初始化主题切换
    initThemeToggle();
    
    // 初始化模态框
    initModals();
    
    // 初始化当前页面的模块
    initializeCurrentPageModule();
    
    // 修复导航显示 - 重要!
    fixNavigationDisplay();
    
    // 本地化页面文本
    localizePageText();
=======
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
>>>>>>> d6ff652e3e6fe08ea0d5a4a7b260317bde96c045
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