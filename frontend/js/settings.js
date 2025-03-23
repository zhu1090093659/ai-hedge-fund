/**
 * Settings management functionality for AI Hedge Fund
 */
const Settings = {
    /**
     * Initialize settings components
     */
    init: function() {
        this.loadStoredSettings();
        this.setupEventListeners();
    },
    
    /**
     * Load stored settings into form fields
     */
    loadStoredSettings: function() {
        const settings = Utils.getSettings();
        
        // API settings
        const apiEndpointInput = document.getElementById('apiEndpoint');
        const apiKeyInput = document.getElementById('apiKey');
        
        if (apiEndpointInput) {
            apiEndpointInput.value = localStorage.getItem(CONFIG.STORAGE.API_ENDPOINT) || CONFIG.API.BASE_URL;
        }
        
        if (apiKeyInput) {
            const apiKey = localStorage.getItem(CONFIG.STORAGE.API_KEY);
            apiKeyInput.value = apiKey || '';
        }
        
        // Display settings
        const themeSelect = document.getElementById('themeSelect');
        const colorSelect = document.getElementById('colorSelect');
        const dateFormatSelect = document.getElementById('dateFormatSelect');
        
        if (themeSelect) {
            themeSelect.value = settings.theme || CONFIG.DEFAULTS.THEME;
        }
        
        if (colorSelect) {
            colorSelect.value = settings.chartColorScheme || CONFIG.DEFAULTS.CHART_COLOR_SCHEME;
        }
        
        if (dateFormatSelect) {
            dateFormatSelect.value = settings.dateFormat || CONFIG.DEFAULTS.DATE_FORMAT;
        }
        
        // Data settings
        const defaultMarketSelect = document.getElementById('defaultMarketSelect');
        if (defaultMarketSelect) {
            defaultMarketSelect.value = settings.defaultMarket || CONFIG.DEFAULTS.MARKET;
        }
        
        // Load default model selection
        const defaultModelSelect = document.getElementById('defaultModelSelect');
        if (defaultModelSelect) {
            this.loadModelsForSettings(defaultModelSelect, settings.defaultModel);
        }
        
        // Load default analysts
        const defaultAnalystSelect = document.getElementById('defaultAnalystSelect');
        if (defaultAnalystSelect) {
            this.loadAnalystsForSettings(defaultAnalystSelect, settings.defaultAnalysts);
        }
    },
    
    /**
     * Load available models for settings dropdown
     * @param {HTMLElement} selectElement - Select element
     * @param {string} defaultModel - Default model name
     */
    loadModelsForSettings: function(selectElement, defaultModel) {
        // Clear existing options
        selectElement.innerHTML = '<option value="">Loading...</option>';
        
        // Fetch models from API
        API.get(CONFIG.API.ENDPOINTS.MODELS)
            .then(models => {
                if (!models || !models.length) {
                    selectElement.innerHTML = '<option value="">No models available</option>';
                    return;
                }
                
                // Create options for each model
                const options = models.map(model => {
                    const isSelected = model.model_name === defaultModel;
                    return `<option value="${model.model_name}" data-provider="${model.provider}" ${isSelected ? 'selected' : ''}>${model.display_name}</option>`;
                }).join('');
                
                // Update select element
                selectElement.innerHTML = options;
            })
            .catch(error => {
                console.error('Error loading models:', error);
                selectElement.innerHTML = '<option value="">Error loading models</option>';
            });
    },
    
    /**
     * Load available analysts for settings multi-select
     * @param {HTMLElement} selectElement - Select element
     * @param {Array} defaultAnalysts - Default selected analysts
     */
    loadAnalystsForSettings: function(selectElement, defaultAnalysts = []) {
        // Clear existing options
        selectElement.innerHTML = '<option value="">Loading...</option>';
        
        // Fetch analysts from API
        API.get(CONFIG.API.ENDPOINTS.ANALYSTS)
            .then(analysts => {
                if (!analysts || !analysts.length) {
                    selectElement.innerHTML = '<option value="">No analysts available</option>';
                    return;
                }
                
                // Clear loading message
                selectElement.innerHTML = '';
                
                // Create options for each analyst
                analysts.forEach(analyst => {
                    const option = document.createElement('option');
                    option.value = analyst.id;
                    option.textContent = analyst.display_name;
                    option.selected = defaultAnalysts && defaultAnalysts.includes(analyst.id);
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error loading analysts:', error);
                selectElement.innerHTML = '<option value="">Error loading analysts</option>';
            });
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // API settings form
        const apiSettingsForm = document.getElementById('apiSettingsForm');
        if (apiSettingsForm) {
            apiSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveApiSettings();
            });
        }
        
        // Test API connection button
        const testApiBtn = document.getElementById('testApiBtn');
        if (testApiBtn) {
            testApiBtn.addEventListener('click', () => {
                this.testApiConnection();
            });
        }
        
        // Display settings form
        const displaySettingsForm = document.getElementById('displaySettingsForm');
        if (displaySettingsForm) {
            displaySettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDisplaySettings();
            });
        }
        
        // Reset display settings button
        const resetDisplayBtn = document.getElementById('resetDisplayBtn');
        if (resetDisplayBtn) {
            resetDisplayBtn.addEventListener('click', () => {
                this.resetDisplaySettings();
            });
        }
        
        // Data settings form
        const dataSettingsForm = document.getElementById('dataSettingsForm');
        if (dataSettingsForm) {
            dataSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDataSettings();
            });
        }
    },
    
    /**
     * Save API settings
     */
    saveApiSettings: function() {
        const apiEndpointInput = document.getElementById('apiEndpoint');
        const apiKeyInput = document.getElementById('apiKey');
        
        if (!apiEndpointInput) return;
        
        const apiEndpoint = apiEndpointInput.value.trim();
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : '';
        
        // Validate API endpoint
        if (!apiEndpoint) {
            Utils.showToast('API endpoint cannot be empty', 'error');
            return;
        }
        
        // Validate URL format
        try {
            new URL(apiEndpoint);
        } catch (error) {
            Utils.showToast('Invalid API endpoint URL', 'error');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem(CONFIG.STORAGE.API_ENDPOINT, apiEndpoint);
        
        // Save API key if provided
        if (apiKey) {
            localStorage.setItem(CONFIG.STORAGE.API_KEY, apiKey);
        } else {
            localStorage.removeItem(CONFIG.STORAGE.API_KEY);
        }
        
        Utils.showToast('API settings saved', 'success');
    },
    
    /**
     * Test API connection
     */
    testApiConnection: function() {
        const apiEndpointInput = document.getElementById('apiEndpoint');
        
        if (!apiEndpointInput) return;
        
        const apiEndpoint = apiEndpointInput.value.trim();
        
        // Validate API endpoint
        if (!apiEndpoint) {
            Utils.showToast('API endpoint cannot be empty', 'error');
            return;
        }
        
        // Save current values temporarily
        const tempEndpoint = localStorage.getItem(CONFIG.STORAGE.API_ENDPOINT);
        localStorage.setItem(CONFIG.STORAGE.API_ENDPOINT, apiEndpoint);
        
        // Show testing message
        Utils.showToast('Testing API connection...', 'info');
        
        // Test connection by fetching analysts list
        API.get(CONFIG.API.ENDPOINTS.ANALYSTS)
            .then(response => {
                if (response && response.length) {
                    Utils.showToast('API connection successful', 'success');
                } else {
                    Utils.showToast('API returned empty response', 'warning');
                }
            })
            .catch(error => {
                console.error('API test error:', error);
                Utils.showToast('API connection failed', 'error');
                
                // Restore original endpoint
                if (tempEndpoint) {
                    localStorage.setItem(CONFIG.STORAGE.API_ENDPOINT, tempEndpoint);
                } else {
                    localStorage.removeItem(CONFIG.STORAGE.API_ENDPOINT);
                }
            });
    },
    
    /**
     * Save display settings
     */
    saveDisplaySettings: function() {
        const themeSelect = document.getElementById('themeSelect');
        const colorSelect = document.getElementById('colorSelect');
        const dateFormatSelect = document.getElementById('dateFormatSelect');
        
        if (!themeSelect || !colorSelect || !dateFormatSelect) return;
        
        const theme = themeSelect.value;
        const chartColorScheme = colorSelect.value;
        const dateFormat = dateFormatSelect.value;
        
        // Get current settings and update values
        const settings = Utils.getSettings();
        settings.theme = theme;
        settings.chartColorScheme = chartColorScheme;
        settings.dateFormat = dateFormat;
        
        // Save settings
        Utils.saveSettings(settings);
        
        // Apply theme immediately
        Utils.applyTheme(theme);
        
        // Update charts with new color scheme
        Charts.updateChartsForTheme();
    },
    
    /**
     * Reset display settings to defaults
     */
    resetDisplaySettings: function() {
        const themeSelect = document.getElementById('themeSelect');
        const colorSelect = document.getElementById('colorSelect');
        const dateFormatSelect = document.getElementById('dateFormatSelect');
        
        if (!themeSelect || !colorSelect || !dateFormatSelect) return;
        
        // Reset to defaults
        themeSelect.value = CONFIG.DEFAULTS.THEME;
        colorSelect.value = CONFIG.DEFAULTS.CHART_COLOR_SCHEME;
        dateFormatSelect.value = CONFIG.DEFAULTS.DATE_FORMAT;
        
        // Trigger save
        this.saveDisplaySettings();
        
        Utils.showToast('Display settings reset to defaults', 'info');
    },
    
    /**
     * Save data settings
     */
    saveDataSettings: function() {
        const defaultMarketSelect = document.getElementById('defaultMarketSelect');
        const defaultAnalystSelect = document.getElementById('defaultAnalystSelect');
        const defaultModelSelect = document.getElementById('defaultModelSelect');
        
        if (!defaultMarketSelect || !defaultAnalystSelect || !defaultModelSelect) return;
        
        const defaultMarket = defaultMarketSelect.value;
        
        // Get selected analysts (multi-select)
        const defaultAnalysts = Array.from(defaultAnalystSelect.selectedOptions).map(option => option.value);
        
        // Get selected model
        const defaultModel = defaultModelSelect.value;
        const defaultModelProvider = defaultModelSelect.options[defaultModelSelect.selectedIndex].dataset.provider;
        
        // Get current settings and update values
        const settings = Utils.getSettings();
        settings.defaultMarket = defaultMarket;
        settings.defaultAnalysts = defaultAnalysts;
        settings.defaultModel = defaultModel;
        settings.defaultModelProvider = defaultModelProvider;
        
        // Save settings
        Utils.saveSettings(settings);
    }
};
