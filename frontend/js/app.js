/**
 * Main application for AI Hedge Fund
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initApp();
});

/**
 * Initialize the application with improved navigation handling
 */
function initApp() {
    console.log('Initializing AI Hedge Fund Dashboard...');
    
    // Initialize charts configuration
    if (typeof Charts !== 'undefined') {
        Charts.init();
    }
    
    // Check API connectivity
    checkApiConnection();
    
    // Apply saved theme or default
    const savedTheme = localStorage.getItem(CONFIG.STORAGE.THEME) || CONFIG.DEFAULTS.THEME;
    Utils.applyTheme(savedTheme);
    
    // Initialize components
    initNavigation();
    initSearch();
    initThemeToggle();
    initModals();
    
    // Initialize module for the current page
    initializeCurrentPageModule();
    
    // Fix navigation display - IMPORTANT!
    fixNavigationDisplay();
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
 * 刷新导航链接的活动状态
 * 确保当前页面的导航链接正确高亮显示
 */
function refreshActiveNavLinks() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    // 获取当前页面
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('Current page:', currentPage);
    
    // 合并所有链接
    const allLinks = [...sidebarLinks, ...mobileLinks];
    
    // 先重置所有链接样式
    allLinks.forEach(link => {
        link.classList.remove('bg-primary-500', 'text-white', 'hover:bg-primary-600', 'dark:hover:bg-primary-700');
        link.classList.add('text-secondary-700', 'dark:text-white', 'hover:bg-gray-100', 'dark:hover:bg-secondary-700');
    });
    
    // 为当前页面链接设置活动样式
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            console.log('Setting active link:', href);
            link.classList.remove('text-secondary-700', 'hover:bg-gray-100', 'dark:hover:bg-secondary-700');
            link.classList.add('bg-primary-500', 'text-white', 'hover:bg-primary-600', 'dark:hover:bg-primary-700');
        }
    });
}

/**
 * Initialize module for the current page
 */
function initializeCurrentPageModule() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    console.log('Current page:', currentPage);
    
    if (currentPage === 'index.html' || currentPage === '') {
        if (typeof Dashboard !== 'undefined') Dashboard.init();
    } else if (currentPage === 'analysis.html') {
        if (typeof Analysis !== 'undefined') Analysis.init();
    } else if (currentPage === 'backtest.html') {
        if (typeof Backtest !== 'undefined') Backtest.init();
    } else if (currentPage === 'portfolio.html') {
        if (typeof Portfolio !== 'undefined') Portfolio.init();
    } else if (currentPage === 'settings.html') {
        if (typeof Settings !== 'undefined') Settings.init();
    }
    
    // Always call fixNavigationDisplay after page-specific initialization
    // This ensures the sidebar is displayed correctly regardless of the page
    setTimeout(() => {
        fixNavigationDisplay();
        refreshActiveNavLinks();
    }, 50);
}

/**
 * Initialize sidebar navigation
 */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    // Combine both sets of links
    const allLinks = [...sidebarLinks, ...mobileLinks];
    
    // Set active link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // 重置所有链接样式，确保文本颜色可见
        link.classList.remove('bg-primary-500', 'text-white', 'hover:bg-primary-600', 'dark:hover:bg-primary-700');
        if (!link.classList.contains('text-secondary-700')) {
            link.classList.add('text-secondary-700');
        }
        if (!link.classList.contains('dark:text-white')) {
            link.classList.add('dark:text-white');
        }
        
        // Check if this link matches the current page
        if (href === currentPage) {
            console.log('Active link found:', href);
            link.classList.remove('text-secondary-700', 'hover:bg-gray-100', 'dark:hover:bg-secondary-700');
            link.classList.add('bg-primary-500', 'text-white', 'hover:bg-primary-600', 'dark:hover:bg-primary-700');
        }
        
        link.addEventListener('click', (e) => {
            // Get href attribute
            const href = link.getAttribute('href');
            
            // If it's a section within the same page (has data-section attribute)
            const sectionId = link.getAttribute('data-section');
            if (sectionId) {
                e.preventDefault();
                
                // Remove active class from all links
                allLinks.forEach(navLink => {
                    navLink.classList.remove('bg-primary-500', 'text-white');
                    navLink.classList.add('text-secondary-700', 'dark:text-white', 'hover:bg-gray-100', 'dark:hover:bg-secondary-700');
                });
                
                // Add active class to clicked link
                allLinks.forEach(navLink => {
                    if (navLink.getAttribute('data-section') === sectionId) {
                        navLink.classList.remove('text-secondary-700', 'hover:bg-gray-100', 'dark:hover:bg-secondary-700');
                        navLink.classList.add('bg-primary-500', 'text-white', 'hover:bg-primary-600', 'dark:hover:bg-primary-700');
                    }
                });
                
                // Hide all sections
                const sections = document.querySelectorAll('.content-section');
                sections.forEach(section => {
                    section.classList.remove('active');
                    section.classList.add('hidden');
                });
                
                // Show target section
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.remove('hidden');
                    targetSection.classList.add('active');
                }
                
                // Update URL hash
                window.location.hash = sectionId;
            }
            // If it's a link to another page (has href attribute but no data-section)
            else if (href && href !== '#') {
                // Let the default navigation happen
                // No need to call preventDefault()
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && mobileMenu.classList.contains('show')) {
                    const hsOverlay = HSOverlay.getInstance(mobileMenu);
                    if (hsOverlay) hsOverlay.hide();
                }
            }
        });
    });
    
    // Check URL hash on page load
    if (window.location.hash) {
        const sectionId = window.location.hash.substring(1);
        const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetLink) {
            targetLink.click();
        }
    }
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
    }, 100);
});

// 添加页面路由变化监听器（适用于单页应用）
window.addEventListener('popstate', () => {
    setTimeout(() => {
        fixNavigationDisplay();
        refreshActiveNavLinks();
    }, 100);
});

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Add a reload handler to fix navigation when navigating between pages
window.addEventListener('pageshow', function(event) {
    // Fix navigation even on back/forward navigation
    setTimeout(() => {
        fixNavigationDisplay();
        refreshActiveNavLinks();
    }, 50);
});
