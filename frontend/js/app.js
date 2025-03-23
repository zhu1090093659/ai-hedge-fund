/**
 * Main application for AI Hedge Fund
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    initApp();
});

/**
 * Initialize the application
 */
function initApp() {
    console.log('Initializing AI Hedge Fund Dashboard...');
    
    // Initialize charts configuration
    Charts.init();
    
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
    
    // Initialize module-specific functionality
    Dashboard.init();
    Analysis.init();
    Backtest.init();
    Portfolio.init();
    Settings.init();
}

/**
 * Check API connection on startup
 */
function checkApiConnection() {
    // Get the base URL from config or localStorage
    const apiBaseUrl = localStorage.getItem(CONFIG.STORAGE.API_ENDPOINT) || CONFIG.API.BASE_URL;
    
    // Make a simple ping request to the API root
    fetch(`${apiBaseUrl}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API Connection:', data.status);
            if (data.status === 'online') {
                // API is online
                CONFIG.API.SIMULATION = false;
            } else {
                // API is not reporting as online
                CONFIG.API.SIMULATION = true;
                Utils.showToast('Warning: API connection status is not optimal. Some features may be limited.', 'warning');
            }
        })
        .catch(error => {
            console.error('API Connection Error:', error);
            CONFIG.API.SIMULATION = true;
            Utils.showToast('API connection failed. Using simulation mode.', 'error');
        });
}

/**
 * Initialize sidebar navigation
 */
function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    const sections = document.querySelectorAll('.content-section');
    
    // Combine both sets of links
    const allLinks = [...sidebarLinks, ...mobileLinks];
    
    allLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get target section
            const sectionId = link.getAttribute('data-section');
            if (!sectionId) return;
            
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
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('show')) {
                const hsOverlay = HSOverlay.getInstance(mobileMenu);
                if (hsOverlay) hsOverlay.hide();
            }
            
            // Update URL hash
            window.location.hash = sectionId;
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

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.getElementById('tickerSearch');
    const searchButton = document.getElementById('searchButton');
    const marketSelect = document.getElementById('marketSelect');
    
    if (!searchInput || !searchButton) return;
    
    // Search button click event
    searchButton.addEventListener('click', () => {
        performSearch(searchInput.value);
    });
    
    // Search input enter key event
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
    
    // Market filter change event
    if (marketSelect) {
        marketSelect.addEventListener('change', () => {
            // This would filter the dashboard view based on selected market
            const market = marketSelect.value;
            console.log('Market filter changed to:', market);
            
            // Update watchlist to filter by market
            if (Dashboard.filterWatchlistByMarket) {
                Dashboard.filterWatchlistByMarket(market);
            }
        });
    }
}

/**
 * Perform ticker search
 * @param {string} query - Search query
 */
function performSearch(query) {
    if (!query || !query.trim()) {
        Utils.showToast('Please enter a ticker symbol', 'warning');
        return;
    }
    
    query = query.trim().toUpperCase();
    
    // Check if query is a valid ticker format
    if (API.validateTickerFormat(query)) {
        openTickerModal(query);
    } else {
        Utils.showToast('Invalid ticker format. Use 1-5 letters for US stocks or 6 digits followed by .SH/.SZ for A-shares', 'error');
    }
}

/**
 * Initialize theme toggle
 */
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', () => {
        // Get current theme
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        // Toggle theme
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Apply and save the new theme
        Utils.applyTheme(newTheme);
        
        // Update settings if on settings page
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = newTheme;
        }
    });
}

/**
 * Initialize modals
 */
function initModals() {
    // Ticker modal
    initTickerModal();
}

/**
 * Initialize ticker modal
 */
function initTickerModal() {
    // Preline UI handles most modal functionality
    // We just need to add event handlers for our custom actions
    
    // Add to watchlist button
    const addToWatchlistBtn = document.getElementById('addToWatchlistBtn');
    if (addToWatchlistBtn) {
        addToWatchlistBtn.addEventListener('click', () => {
            const ticker = document.getElementById('modalTickerSymbol').textContent;
            Utils.addToWatchlist(ticker);
        });
    }
    
    // Analyze ticker button
    const analyzeTickerBtn = document.getElementById('analyzeTickerBtn');
    if (analyzeTickerBtn) {
        analyzeTickerBtn.addEventListener('click', () => {
            const ticker = document.getElementById('modalTickerSymbol').textContent;
            
            // Navigate to analysis tab and populate ticker
            const analysisLink = document.querySelector('[data-section="analysis"]');
            if (analysisLink) analysisLink.click();
            
            const tickersInput = document.getElementById('analysisTickers');
            if (tickersInput) tickersInput.value = ticker;
            
            // Close the modal
            const modal = document.getElementById('tickerModal');
            const hsOverlay = HSOverlay.getInstance(modal);
            if (hsOverlay) hsOverlay.hide();
        });
    }
    
    // Chart period buttons
    const chartPeriodButtons = document.querySelectorAll('.chart-period');
    chartPeriodButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all period buttons
            chartPeriodButtons.forEach(b => {
                b.classList.remove('bg-primary-100', 'text-primary-700');
                b.classList.add('border-gray-200', 'bg-white', 'text-gray-800');
            });
            
            // Add active class to clicked button
            button.classList.remove('border-gray-200', 'bg-white', 'text-gray-800');
            button.classList.add('bg-primary-100', 'text-primary-700');
            
            // Get ticker symbol and period
            const ticker = document.getElementById('modalTickerSymbol').textContent;
            const period = button.getAttribute('data-period');
            
            // Update chart
            updateTickerChart(ticker, period);
        });
    });
    
    // Make sure tabs function properly
    document.addEventListener('click', function(e) {
        if (e.target.matches('.ticker-tab') || e.target.closest('.ticker-tab')) {
            const tab = e.target.matches('.ticker-tab') ? e.target : e.target.closest('.ticker-tab');
            const tabId = tab.getAttribute('data-hs-tab');
            if (!tabId) return;
            
            // Remove active class from all tabs
            document.querySelectorAll('.ticker-tab').forEach(t => {
                t.classList.remove('hs-tab-active');
                t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            tab.classList.add('hs-tab-active');
            tab.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.ticker-tab-content').forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });
            
            // Show corresponding tab content
            const tabContent = document.querySelector(tabId);
            if (tabContent) {
                tabContent.classList.remove('hidden');
                tabContent.classList.add('active');
            }
        }
    });
}

/**
 * Open ticker modal with data for a ticker
 * @param {string} ticker - Ticker symbol
 */
function openTickerModal(ticker) {
    const modal = document.getElementById('tickerModal');
    const modalTickerSymbol = document.getElementById('modalTickerSymbol');
    
    if (!modal || !modalTickerSymbol) return;
    
    // Set ticker symbol
    modalTickerSymbol.textContent = ticker;
    
    // Show loading state for each tab
    const tabContents = {
        'overview-tab': document.getElementById('overview-tab'),
        'chart-tab': document.getElementById('chart-tab'),
        'financials-tab': document.getElementById('financials-tab'),
        'news-tab': document.getElementById('news-tab'),
        'analysis-tab': document.getElementById('analysis-tab')
    };
    
    // Set loading state for each tab
    Object.values(tabContents).forEach(tab => {
        if (tab) {
            tab.innerHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-primary-600 rounded-full" role="status" aria-label="loading">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            `;
        }
    });
    
    // Show the modal
    const hsOverlay = HSOverlay.getInstance(modal);
    if (hsOverlay) hsOverlay.show();
    
    // Load ticker data
    loadTickerData(ticker);
    
    // Initialize chart with default period (3 months)
    updateTickerChart(ticker, '3m');
}

