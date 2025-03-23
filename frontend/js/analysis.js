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
        console.log('初始化分析页面');
        this.loadAnalysts();
        this.loadModels();
        this.initDatePickers();
        this.setupEventListeners();
        this.loadRecentAnalyses();
        
        // 从URL或localStorage获取股票代码并自动填充
        this.autoFillTickerFromParams();
    },
    
    /**
     * 自动从URL参数或localStorage中获取股票代码，并填充到表单
     */
    autoFillTickerFromParams: function() {
        console.log('检查URL参数和localStorage...');
        
        // 从URL获取股票代码
        const urlParams = new URLSearchParams(window.location.search);
        let ticker = urlParams.get('ticker');
        
        // 如果URL中没有，则尝试从localStorage获取
        if (!ticker) {
            ticker = localStorage.getItem('pending_analysis_ticker');
            console.log('从localStorage获取股票代码:', ticker);
            
            // 使用后立即清除，防止重复使用
            if (ticker) {
                localStorage.removeItem('pending_analysis_ticker');
            }
        } else {
            console.log('从URL参数获取股票代码:', ticker);
        }
        
        // 如果找到股票代码，填充到表单并显示通知
        if (ticker) {
            const tickersInput = document.getElementById('analysisTickers');
            if (tickersInput) {
                tickersInput.value = ticker;
                console.log('已自动填充股票代码:', ticker);
                this.validateTickersInput(tickersInput);
                
                // 显示通知
                Utils.showToast(`已加载${ticker}，准备分析`, 'info');
                
                // 自动选择默认分析师（如果未选择）
                setTimeout(() => {
                    const selectedAnalysts = document.querySelectorAll('#analystSelector .analyst-checkbox.selected');
                    if (selectedAnalysts.length === 0) {
                        this.selectDefaultAnalysts();
                    }
                }, 1000);
            }
        }
    },
    
    /**
     * 选择默认分析师
     */
    selectDefaultAnalysts: function() {
        console.log('选择默认分析师');
        // 获取用户设置中的默认分析师
        const settings = Utils.getSettings();
        const defaultAnalysts = settings.defaultAnalysts || CONFIG.DEFAULTS.ANALYSTS;
        
        // 选择默认分析师
        document.querySelectorAll('#analystSelector .analyst-checkbox').forEach(checkbox => {
            if (defaultAnalysts.includes(checkbox.dataset.analystId)) {
                checkbox.classList.add('selected');
            }
        });
        
        // 更新选中计数
        this.updateSelectedAnalystsCount();
    },
    
    /**
     * Load available analysts with improved error handling
     */
    loadAnalysts: function() {
        const container = document.getElementById('analystSelector');
    if (!container) return;
    
    // 显示加载状态
    container.innerHTML = '<div class="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm dark:bg-secondary-900 dark:border-secondary-700 dark:text-white skeleton-pulse">加载分析师中...</div>';
    
    // 获取用户设置中的默认分析师
    const settings = Utils.getSettings();
    const defaultAnalysts = settings.defaultAnalysts || CONFIG.DEFAULTS.ANALYSTS;
    
    // 从API获取分析师
    API.getAnalysts()
        .then(analysts => {
            if (!analysts || !analysts.length) {
                container.innerHTML = '<p class="text-red-500 dark:text-red-400">没有可用的分析师。请检查API连接。</p>';
                return;
            }
            
            // 清除现有内容
            container.innerHTML = '';
            
            // 按类型分组分析师
            const analystGroups = {
                '投资大师': analysts.filter(a => !a.id.includes('analyst')),
                '专业分析师': analysts.filter(a => a.id.includes('analyst'))
            };
            
            // 创建带分组的分析师选择器
            for (const [groupName, groupAnalysts] of Object.entries(analystGroups)) {
                if (groupAnalysts.length === 0) continue;
                
                // 添加分组标题
                const groupHeader = document.createElement('div');
                groupHeader.className = 'w-full text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 mt-2';
                groupHeader.textContent = groupName;
                container.appendChild(groupHeader);
                
                // 为该分组创建包装器
                const groupContainer = document.createElement('div');
                groupContainer.className = 'flex flex-wrap gap-2 mb-2';
                container.appendChild(groupContainer);
                
                // 添加分析师复选框
                groupAnalysts.forEach(analyst => {
                    const isSelected = defaultAnalysts.includes(analyst.id);
                    
                    const checkbox = document.createElement('div');
                    checkbox.className = `glass-chip py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border ${isSelected ? 'selected' : ''} analyst-checkbox`;
                    checkbox.dataset.analystId = analyst.id;
                    checkbox.dataset.group = groupName;
                    
                    // 添加带描述的工具提示
                    checkbox.setAttribute('title', this.getAnalystDescription(analyst.id));
                    
                    // 如果有图标则添加图标
                    const iconName = this.getAnalystIcon(analyst.id);
                    if (iconName) {
                        checkbox.innerHTML = `<i class="ti ${iconName}"></i><span>${analyst.display_name}</span>`;
                    } else {
                        checkbox.textContent = analyst.display_name;
                    }
                    
                    groupContainer.appendChild(checkbox);
                    
                    // 添加事件监听器
                    checkbox.addEventListener('click', () => {
                        checkbox.classList.toggle('selected');
                        this.updateSelectedAnalystsCount();
                    });
                });
            }
            
            // 添加全选/全不选控件
            const controlsContainer = document.createElement('div');
            controlsContainer.className = 'flex justify-between items-center w-full mt-3 text-xs';
            controlsContainer.innerHTML = `
                <button type="button" id="selectAllAnalysts" class="glass-btn py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-md">
                    <i class="ti ti-check-all text-sm"></i> 全选
                </button>
                <span id="selectedAnalystsCount" class="text-gray-500 dark:text-gray-400 px-2"></span>
                <button type="button" id="selectNoneAnalysts" class="glass-btn py-1 px-2 inline-flex items-center gap-x-1 text-xs font-medium rounded-md">
                    <i class="ti ti-square-x text-sm"></i> 清空
                </button>
            `;
            container.appendChild(controlsContainer);
            
            // 为控件添加事件监听器
            document.getElementById('selectAllAnalysts').addEventListener('click', () => {
                this.selectAllAnalysts();
            });
            
            document.getElementById('selectNoneAnalysts').addEventListener('click', () => {
                this.selectNoneAnalysts();
            });
            
            // 更新选中数量
            this.updateSelectedAnalystsCount();
            
            // 克隆分析师到回测部分
            this.cloneAnalystsToBacktest(analysts, defaultAnalysts);
        })
        .catch(error => {
            console.error('加载分析师时出错:', error);
            container.innerHTML = `
                <div class="error-state text-center p-4">
                    <i class="ti ti-alert-triangle text-2xl text-red-500 mb-2"></i>
                    <p class="text-red-500 mb-3">加载分析师失败</p>
                    <button id="retryLoadAnalysts" class="gradient-btn py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg">
                        <i class="ti ti-refresh"></i> 重试
                    </button>
                </div>
            `;
            
            // 添加重试按钮监听器
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
            if (!checkbox.classList.contains('selected')) {
                checkbox.classList.add('selected');
            }
        });
        this.updateSelectedAnalystsCount();
    },
    
    /**
     * Deselect all analysts
     */
    selectNoneAnalysts: function() {
        document.querySelectorAll('#analystSelector .analyst-checkbox').forEach(checkbox => {
            checkbox.classList.remove('selected');
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
        // 获取表单输入
    const tickersInput = document.getElementById('analysisTickers');
    const startDateInput = document.getElementById('analysisStartDate');
    const endDateInput = document.getElementById('analysisEndDate');
    const modelSelect = document.getElementById('modelSelect');
    const analystCheckboxes = document.querySelectorAll('#analystSelector .analyst-checkbox.selected');
    
    // 验证股票代码
    if (!tickersInput.value.trim()) {
        Utils.showToast('请至少输入一个股票代码', 'error');
        tickersInput.focus();
        return;
    }
    
    // 解析股票代码
    const tickers = this.parseTickers(tickersInput.value);
    if (tickers.length === 0) {
        Utils.showToast('无效的股票代码格式', 'error');
        tickersInput.focus();
        return;
    }
    
    // 验证股票代码格式
    const invalidTickers = tickers.filter(ticker => !API.validateTickerFormat(ticker));
    if (invalidTickers.length > 0) {
        Utils.showToast(`无效的股票代码格式：${invalidTickers.join(', ')}`, 'error');
        tickersInput.focus();
        return;
    }
    
    // 验证最大股票代码数量
    if (tickers.length > 5) {
        Utils.showToast('请最多输入5个股票代码以获得最佳性能', 'warning');
        tickersInput.focus();
        return;
    }
    
    // 获取选中的分析师
    const selectedAnalysts = Array.from(analystCheckboxes).map(checkbox => checkbox.dataset.analystId);
    if (selectedAnalysts.length === 0) {
        Utils.showToast('请至少选择一个分析师', 'error');
        return;
    }
    
    // 获取选中的模型
    if (!modelSelect.value) {
        Utils.showToast('请选择一个AI模型', 'error');
        modelSelect.focus();
        return;
    }
    
    const modelName = modelSelect.value;
    const modelProvider = modelSelect.options[modelSelect.selectedIndex].dataset.provider;
    
    // 获取日期
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    // 检查日期范围
    if (!startDate || !endDate) {
        Utils.showToast('请选择开始和结束日期', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        Utils.showToast('开始日期必须在结束日期之前', 'error');
        return;
    }
    
    // 显示加载状态
    this.showAnalysisLoading();
    
    // 切换按钮
    const runAnalysisBtn = document.getElementById('runAnalysisBtn');
    const cancelAnalysisBtn = document.getElementById('cancelAnalysisBtn');
    
    if (runAnalysisBtn) runAnalysisBtn.disabled = true;
    if (cancelAnalysisBtn) {
        cancelAnalysisBtn.classList.remove('hidden');
        cancelAnalysisBtn.disabled = false;
    }
    
    // 发送分析请求
    API.runAnalysis(tickers, startDate, endDate, selectedAnalysts, modelName, modelProvider)
        .then(response => {
            if (response && response.task_id) {
                this.activeTaskId = response.task_id;
                Utils.showToast(`分析开始：${tickers.join(', ')}`, 'info');
                
                // 轮询任务更新
                this.pollControl = API.pollTask(
                    response.task_id,
                    // 进度回调
                    (progress) => {
                        this.updateAnalysisProgress(progress);
                    },
                    // 完成回调
                    (result) => {
                        this.showAnalysisResults(result);
                        
                        // 存储分析数据
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
                        
                        // 保存到最近分析
                        Utils.saveRecentAnalysis(this.activeAnalysis);
                        
                        // 重置UI状态
                        if (runAnalysisBtn) runAnalysisBtn.disabled = false;
                        if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
                    },
                    // 错误回调
                    (error) => {
                        this.showAnalysisError(error || '分析失败');
                        this.activeTaskId = null;
                        
                        // 重置UI状态
                        if (runAnalysisBtn) runAnalysisBtn.disabled = false;
                        if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
                    }
                );
            } else {
                this.showAnalysisError('无效的服务器响应');
                
                // 重置UI状态
                if (runAnalysisBtn) runAnalysisBtn.disabled = false;
                if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error('启动分析时出错:', error);
            this.showAnalysisError(`分析启动失败：${error.message}`);
            
            // 重置UI状态
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
        
        // 重置 UI
        const statusElement = document.getElementById('analysisStatus');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="text-center p-8">
                    <i class="ti ti-robot text-3xl text-yellow-500 mb-2"></i>
                    <p class="text-yellow-500 mb-4">分析已被用户取消</p>
                    <button id="startNewAnalysis" class="gradient-btn py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg">
                        <i class="ti ti-player-play"></i> 开始新分析
                    </button>
                </div>
            `;
            
            // 添加事件监听器
            document.getElementById('startNewAnalysis')?.addEventListener('click', () => {
                statusElement.innerHTML = `
                    <div class="text-center p-8">
                        <i class="ti ti-robot text-4xl text-gray-400 dark:text-secondary-600 mb-3"></i>
                        <p class="text-gray-500 dark:text-secondary-400">没有正在运行的分析。使用表单启动一个。</p>
                    </div>
                `;
            });
        }
        
        // 重置按钮状态
        const runAnalysisBtn = document.getElementById('runAnalysisBtn');
        const cancelAnalysisBtn = document.getElementById('cancelAnalysisBtn');
        
        if (runAnalysisBtn) runAnalysisBtn.disabled = false;
        if (cancelAnalysisBtn) cancelAnalysisBtn.classList.add('hidden');
        
        // 显示提示
        Utils.showToast('分析已取消', 'info');
        
        // 重置任务ID
        this.activeTaskId = null;
    },

    /**
     * Show analysis loading state
     */
    showAnalysisLoading: function() {
        const statusElement = document.getElementById('analysisStatus');
        const outputElement = document.getElementById('analysisOutput');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="flex items-center justify-center flex-col p-8">
                    <div class="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-primary-600 rounded-full" role="status" aria-label="loading">
                        <span class="sr-only">加载中...</span>
                    </div>
                    <p class="mt-4 text-secondary-700 dark:text-secondary-300">分析正在进行中，请稍候...</p>
                    <div class="progress-container mt-4 bg-gray-200 dark:bg-secondary-700 rounded-full h-2.5 w-full max-w-md mx-auto">
                        <div class="progress-bar bg-primary-600 h-2.5 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
            `;
            statusElement.classList.remove('hidden');
        }
        
        if (outputElement) outputElement.classList.add('hidden');
    },
    
    updateAnalysisProgress: function(progress) {
        const progressBar = document.querySelector('#analysisStatus .progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }
    },
    
    /**
     * 显示分析错误
     */
    showAnalysisError: function(error) {
        const statusElement = document.getElementById('analysisStatus');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="error-state text-center p-8">
                    <i class="ti ti-alert-triangle text-3xl text-red-500 mb-2"></i>
                    <p class="text-red-500 mb-4">${error}</p>
                    <button id="retryAnalysisBtn" class="gradient-btn py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg">
                        <i class="ti ti-refresh"></i> 重试
                    </button>
                </div>
            `;
            
            // 添加重试按钮事件监听器
            document.getElementById('retryAnalysisBtn')?.addEventListener('click', () => {
                this.runAnalysis();
            });
        }
    },
    
    
};
