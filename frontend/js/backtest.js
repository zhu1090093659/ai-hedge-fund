/**
 * Backtesting functionality for AI Hedge Fund
 */
const Backtest = {
    // Store active task ID
    activeTaskId: null,
    // Store active backtest result
    activeBacktest: null,
    // Task polling interval (milliseconds)
    pollInterval: 2000,
    // Task polling timer
    pollTimer: null,
    
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
        
        // Prepare request data
        const requestData = {
            tickers: tickers,
            start_date: startDate,
            end_date: endDate,
            initial_capital: initialCapital,
            margin_requirement: marginRequirement,
            selected_analysts: selectedAnalysts,
            model_name: modelName,
            model_provider: modelProvider
        };
        
        // Show loading state
        this.showBacktestLoading();
        
        // Send backtest request
        API.post(CONFIG.API.ENDPOINTS.BACKTEST, requestData)
            .then(response => {
                if (response && response.task_id) {
                    this.activeTaskId = response.task_id;
                    this.pollBacktestTask();
                    Utils.showToast('Backtest started', 'info');
                } else {
                    this.showBacktestError('Invalid response from server');
                }
            })
            .catch(error => {
                console.error('Error starting backtest:', error);
                this.showBacktestError('Failed to start backtest');
            });
    },
    
    /**
     * Poll backtest task status
     */
    pollBacktestTask: function() {
        if (!this.activeTaskId) return;
        
        // Clear existing timer
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        
        // Poll task status
        API.get(`${CONFIG.API.ENDPOINTS.TASK}/${this.activeTaskId}`)
            .then(response => {
                if (!response) {
                    this.showBacktestError('Invalid response from server');
                    return;
                }
                
                const { status, progress, result, error } = response;
                
                // Update progress
                this.updateBacktestProgress(progress);
                
                if (status === 'completed') {
                    // Backtest completed successfully
                    this.showBacktestResults(result);
                    this.activeTaskId = null;
                    this.activeBacktest = {
                        id: `backtest_${Date.now()}`,
                        date: new Date().toISOString(),
                        ...result
                    };
                } else if (status === 'error') {
                    // Backtest failed
                    this.showBacktestError(error || 'Backtest failed');
                    this.activeTaskId = null;
                } else {
                    // Backtest still running, poll again
                    this.pollTimer = setTimeout(() => {
                        this.pollBacktestTask();
                    }, this.pollInterval);
                }
            })
            .catch(error => {
                console.error('Error polling backtest task:', error);
                this.showBacktestError('Failed to check backtest status');
                this.activeTaskId = null;
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
                <div class="loading-state">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                    <p>Backtesting in progress. This may take a few minutes...</p>
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
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${error}</p>
                    <button id="retryBacktestBtn" class="btn-secondary">
                        <i class="fas fa-redo"></i> Retry
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
        document.getElementById('totalReturn').textContent = Utils.formatPercentage(totalReturn, 2, true);
        document.getElementById('totalReturn').classList.add(totalReturn >= 0 ? 'positive' : 'negative');
        
        document.getElementById('sharpeRatio').textContent = (metrics.sharpe_ratio || 0).toFixed(2);
        
        const maxDrawdown = metrics.max_drawdown || 0;
        document.getElementById('maxDrawdown').textContent = Utils.formatPercentage(maxDrawdown / 100, 2, true);
        document.getElementById('maxDrawdown').classList.add('negative');
        
        document.getElementById('winRate').textContent = Utils.formatPercentage((metrics.win_rate || 0) / 100, 1, false);
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
            return '<p class="no-trades">No trades executed during backtest</p>';
        }
        
        let html = `
            <h4>Final Portfolio Positions</h4>
            <div class="trades-table-container">
                <table class="trades-table">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Type</th>
                            <th>Quantity</th>
                            <th>Avg. Price</th>
                            <th>Value</th>
                            <th>Realized P/L</th>
                        </tr>
                    </thead>
                    <tbody>
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
                
                html += `
                    <tr>
                        <td>${ticker}</td>
                        <td>Long</td>
                        <td>${position.long}</td>
                        <td>${Utils.formatCurrency(position.long_cost_basis)}</td>
                        <td>${Utils.formatCurrency(value)}</td>
                        <td class="${realizedGains.long >= 0 ? 'positive' : 'negative'}">${Utils.formatCurrency(realizedGains.long)}</td>
                    </tr>
                `;
            }
            
            // Add short position if exists
            if (position.short > 0) {
                const value = position.short * position.short_cost_basis;
                
                html += `
                    <tr>
                        <td>${ticker}</td>
                        <td>Short</td>
                        <td>${position.short}</td>
                        <td>${Utils.formatCurrency(position.short_cost_basis)}</td>
                        <td>${Utils.formatCurrency(value)}</td>
                        <td class="${realizedGains.short >= 0 ? 'positive' : 'negative'}">${Utils.formatCurrency(realizedGains.short)}</td>
                    </tr>
                `;
            }
        }
        
        // Add cash position
        html += `
            <tr>
                <td colspan="4" class="text-right"><strong>Cash</strong></td>
                <td>${Utils.formatCurrency(finalPortfolio.cash || 0)}</td>
                <td></td>
            </tr>
        `;
        
        // Add total row
        html += `
            <tr class="total-row">
                <td colspan="4" class="text-right"><strong>Total</strong></td>
                <td><strong>${Utils.formatCurrency((finalPortfolio.cash || 0) + Object.values(positions).reduce((sum, pos) => {
                    return sum + (pos.long * pos.long_cost_basis) + (pos.short * pos.short_cost_basis);
                }, 0))}</strong></td>
                <td class="${totalRealizedPL >= 0 ? 'positive' : 'negative'}"><strong>${Utils.formatCurrency(totalRealizedPL)}</strong></td>
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