/**
 * Load ticker data for modal tabs
 * @param {string} ticker - Ticker symbol
 */
function loadTickerData(ticker) {
    const { startDate, endDate } = Utils.getDefaultDates();
    
    // Load overview data
    API.getStockData(ticker, startDate, endDate)
        .then(data => {
            updateOverviewTab(ticker, data);
        })
        .catch(error => {
            console.error(`Error loading data for ${ticker}:`, error);
            document.getElementById('overview-tab').innerHTML = `
                <div class="error-state text-center py-8">
                    <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                    <p class="text-red-500">Error loading overview data</p>
                </div>
            `;
        });
    
    // Load financials data
    API.getFinancials(ticker, endDate)
        .then(data => {
            updateFinancialsTab(ticker, data);
        })
        .catch(error => {
            console.error(`Error loading financials for ${ticker}:`, error);
            document.getElementById('financials-tab').innerHTML = `
                <div class="error-state text-center py-8">
                    <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                    <p class="text-red-500">Error loading financial data</p>
                </div>
            `;
        });
    
    // Load news data
    API.getNews(ticker, startDate, endDate, 10)
        .then(data => {
            updateNewsTab(ticker, data);
        })
        .catch(error => {
            console.error(`Error loading news for ${ticker}:`, error);
            document.getElementById('news-tab').innerHTML = `
                <div class="error-state text-center py-8">
                    <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                    <p class="text-red-500">Error loading news data</p>
                </div>
            `;
        });
    
    // Load analysis tab (use most recent analysis if available)
    const recentAnalyses = Utils.getRecentAnalyses();
    const tickerAnalysis = recentAnalyses.find(analysis => 
        analysis.tickers && analysis.tickers.includes(ticker)
    );
    
    if (tickerAnalysis && tickerAnalysis.result) {
        updateAnalysisTab(ticker, tickerAnalysis.result);
    } else {
        document.getElementById('analysis-tab').innerHTML = `
            <div class="empty-state text-center py-8">
                <i class="ti ti-robot text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                <p class="text-sm text-gray-500 dark:text-secondary-400 mb-4">No recent analysis available for ${ticker}.</p>
                <button class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" id="runNewAnalysis">
                    <i class="ti ti-robot"></i> Run New Analysis
                </button>
            </div>
        `;
        
        // Add event listener to analysis button
        document.getElementById('runNewAnalysis').addEventListener('click', () => {
            const analysisLink = document.querySelector('[data-section="analysis"]');
            if (analysisLink) analysisLink.click();
            
            const tickersInput = document.getElementById('analysisTickers');
            if (tickersInput) tickersInput.value = ticker;
            
            // Close the modal
            const modal = document.getElementById('tickerModal');
            const hsOverlay = HSOverlay.getInstance(modal);
            if (hsOverlay) hsOverlay.hide();
        });
    }
}

