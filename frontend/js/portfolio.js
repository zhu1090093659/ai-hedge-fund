/**
 * Portfolio management functionality for AI Hedge Fund
 */
const Portfolio = {
    /**
     * Initialize portfolio components
     */
    init: function() {
        this.loadPortfolio();
        this.setupEventListeners();
    },
    
    /**
     * Load portfolio data
     */
    loadPortfolio: function() {
        const portfolio = Utils.getPortfolio();
        
        // Update portfolio summary
        this.updatePortfolioSummary(portfolio);
        
        // Load positions
        this.loadPositions(portfolio);
        
        // Create allocation chart
        Charts.createAllocationChart('allocationChart', portfolio);
    },
    
    /**
     * Update portfolio summary
     * @param {Object} portfolio - Portfolio data
     */
    updatePortfolioSummary: function(portfolio) {
        let totalPositionValue = 0;
        let totalRealizedGain = 0;
        
        // Calculate position values
        for (const [ticker, position] of Object.entries(portfolio.positions)) {
            if (position.long > 0) {
                totalPositionValue += position.long * position.long_cost_basis;
            }
            if (position.short > 0) {
                totalPositionValue += position.short_margin_used;
            }
        }
        
        // Calculate realized gains
        for (const [ticker, gains] of Object.entries(portfolio.realized_gains)) {
            totalRealizedGain += gains.long + gains.short;
        }
        
        const totalValue = portfolio.cash + totalPositionValue;
        
        // Update UI
        document.getElementById('portfolioTotalValue').textContent = Utils.formatCurrency(totalValue);
        document.getElementById('portfolioCash').textContent = Utils.formatCurrency(portfolio.cash);
        document.getElementById('portfolioInvested').textContent = Utils.formatCurrency(totalPositionValue);
        
        const realizedGainElement = document.getElementById('portfolioRealizedGain');
        realizedGainElement.textContent = Utils.formatCurrency(totalRealizedGain);
        realizedGainElement.classList.add(totalRealizedGain >= 0 ? 'positive' : 'negative');
    },
    
    /**
     * Load portfolio positions
     * @param {Object} portfolio - Portfolio data
     */
    loadPositions: function(portfolio) {
        const positionsTable = document.getElementById('positionsTable');
        if (!positionsTable) return;
        
        // Clear existing content
        positionsTable.innerHTML = '';
        
        const positions = portfolio.positions || {};
        
        if (Object.keys(positions).length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="8" class="text-center">
                    <p>Your portfolio is empty. Use the AI Analysis to get investment recommendations.</p>
                    <button id="emptyPortfolioAnalyze" class="btn-secondary">
                        <i class="fas fa-robot"></i> Run Analysis
                    </button>
                </td>
            `;
            positionsTable.appendChild(row);
            
            // Add event listener
            positionsTable.querySelector('#emptyPortfolioAnalyze').addEventListener('click', () => {
                document.querySelector('[data-section="analysis"]').click();
            });
            return;
        }
        
        // Get price data for all position tickers
        const tickers = Object.keys(positions);
        this.fetchPricesForPositions(tickers, positions, positionsTable);
    },
    
    /**
     * Fetch current prices for all positions
     * @param {Array} tickers - Array of ticker symbols
     * @param {Object} positions - Portfolio positions
     * @param {HTMLElement} container - Table container
     */
    fetchPricesForPositions: function(tickers, positions, container) {
        const { startDate, endDate } = Utils.getDefaultDates();
        
        // Fetch prices for each ticker
        const pricePromises = tickers.map(ticker => {
            return API.get(`${CONFIG.API.ENDPOINTS.PRICES}/${ticker}`, {
                start_date: startDate,
                end_date: endDate
            })
            .then(data => {
                // Return last price or null if no data
                return { ticker, price: data && data.length > 0 ? data[data.length - 1].close : null };
            })
            .catch(error => {
                console.error(`Error fetching price for ${ticker}:`, error);
                return { ticker, price: null };
            });
        });
        
        // When all prices are fetched
        Promise.all(pricePromises)
            .then(results => {
                // Create a map of tickers to prices
                const prices = {};
                results.forEach(result => {
                    prices[result.ticker] = result.price;
                });
                
                // Render positions with current prices
                this.renderPositions(positions, prices, container);
            })
            .catch(error => {
                console.error('Error fetching prices:', error);
                
                // Render positions without current prices
                this.renderPositions(positions, {}, container);
            });
    },
    
    /**
     * Render positions table
     * @param {Object} positions - Portfolio positions
     * @param {Object} prices - Current prices map
     * @param {HTMLElement} container - Table container
     */
    renderPositions: function(positions, prices, container) {
        // Create rows for each position
        for (const [ticker, position] of Object.entries(positions)) {
            // Skip empty positions
            if (position.long === 0 && position.short === 0) continue;
            
            const currentPrice = prices[ticker] || 0;
            const currency = Utils.getTickerCurrency(ticker);
            
            // Render long position if exists
            if (position.long > 0) {
                const costBasis = position.long_cost_basis;
                const value = position.long * currentPrice;
                const gainLoss = value - (position.long * costBasis);
                const gainLossPercent = costBasis > 0 ? gainLoss / (position.long * costBasis) : 0;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${ticker}</td>
                    <td>Long</td>
                    <td>${position.long}</td>
                    <td>${Utils.formatCurrency(costBasis, currency)}</td>
                    <td>${currentPrice > 0 ? Utils.formatCurrency(currentPrice, currency) : 'N/A'}</td>
                    <td>${currentPrice > 0 ? Utils.formatCurrency(value, currency) : 'N/A'}</td>
                    <td class="${gainLoss >= 0 ? 'positive' : 'negative'}">
                        ${currentPrice > 0 ? Utils.formatCurrency(gainLoss, currency) + ' (' + Utils.formatPercentage(gainLossPercent, 2, true) + ')' : 'N/A'}
                    </td>
                    <td>
                        <button class="btn-icon trade-btn" data-action="sell" data-ticker="${ticker}">
                            <i class="fas fa-minus-circle"></i>
                        </button>
                    </td>
                `;
                container.appendChild(row);
            }
            
            // Render short position if exists
            if (position.short > 0) {
                const costBasis = position.short_cost_basis;
                const value = position.short * currentPrice;
                const gainLoss = (position.short * costBasis) - value;
                const gainLossPercent = costBasis > 0 ? gainLoss / (position.short * costBasis) : 0;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${ticker}</td>
                    <td>Short</td>
                    <td>${position.short}</td>
                    <td>${Utils.formatCurrency(costBasis, currency)}</td>
                    <td>${currentPrice > 0 ? Utils.formatCurrency(currentPrice, currency) : 'N/A'}</td>
                    <td>${currentPrice > 0 ? Utils.formatCurrency(value, currency) : 'N/A'}</td>
                    <td class="${gainLoss >= 0 ? 'positive' : 'negative'}">
                        ${currentPrice > 0 ? Utils.formatCurrency(gainLoss, currency) + ' (' + Utils.formatPercentage(gainLossPercent, 2, true) + ')' : 'N/A'}
                    </td>
                    <td>
                        <button class="btn-icon trade-btn" data-action="cover" data-ticker="${ticker}">
                            <i class="fas fa-plus-circle"></i>
                        </button>
                    </td>
                `;
                container.appendChild(row);
            }
        }
        
        // Add trade button event listeners
        const tradeButtons = document.querySelectorAll('.trade-btn');
        tradeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const ticker = e.currentTarget.dataset.ticker;
                const action = e.currentTarget.dataset.action;
                this.showTradeDialog(ticker, action);
            });
        });
    },
    
    /**
     * Show trade dialog
     * @param {string} ticker - Ticker symbol
     * @param {string} action - Trade action (sell, cover)
     */
    showTradeDialog: function(ticker, action) {
        const portfolio = Utils.getPortfolio();
        const position = portfolio.positions[ticker];
        
        if (!position) return;
        
        let maxQuantity;
        if (action === 'sell') {
            maxQuantity = position.long;
        } else if (action === 'cover') {
            maxQuantity = position.short;
        } else {
            return;
        }
        
        if (maxQuantity <= 0) {
            Utils.showToast(`No shares to ${action}`, 'error');
            return;
        }
        
        // Show prompt for quantity
        const quantity = prompt(`Enter quantity to ${action} (1-${maxQuantity}):`, maxQuantity);
        if (!quantity) return;
        
        // Validate quantity
        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0 || parsedQuantity > maxQuantity) {
            Utils.showToast(`Invalid quantity. Please enter a number between 1 and ${maxQuantity}`, 'error');
            return;
        }
        
        // Execute trade
        this.executeTrade(ticker, action, parsedQuantity);
    },
    
    /**
     * Execute a trade
     * @param {string} ticker - Ticker symbol
     * @param {string} action - Trade action
     * @param {number} quantity - Trade quantity
     */
    executeTrade: function(ticker, action, quantity) {
        const portfolio = Utils.getPortfolio();
        const position = portfolio.positions[ticker];
        
        if (!position) return;
        
        // Get current price (simulate)
        const currentPrice = this.simulateCurrentPrice(ticker, position);
        
        // Execute trade based on action
        if (action === 'sell') {
            // Calculate trade value
            const tradeValue = quantity * currentPrice;
            
            // Calculate realized gain/loss
            const costBasis = position.long_cost_basis;
            const gainLoss = (currentPrice - costBasis) * quantity;
            
            // Update position
            position.long -= quantity;
            
            // Update cash
            portfolio.cash += tradeValue;
            
            // Update realized gains
            if (!portfolio.realized_gains[ticker]) {
                portfolio.realized_gains[ticker] = { long: 0, short: 0 };
            }
            portfolio.realized_gains[ticker].long += gainLoss;
            
            // Remove position if zero shares
            if (position.long === 0) {
                position.long_cost_basis = 0;
            }
            
            Utils.showToast(`Sold ${quantity} shares of ${ticker} for ${Utils.formatCurrency(tradeValue)}`, 'success');
        } else if (action === 'cover') {
            // Calculate trade value
            const tradeValue = quantity * currentPrice;
            
            // Calculate realized gain/loss
            const costBasis = position.short_cost_basis;
            const gainLoss = (costBasis - currentPrice) * quantity;
            
            // Calculate margin to release
            const marginPerShare = position.short_margin_used / position.short;
            const marginReleased = marginPerShare * quantity;
            
            // Update position
            position.short -= quantity;
            position.short_margin_used -= marginReleased;
            
            // Update cash
            portfolio.cash -= tradeValue;
            portfolio.cash += marginReleased;
            portfolio.margin_used -= marginReleased;
            
            // Update realized gains
            if (!portfolio.realized_gains[ticker]) {
                portfolio.realized_gains[ticker] = { long: 0, short: 0 };
            }
            portfolio.realized_gains[ticker].short += gainLoss;
            
            // Remove position if zero shares
            if (position.short === 0) {
                position.short_cost_basis = 0;
                position.short_margin_used = 0;
            }
            
            Utils.showToast(`Covered ${quantity} shares of ${ticker} for ${Utils.formatCurrency(tradeValue)}`, 'success');
        }
        
        // Save updated portfolio
        Utils.savePortfolio(portfolio);
        
        // Reload portfolio display
        this.loadPortfolio();
        
        // Update dashboard if on dashboard page
        const dashboardSection = document.getElementById('dashboard');
        if (dashboardSection && dashboardSection.classList.contains('active')) {
            Dashboard.loadPortfolioSummary();
        }
    },
    
    /**
     * Simulate a current price for trading
     * @param {string} ticker - Ticker symbol
     * @param {Object} position - Position data
     * @returns {number} Simulated current price
     */
    simulateCurrentPrice: function(ticker, position) {
        // In a real app, we would fetch the current price from the API
        // For simulation, we'll use the cost basis with a small random variation
        
        const costBasis = position.long > 0 ? position.long_cost_basis : position.short_cost_basis;
        const randomFactor = 0.98 + (Math.random() * 0.04); // Random between -2% and +2%
        
        return costBasis * randomFactor;
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners: function() {
        // This section would be for additional event listeners
        // such as manual trade entry, portfolio import/export, etc.
    }
};
