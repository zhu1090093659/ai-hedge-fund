/**
 * Analysis functionality for AI Hedge Fund
 */
const Analysis = {
    // Store active task ID
    activeTaskId: null,
    // Store active analysis data
    activeAnalysis: null,
    // Task polling interval (milliseconds)
    pollInterval: 2000,
    // Task polling timer
    pollTimer: null,
    
    /**
     * Initialize analysis components
     */
    init: function() {
        this.loadAnalysts();
        this.loadModels();
        this.initDatePickers();
        this.setupEventListeners();
        this.loadRecentAnalyses();
    },
    
    /**
     * Load available analysts
     */
    loadAnalysts: function() {
        const container = document.getElementById('analystSelector');
        if (!container) return;
        
        // Show loading state
        container.innerHTML = '<div class="analyst-checkbox skeleton-pulse">Loading analysts...</div>';
        
        // Get user settings for default analysts
        const settings = Utils.getSettings();
        const defaultAnalysts = settings.defaultAnalysts || CONFIG.DEFAULTS.ANALYSTS;
        
        // Fetch analysts from API
        API.getAnalysts()
            .then(analysts => {
                if (!analysts || !analysts.length) {
                    container.innerHTML = '<p>No analysts available</p>';
                    return;
                }
                
                // Clear existing content
                container.innerHTML = '';
                
                // Create checkboxes for each analyst
                analysts.forEach(analyst => {
                    const isSelected = defaultAnalysts.includes(analyst.id);
                    
                    const checkbox = document.createElement('div');
                    checkbox.className = `analyst-checkbox ${isSelected ? 'selected' : ''}`;
                    checkbox.dataset.analystId = analyst.id;
                    checkbox.textContent = analyst.display_name;
                    
                    container.appendChild(checkbox);
                    
                    // Add event listener
                    checkbox.addEventListener('click', () => {
                        checkbox.classList.toggle('selected');
                    });
                });
                
                // Clone analysts to backtest section
                this.cloneAnalystsToBacktest(analysts, defaultAnalysts);
            })
            .catch(error => {
                console.error('Error loading analysts:', error);
                container.innerHTML = '<p>Error loading analysts. Please check your connection.</p>';
                
                // Show toast notification
                Utils.showToast('Failed to load analysts. Please check your connection.', 'error');
            });
    },
    
    /**
     * Clone analysts to backtest section
     * @param {Array} analysts - Array of analysts
     * @param {Array} defaultAnalysts - Array of default analyst IDs
     */
    cloneAnalystsToBacktest: function(analysts, defaultAnalysts) {
        const container = document.getElementById('backtestAnalystSelector');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create checkboxes for each analyst
        analysts.forEach(analyst => {
            const isSelected = defaultAnalysts.includes(analyst.id);
            
            const checkbox = document.createElement('div');
            checkbox.className = `analyst-checkbox ${isSelected ? 'selected' : ''}`;
            checkbox.dataset.analystId = analyst.id;
            checkbox.textContent = analyst.display_name;
            
            container.appendChild(checkbox);
            
            // Add event listener
            checkbox.addEventListener('click', () => {
                checkbox.classList.toggle('selected');
            });
        });
    },
    
    /**
     * Load available models
     */
    loadModels: function() {
        const modelSelect = document.getElementById('modelSelect');
        const backtestModelSelect = document.getElementById('backtestModelSelect');
        if (!modelSelect && !backtestModelSelect) return;
        
        // Show loading state
        if (modelSelect) modelSelect.innerHTML = '<option value="">Loading models...</option>';
        if (backtestModelSelect) backtestModelSelect.innerHTML = '<option value="">Loading models...</option>';
        
        // Get user settings for default model
        const settings = Utils.getSettings();
        const defaultModel = settings.defaultModel || CONFIG.DEFAULTS.MODEL_NAME;
        
        // Fetch models from API
        API.getModels()
            .then(models => {
                if (!models || !models.length) {
                    if (modelSelect) modelSelect.innerHTML = '<option value="">No models available</option>';
                    if (backtestModelSelect) backtestModelSelect.innerHTML = '<option value="">No models available</option>';
                    return;
                }
                
                // Create options for each model
                const options = models.map(model => {
                    const isSelected = model.model_name === defaultModel;
                    return `<option value="${model.model_name}" data-provider="${model.provider}" ${isSelected ? 'selected' : ''}>${model.display_name}</option>`;
                }).join('');
                
                // Update model selects
                if (modelSelect) modelSelect.innerHTML = options;
                if (backtestModelSelect) backtestModelSelect.innerHTML = options;
            })
            .catch(error => {
                console.error('Error loading models:', error);
                if (modelSelect) modelSelect.innerHTML = '<option value="">Error loading models</option>';
                if (backtestModelSelect) backtestModelSelect.innerHTML = '<option value="">Error loading models</option>';
                
                // Show toast notification
                Utils.showToast('Failed to load AI models. Please check your connection.', 'error');
            });
    },
    
    /**
     * Initialize date pickers
     */
    initDatePickers: function() {
        const dates = Utils.getDefaultDates();
        
        // Analysis date pickers
        if (flatpickr) {
            // Analysis start date
            flatpickr('#analysisStartDate', {
                dateFormat: 'Y-m-d',
                defaultDate: dates.startDate,
                maxDate: 'today'
            });
            
            // Analysis end date
            flatpickr('#analysisEndDate', {
                dateFormat: 'Y-m-d',
                defaultDate: dates.endDate,
                maxDate: 'today'
            });
            
            // Backtest start date
            flatpickr('#backtestStartDate', {
                dateFormat: 'Y-m-d',
                defaultDate: Utils.getDateAgo(365, 'day'), // Default to 1 year ago for backtesting
                maxDate: 'today'
            });
            
            // Backtest end date
            flatpickr('#backtestEndDate', {
                dateFormat: 'Y-m-d',
                defaultDate: dates.endDate,
                maxDate: 'today'
            });
        } else {
            // Fallback if flatpickr is not available
            const inputs = ['analysisStartDate', 'analysisEndDate', 'backtestStartDate', 'backtestEndDate'];
            inputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.type = 'date';
                    input.value = id.includes('Start') ? dates.startDate : dates.endDate;
                    if (id === 'backtestStartDate') {
                        input.value = Utils.getDateAgo(365, 'day');
                    }
                }
            });
        }
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // Analysis form submission
        const analysisForm = document.getElementById('analysisForm');
        if (analysisForm) {
            analysisForm.addEventListener('submit', e => {
                e.preventDefault();
                this.runAnalysis();
            });
        }
        
        // Export analysis button
        const exportAnalysisBtn = document.getElementById('exportAnalysisBtn');
        if (exportAnalysisBtn) {
            exportAnalysisBtn.addEventListener('click', () => {
                this.exportAnalysis();
            });
        }
    },
    
    /**
     * Run analysis
     */
    runAnalysis: function() {
        // Get form inputs
        const tickersInput = document.getElementById('analysisTickers');
        const startDateInput = document.getElementById('analysisStartDate');
        const endDateInput = document.getElementById('analysisEndDate');
        const modelSelect = document.getElementById('modelSelect');
        const analystCheckboxes = document.querySelectorAll('#analystSelector .analyst-checkbox.selected');
        
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
        
        // Show loading state
        this.showAnalysisLoading();
        
        // Send analysis request
        API.runAnalysis(tickers, startDate, endDate, selectedAnalysts, modelName, modelProvider)
            .then(response => {
                if (response && response.task_id) {
                    this.activeTaskId = response.task_id;
                    Utils.showToast('Analysis started', 'info');
                    
                    // Poll for task updates
                    API.pollTask(
                        response.task_id,
                        // Progress callback
                        (progress) => {
                            this.updateAnalysisProgress(progress);
                        },
                        // Complete callback
                        (result) => {
                            this.showAnalysisResults(result);
                            this.activeAnalysis = {
                                tickers: result ? Object.keys(result.decisions || {}) : [],
                                result: result
                            };
                            Utils.saveRecentAnalysis(this.activeAnalysis);
                        },
                        // Error callback
                        (error) => {
                            this.showAnalysisError(error || 'Analysis failed');
                            this.activeTaskId = null;
                        }
                    );
                } else {
                    this.showAnalysisError('Invalid response from server');
                }
            })
            .catch(error => {
                console.error('Error starting analysis:', error);
                this.showAnalysisError('Failed to start analysis. Please check your connection.');
            });
    },
    
    /**
     * Show analysis loading state
     */
    showAnalysisLoading: function() {
        const statusElement = document.getElementById('analysisStatus');
        const outputElement = document.getElementById('analysisOutput');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="loading-state">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: 0%"></div>
                    </div>
                    <p>AI analysis in progress. This may take a few minutes...</p>
                </div>
            `;
            statusElement.style.display = 'block';
        }
        
        if (outputElement) {
            outputElement.innerHTML = '';
            outputElement.style.display = 'none';
        }
    },
    
    /**
     * Update analysis progress
     * @param {number} progress - Progress value (0-1)
     */
    updateAnalysisProgress: function(progress) {
        const progressBar = document.querySelector('#analysisStatus .progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    },
    
    /**
     * Show analysis error
     * @param {string} error - Error message
     */
    showAnalysisError: function(error) {
        const statusElement = document.getElementById('analysisStatus');
        const outputElement = document.getElementById('analysisOutput');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="error-state">
                    <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                    <p class="text-red-500">${error}</p>
                    <button id="retryAnalysisBtn" class="mt-4 py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700">
                        <i class="ti ti-refresh"></i> Retry
                    </button>
                </div>
            `;
            statusElement.style.display = 'block';
            
            // Add event listener to retry button
            const retryBtn = document.getElementById('retryAnalysisBtn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.runAnalysis();
                });
            }
        }
        
        if (outputElement) {
            outputElement.innerHTML = '';
            outputElement.style.display = 'none';
        }
    },
    
    /**
     * Show analysis results
     * @param {Object} result - Analysis result
     */
    showAnalysisResults: function(result) {
        const statusElement = document.getElementById('analysisStatus');
        const outputElement = document.getElementById('analysisOutput');
        
        if (!result || !result.decisions || Object.keys(result.decisions).length === 0) {
            this.showAnalysisError('No results available');
            return;
        }
        
        if (statusElement) {
            statusElement.style.display = 'none';
        }
        
        if (outputElement) {
            // Format analysis output
            let html = '<div class="analysis-result">';
            
            // Add decisions section
            html += '<div class="decisions-section mb-6">';
            html += '<h4 class="text-lg font-semibold mb-3">Trading Decisions</h4>';
            html += '<div class="decisions-table-container overflow-x-auto">';
            html += '<table class="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">';
            html += '<thead><tr>';
            html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Ticker</th>';
            html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Action</th>';
            html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Quantity</th>';
            html += '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Confidence</th>';
            html += '</tr></thead>';
            html += '<tbody class="divide-y divide-gray-200 dark:divide-secondary-700">';
            
            for (const [ticker, decision] of Object.entries(result.decisions)) {
                const actionClass = decision.action === 'buy' || decision.action === 'cover' ? 'text-green-500' : 
                                   (decision.action === 'sell' || decision.action === 'short' ? 'text-red-500' : '');
                
                html += `<tr>
                    <td class="px-4 py-3 whitespace-nowrap">${ticker}</td>
                    <td class="px-4 py-3 whitespace-nowrap ${actionClass} font-medium">${decision.action.toUpperCase()}</td>
                    <td class="px-4 py-3 whitespace-nowrap">${decision.quantity}</td>
                    <td class="px-4 py-3 whitespace-nowrap">${decision.confidence.toFixed(1)}%</td>
                </tr>`;
            }
            
            html += '</tbody></table></div>';
            
            // Add reasoning section
            html += '<div class="reasoning-section mt-6 space-y-4">';
            for (const [ticker, decision] of Object.entries(result.decisions)) {
                if (decision.reasoning) {
                    html += `<div class="ticker-reasoning bg-gray-50 dark:bg-secondary-700/50 p-4 rounded-lg">
                        <h5 class="font-medium mb-2">${ticker} Reasoning</h5>
                        <p class="text-sm text-gray-600 dark:text-secondary-300">${decision.reasoning}</p>
                    </div>`;
                }
            }
            html += '</div></div>';
            
            // Add analyst signals section
            if (result.analyst_signals && Object.keys(result.analyst_signals).length > 0) {
                html += '<div class="analyst-signals-section">';
                html += '<h4 class="text-lg font-semibold mb-3">Analyst Signals</h4>';
                
                // For each ticker
                const tickers = Object.keys(result.decisions);
                for (const ticker of tickers) {
                    html += `<div class="ticker-signals mb-6">
                        <h5 class="font-medium mb-2">${ticker} Signals</h5>
                        <div class="signals-table-container overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 dark:divide-secondary-700">
                        <thead><tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Analyst</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Signal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-secondary-400">Confidence</th>
                        </tr></thead>
                        <tbody class="divide-y divide-gray-200 dark:divide-secondary-700">`;
                    
                    // For each analyst that analyzed this ticker
                    for (const [analyst, signals] of Object.entries(result.analyst_signals)) {
                        if (!signals[ticker]) continue;
                        
                        const signal = signals[ticker];
                        const signalClass = signal.signal === 'bullish' ? 'text-green-500' : 
                                          (signal.signal === 'bearish' ? 'text-red-500' : 'text-yellow-500');
                        
                        const analystName = analyst.replace('_agent', '').replace(/_/g, ' ');
                        const displayName = analystName.charAt(0).toUpperCase() + analystName.slice(1);
                        
                        html += `<tr>
                            <td class="px-4 py-3">${displayName}</td>
                            <td class="px-4 py-3 ${signalClass} font-medium">${signal.signal.toUpperCase()}</td>
                            <td class="px-4 py-3">${signal.confidence.toFixed(1)}%</td>
                        </tr>`;
                    }
                    
                    html += '</tbody></table></div></div>';
                }
                
                html += '</div>';
            }
            
            html += '</div>';
            
            outputElement.innerHTML = html;
            outputElement.style.display = 'block';
            
            // Update recent analyses
            this.loadRecentAnalyses();
        }
    },
    
    /**
     * Load recent analyses for the dashboard
     */
    loadRecentAnalyses: function() {
        const analysesContainer = document.getElementById('recentAnalysesList');
        if (!analysesContainer) return;
        
        const recentAnalyses = Utils.getRecentAnalyses();
        
        // Clear existing content
        analysesContainer.innerHTML = '';
        
        if (recentAnalyses.length === 0) {
            analysesContainer.innerHTML = `
                <div class="empty-state flex flex-col items-center justify-center py-8">
                    <i class="ti ti-robot text-3xl text-gray-400 dark:text-secondary-600 mb-2"></i>
                    <p class="text-sm text-gray-500 dark:text-secondary-400 mb-3">No recent analyses</p>
                    <button id="emptyAnalysisGo" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700">
                        <i class="ti ti-robot"></i> Run Analysis
                    </button>
                </div>
            `;
            
            // Add event listener
            analysesContainer.querySelector('#emptyAnalysisGo').addEventListener('click', () => {
                document.querySelector('[data-section="analysis"]').click();
            });
            return;
        }
        
        // Display recent analyses
        for (const analysis of recentAnalyses.slice(0, 5)) {
            const analysisItem = document.createElement('div');
            analysisItem.className = 'bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-lg p-4 mb-4';
            
            // Format tickers string
            let tickersStr = '';
            if (analysis.tickers && analysis.tickers.length > 0) {
                tickersStr = analysis.tickers.join(', ');
                if (tickersStr.length > 25) {
                    tickersStr = tickersStr.substring(0, 22) + '...';
                }
            }
            
            // Format date
            const date = new Date(analysis.date);
            const formattedDate = date.toLocaleDateString();
            
            analysisItem.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs text-gray-500 dark:text-secondary-400">${formattedDate}</span>
                    <span class="text-xs font-medium text-primary-600 dark:text-primary-400">${tickersStr}</span>
                </div>
                <div class="space-y-2 mb-3">
                    ${this.formatAnalysisSignals(analysis)}
                </div>
                <div class="flex justify-end">
                    <button class="view-analysis py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-md border border-transparent bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-800/30 dark:text-primary-500 dark:hover:bg-primary-800/40" data-id="${analysis.id}">
                        <i class="ti ti-eye"></i> View
                    </button>
                </div>
            `;
            
            analysesContainer.appendChild(analysisItem);
            
            // Add event listener
            analysisItem.querySelector('.view-analysis').addEventListener('click', () => {
                // Navigate to analysis tab and load analysis details
                document.querySelector('[data-section="analysis"]').click();
                this.loadSavedAnalysis(analysis.id);
            });
        }
    },
    
    /**
     * Format analysis signals for display
     * @param {Object} analysis - Analysis data
     * @returns {string} HTML for signals
     */
    formatAnalysisSignals: function(analysis) {
        if (!analysis.result || !analysis.result.decisions) {
            return '<span class="text-sm text-gray-500 dark:text-secondary-400">No signals available</span>';
        }
        
        let html = '';
        for (const [ticker, decision] of Object.entries(analysis.result.decisions)) {
            const actionClass = decision.action === 'buy' || decision.action === 'cover' ? 'text-green-500' : 
                               (decision.action === 'sell' || decision.action === 'short' ? 'text-red-500' : 'text-yellow-500');
            
            html += `
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium">${ticker}</span>
                    <span class="text-xs ${actionClass} font-medium">${decision.action.toUpperCase()} (${decision.confidence.toFixed(1)}%)</span>
                </div>
            `;
        }
        
        return html;
    },
    
    /**
     * Load saved analysis
     * @param {string} id - Analysis ID
     */
    loadSavedAnalysis: function(id) {
        const analyses = Utils.getRecentAnalyses();
        const analysis = analyses.find(a => a.id === id);
        
        if (!analysis) {
            Utils.showToast('Analysis not found', 'error');
            return;
        }
        
        // Set as active analysis
        this.activeAnalysis = analysis;
        
        // Show results
        this.showAnalysisResults(analysis.result);
    },
    
    /**
     * Export analysis to file
     */
    exportAnalysis: function() {
        if (!this.activeAnalysis) {
            Utils.showToast('No analysis available to export', 'error');
            return;
        }
        
        // Format date for filename
        const date = new Date().toISOString().split('T')[0];
        const tickers = this.activeAnalysis.tickers.join('-');
        const filename = `analysis_${date}_${tickers}.json`;
        
        Utils.downloadJSON(this.activeAnalysis, filename);
        Utils.showToast('Analysis exported', 'success');
    }
};