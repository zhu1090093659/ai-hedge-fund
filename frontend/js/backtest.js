/**
 * Backtesting functionality for AI Hedge Fund
 */
const Backtest = {
    // Store active task ID
    activeTaskId: null,
    // Store active backtest result
    activeBacktest: null,
    
    /**
     * Initialize backtest components
     */
    init: function() {
        this.setupEventListeners();
        this.setDefaultValues();
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Backtest form submission
        const backtestForm = document.getElementById('backtestForm');
        if (backtestForm) {
            backtestForm.addEventListener('submit', e => {
                e.preventDefault();
                this.runBacktest();
            });
        }
        
        // Export backtest button
        const exportBacktestBtn = document.getElementById('exportBacktestBtn');
        if (exportBacktestBtn) {
            exportBacktestBtn.addEventListener('click', () => {
                this.exportBacktest();
            });
        }
    },
    
    /**
     * Set default form values
     */
    setDefaultValues: function() {
        // Set default initial capital
        const initialCapitalInput = document.getElementById('initialCapital');
        if (initialCapitalInput) {
            initialCapitalInput.value = CONFIG.DEFAULTS.INITIAL_CAPITAL;
        }
        
        // Set default margin requirement
        const marginRequirementInput = document.getElementById('marginRequirement');
        if (marginRequirementInput) {
            marginRequirementInput.value = CONFIG.DEFAULTS.MARGIN_REQUIREMENT;
        }
    },
    
    /**
     * Run backtest
     */
    runBacktest: function() {
        // Get form inputs
        const tickersInput = document.getElementById('backtestTickers');
        const startDateInput = document.getElementById('backtestStartDate');
        const endDateInput = document.getElementById('backtestEndDate');
        const initialCapitalInput = document.getElementById('initialCapital');
        const marginRequirementInput = document.getElementById('marginRequirement');
        const modelSelect = document.getElementById('backtestModelSelect');
        const analystCheckboxes = document.querySelectorAll('#backtestAnalystSelector .analyst-checkbox.selected');
        
        // Validate inputs
        if (!tickersInput.value.trim()) {
            Utils.showToast('Please enter at least one ticker', 'error');
            return;
        }
        
        // Parse tickers
        const tickers = Utils.parseTickers(tickersInput.value);
        if (tickers.length === 0) {
            Utils.showToast('Invalid ticker format', 'error');
            return;
        }
        
        // Validate ticker formats
        const invalidTickers = tickers.filter(ticker => !API.validateTickerFormat(ticker));
        if (invalidTickers.length > 0) {
            Utils.showToast(`Invalid ticker format: ${invalidTickers.join(', ')}`, 'error');
            return;
        }
        
        // Get selected analysts
        const selectedAnalysts = Array.from(analystCheckboxes).map(checkbox => checkbox.dataset.analystId);
        if (selectedAnalysts.length === 0) {
            Utils.showToast('Please select at least one analyst', 'error');
            return;
        }
        
        // Get selected model
        const modelName = modelSelect.value;
        const modelProvider = modelSelect.options[modelSelect.selectedIndex].dataset.provider;
        
        // Get dates
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Check date range
        if (new Date(startDate) > new Date(endDate)) {
            Utils.showToast('Start date must be before end date', 'error');
            return;
        }
        
        // Get initial capital
        const initialCapital = parseFloat(initialCapitalInput.value);
        if (isNaN(initialCapital) || initialCapital <= 0) {
            Utils.showToast('Initial capital must be a positive number', 'error');
            return;
        }
        
        // Get margin requirement
        const marginRequirement = parseFloat(marginRequirementInput.value);
        if (isNaN(marginRequirement) || marginRequirement < 0 || marginRequirement > 1) {
            Utils.showToast('Margin requirement must be between 0 and 1', 'error');
            return;
        }
        
        // Show loading state
        this.showBacktestLoading();
        
        // Send backtest request
        API.runBacktest(
            tickers, 
            startDate, 
            endDate, 
            initialCapital, 
            marginRequirement, 
            selectedAnalysts, 
            modelName, 
            modelProvider
        )
            .then(response => {
                if (response && response.task_id) {
                    this.activeTaskId = response.task_id;
                    Utils.showToast('Backtest started', 'info');
                    
                    // Poll for task updates
                    API.pollTask(
                        response.task_id,
                        // Progress callback
                        (progress) => {
                            this.updateBacktestProgress(progress);
                        },
                        // Complete callback
                        (result) => {
                            this.showBacktestResults(result);
                            this.activeBacktest = {
                                id: `backtest_${Date.now()}`,
                                date: new Date().toISOString(),
                                ...result
                            };
                        },
                        // Error callback
                        (error) => {
                            this.showBacktestError(error || 'Backtest failed');
                            this.activeTaskId = null;
                        }
                    );
                } else {
                    this.showBacktestError('Invalid response from server');
                }
            })
            .catch(error => {
                console.error('Error starting backtest:', error);
                this.showBacktestError('Failed to start backtest. Please check your connection.');
            });
    },
    
    /**
     * Show backtest loading state
     */
    showBacktestLoading: function() {
        const statusElement = document.getElementById('backtestStatus');
        const metricsElement = document.querySelector('.backtest-metrics');
        const chartContainer = document.querySelector('.backtest-chart-container');
        const tradesElement = document.getElementById('backtestTrades');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="loading-state text-center">
                    <div class="progress-container mb-4 bg-gray-200 dark:bg-secondary-700 rounded-full h-2.5 w-full max-w-md mx-auto">
                        <div class="progress-bar bg-primary-600 h-2.5 rounded-full" style="width: 0%"></div>
                    </div>
                    <p class="text-gray-500 dark:text-secondary-400">Backtesting in progress. This may take a few minutes...</p>
                </div>
            `;
            statusElement.style.display = 'block';
        }
        
        if (metricsElement) metricsElement.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'none';
        if (tradesElement) tradesElement.style.display = 'none';
        
        // Clear existing metrics
        document.getElementById('totalReturn').textContent = '--';
        document.getElementById('sharpeRatio').textContent = '--';
        document.getElementById('maxDrawdown').textContent = '--';
        document.getElementById('winRate').textContent = '--';
    },
    
    /**
     * Update backtest progress
     * @param {number} progress - Progress value (0-1)
     */
    updateBacktestProgress: function(progress) {
        const progressBar = document.querySelector('#backtestStatus .progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    },
    
    /**
     * Show backtest error
     * @param {string} error - Error message
     */
    showBacktestError: function(error) {
        const statusElement = document.getElementById('backtestStatus');
        const metricsElement = document.querySelector('.backtest-metrics');
        const chartContainer = document.querySelector('.backtest-chart-container');
        const tradesElement = document.getElementById('backtestTrades');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="error-state text-center">
                    <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                    <p class="text-red-500 mb-4">${error}</p>
                    <button id="retryBacktestBtn" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700">
                        <i class="ti ti-refresh"></i> Retry
                    </button>
                </div>
            `;
            statusElement.style.display = 'block';
            
            // Add event listener to retry button
            const retryBtn = document.getElementById('retryBacktestBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.runBacktest();
                });
            }
        }
        
        if (metricsElement) metricsElement.style.display = 'none';
        if (chartContainer) chartContainer.style.display = 'none';
        if (tradesElement) tradesElement.style.display = 'none';
    },
    
    /**
     * Show backtest results
     * @param {Object} result - Backtest result
     */
    showBacktestResults: function(result) {
        const statusElement = document.getElementById('backtestStatus');
        const metricsElement = document.querySelector('.backtest-metrics');
        const chartContainer = document.querySelector('.backtest-chart-container');
        const tradesElement = document.getElementById('backtestTrades');
        
        if (!result || !result.portfolio_values || result.portfolio_values.length === 0) {
            this.showBacktestError('No backtest results available');
            return;
        }
        
        // Hide status element
        if (statusElement) statusElement.style.display = 'none';
        
        // Show metrics
        if (metricsElement) metricsElement.style.display = 'block';
        
        // Show chart container
        if (chartContainer) chartContainer.style.display = 'block';
        
        // Update metrics
        this.updateBacktestMetrics(result);
        
        // Create backtest chart
        Charts.createBacktestChart('backtestChart', result.portfolio_values);
        
        // Show trades
        if (tradesElement) {
            tradesElement.innerHTML = this.formatTrades(result);
            tradesElement.style.display = 'block';
        }
    },
    
    /**
     * Update backtest metrics
     * @param {Object} result - Backtest result
     */
    updateBacktestMetrics: function(result) {
        const metrics = result.performance_metrics || {};
        
        // Calculate total return
        const portfolioValues = result.portfolio_values || [];
        let totalReturn = 0;
        
        if (portfolioValues.length >= 2) {
            const initialValue = portfolioValues[0]['Portfolio Value'];
            const finalValue = portfolioValues[portfolioValues.length - 1]['Portfolio Value'];
            totalReturn = (finalValue - initialValue) / initialValue;
        }
        
        // Update metrics display
        const totalReturnElement = document.getElementById('totalReturn');
        totalReturnElement.textContent = Utils.formatPercentage(totalReturn, 2, true);
        totalReturnElement.className = totalReturn >= 0 ? 'text-lg font-semibold text-green-500' : 'text-lg font-semibold text-red-500';
        
        const sharpeRatio = document.getElementById('sharpeRatio');
        sharpeRatio.textContent = (metrics.sharpe_ratio || 0).toFixed(2);
        
        const maxDrawdownElement = document.getElementById('maxDrawdown');
        const maxDrawdown = metrics.max_drawdown || 0;
        maxDrawdownElement.textContent = Utils.formatPercentage(maxDrawdown / 100, 2, true);
        maxDrawdownElement.className = 'text-lg font-semibold text-red-500';
        
        const winRateElement = document.getElementById('winRate');
        winRateElement.textContent = Utils.formatPercentage((metrics.win_rate || 0) / 100, 1, false);
    },
    
    /**
     * Format trades for display
     * @param {Object} result - Backtest result
     * @returns {string} HTML for trades table
     */
    formatTrades: function(result) {
        const finalPortfolio = result.final_portfolio || {};
        const positions = finalPortfolio.positions || {};
        
        if (Object.keys(positions).length === 0) {
            return '<p class="text-center text-gray-500 dark:text-secondary-400 py-6">No trades executed during backtest</p>';
        }
        
        let html = `
            <h4 class="text-lg font-semibold mb-4 mt-6">Final Portfolio Positions</h4>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                    <thead>
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Ticker</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Type</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Quantity</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Avg. Price</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Value</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Realized P/L</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-secondary-700">
        `;
        
        // Calculate total P/L
        let totalRealizedPL = 0;
        
        // Add positions
        for (const [ticker, position] of Object.entries(positions)) {
            const realizedGains = finalPortfolio.realized_gains?.[ticker] || { long: 0, short: 0 };
            totalRealizedPL += realizedGains.long + realizedGains.short;
            
            // Add long position if exists
            if (position.long > 0) {
                const value = position.long * position.long_cost_basis;
                const plClass = realizedGains.long >= 0 ? 'text-green-500' : 'text-red-500';
                
                html += `
                    <tr>
                        <td class="px-4 py-3">${ticker}</td>
                        <td class="px-4 py-3 text-green-500 font-medium">Long</td>
                        <td class="px-4 py-3">${position.long}</td>
                        <td class="px-4 py-3">${Utils.formatCurrency(position.long_cost_basis)}</td>
                        <td class="px-4 py-3">${Utils.formatCurrency(value)}</td>
                        <td class="px-4 py-3 ${plClass} font-medium">${Utils.formatCurrency(realizedGains.long)}</td>
                    </tr>
                `;
            }
            
            // Add short position if exists
            if (position.short > 0) {
                const value = position.short * position.short_cost_basis;
                const plClass = realizedGains.short >= 0 ? 'text-green-500' : 'text-red-500';
                
                html += `
                    <tr>
                        <td class="px-4 py-3">${ticker}</td>
                        <td class="px-4 py-3 text-red-500 font-medium">Short</td>
                        <td class="px-4 py-3">${position.short}</td>
                        <td class="px-4 py-3">${Utils.formatCurrency(position.short_cost_basis)}</td>
                        <td class="px-4 py-3">${Utils.formatCurrency(value)}</td>
                        <td class="px-4 py-3 ${plClass} font-medium">${Utils.formatCurrency(realizedGains.short)}</td>
                    </tr>
                `;
            }
        }
        
        // Add cash position
        html += `
            <tr>
                <td colspan="4" class="px-4 py-3 text-right font-semibold">Cash</td>
                <td class="px-4 py-3 font-semibold">${Utils.formatCurrency(finalPortfolio.cash || 0)}</td>
                <td></td>
            </tr>
        `;
        
        // Add total row
        const totalPortfolioValue = (finalPortfolio.cash || 0) + Object.values(positions).reduce((sum, pos) => {
            return sum + (pos.long * pos.long_cost_basis) + (pos.short * pos.short_cost_basis);
        }, 0);
        
        const totalPlClass = totalRealizedPL >= 0 ? 'text-green-500' : 'text-red-500';
        
        html += `
            <tr class="bg-gray-50 dark:bg-secondary-700/50">
                <td colspan="4" class="px-4 py-3 text-right font-bold">Total</td>
                <td class="px-4 py-3 font-bold">${Utils.formatCurrency(totalPortfolioValue)}</td>
                <td class="px-4 py-3 ${totalPlClass} font-bold">${Utils.formatCurrency(totalRealizedPL)}</td>
            </tr>
        `;
        
        html += '</tbody></table></div>';
        
        return html;
    },
    
    /**
     * Export backtest to file
     */
    exportBacktest: function() {
        if (!this.activeBacktest) {
            Utils.showToast('No backtest available to export', 'error');
            return;
        }
        
        // Format date for filename
        const date = new Date().toISOString().split('T')[0];
        const filename = `backtest_${date}.json`;
        
        Utils.downloadJSON(this.activeBacktest, filename);
        Utils.showToast('Backtest exported', 'success');
    }
};