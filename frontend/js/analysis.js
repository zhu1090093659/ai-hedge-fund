/**
 * Enhanced analysis functionality for AI Hedge Fund
 */
const Analysis = {
    // Store active task ID
    activeTaskId: null,
    // Store active analysis data
    activeAnalysis: null,
    // Task polling interval (milliseconds)
    pollInterval: 2000,
    // Task polling control
    pollControl: null,
    
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
     * Load available analysts with improved error handling
     */
    loadAnalysts: function() {
        const container = document.getElementById('analystSelector');
        if (!container) return;
        
        // Show loading state
        container.innerHTML = '<div class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm dark:bg-secondary-900 dark:border-secondary-700 dark:text-white skeleton-pulse">加载分析师中...</div>';
        
        // Get user settings for default analysts
        const settings = Utils.getSettings();
        const defaultAnalysts = settings.defaultAnalysts || CONFIG.DEFAULTS.ANALYSTS;
        
        // Fetch analysts from API
        API.getAnalysts()
            .then(analysts => {
                if (!analysts || !analysts.length) {
                    container.innerHTML = '<p class="text-red-500 dark:text-red-400">没有可用的分析师。请检查API连接。</p>';
                    return;
                }
                
                // Clear existing content
                container.innerHTML = '';
                
                // Group analysts by type
                const analystGroups = {
                    '投资大师': analysts.filter(a => !a.id.includes('analyst')),
                    '专业分析师': analysts.filter(a => a.id.includes('analyst'))
                };
                
                // Create analyst selector with grouping
                for (const [groupName, groupAnalysts] of Object.entries(analystGroups)) {
                    if (groupAnalysts.length === 0) continue;
                    
                    // Add group header
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'w-full text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 mt-2';
                    groupHeader.textContent = groupName;
                    container.appendChild(groupHeader);
                    
                    // Create wrapper for analysts in this group
                    const groupContainer = document.createElement('div');
                    groupContainer.className = 'flex flex-wrap gap-2 mb-2';
                    container.appendChild(groupContainer);
                    
                    // Add analyst checkboxes
                    groupAnalysts.forEach(analyst => {
                        const isSelected = defaultAnalysts.includes(analyst.id);
                        
                        const checkbox = document.createElement('div');
                        checkbox.className = `py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border ${isSelected ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 bg-white text-gray-800 dark:bg-secondary-900 dark:border-secondary-700 dark:text-white'} cursor-pointer hover:shadow-sm transition-all duration-200 analyst-checkbox ${isSelected ? 'selected' : ''}`;
                        checkbox.dataset.analystId = analyst.id;
                        checkbox.dataset.group = groupName;
                        
                        // Add tooltip with description
                        checkbox.setAttribute('title', this.getAnalystDescription(analyst.id));
                        
                        // Add icon if available
                        const iconName = this.getAnalystIcon(analyst.id);
                        if (iconName) {
                            checkbox.innerHTML = `<i class="ti ${iconName}"></i><span>${analyst.display_name}</span>`;
                        } else {
                            checkbox.textContent = analyst.display_name;
                        }
                        
                        groupContainer.appendChild(checkbox);
                        
                        // Add event listener
                        checkbox.addEventListener('click', () => {
                            checkbox.classList.toggle('selected');
                            checkbox.classList.toggle('bg-primary-600');
                            checkbox.classList.toggle('text-white');
                            checkbox.classList.toggle('border-primary-600');
                            checkbox.classList.toggle('bg-white');
                            checkbox.classList.toggle('text-gray-800');
                            checkbox.classList.toggle('dark:bg-secondary-900');
                            checkbox.classList.toggle('border-gray-200');
                            checkbox.classList.toggle('dark:border-secondary-700');
                            checkbox.classList.toggle('dark:text-white');
                            this.updateSelectedAnalystsCount();
                        });
                    });
                }
                
                // Add select all / none controls
                const controlsContainer = document.createElement('div');
                controlsContainer.className = 'flex justify-between items-center w-full mt-3 text-xs';
                controlsContainer.innerHTML = `
                    <button type="button" id="selectAllAnalysts" class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-secondary-900 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-800">
                        <i class="ti ti-check-all text-sm"></i> 全选
                    </button>
                    <span id="selectedAnalystsCount" class="text-gray-500 dark:text-gray-400 px-2"></span>
                    <button type="button" id="selectNoneAnalysts" class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-secondary-900 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-800">
                        <i class="ti ti-square-x text-sm"></i> 清空
                    </button>
                `;
                container.appendChild(controlsContainer);
                
                // Add event listeners for controls
                document.getElementById('selectAllAnalysts').addEventListener('click', () => {
                    this.selectAllAnalysts();
                });
                
                document.getElementById('selectNoneAnalysts').addEventListener('click', () => {
                    this.selectNoneAnalysts();
                });
                
                // Update selected count
                this.updateSelectedAnalystsCount();
                
                // Clone analysts to backtest section
                this.cloneAnalystsToBacktest(analysts, defaultAnalysts);
            })
            .catch(error => {
                console.error('Error loading analysts:', error);
                container.innerHTML = `
                    <div class="error-state text-center p-4">
                        <i class="ti ti-alert-triangle text-2xl text-red-500 mb-2"></i>
                        <p class="text-red-500 mb-3">加载分析师失败</p>
                        <button id="retryLoadAnalysts" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-primary-600 text-white hover:bg-primary-700 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600">
                            <i class="ti ti-refresh"></i> 重试
                        </button>
                    </div>
                `;
                
                // Add retry button listener
                document.getElementById('retryLoadAnalysts')?.addEventListener('click', () => {
                    this.loadAnalysts();
                });
            });
    },
    
    /**
     * Update the count of selected analysts
     */
    updateSelectedAnalystsCount: function() {
        const countElement = document.getElementById('selectedAnalystsCount');
        if (!countElement) return;
        
        const totalAnalysts = document.querySelectorAll('#analystSelector .analyst-checkbox').length;
        const selectedAnalysts = document.querySelectorAll('#analystSelector .analyst-checkbox.selected').length;
        
        countElement.textContent = `${selectedAnalysts} of ${totalAnalysts} selected`;
    },
    
    /**
     * Select all analysts
     */
    selectAllAnalysts: function() {
        document.querySelectorAll('#analystSelector .analyst-checkbox').forEach(checkbox => {
            checkbox.classList.add('selected');
            checkbox.classList.add('bg-primary-600');
            checkbox.classList.add('text-white');
            checkbox.classList.add('border-primary-600');
            checkbox.classList.remove('bg-white');
            checkbox.classList.remove('text-gray-800');
            checkbox.classList.remove('dark:bg-secondary-900');
            checkbox.classList.remove('border-gray-200');
            checkbox.classList.remove('dark:border-secondary-700');
            checkbox.classList.remove('dark:text-white');
        });
        this.updateSelectedAnalystsCount();
    },
    
    /**
     * Deselect all analysts
     */
    selectNoneAnalysts: function() {
        document.querySelectorAll('#analystSelector .analyst-checkbox').forEach(checkbox => {
            checkbox.classList.remove('selected');
            checkbox.classList.remove('bg-primary-600');
            checkbox.classList.remove('text-white');
            checkbox.classList.remove('border-primary-600');
            checkbox.classList.add('bg-white');
            checkbox.classList.add('text-gray-800');
            checkbox.classList.add('dark:bg-secondary-900');
            checkbox.classList.add('border-gray-200');
            checkbox.classList.add('dark:border-secondary-700');
            checkbox.classList.add('dark:text-white');
        });
        this.updateSelectedAnalystsCount();
    },
    
    /**
     * Get icon class for an analyst
     * @param {string} analystId - Analyst ID
     * @returns {string} Icon class
     */
    getAnalystIcon: function(analystId) {
        const icons = {
            'warren_buffett': 'ti-building-bank',
            'ben_graham': 'ti-book',
            'bill_ackman': 'ti-chart-bar',
            'cathie_wood': 'ti-rocket',
            'charlie_munger': 'ti-telescope',
            'phil_fisher': 'ti-growth',
            'stanley_druckenmiller': 'ti-world',
            'fundamentals_analyst': 'ti-report-money',
            'technical_analyst': 'ti-chart-line',
            'valuation_analyst': 'ti-calculator',
            'sentiment_analyst': 'ti-mood-happy'
        };
        
        return icons[analystId] || 'ti-user';
    },
    
    /**
     * Get description for an analyst
     * @param {string} analystId - Analyst ID
     * @returns {string} Description
     */
    getAnalystDescription: function(analystId) {
        const descriptions = {
            'warren_buffett': '价值投资者，专注于质量公司和可持续的竞争优势',
            'ben_graham': '价值投资之父，寻找安全边际和隐藏的宝石',
            'bill_ackman': '激进投资者，采取大胆的行动和变革',
            'cathie_wood': '增长投资者，专注于创新和颠覆性技术',
            'charlie_munger': '沃伦·巴菲特的合作伙伴，专注于购买质量公司和合理的价格',
            'phil_fisher': '增长投资者，以“八卦”分析而闻名',
            'stanley_druckenmiller': '宏观传奇人物，寻找不对称的机会和增长潜力',
            'fundamentals_analyst': '专注于公司的财务指标和业务健康状况',
            'technical_analyst': '分析价格模式和市场趋势',
            'valuation_analyst': '计算内在价值并生成买卖信号',
            'sentiment_analyst': '分析市场情绪和新闻影响'
        };
        
        return descriptions[analystId] || '';
    },
    
    /**
     * Clone analysts to backtest section with improved grouping
     * @param {Array} analysts - Array of analysts
     * @param {Array} defaultAnalysts - Array of default analyst IDs
     */
    cloneAnalystsToBacktest: function(analysts, defaultAnalysts) {
        const container = document.getElementById('backtestAnalystSelector');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Group analysts by type
        const analystGroups = {
            '投资大师': analysts.filter(a => !a.id.includes('analyst')),
            '专业分析师': analysts.filter(a => a.id.includes('analyst'))
        };
        
        // Create analyst selector with grouping
        for (const [groupName, groupAnalysts] of Object.entries(analystGroups)) {
            if (groupAnalysts.length === 0) continue;
            
            // Add group header
            const groupHeader = document.createElement('div');
            groupHeader.className = 'w-full text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 mt-2';
            groupHeader.textContent = groupName;
            container.appendChild(groupHeader);
            
            // Create wrapper for analysts in this group
            const groupContainer = document.createElement('div');
            groupContainer.className = 'flex flex-wrap gap-2 mb-2';
            container.appendChild(groupContainer);
            
            // Add analyst checkboxes
            groupAnalysts.forEach(analyst => {
                const isSelected = defaultAnalysts.includes(analyst.id);
                
                const checkbox = document.createElement('div');
                checkbox.className = `py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border ${isSelected ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 bg-white text-gray-800 dark:bg-secondary-900 dark:border-secondary-700 dark:text-white'} cursor-pointer hover:shadow-sm transition-all duration-200 analyst-checkbox ${isSelected ? 'selected' : ''}`;
                checkbox.dataset.analystId = analyst.id;
                checkbox.dataset.group = groupName;
                
                // Add tooltip with description
                checkbox.setAttribute('title', this.getAnalystDescription(analyst.id));
                
                // Add icon if available
                const iconName = this.getAnalystIcon(analyst.id);
                if (iconName) {
                    checkbox.innerHTML = `<i class="ti ${iconName}"></i><span>${analyst.display_name}</span>`;
                } else {
                    checkbox.textContent = analyst.display_name;
                }
                
                groupContainer.appendChild(checkbox);
                
                // Add event listener
                checkbox.addEventListener('click', () => {
                    checkbox.classList.toggle('selected');
                    checkbox.classList.toggle('bg-primary-600');
                    checkbox.classList.toggle('text-white');
                    checkbox.classList.toggle('border-primary-600');
                    checkbox.classList.toggle('bg-white');
                    checkbox.classList.toggle('text-gray-800');
                    checkbox.classList.toggle('dark:bg-secondary-900');
                    checkbox.classList.toggle('border-gray-200');
                    checkbox.classList.toggle('dark:border-secondary-700');
                    checkbox.classList.toggle('dark:text-white');
                    this.updateSelectedBacktestAnalystsCount();
                });
            });
        }
        
        // Add select all / none controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'flex justify-between items-center w-full mt-3 text-xs';
        controlsContainer.innerHTML = `
            <button type="button" id="selectAllBacktestAnalysts" class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-secondary-900 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-800">
                <i class="ti ti-check-all text-sm"></i> 全选
            </button>
            <span id="selectedBacktestAnalystsCount" class="text-gray-500 dark:text-gray-400 px-2"></span>
            <button type="button" id="selectNoneBacktestAnalysts" class="py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-md border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-secondary-900 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-800">
                <i class="ti ti-square-x text-sm"></i> 清空
            </button>
        `;
        container.appendChild(controlsContainer);
        
        // Add event listeners for controls
        document.getElementById('selectAllBacktestAnalysts').addEventListener('click', () => {
            this.selectAllBacktestAnalysts();
        });
        
        document.getElementById('selectNoneBacktestAnalysts').addEventListener('click', () => {
            this.selectNoneBacktestAnalysts();
        });
        
        // Update selected count
        this.updateSelectedBacktestAnalystsCount();
    },
    
    /**
     * Update the count of selected backtest analysts
     */
    updateSelectedBacktestAnalystsCount: function() {
        const countElement = document.getElementById('selectedBacktestAnalystsCount');
        if (!countElement) return;
        
        const totalAnalysts = document.querySelectorAll('#backtestAnalystSelector .analyst-checkbox').length;
        const selectedAnalysts = document.querySelectorAll('#backtestAnalystSelector .analyst-checkbox.selected').length;
        
        countElement.textContent = `${selectedAnalysts} of ${totalAnalysts} selected`;
    },
    
    /**
     * Load available models with improved error handling
     */
    loadModels: function() {
        const modelSelect = document.getElementById('modelSelect');
        const backtestModelSelect = document.getElementById('backtestModelSelect');
        if (!modelSelect && !backtestModelSelect) return;
        
        // Show loading state
        if (modelSelect) modelSelect.innerHTML = '<option value="">加载模型中...</option>';
        if (backtestModelSelect) backtestModelSelect.innerHTML = '<option value="">加载模型中...</option>';
        
        // Get user settings for default model
        const settings = Utils.getSettings();
        const defaultModel = settings.defaultModel || CONFIG.DEFAULTS.MODEL_NAME;
        
        // Fetch models from API
        API.getModels()
            .then(models => {
                if (!models || !models.length) {
                    if (modelSelect) modelSelect.innerHTML = '<option value="">没有可用的模型</option>';
                    if (backtestModelSelect) backtestModelSelect.innerHTML = '<option value="">没有可用的模型</option>';
                    return;
                }
                
                // Group models by provider
                const providers = [...new Set(models.map(model => model.provider))];
                
                // Create options with optgroups
                let options = '';
                
                for (const provider of providers) {
                    const providerModels = models.filter(model => model.provider === provider);
                    
                    options += `<optgroup label="${provider}">`;
                    options += providerModels.map(model => {
                        const isSelected = model.model_name === defaultModel;
                        return `<option value="${model.model_name}" data-provider="${model.provider}" ${isSelected ? 'selected' : ''}>${model.display_name}</option>`;
                    }).join('');
                    options += '</optgroup>';
                }
                
                // Update model selects with custom styling
                if (modelSelect) {
                    modelSelect.innerHTML = options;
                    this.enhanceSelectUI(modelSelect);
                }
                if (backtestModelSelect) {
                    backtestModelSelect.innerHTML = options;
                    this.enhanceSelectUI(backtestModelSelect);
                }
            })
            .catch(error => {
                console.error('Error loading models:', error);
                
                const errorHTML = `
                    <option value="">加载模型失败</option>
                    <option value="gpt-4o" data-provider="OpenAI">GPT-4o (OpenAI)</option>
                    <option value="gpt-4o-mini" data-provider="OpenAI">GPT-4o Mini (OpenAI)</option>
                    <option value="claude-3-opus-20240229" data-provider="Anthropic">Claude 3 Opus (Anthropic)</option>
                    <option value="deepseek-chat" data-provider="DeepSeek">DeepSeek Chat (DeepSeek)</option>
                `;
                
                if (modelSelect) {
                    modelSelect.innerHTML = errorHTML;
                    this.enhanceSelectUI(modelSelect);
                }
                if (backtestModelSelect) {
                    backtestModelSelect.innerHTML = errorHTML;
                    this.enhanceSelectUI(backtestModelSelect);
                }
                
                Utils.showToast('加载AI模型失败。显示默认选项。', 'warning');
            });
    },
    
    /**
     * Enhance select UI with custom styling
     */
    enhanceSelectUI: function(selectElement) {
        if (!selectElement) return;
        
        // Add custom classes to the select element
        selectElement.classList.add('form-select', 'block', 'w-full', 'py-2', 'px-3', 'text-sm', 'rounded-lg', 'border', 'border-gray-200', 'bg-white', 'text-gray-800', 'shadow-sm', 'focus:border-primary-500', 'focus:ring-primary-500', 'dark:bg-secondary-900', 'dark:border-secondary-700', 'dark:text-white');
        
        // Add event listener for hover effect
        selectElement.addEventListener('mouseover', function() {
            this.classList.add('hover:border-primary-400');
        });
        
        selectElement.addEventListener('mouseout', function() {
            this.classList.remove('hover:border-primary-400');
        });
        
        // Add custom icon for the select
        const parentElement = selectElement.parentElement;
        if (parentElement) {
            parentElement.style.position = 'relative';
            
            // Check if icon already exists
            const existingIcon = parentElement.querySelector('.select-icon');
            if (!existingIcon) {
                const icon = document.createElement('div');
                icon.className = 'select-icon absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none';
                icon.innerHTML = '<i class="ti ti-chevron-down text-gray-500 dark:text-gray-400"></i>';
                parentElement.appendChild(icon);
            }
        }
    },
    
    /**
     * Initialize date pickers with better defaults
     */
    initDatePickers: function() {
        const dates = Utils.getDefaultDates();
        
        // Analysis date pickers
        if (typeof flatpickr === 'function') {
            // Analysis start date - default to 3 months ago
            flatpickr('#analysisStartDate', {
                dateFormat: 'Y-m-d',
                defaultDate: dates.startDate,
                maxDate: 'today',
                plugins: [
                    new flatpickr.monthSelectPlugin({
                        shorthand: true,
                        dateFormat: "Y-m-d",
                        altFormat: "M Y"
                    })
                ],
                onChange: function(selectedDates, dateStr) {
                    // 更新结束日期的最小日期
                    const endDatePicker = document.querySelector('#analysisEndDate')._flatpickr;
                    if (endDatePicker) {
                        endDatePicker.set('minDate', dateStr);
                        
                        // 如果结束日期早于开始日期，则更新结束日期
                        if (new Date(endDatePicker.selectedDates[0]) < new Date(selectedDates[0])) {
                            endDatePicker.setDate(dateStr);
                        }
                    }
                }
            });
            
            // Analysis end date - default to today
            flatpickr('#analysisEndDate', {
                dateFormat: 'Y-m-d',
                defaultDate: dates.endDate,
                maxDate: 'today',
                onChange: function(selectedDates, dateStr) {
                    // 更新开始日期的最大日期
                    const startDatePicker = document.querySelector('#analysisStartDate')._flatpickr;
                    if (startDatePicker) {
                        startDatePicker.set('maxDate', dateStr);
                    }
                }
            });
            
            // Backtest start date - default to 1 year ago
            flatpickr('#backtestStartDate', {
                dateFormat: 'Y-m-d',
                defaultDate: Utils.getDateAgo(365, 'day'),
                maxDate: 'today',
                plugins: [
                    new flatpickr.monthSelectPlugin({
                        shorthand: true,
                        dateFormat: "Y-m-d",
                        altFormat: "M Y"
                    })
                ],
                onChange: function(selectedDates, dateStr) {
                    // 更新结束日期的最小日期
                    const endDatePicker = document.querySelector('#backtestEndDate')._flatpickr;
                    if (endDatePicker) {
                        endDatePicker.set('minDate', dateStr);
                        
                        // 如果结束日期早于开始日期，则更新结束日期
                        if (new Date(endDatePicker.selectedDates[0]) < new Date(selectedDates[0])) {
                            endDatePicker.setDate(dateStr);
                        }
                    }
                }
            });
            
            // Backtest end date - default to today
            flatpickr('#backtestEndDate', {
                dateFormat: 'Y-m-d',
                defaultDate: dates.endDate,
                maxDate: 'today',
                onChange: function(selectedDates, dateStr) {
                    // 更新开始日期的最大日期
                    const startDatePicker = document.querySelector('#backtestStartDate')._flatpickr;
                    if (startDatePicker) {
                        startDatePicker.set('maxDate', dateStr);
                    }
                }
            });
        } else {
            // Fallback if flatpickr is not available
            const inputs = ['analysisStartDate', 'analysisEndDate', 'backtestStartDate', 'backtestEndDate'];
            inputs.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    input.type = 'date';
                    input.value = id.includes('Start') ? 
                        (id === 'backtestStartDate' ? Utils.getDateAgo(365, 'day') : dates.startDate) : 
                        dates.endDate;
                    input.max = new Date().toISOString().split('T')[0];
                }
            });
        }
    },
    
    /**
     * Set up event listeners with improved validation
     */
    setupEventListeners: function() {
        // Analysis form submission
        const analysisForm = document.getElementById('analysisForm');
        if (analysisForm) {
            analysisForm.addEventListener('submit', e => {
                e.preventDefault();
                this.runAnalysis();
            });
            
            // Ticker input validation as you type
            const tickersInput = document.getElementById('analysisTickers');
            if (tickersInput) {
                tickersInput.addEventListener('input', e => {
                    this.validateTickersInput(e.target);
                });
                
                // Initial validation if there's a value
                if (tickersInput.value) {
                    this.validateTickersInput(tickersInput);
                }
            }
        }
        
        // Export analysis button
        const exportAnalysisBtn = document.getElementById('exportAnalysisBtn');
        if (exportAnalysisBtn) {
            exportAnalysisBtn.addEventListener('click', () => {
                this.exportAnalysis();
            });
        }
        
        // Cancel analysis button
        const cancelAnalysisBtn = document.createElement('button');
        cancelAnalysisBtn.id = 'cancelAnalysisBtn';
        cancelAnalysisBtn.className = 'hidden py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 dark:bg-secondary-800 dark:border-secondary-700 dark:text-white dark:hover:bg-secondary-700';
        cancelAnalysisBtn.innerHTML = '<i class="ti ti-x"></i> 取消分析';
        
        const runAnalysisBtn = document.getElementById('runAnalysisBtn');
        if (runAnalysisBtn && runAnalysisBtn.parentNode) {
            runAnalysisBtn.parentNode.appendChild(cancelAnalysisBtn);
            
            cancelAnalysisBtn.addEventListener('click', () => {
                this.cancelAnalysis();
            });
        }
    },
    
    /**
     * Validate tickers input with real-time feedback
     * @param {HTMLInputElement} input - Input element
     */
    validateTickersInput: function(input) {
        if (!input) return;
        
        // Remove any existing validation messages
        const existingMessage = input.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Skip validation if empty
        if (!input.value.trim()) {
            input.classList.remove('border-red-500', 'border-green-500');
            return;
        }
        
        // Parse tickers
        const tickersInput = input.value.trim();
        const tickers = this.parseTickers(tickersInput);
        
        // Validate each ticker
        const invalidTickers = [];
        for (const ticker of tickers) {
            if (!API.validateTickerFormat(ticker)) {
                invalidTickers.push(ticker);
            }
        }
        
        // Show validation state
        if (invalidTickers.length > 0) {
            input.classList.add('border-red-500');
            input.classList.remove('border-green-500');
            
            // Create validation message
            const message = document.createElement('div');
            message.className = 'validation-message text-red-500 text-xs mt-1';
            message.textContent = `无效格式：${invalidTickers.join(', ')}`;
            input.parentNode.appendChild(message);
        } else if (tickers.length > 0) {
            input.classList.add('border-green-500');
            input.classList.remove('border-red-500');
        } else {
            input.classList.remove('border-red-500', 'border-green-500');
        }
    },
    
    /**
     * Parse ticker string with multiple tickers and normalize format
     * @param {string} tickerString - Comma-separated ticker string
     * @returns {Array} Array of valid tickers
     */
    parseTickers: function(tickerString) {
        if (!tickerString) return [];
        
        return tickerString.split(',')
            .map(ticker => ticker.trim().toUpperCase())
            .filter(ticker => ticker.length > 0);
    },
    
    /**
     * Run analysis with improved validation and feedback
     */
    runAnalysis: function() {
        // Get form inputs
        const tickersInput = document.getElementById('analysisTickers');
        const startDateInput = document.getElementById('analysisStartDate');
        const endDateInput = document.getElementById('analysisEndDate');
        const modelSelect = document.getElementById('modelSelect');
        const analystCheckboxes = document.querySelectorAll('#analystSelector .analyst-checkbox.selected');
        
        // Validate tickers
        if (!tickersInput.value.trim()) {
            Utils.showToast('请至少输入一个股票代码', 'error');
            tickersInput.focus();
            return;
        }
        
        // Parse tickers
        const tickers = this.parseTickers(tickersInput.value);
        if (tickers.length === 0) {
            Utils.showToast('无效的股票代码格式', 'error');
            tickersInput.focus();
            return;
        }
        
        // Validate ticker formats
        const invalidTickers = tickers.filter(ticker => !API.validateTickerFormat(ticker));
        if (invalidTickers.length > 0) {
            Utils.showToast(`无效的股票代码格式：${invalidTickers.join(', ')}`, 'error');
            tickersInput.focus();
            return;
        }
        
        // Validate max number of tickers (limit to 5 for performance)
        if (tickers.length > 5) {
            Utils.showToast('请最多输入5个股票代码以获得最佳性能', 'warning');
            tickersInput.focus();
            return;
        }
        
        // Get selected analysts
        const selectedAnalysts = Array.from(analystCheckboxes).map(checkbox => checkbox.dataset.analystId);
        if (selectedAnalysts.length === 0) {
            Utils.showToast('请至少选择一个分析师', 'error');
            return;
        }
        
        // Get selected model
        if (!modelSelect.value) {
            Utils.showToast('请选择一个AI模型', 'error');
            modelSelect.focus();
            return;
        }
        
        const modelName = modelSelect.value;
        const modelProvider = modelSelect.options[modelSelect.selectedIndex].dataset.provider;
        
        // Get dates
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Check date range
        if (!startDate || !endDate) {
            Utils.showToast('请选择开始和结束日期', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            Utils.showToast('开始日期必须在结束日期之前', 'error');
            return;
        }
        
        // Show loading state
        this.showAnalysisLoading();
        
        // Toggle buttons
        const runAnalysisBtn = document.getElementById('runAnalysisBtn');
        const cancelAnalysisBtn = document.getElementById('cancelAnalysisBtn');
        
        if (runAnalysisBtn) runAnalysisBtn.disabled = true;
        if (cancelAnalysisBtn) {
            cancelAnalysisBtn.classList.remove('hidden');
            cancelAnalysisBtn.disabled = false;
        }
        
        // Send analysis request
        API.runAnalysis(tickers, startDate, endDate, selectedAnalysts, modelName, modelProvider)
            .then(response => {
                if (response && response.task_id) {
                    this.activeTaskId = response.task_id;
                    Utils.showToast(`分析开始：${tickers.join(', ')}`, 'info');
                    
                    // Poll for task updates
                    this.pollControl = API.pollTask(
                        response.task_id,
                        // Progress callback
                        (progress) => {
                            this.updateAnalysisProgress(progress);
                        },
                        // Complete callback
                        (result) => {
                            this.showAnalysisResults(result);
                            
                            // Store analysis data
                            this.activeAnalysis = {
                                id: `analysis_${Date.now()}`,
                                date: new Date().toISOString(),
                                tickers: tickers,
                                startDate: startDate,
                                endDate: endDate,
                                selectedAnalysts: selectedAnalysts,
                                modelName: modelName,
                                modelProvider: modelProvider,
                                result: result
                            };
                            
                            // Save to recent analyses
                            Utils.saveRecentAnalysis(this.activeAnalysis);
                            
                            // Reset UI state
                            if (runAnalysisBtn) runAnalysisBtn.disabled = false;
                            if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
                        },
                        // Error callback
                        (error) => {
                            this.showAnalysisError(error || '分析失败');
                            this.activeTaskId = null;
                            
                            // Reset UI state
                            if (runAnalysisBtn) runAnalysisBtn.disabled = false;
                            if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
                        }
                    );
                } else {
                    this.showAnalysisError('无效的服务器响应');
                    
                    // Reset UI state
                    if (runAnalysisBtn) runAnalysisBtn.disabled = false;
                    if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
                }
            })
            .catch(error => {
                console.error('Error starting analysis:', error);
                this.showAnalysisError(`分析启动失败：${error.message}`);
                
                // Reset UI state
                if (runAnalysisBtn) runAnalysisBtn.disabled = false;
                if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
            });
    },
    
    /**
     * Cancel ongoing analysis
     */
    cancelAnalysis: function() {
        if (this.pollControl) {
            this.pollControl.cancel();
            this.pollControl = null;
        }
        
        // Reset UI
        const statusElement = document.getElementById('analysisStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="error-state text-center">
                    <i class="ti ti-player-stop text-3xl text-yellow-500 mb-2"></i>
                    <p class="text-yellow-500 mb-4">分析被用户取消</p>
                    <button id="startNewAnalysis" class="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-primary-600 text-white hover:bg-primary-700">
                        <i class="ti ti-player-play"></i> 开始新分析
                    </button>
                </div>
            `;
            
            // Add event listener
            document.getElementById('startNewAnalysis')?.addEventListener('click', () => {
                statusElement.innerHTML = '';
                statusElement.style.display = 'none';
            });
        }
        
        // Reset button state
        const runAnalysisBtn = document.getElementById('runAnalysisBtn');
        const cancelAnalysisBtn = document.getElementById('cancelAnalysisBtn');
        
        if (runAnalysisBtn) runAnalysisBtn.disabled = false;
        if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
        
        // Show toast
        Utils.showToast('分析取消', 'info');
        
        // Reset task ID
        this.activeTaskId = null;
    },
    
    // [Rest of the methods remain similar but with improved implementations...]
};