/**
 * Update ticker chart with selected period
 * @param {string} ticker - Ticker symbol
 * @param {string} period - Time period (1m, 3m, 6m, 1y, 5y)
 */
function updateTickerChart(ticker, period) {
    const chartContainer = document.getElementById('chart-tab');
    if (!chartContainer) return;
    
    // Show loading state
    chartContainer.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <div class="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-primary-600 rounded-full" role="status" aria-label="loading">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    `;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
        case '1m':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case '3m':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        case '6m':
            startDate.setMonth(endDate.getMonth() - 6);
            break;
        case '1y':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        case '5y':
            startDate.setFullYear(endDate.getFullYear() - 5);
            break;
        default:
            startDate.setMonth(endDate.getMonth() - 3);
    }
    
    // Format dates
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Fetch price data
    API.getPrices(ticker, startDateStr, endDateStr)
        .then(data => {
            if (!data || data.length === 0) {
                chartContainer.innerHTML = `
                    <div class="error-state text-center py-8">
                        <i class="ti ti-chart-line text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                        <p class="text-gray-500 dark:text-secondary-400">No price data available for the selected period</p>
                    </div>
                `;
                return;
            }
            
            // Restore chart container
            chartContainer.innerHTML = `
                <div class="chart-container mb-4">
                    <canvas id="tickerChart"></canvas>
                </div>
                <div class="flex flex-wrap justify-center gap-2 mb-2">
                    <button class="chart-period py-2 px-4 inline-flex items-center gap-x-2 text-xs font-medium rounded-full border ${period === '1m' ? 'border-transparent bg-primary-100 text-primary-700' : 'border-gray-200 bg-white text-gray-800'} dark:bg-secondary-800 dark:border-secondary-700 dark:text-white" data-period="1m">1M</button>
                    <button class="chart-period py-2 px-4 inline-flex items-center gap-x-2 text-xs font-medium rounded-full border ${period === '3m' ? 'border-transparent bg-primary-100 text-primary-700' : 'border-gray-200 bg-white text-gray-800'} dark:bg-secondary-800 dark:border-secondary-700 dark:text-white" data-period="3m">3M</button>
                    <button class="chart-period py-2 px-4 inline-flex items-center gap-x-2 text-xs font-medium rounded-full border ${period === '6m' ? 'border-transparent bg-primary-100 text-primary-700' : 'border-gray-200 bg-white text-gray-800'} dark:bg-secondary-800 dark:border-secondary-700 dark:text-white" data-period="6m">6M</button>
                    <button class="chart-period py-2 px-4 inline-flex items-center gap-x-2 text-xs font-medium rounded-full border ${period === '1y' ? 'border-transparent bg-primary-100 text-primary-700' : 'border-gray-200 bg-white text-gray-800'} dark:bg-secondary-800 dark:border-secondary-700 dark:text-white" data-period="1y">1Y</button>
                    <button class="chart-period py-2 px-4 inline-flex items-center gap-x-2 text-xs font-medium rounded-full border ${period === '5y' ? 'border-transparent bg-primary-100 text-primary-700' : 'border-gray-200 bg-white text-gray-800'} dark:bg-secondary-800 dark:border-secondary-700 dark:text-white" data-period="5y">5Y</button>
                </div>
            `;
            
            // Create stock chart
            Charts.createStockChart('tickerChart', data, period);
            
            // Re-initialize chart period buttons
            const chartPeriodButtons = document.querySelectorAll('.chart-period');
            chartPeriodButtons.forEach(button => {
                button.addEventListener('click', () => {
                    updateTickerChart(ticker, button.getAttribute('data-period'));
                });
            });
        })
        .catch(error => {
            console.error(`Error loading chart data for ${ticker}:`, error);
            chartContainer.innerHTML = `
                <div class="error-state text-center py-8">
                    <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                    <p class="text-red-500">Error loading chart data</p>
                </div>
            `;
        });
}

/**
 * Update overview tab with ticker data
 * @param {string} ticker - Ticker symbol
 * @param {Object} data - Ticker data
 */
function updateOverviewTab(ticker, data) {
    const container = document.getElementById('overview-tab');
    if (!container) return;
    
    if (!data || !data.metrics || data.metrics.length === 0) {
        container.innerHTML = `
            <div class="error-state text-center py-8">
                <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                <p class="text-red-500">No overview data available</p>
            </div>
        `;
        return;
    }
    
    // Get the most recent metrics
    const metrics = data.metrics[0];
    const prices = data.prices && data.prices.length > 0 ? data.prices : [];
    const latestPrice = prices.length > 0 ? prices[prices.length - 1] : null;
    
    // Get market type and currency
    const isAShare = Utils.isAShare(ticker);
    const currency = Utils.getTickerCurrency(ticker);
    
    // Calculate market cap display
    let marketCapDisplay = 'N/A';
    if (data.market_cap) {
        if (data.market_cap >= 1e12) {
            marketCapDisplay = `${(data.market_cap / 1e12).toFixed(2)}T ${currency}`;
        } else if (data.market_cap >= 1e9) {
            marketCapDisplay = `${(data.market_cap / 1e9).toFixed(2)}B ${currency}`;
        } else if (data.market_cap >= 1e6) {
            marketCapDisplay = `${(data.market_cap / 1e6).toFixed(2)}M ${currency}`;
        } else {
            marketCapDisplay = `${data.market_cap.toLocaleString()} ${currency}`;
        }
    }
    
    // Build the overview HTML
    let html = `
        <div class="overview-content">
            <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div class="ticker-info">
                    <h3 class="text-xl font-semibold">${ticker}</h3>
                    <p class="text-sm text-gray-500 dark:text-secondary-400">${isAShare ? 'A-Share' : 'US Stock'}</p>
                </div>
                <div class="ticker-price text-right">
                    <p class="text-xl font-bold">${latestPrice ? Utils.formatCurrency(latestPrice.close, currency) : 'N/A'}</p>
    `;
    
    // Add price change if available
    if (latestPrice && prices.length > 1) {
        const previousDay = prices[prices.length - 2];
        const change = latestPrice.close - previousDay.close;
        const changePercent = change / previousDay.close;
        const changeClass = change >= 0 ? 'text-green-500' : 'text-red-500';
        
        html += `
            <p class="${changeClass}">
                ${Utils.formatCurrency(change, currency, 2)} (${Utils.formatPercentage(changePercent, 2, true)})
            </p>
        `;
    } else {
        html += `<p class="text-gray-500 dark:text-secondary-400">--</p>`;
    }
    
    html += `
            </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">Market Cap</p>
                <p class="text-sm font-semibold">${marketCapDisplay}</p>
            </div>
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">P/E Ratio</p>
                <p class="text-sm font-semibold">${metrics.price_to_earnings_ratio ? metrics.price_to_earnings_ratio.toFixed(2) : 'N/A'}</p>
            </div>
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">P/B Ratio</p>
                <p class="text-sm font-semibold">${metrics.price_to_book_ratio ? metrics.price_to_book_ratio.toFixed(2) : 'N/A'}</p>
            </div>
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">P/S Ratio</p>
                <p class="text-sm font-semibold">${metrics.price_to_sales_ratio ? metrics.price_to_sales_ratio.toFixed(2) : 'N/A'}</p>
            </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">Net Margin</p>
                <p class="text-sm font-semibold">${metrics.net_margin ? Utils.formatPercentage(metrics.net_margin, 2) : 'N/A'}</p>
            </div>
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">Operating Margin</p>
                <p class="text-sm font-semibold">${metrics.operating_margin ? Utils.formatPercentage(metrics.operating_margin, 2) : 'N/A'}</p>
            </div>
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">ROE</p>
                <p class="text-sm font-semibold">${metrics.return_on_equity ? Utils.formatPercentage(metrics.return_on_equity, 2) : 'N/A'}</p>
            </div>
            <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-3">
                <p class="text-xs text-gray-500 dark:text-secondary-400 mb-1">ROA</p>
                <p class="text-sm font-semibold">${metrics.return_on_assets ? Utils.formatPercentage(metrics.return_on_assets, 2) : 'N/A'}</p>
            </div>
        </div>
        
        <div class="bg-gray-50 dark:bg-secondary-700/50 rounded-lg p-4 mt-6">
            <h4 class="text-base font-medium mb-2">AI Summary</h4>
            <p class="text-sm text-gray-600 dark:text-secondary-300">
                This is a placeholder for an AI-generated summary of the stock. In a real application, 
                this would be populated with a brief overview of the company, its business model, 
                recent performance, and key highlights.
            </p>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Update financials tab with ticker data
 * @param {string} ticker - Ticker symbol
 * @param {Array} data - Financial metrics
 */
function updateFinancialsTab(ticker, data) {
    const container = document.getElementById('financials-tab');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="error-state text-center py-8">
                <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                <p class="text-red-500">No financial data available</p>
            </div>
        `;
        return;
    }
    
    // Sort by report date (most recent first)
    data.sort((a, b) => new Date(b.report_period) - new Date(a.report_period));
    
    // Get currency from first record
    const currency = data[0].currency || Utils.getTickerCurrency(ticker);
    
    // Build the HTML
    let html = `
        <div class="financials-content">
            <div class="mb-4 flex justify-between items-center">
                <h4 class="text-lg font-semibold">Financial Metrics</h4>
                <div class="financials-controls">
                    <select id="financialPeriod" class="py-2 px-3 pe-9 text-sm border-gray-200 rounded-lg focus:border-primary-500 focus:ring-primary-500 dark:bg-secondary-900 dark:border-secondary-700 dark:text-secondary-400">
                        <option value="all">All Periods</option>
                        <option value="annual">Annual</option>
                        <option value="quarterly">Quarterly</option>
                    </select>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                    <thead>
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Period</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">P/E</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">P/B</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">P/S</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Net Margin</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">ROE</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">ROA</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Debt/Equity</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-secondary-700">
    `;
    
    // Add rows for each period
    data.forEach(period => {
        const periodType = period.period === 'annual' ? 'annual' : 'quarterly';
        
        html += `
            <tr data-period-type="${periodType}">
                <td class="px-4 py-3 whitespace-nowrap">
                    ${period.report_period} (${periodType === 'annual' ? 'Annual' : 'Q'})
                </td>
                <td class="px-4 py-3">${period.price_to_earnings_ratio ? period.price_to_earnings_ratio.toFixed(2) : 'N/A'}</td>
                <td class="px-4 py-3">${period.price_to_book_ratio ? period.price_to_book_ratio.toFixed(2) : 'N/A'}</td>
                <td class="px-4 py-3">${period.price_to_sales_ratio ? period.price_to_sales_ratio.toFixed(2) : 'N/A'}</td>
                <td class="px-4 py-3">${period.net_margin ? Utils.formatPercentage(period.net_margin, 2) : 'N/A'}</td>
                <td class="px-4 py-3">${period.return_on_equity ? Utils.formatPercentage(period.return_on_equity, 2) : 'N/A'}</td>
                <td class="px-4 py-3">${period.return_on_assets ? Utils.formatPercentage(period.return_on_assets, 2) : 'N/A'}</td>
                <td class="px-4 py-3">${period.debt_to_equity ? period.debt_to_equity.toFixed(2) : 'N/A'}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add event listener for period filter
    const periodSelect = document.getElementById('financialPeriod');
    if (periodSelect) {
        periodSelect.addEventListener('change', () => {
            const period = periodSelect.value;
            const rows = container.querySelectorAll('tr[data-period-type]');
            
            rows.forEach(row => {
                if (period === 'all' || row.dataset.periodType === period) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
}

/**
 * Update news tab with ticker data
 * @param {string} ticker - Ticker symbol
 * @param {Array} data - News items
 */
function updateNewsTab(ticker, data) {
    const container = document.getElementById('news-tab');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state text-center py-8">
                <i class="ti ti-news text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                <p class="text-sm text-gray-500 dark:text-secondary-400">No news available</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (most recent first)
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Build the HTML
    let html = `
        <div class="news-content">
            <h4 class="text-lg font-semibold mb-4">Recent News</h4>
            <div class="space-y-4">
    `;
    
    // Add news items
    data.forEach(item => {
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString();
        
        const sentimentClass = item.sentiment === 'positive' ? 'text-green-500' : 
                             (item.sentiment === 'negative' ? 'text-red-500' : 'text-gray-500');
        
        html += `
            <div class="news-item bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                    <h5 class="text-base font-medium mb-2">${item.title}</h5>
                    <span class="text-xs ${sentimentClass} font-medium ml-2">
                        ${item.sentiment ? item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1) : 'Neutral'}
                    </span>
                </div>
                <div class="flex justify-between items-center text-xs text-gray-500 dark:text-secondary-400 mt-2">
                    <span>${item.source} - ${formattedDate}</span>
                    ${item.url ? `<a href="${item.url}" target="_blank" class="text-primary-600 dark:text-primary-500 hover:underline">Read More</a>` : ''}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

/**
 * Update analysis tab with ticker data
 * @param {string} ticker - Ticker symbol
 * @param {Object} data - Analysis data
 */
function updateAnalysisTab(ticker, data) {
    const container = document.getElementById('analysis-tab');
    if (!container) return;
    
    if (!data || !data.decisions || !data.decisions[ticker]) {
        container.innerHTML = `
            <div class="empty-state text-center py-8">
                <i class="ti ti-robot text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                <p class="text-sm text-gray-500 dark:text-secondary-400 mb-4">No analysis available for ${ticker}.</p>
                <button class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700" id="runNewAnalysis">
                    <i class="ti ti-robot"></i> Run New Analysis
                </button>
            </div>
        `;
        
        // Add event listener to analysis button
        document.getElementById('runNewAnalysis').addEventListener('click', () => {
            const analysisLink = document.querySelector('[data-section="analysis"]');
            if (analysisLink) analysisLink.click();
            
            const tickersInput = document.getElementById('analysisTickers');
            if (tickersInput) tickersInput.value = ticker;
            
            // Close the modal
            const modal = document.getElementById('tickerModal');
            const hsOverlay = HSOverlay.getInstance(modal);
            if (hsOverlay) hsOverlay.hide();
        });
        
        return;
    }
    
    // Get ticker decision
    const decision = data.decisions[ticker];
    const actionClass = decision.action === 'buy' || decision.action === 'cover' ? 'text-green-500' : 
                      (decision.action === 'sell' || decision.action === 'short' ? 'text-red-500' : 'text-yellow-500');
    
    // Build the HTML
    let html = `
        <div class="analysis-content">
            <div class="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg p-4 mb-4">
                <h4 class="text-lg font-semibold mb-3">AI Trading Decision</h4>
                <div class="flex justify-between items-center mb-4">
                    <div class="flex items-center">
                        <span class="text-lg font-bold ${actionClass} mr-2">${decision.action.toUpperCase()}</span>
                        <span class="text-sm">${decision.quantity} shares</span>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-600 dark:text-secondary-400">Confidence</div>
                        <div class="text-lg font-semibold">${decision.confidence.toFixed(1)}%</div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 dark:bg-secondary-700 rounded-full h-2.5 mb-4">
                    <div class="bg-primary-600 h-2.5 rounded-full" style="width: ${decision.confidence}%"></div>
                </div>
                <div class="mt-4">
                    <h5 class="font-medium mb-2">Reasoning</h5>
                    <p class="text-sm text-gray-600 dark:text-secondary-300">${decision.reasoning || 'No reasoning provided.'}</p>
                </div>
            </div>
    `;
    
    // Add analyst signals if available
    if (data.analyst_signals) {
        html += `
            <div class="bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg p-4">
                <h4 class="text-lg font-semibold mb-3">Analyst Signals</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                        <thead>
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Analyst</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Signal</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Confidence</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-secondary-700">
        `;
        
        // Add signals for this ticker
        let hasSignals = false;
        for (const [analyst, signals] of Object.entries(data.analyst_signals)) {
            if (signals[ticker]) {
                hasSignals = true;
                const signal = signals[ticker];
                const signalClass = signal.signal === 'bullish' ? 'text-green-500' : 
                                  (signal.signal === 'bearish' ? 'text-red-500' : 'text-yellow-500');
                
                const analystName = analyst.replace('_agent', '').replace(/_/g, ' ');
                const displayName = analystName.charAt(0).toUpperCase() + analystName.slice(1);
                
                html += `
                    <tr>
                        <td class="px-4 py-3">${displayName}</td>
                        <td class="px-4 py-3 ${signalClass} font-medium">${signal.signal.toUpperCase()}</td>
                        <td class="px-4 py-3">${signal.confidence.toFixed(1)}%</td>
                    </tr>
                `;
            }
        }
        
        if (!hasSignals) {
            html += `
                <tr>
                    <td colspan="3" class="px-4 py-3 text-center text-gray-500 dark:text-secondary-400">No analyst signals available</td>
                </tr>
            `;
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
}
