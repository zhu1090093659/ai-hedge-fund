/**
 * Enhanced chart utilities for AI Hedge Fund dashboard
 */
const Charts = {
    // Store chart instances to update/destroy later
    instances: {},
    
    /**
     * Initialize Chart.js defaults with better financial visualization settings
     */
    init: function() {
        // Set default colors based on theme
        this.updateChartColors();
        
        // Set default chart options
        Chart.defaults.font.family = 'Inter, sans-serif';
        Chart.defaults.scale.grid.color = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        Chart.defaults.plugins.tooltip.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim();
        Chart.defaults.plugins.tooltip.titleColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        Chart.defaults.plugins.tooltip.bodyColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        Chart.defaults.plugins.tooltip.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        
        // Register custom chart types
        this.registerCandlestickChart();
    },
    
    /**
     * Update chart colors based on current theme
     */
    updateChartColors: function() {
        const colorScheme = Utils.getColorScheme();
        Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
    },
    
    /**
     * Register candlestick chart for financial data
     */
    registerCandlestickChart: function() {
        // Only register if not already registered
        if (Chart.controllers.candlestick) return;
        
        // Create candlestick chart type
        class CandlestickElement extends Chart.elements.BarElement {
            draw(ctx) {
                const {x, width, y, base, options} = this;
                const strokeWidth = options.borderWidth;
                
                // Draw wick (vertical line)
                ctx.beginPath();
                ctx.strokeStyle = options.borderColor;
                ctx.lineWidth = strokeWidth;
                ctx.moveTo(x, this._open);
                ctx.lineTo(x, this._high);
                ctx.moveTo(x, this._low);
                ctx.lineTo(x, this._close);
                ctx.stroke();
                
                // Draw body
                ctx.beginPath();
                ctx.fillStyle = options.backgroundColor;
                
                // Determine body coordinates based on open/close values
                const bodyY = Math.min(this._open, this._close);
                const bodyHeight = Math.abs(this._close - this._open);
                
                // Draw body rectangle
                ctx.fillRect(x - width / 2, bodyY, width, bodyHeight);
                
                // Draw border around body
                ctx.strokeRect(x - width / 2, bodyY, width, bodyHeight);
            }
        }
        
        // Register candlestick element
        Chart.register({
            id: 'candlestick',
            defaults: {
                ...Chart.defaults.elements.bar,
                borderWidth: 1,
                borderSkipped: false,
            },
            elements: {
                candlestick: CandlestickElement
            },
        });
        
        // Register candlestick controller
        class CandlestickController extends Chart.controllers.bar {
            parseObjectData(meta, data, start, count) {
                const parsed = super.parseObjectData(meta, data, start, count);
                
                // Store OHLC values for each data point
                for (let i = 0; i < parsed.length; i++) {
                    const dp = parsed[i];
                    const index = start + i;
                    const item = data[index];
                    
                    dp._open = this.getParsedValue(item.open);
                    dp._high = this.getParsedValue(item.high);
                    dp._low = this.getParsedValue(item.low);
                    dp._close = this.getParsedValue(item.close);
                }
                
                return parsed;
            }
            
            getParsedValue(value) {
                const {vScale} = this._cachedMeta;
                return vScale.getPixelForValue(value);
            }
            
            updateElements(elements, start, count, mode) {
                super.updateElements(elements, start, count, mode);
                
                // Update candlestick specific values
                const {data} = this.getDataset();
                const {vScale} = this._cachedMeta;
                
                for (let i = 0; i < count; i++) {
                    const index = start + i;
                    const item = data[index];
                    const element = elements[i];
                    
                    element._open = vScale.getPixelForValue(item.open);
                    element._high = vScale.getPixelForValue(item.high);
                    element._low = vScale.getPixelForValue(item.low);
                    element._close = vScale.getPixelForValue(item.close);
                    
                    // Color candlestick based on price movement
                    const colorScheme = Utils.getColorScheme();
                    if (item.open > item.close) {
                        element.options.backgroundColor = colorScheme.negative;
                        element.options.borderColor = colorScheme.negative;
                    } else {
                        element.options.backgroundColor = colorScheme.positive;
                        element.options.borderColor = colorScheme.positive;
                    }
                }
            }
        }
        
        // Register candlestick controller
        Chart.register({
            id: 'candlestick',
            datasetElementType: false,
            dataElementType: 'candlestick',
            defaults: {
                ...Chart.defaults.bar,
                datasets: {
                    animation: false,
                    barPercentage: 0.8,
                    categoryPercentage: 0.9,
                }
            },
            controller: CandlestickController
        });
    },
    
    /**
     * Create an enhanced portfolio value chart with annotations
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
        
        // Calculate metrics
        const startValue = values[0];
        const endValue = values[values.length - 1];
        const totalReturn = (endValue - startValue) / startValue;
        
        // Calculate moving average
        const movingAveragePeriod = 7; // 7-day moving average
        const movingAverages = [];
        
        for (let i = 0; i < values.length; i++) {
            if (i < movingAveragePeriod - 1) {
                movingAverages.push(null);
            } else {
                let sum = 0;
                for (let j = 0; j < movingAveragePeriod; j++) {
                    sum += values[i - j];
                }
                movingAverages.push(sum / movingAveragePeriod);
            }
        }
        
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
                datasets: [
                    {
                        label: 'Portfolio Value',
                        data: values,
                        borderColor: colorScheme.primary,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHitRadius: 10,
                        borderWidth: 2
                    },
                    {
                        label: '7-Day Moving Average',
                        data: movingAverages,
                        borderColor: colorScheme.secondary,
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHitRadius: 0,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Portfolio Value') {
                                    return `Value: ${Utils.formatCurrency(context.raw)}`;
                                } else {
                                    return `MA(7): ${Utils.formatCurrency(context.raw)}`;
                                }
                            },
                            afterBody: function(tooltipItems) {
                                const index = tooltipItems[0].dataIndex;
                                const startVal = values[0];
                                const currentVal = values[index];
                                const returnVal = (currentVal - startVal) / startVal;
                                return `Return: ${Utils.formatPercentage(returnVal, 2, true)}`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: startValue,
                                yMax: startValue,
                                borderColor: 'rgba(150, 150, 150, 0.5)',
                                borderWidth: 1,
                                borderDash: [6, 6],
                                label: {
                                    display: true,
                                    content: 'Initial',
                                    position: 'start'
                                }
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
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },
    
    /**
     * Create an enhanced stock price chart with OHLC data
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
        
        // Prepare data for line chart
        const dates = filteredData.map(item => item.Date);
        const prices = filteredData.map(item => item.close);
        
        // Prepare data for candlestick chart if available
        const hasCandlestickData = filteredData.some(item => 
            item.open !== undefined && 
            item.high !== undefined && 
            item.low !== undefined && 
            item.close !== undefined
        );
        
        const candlestickData = hasCandlestickData ? filteredData.map(item => ({
            x: item.Date,
            open: item.open || item.close,
            high: item.high || item.close,
            low: item.low || item.close,
            close: item.close
        })) : [];
        
        // Calculate volume data if available
        const hasVolumeData = filteredData.some(item => item.volume !== undefined);
        const volumeData = hasVolumeData ? filteredData.map(item => ({
            x: item.Date,
            y: item.volume || 0
        })) : [];
        
        // Get colors
        const colorScheme = Utils.getColorScheme();
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, this.hexToRgba(colorScheme.primary, 0.2));
        gradient.addColorStop(1, this.hexToRgba(colorScheme.primary, 0));
        
        // Create datasets based on available data
        const datasets = [];
        
        if (hasCandlestickData) {
            // Add candlestick dataset
            datasets.push({
                type: 'candlestick',
                label: 'OHLC',
                data: candlestickData,
                borderColor: function(context) {
                    const item = context.raw;
                    return item && item.open > item.close 
                        ? colorScheme.negative 
                        : colorScheme.positive;
                },
                backgroundColor: function(context) {
                    const item = context.raw;
                    return item && item.open > item.close 
                        ? colorScheme.negative 
                        : colorScheme.positive;
                }
            });
        } else {
            // Add line chart for close prices
            datasets.push({
                type: 'line',
                label: 'Price',
                data: prices,
                borderColor: colorScheme.primary,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHitRadius: 10,
                borderWidth: 2
            });
        }
        
        // Add volume chart if data is available
        if (hasVolumeData) {
            // Create separate y-axis for volume
            datasets.push({
                type: 'bar',
                label: 'Volume',
                data: volumeData,
                yAxisID: 'volume',
                backgroundColor: this.hexToRgba(colorScheme.secondary, 0.3),
                borderColor: this.hexToRgba(colorScheme.secondary, 0.5),
                borderWidth: 1
            });
        }
        
        // Create chart
        this.instances[chartId] = new Chart(canvas, {
            type: 'line', // Base type, will be overridden by dataset types
            data: {
                labels: dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.type === 'candlestick') {
                                    const item = context.raw;
                                    return [
                                        `Open: ${Utils.formatCurrency(item.open)}`,
                                        `High: ${Utils.formatCurrency(item.high)}`,
                                        `Low: ${Utils.formatCurrency(item.low)}`,
                                        `Close: ${Utils.formatCurrency(item.close)}`
                                    ];
                                } else if (context.dataset.label === 'Volume') {
                                    return `Volume: ${Utils.formatNumber(context.raw.y, 0)}`;
                                } else {
                                    return `Price: ${Utils.formatCurrency(context.raw)}`;
                                }
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
                    },
                    volume: {
                        display: hasVolumeData,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatNumber(value, 0);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },
    
    // Other methods remain the same...
    
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
        this.updateChartColors();
        
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
                const period = document.querySelector('.chart-period.active')?.dataset.period || '3m';
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