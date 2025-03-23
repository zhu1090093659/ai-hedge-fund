/**
 * 初始化脚本 - 确保所有页面加载时导航正确显示
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
