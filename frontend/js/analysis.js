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
    },
    
    /**
     * Load available analysts
     */
    loadAnalysts: function() {
        const container = document.getElementById('analystSelector');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Get user settings for default analysts
        const settings = Utils.getSettings();
        const defaultAnalysts = settings.defaultAnalysts || CONFIG.DEFAULTS.ANALYSTS;
        
        // Fetch analysts from API
        API.get(CONFIG.API.ENDPOINTS.ANALYSTS)
            .then(analysts => {
                if (!analysts || !analysts.length) {
                    container.innerHTML = '<p>No analysts available</p>';
                    return;
                }
                
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
                container.innerHTML = '<p>Error loading analysts</p>';
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
        
        // Get user settings for default model
        const settings = Utils.getSettings();
        const defaultModel = settings.defaultModel || CONFIG.DEFAULTS.MODEL_NAME;
        
        // Fetch models from API
        API.get(CONFIG.API.ENDPOINTS.MODELS)
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
        
        // Prepare request data
        const requestData = {
            tickers: tickers,
            start_date: startDate,
            end_date: endDate,
            selected_analysts: selectedAnalysts,
            model_name: modelName,
            model_provider: modelProvider
        };
        
        // Show loading state
        this.showAnalysisLoading();
        
        // Send analysis request
        API.post(CONFIG.API.ENDPOINTS.ANALYZE, requestData)
            .then(response => {
                if (response && response.task_id) {
                    this.activeTaskId = response.task_id;
                    this.pollAnalysisTask();
                    Utils.showToast('Analysis started', 'info');
                } else {
                    this.showAnalysisError('Invalid response from server');
                }
            })
            .catch(error => {
                console.error('Error starting analysis:', error);
                this.showAnalysisError('Failed to start analysis');
            });
    },
    
    /**
     * Poll analysis task status
     */
    pollAnalysisTask: function() {
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
                    this.showAnalysisError('Invalid response from server');
                    return;
                }
                
                const { status, progress, result, error } = response;
                
                // Update progress
                this.updateAnalysisProgress(progress);
                
                if (status === 'completed') {
                    // Analysis completed successfully
                    this.showAnalysisResults(result);
                    this.activeTaskId = null;
                    this.activeAnalysis = {
                        tickers: result ? Object.keys(result.decisions || {}) : [],
                        result: result
                    };
                    Utils.saveRecentAnalysis(this.activeAnalysis);
                } else if (status === 'error') {
                    // Analysis failed
                    this.showAnalysisError(error || 'Analysis failed');
                    this.activeTaskId = null;
                } else {
                    // Analysis still running, poll again
                    this.pollTimer = setTimeout(() => {
                        this.pollAnalysisTask();
                    }, this.pollInterval);
                }
            })
            .catch(error => {
                console.error('Error polling analysis task:', error);
                this.showAnalysisError('Failed to check analysis status');
                this.activeTaskId = null;
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
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${error}</p>
                    <button id="retryAnalysisBtn" class="btn-secondary">
                        <i class="fas fa-redo"></i> Retry
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
            html += '<div class="decisions-section">';
            html += '<h4>Trading Decisions</h4>';
            html += '<div class="decisions-table-container">';
            html += '<table class="decisions-table">';
            html += '<thead><tr><th>Ticker</th><th>Action</th><th>Quantity</th><th>Confidence</th></tr></thead>';
            html += '<tbody>';
            
            for (const [ticker, decision] of Object.entries(result.decisions)) {
                const actionClass = decision.action === 'buy' || decision.action === 'cover' ? 'positive' : 
                                   (decision.action === 'sell' || decision.action === 'short' ? 'negative' : '');
                
                html += `<tr>
                    <td>${ticker}</td>
                    <td class="${actionClass}">${decision.action.toUpperCase()}</td>
                    <td>${decision.quantity}</td>
                    <td>${decision.confidence.toFixed(1)}%</td>
                </tr>`;
            }
            
            html += '</tbody></table></div>';
            
            // Add reasoning section
            html += '<div class="reasoning-section">';
            for (const [ticker, decision] of Object.entries(result.decisions)) {
                if (decision.reasoning) {
                    html += `<div class="ticker-reasoning">
                        <h5>${ticker} Reasoning</h5>
                        <p>${decision.reasoning}</p>
                    </div>`;
                }
            }
            html += '</div></div>';
            
            // Add analyst signals section
            if (result.analyst_signals && Object.keys(result.analyst_signals).length > 0) {
                html += '<div class="analyst-signals-section">';
                html += '<h4>Analyst Signals</h4>';
                
                // For each ticker
                const tickers = Object.keys(result.decisions);
                for (const ticker of tickers) {
                    html += `<div class="ticker-signals">
                        <h5>${ticker} Signals</h5>
                        <div class="signals-table-container">
                        <table class="signals-table">
                        <thead><tr><th>Analyst</th><th>Signal</th><th>Confidence</th></tr></thead>
                        <tbody>`;
                    
                    // For each analyst that analyzed this ticker
                    for (const [analyst, signals] of Object.entries(result.analyst_signals)) {
                        if (!signals[ticker]) continue;
                        
                        const signal = signals[ticker];
                        const signalClass = signal.signal === 'bullish' ? 'positive' : 
                                          (signal.signal === 'bearish' ? 'negative' : '');
                        
                        const analystName = analyst.replace('_agent', '').replace(/_/g, ' ');
                        const displayName = analystName.charAt(0).toUpperCase() + analystName.slice(1);
                        
                        html += `<tr>
                            <td>${displayName}</td>
                            <td class="${signalClass}">${signal.signal.toUpperCase()}</td>
                            <td>${signal.confidence.toFixed(1)}%</td>
                        </tr>`;
                    }
                    
                    html += '</tbody></table></div></div>';
                }
                
                html += '</div>';
            }
            
            html += '</div>';
            
            outputElement.innerHTML = html;
            outputElement.style.display = 'block';
        }
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
        
        // Scroll to results
        document.getElementById('analysisResults').scrollIntoView({ behavior: 'smooth' });
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
