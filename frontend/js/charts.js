/**
 * Chart utilities for AI Hedge Fund dashboard
 */
const Charts = {
    // Store chart instances to update/destroy later
    instances: {},
    
    /**
     * Initialize Chart.js defaults
     */
    init: function() {
        const colorScheme = Utils.getColorScheme();
        
        // Set default chart options
        Chart.defaults.font.family = 'Inter, sans-serif';
        Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
        Chart.defaults.scale.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        Chart.defaults.plugins.tooltip.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim();
        Chart.defaults.plugins.tooltip.titleColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        Chart.defaults.plugins.tooltip.bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        Chart.defaults.plugins.tooltip.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        Chart.defaults.plugins.tooltip.borderWidth = 1;
    },
    
    /**
     * Create a portfolio value chart
     * @param {string} chartId - Canvas element ID
     * @param {Array} data - Portfolio value data
     */
    createPortfolioChart: function(chartId, data) {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
        }
        
        // Prepare data
        const dates = data.map(item => item.Date);
        const values = data.map(item => item['Portfolio Value']);
        
        // Get colors
        const colorScheme = Utils.getColorScheme();
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, this.hexToRgba(colorScheme.primary, 0.2));
        gradient.addColorStop(1, this.hexToRgba(colorScheme.primary, 0));
        
        // Create chart
        this.instances[chartId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Portfolio Value',
                    data: values,
                    borderColor: colorScheme.primary,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 10,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'MMM d, yyyy',
                            displayFormats: {
                                day: 'MMM d'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value, 'USD', 0);
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create a backtest results chart
     * @param {string} chartId - Canvas element ID
     * @param {Array} data - Backtest data
     */
    createBacktestChart: function(chartId, data) {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
        }
        
        // Prepare data
        const dates = data.map(item => item.Date);
        const portfolioValues = data.map(item => item['Portfolio Value']);
        
        // Get colors
        const colorScheme = Utils.getColorScheme();
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, this.hexToRgba(colorScheme.primary, 0.2));
        gradient.addColorStop(1, this.hexToRgba(colorScheme.primary, 0));
        
        // Create chart
        this.instances[chartId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Portfolio Value',
                    data: portfolioValues,
                    borderColor: colorScheme.primary,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 10,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'MMM d, yyyy',
                            displayFormats: {
                                day: 'MMM d'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value, 'USD', 0);
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create a stock price chart
     * @param {string} chartId - Canvas element ID
     * @param {Array} data - Price data
     * @param {string} period - Time period (1m, 3m, 6m, 1y, 5y)
     */
    createStockChart: function(chartId, data, period = '3m') {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
        }
        
        // Filter data based on period
        const filteredData = this.filterDataByPeriod(data, period);
        
        // Prepare data
        const dates = filteredData.map(item => item.Date);
        const prices = filteredData.map(item => item.close);
        
        // Get colors
        const colorScheme = Utils.getColorScheme();
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, this.hexToRgba(colorScheme.primary, 0.2));
        gradient.addColorStop(1, this.hexToRgba(colorScheme.primary, 0));
        
        // Create chart
        this.instances[chartId] = new Chart(canvas, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Stock Price',
                    data: prices,
                    borderColor: colorScheme.primary,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHitRadius: 10,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return Utils.formatCurrency(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: this.getTimeUnit(period),
                            tooltipFormat: 'MMM d, yyyy',
                            displayFormats: {
                                day: 'MMM d',
                                week: 'MMM d',
                                month: 'MMM yyyy'
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create portfolio allocation pie chart
     * @param {string} chartId - Canvas element ID
     * @param {Object} portfolio - Portfolio data
     */
    createAllocationChart: function(chartId, portfolio) {
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (this.instances[chartId]) {
            this.instances[chartId].destroy();
        }
        
        // Prepare data
        const labels = [];
        const values = [];
        const colors = [];
        const colorScheme = Utils.getColorScheme();
        const chartColors = [
            colorScheme.primary,
            colorScheme.secondary,
            colorScheme.tertiary,
            colorScheme.quaternary,
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
            '#f97316'
        ];
        
        // Add cash
        labels.push('Cash');
        values.push(portfolio.cash);
        colors.push(colorScheme.secondary);
        
        // Add positions
        let colorIndex = 0;
        for (const [ticker, position] of Object.entries(portfolio.positions)) {
            if (position.long > 0) {
                labels.push(`${ticker} (Long)`);
                // Calculate position value (this is simplified, actual value would depend on current price)
                const value = position.long * position.long_cost_basis;
                values.push(value);
                colors.push(chartColors[colorIndex % chartColors.length]);
                colorIndex++;
            }
            
            if (position.short > 0) {
                labels.push(`${ticker} (Short)`);
                // Calculate position value
                const value = position.short * position.short_cost_basis;
                values.push(value);
                colors.push(chartColors[colorIndex % chartColors.length]);
                colorIndex++;
            }
        }
        
        // Create chart
        this.instances[chartId] = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim(),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = (value / total * 100).toFixed(1);
                                return `${context.label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Filter data by time period
     * @param {Array} data - Original data array
     * @param {string} period - Time period (1m, 3m, 6m, 1y, 5y)
     * @returns {Array} Filtered data
     */
    filterDataByPeriod: function(data, period) {
        if (!data || !data.length) return [];
        
        const now = new Date();
        let cutoffDate;
        
        switch (period) {
            case '1m':
                cutoffDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case '3m':
                cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case '6m':
                cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
                break;
            case '1y':
                cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            case '5y':
                cutoffDate = new Date(now.setFullYear(now.getFullYear() - 5));
                break;
            default:
                cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        }
        
        cutoffDate = cutoffDate.toISOString().split('T')[0];
        return data.filter(item => item.Date >= cutoffDate);
    },
    
    /**
     * Get appropriate time unit for Chart.js based on period
     * @param {string} period - Time period
     * @returns {string} Time unit
     */
    getTimeUnit: function(period) {
        switch (period) {
            case '1m':
                return 'day';
            case '3m':
                return 'day';
            case '6m':
                return 'week';
            case '1y':
                return 'month';
            case '5y':
                return 'month';
            default:
                return 'day';
        }
    },
    
    /**
     * Convert hex color to rgba
     * @param {string} hex - Hex color code
     * @param {number} alpha - Alpha value
     * @returns {string} RGBA color string
     */
    hexToRgba: function(hex, alpha = 1) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse hex
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    /**
     * Redraw all charts with current theme colors
     */
    updateChartsForTheme: function() {
        // Update Chart.js defaults
        this.init();
        
        // Redraw all charts
        for (const [chartId, chart] of Object.entries(this.instances)) {
            if (chartId === 'portfolioChart') {
                // Get current data
                const data = chart.data.datasets[0].data;
                const labels = chart.data.labels;
                this.createPortfolioChart(chartId, labels.map((date, i) => ({
                    Date: date,
                    'Portfolio Value': data[i]
                })));
            } else if (chartId === 'backtestChart') {
                // Get current data
                const data = chart.data.datasets[0].data;
                const labels = chart.data.labels;
                this.createBacktestChart(chartId, labels.map((date, i) => ({
                    Date: date,
                    'Portfolio Value': data[i]
                })));
            } else if (chartId === 'tickerChart') {
                // Get current data
                const data = chart.data.datasets[0].data;
                const labels = chart.data.labels;
                const period = document.querySelector('.chart-period.active').dataset.period;
                this.createStockChart(chartId, labels.map((date, i) => ({
                    Date: date,
                    close: data[i]
                })), period);
            } else if (chartId === 'allocationChart') {
                // Redraw with current portfolio
                this.createAllocationChart(chartId, Utils.getPortfolio());
            }
        }
    }
};
