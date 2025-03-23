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
    // Initialize charts configuration
    Charts.init();
    
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
 * Initialize sidebar navigation
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get target section
            const targetSection = link.getAttribute('data-section');
            
            // Remove active class from all links
            navLinks.forEach(navLink => {
                navLink.parentElement.classList.remove('active');
            });
            
            // Add active class to clicked link
            link.parentElement.classList.add('active');
            
            // Hide all sections
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show target section
            const sectionElement = document.getElementById(targetSection);
            if (sectionElement) {
                sectionElement.classList.add('active');
            }
        });
    });
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
            // For now, just update the UI to reflect the change
            const market = marketSelect.value;
            console.log('Market filter changed to:', market);
            
            // TODO: Implement filtering logic
            // For example, hide/show tickers in the watchlist based on the selected market
        });
    }
}

/**
 * Perform ticker search
 * @param {string} query - Search query
 */
function performSearch(query) {
    if (!query) return;
    
    query = query.trim().toUpperCase();
    
    // Check if query is a valid ticker format
    if (Utils.isValidTicker(query)) {
        openTickerModal(query);
    } else {
        Utils.showToast('Invalid ticker format', 'error');
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
    const modal = document.getElementById('tickerModal');
    const closeButtons = modal.querySelectorAll('.close-modal');
    
    // Close modal when clicking the close button
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeTickerModal();
        });
    });
    
    // Close modal when clicking outside the content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTickerModal();
        }
    });
    
    // Initialize tab switching
    const tabs = modal.querySelectorAll('.ticker-tab');
    const tabContents = modal.querySelectorAll('.ticker-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabName = tab.getAttribute('data-tab');
            const contentElement = document.getElementById(tabName + '-tab');
            if (contentElement) {
                contentElement.classList.add('active');
            }
        });
    });
    
    // Chart period buttons
    const chartPeriodButtons = modal.querySelectorAll('.chart-period');
    chartPeriodButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all period buttons
            chartPeriodButtons.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get ticker symbol and period
            const ticker = document.getElementById('modalTickerSymbol').textContent;
            const period = button.getAttribute('data-period');
            
            // Update chart
            updateTickerChart(ticker, period);
        });
    });
    
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
            document.querySelector('[data-section="analysis"]').click();
            document.getElementById('analysisTickers').value = ticker;
            
            // Close the modal
            closeTickerModal();
        });
    }
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
        'overview': document.getElementById('overview-tab'),
        'financials': document.getElementById('financials-tab'),
        'news': document.getElementById('news-tab'),
        'analysis': document.getElementById('analysis-tab')
    };
    
    // Set loading state for each tab
    Object.values(tabContents).forEach(tab => {
        if (tab) {
            tab.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </div>
            `;
        }
    });
    
    // Show the modal
    modal.classList.add('active');
    
    // Load ticker data
    loadTickerData(ticker);
    
    // Initialize chart with default period (3 months)
    updateTickerChart(ticker, '3m');
}

/**
 * Close ticker modal
 */
function closeTickerModal() {
    const modal = document.getElementById('tickerModal');
    if (!modal) return;
    
    modal.classList.remove('active');
}

/**
 * Load ticker data for modal tabs
 * @param {string} ticker - Ticker symbol
 */
function loadTickerData(ticker) {
    const { startDate, endDate } = Utils.getDefaultDates();
    
    // Load overview data
    API.get(`${CONFIG.API.ENDPOINTS.STOCK_DATA}/${ticker}`, {
        start_date: startDate,
        end_date: endDate
    })
    .then(data => {
        updateOverviewTab(ticker, data);
    })
    .catch(error => {
        console.error(`Error loading data for ${ticker}:`, error);
        document.getElementById('overview-tab').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading overview data</p>
            </div>
        `;
    });
    
    // Load financials data
    API.get(`${CONFIG.API.ENDPOINTS.FINANCIALS}/${ticker}`, {
        end_date: endDate
    })
    .then(data => {
        updateFinancialsTab(ticker, data);
    })
    .catch(error => {
        console.error(`Error loading financials for ${ticker}:`, error);
        document.getElementById('financials-tab').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading financial data</p>
            </div>
        `;
    });
    
    // Load news data
    API.get(`${CONFIG.API.ENDPOINTS.NEWS}/${ticker}`, {
        start_date: startDate,
        end_date: endDate,
        limit: 10
    })
    .then(data => {
        updateNewsTab(ticker, data);
    })
    .catch(error => {
        console.error(`Error loading news for ${ticker}:`, error);
        document.getElementById('news-tab').innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading news data</p>
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
            <div class="empty-state">
                <p>No recent analysis available for ${ticker}.</p>
                <button class="btn-secondary" id="runNewAnalysis">
                    <i class="fas fa-robot"></i> Run New Analysis
                </button>
            </div>
        `;
        
        // Add event listener to analysis button
        document.getElementById('runNewAnalysis').addEventListener('click', () => {
            document.querySelector('[data-section="analysis"]').click();
            document.getElementById('analysisTickers').value = ticker;
            closeTickerModal();
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
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate;
    
    switch (period) {
        case '1m':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case '3m':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        case '6m':
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 6);
            break;
        case '1y':
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        case '5y':
            startDate = new Date(endDate);
            startDate.setFullYear(endDate.getFullYear() - 5);
            break;
        default:
            startDate = new Date(endDate);
            startDate.setMonth(endDate.getMonth() - 3);
    }
    
    // Format dates
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Show loading state
    chartContainer.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading chart data...</p>
        </div>
    `;
    
    // Fetch price data
    API.get(`${CONFIG.API.ENDPOINTS.PRICES}/${ticker}`, {
        start_date: startDateStr,
        end_date: endDateStr
    })
    .then(data => {
        if (!data || data.length === 0) {
            chartContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No price data available for the selected period</p>
                </div>
            `;
            return;
        }
        
        // Restore chart container
        chartContainer.innerHTML = `
            <div class="ticker-chart-container">
                <canvas id="tickerChart"></canvas>
            </div>
            <div class="chart-controls">
                <button class="chart-period ${period === '1m' ? 'active' : ''}" data-period="1m">1M</button>
                <button class="chart-period ${period === '3m' ? 'active' : ''}" data-period="3m">3M</button>
                <button class="chart-period ${period === '6m' ? 'active' : ''}" data-period="6m">6M</button>
                <button class="chart-period ${period === '1y' ? 'active' : ''}" data-period="1y">1Y</button>
                <button class="chart-period ${period === '5y' ? 'active' : ''}" data-period="5y">5Y</button>
            </div>
        `;
        
        // Create stock chart
        Charts.createStockChart('tickerChart', data, period);
        
        // Re-initialize chart period buttons
        const chartPeriodButtons = document.querySelectorAll('.chart-period');
        chartPeriodButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all period buttons
                chartPeriodButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Update chart
                updateTickerChart(ticker, button.getAttribute('data-period'));
            });
        });
    })
    .catch(error => {
        console.error(`Error loading chart data for ${ticker}:`, error);
        chartContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading chart data</p>
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
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No overview data available</p>
            </div>
        `;
        return;
    }
    
    // Get the most recent metrics
    const metrics = data.metrics[0];
    const prices = data.prices && data.prices.length > 0 ? data.prices : [];
    const latestPrice = prices.length > 0 ? prices[prices.length - 1] : null;
    
    // Get market type
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
            <div class="overview-header">
                <div class="ticker-info">
                    <h3>${ticker}</h3>
                    <p class="ticker-type">${isAShare ? 'A-Share' : 'US Stock'}</p>
                </div>
                <div class="ticker-price">
                    <p class="price-value">${latestPrice ? Utils.formatCurrency(latestPrice.close, currency) : 'N/A'}</p>
                    `;
    
    // Add price change if available
    if (latestPrice && prices.length > 1) {
        const previousDay = prices[prices.length - 2];
        const change = latestPrice.close - previousDay.close;
        const changePercent = change / previousDay.close;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        
        html += `
                    <p class="price-change ${changeClass}">
                        ${Utils.formatCurrency(change, currency)} (${Utils.formatPercentage(changePercent, 2, true)})
                    </p>
                    `;
    } else {
        html += `<p class="price-change">--</p>`;
    }
    
    html += `
                </div>
            </div>
            
            <div class="overview-metrics">
                <div class="metric-row">
                    <div class="metric">
                        <p class="metric-label">Market Cap</p>
                        <p class="metric-value">${marketCapDisplay}</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">P/E Ratio</p>
                        <p class="metric-value">${metrics.price_to_earnings_ratio ? metrics.price_to_earnings_ratio.toFixed(2) : 'N/A'}</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">P/B Ratio</p>
                        <p class="metric-value">${metrics.price_to_book_ratio ? metrics.price_to_book_ratio.toFixed(2) : 'N/A'}</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">P/S Ratio</p>
                        <p class="metric-value">${metrics.price_to_sales_ratio ? metrics.price_to_sales_ratio.toFixed(2) : 'N/A'}</p>
                    </div>
                </div>
                <div class="metric-row">
                    <div class="metric">
                        <p class="metric-label">Net Margin</p>
                        <p class="metric-value">${metrics.net_margin ? Utils.formatPercentage(metrics.net_margin, 2) : 'N/A'}</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">Operating Margin</p>
                        <p class="metric-value">${metrics.operating_margin ? Utils.formatPercentage(metrics.operating_margin, 2) : 'N/A'}</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">ROE</p>
                        <p class="metric-value">${metrics.return_on_equity ? Utils.formatPercentage(metrics.return_on_equity, 2) : 'N/A'}</p>
                    </div>
                    <div class="metric">
                        <p class="metric-label">ROA</p>
                        <p class="metric-value">${metrics.return_on_assets ? Utils.formatPercentage(metrics.return_on_assets, 2) : 'N/A'}</p>
                    </div>
                </div>
            </div>
            
            <div class="overview-report">
                <h4>AI Summary</h4>
                <p>This is a placeholder for an AI-generated summary of the stock. In a real application, this would be populated with a brief overview of the company, its business model, recent performance, and key highlights.</p>
            </div>
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
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No financial data available</p>
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
            <div class="financials-header">
                <h4>Financial Metrics</h4>
                <div class="financials-controls">
                    <select id="financialPeriod">
                        <option value="all">All Periods</option>
                        <option value="annual">Annual</option>
                        <option value="quarterly">Quarterly</option>
                    </select>
                </div>
            </div>
            
            <div class="financials-table-container">
                <table class="financials-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>P/E</th>
                            <th>P/B</th>
                            <th>P/S</th>
                            <th>Net Margin</th>
                            <th>ROE</th>
                            <th>ROA</th>
                            <th>Debt/Equity</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Add rows for each period
    data.forEach(period => {
        html += `
            <tr data-period-type="${period.period}">
                <td>${period.report_period} (${period.period === 'annual' ? 'Annual' : 'Q'})</td>
                <td>${period.price_to_earnings_ratio ? period.price_to_earnings_ratio.toFixed(2) : 'N/A'}</td>
                <td>${period.price_to_book_ratio ? period.price_to_book_ratio.toFixed(2) : 'N/A'}</td>
                <td>${period.price_to_sales_ratio ? period.price_to_sales_ratio.toFixed(2) : 'N/A'}</td>
                <td>${period.net_margin ? Utils.formatPercentage(period.net_margin, 2) : 'N/A'}</td>
                <td>${period.return_on_equity ? Utils.formatPercentage(period.return_on_equity, 2) : 'N/A'}</td>
                <td>${period.return_on_assets ? Utils.formatPercentage(period.return_on_assets, 2) : 'N/A'}</td>
                <td>${period.debt_to_equity ? period.debt_to_equity.toFixed(2) : 'N/A'}</td>
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
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No news available</p>
            </div>
        `;
        return;
    }
    
    // Sort by date (most recent first)
    data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Build the HTML
    let html = `
        <div class="news-content">
            <div class="news-header">
                <h4>Recent News</h4>
            </div>
            
            <div class="news-list">
    `;
    
    // Add news items
    data.forEach(item => {
        const sentimentClass = item.sentiment === 'positive' ? 'positive' : 
                              (item.sentiment === 'negative' ? 'negative' : '');
        
        html += `
            <div class="news-item">
                <div class="news-date">${Utils.formatDate(item.date)}</div>
                <div class="news-headline">
                    <a href="${item.url}" target="_blank">${item.title}</a>
                </div>
                <div class="news-meta">
                    <span class="news-source">${item.source}</span>
                    ${item.sentiment ? `<span class="news-sentiment ${sentimentClass}">${item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}</span>` : ''}
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
            <div class="empty-state">
                <p>No analysis available for ${ticker}.</p>
                <button class="btn-secondary" id="runNewAnalysis">
                    <i class="fas fa-robot"></i> Run New Analysis
                </button>
            </div>
        `;
        
        // Add event listener to analysis button
        const runNewButton = document.getElementById('runNewAnalysis');
        if (runNewButton) {
            runNewButton.addEventListener('click', () => {
                document.querySelector('[data-section="analysis"]').click();
                document.getElementById('analysisTickers').value = ticker;
                closeTickerModal();
            });
        }
        
        return;
    }
    
    // Get ticker decision
    const decision = data.decisions[ticker];
    const actionClass = decision.action === 'buy' || decision.action === 'cover' ? 'positive' : 
                       (decision.action === 'sell' || decision.action === 'short' ? 'negative' : '');
    
    // Build the HTML
    let html = `
        <div class="analysis-content">
            <div class="analysis-decision">
                <div class="decision-header">
                    <h4>AI Trading Decision</h4>
                </div>
                <div class="decision-details">
                    <div class="decision-action ${actionClass}">
                        ${decision.action.toUpperCase()}
                    </div>
                    <div class="decision-confidence">
                        <div class="confidence-label">Confidence</div>
                        <div class="confidence-value">${decision.confidence.toFixed(1)}%</div>
                        <div class="confidence-bar">
                            <div class="confidence-level" style="width: ${decision.confidence}%"></div>
                        </div>
                    </div>
                </div>
                <div class="decision-reasoning">
                    <h5>Reasoning</h5>
                    <p>${decision.reasoning || 'No reasoning provided.'}</p>
                </div>
            </div>
    `;
    
    // Add analyst signals if available
    if (data.analyst_signals) {
        html += `
            <div class="analyst-signals">
                <div class="signals-header">
                    <h4>Analyst Signals</h4>
                </div>
                <div class="signals-table-container">
                    <table class="signals-table">
                        <thead>
                            <tr>
                                <th>Analyst</th>
                                <th>Signal</th>
                                <th>Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Add signals for this ticker
        let hasSignals = false;
        for (const [analyst, signals] of Object.entries(data.analyst_signals)) {
            if (signals[ticker]) {
                hasSignals = true;
                const signal = signals[ticker];
                const signalClass = signal.signal === 'bullish' ? 'positive' : 
                                  (signal.signal === 'bearish' ? 'negative' : '');
                
                const analystName = analyst.replace('_agent', '').replace(/_/g, ' ');
                const displayName = analystName.charAt(0).toUpperCase() + analystName.slice(1);
                
                html += `
                    <tr>
                        <td>${displayName}</td>
                        <td class="${signalClass}">${signal.signal.toUpperCase()}</td>
                        <td>${signal.confidence.toFixed(1)}%</td>
                    </tr>
                `;
            }
        }
        
        if (!hasSignals) {
            html += `
                <tr>
                    <td colspan="3" class="text-center">No analyst signals available</td>
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
    
    html += `
        </div>
    `;
    
    container.innerHTML = html;
}
