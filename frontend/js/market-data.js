/**
 * 市场数据管理模块
 * 负责获取和显示市场指数和热门股票数据
 */

const MarketData = {
    /**
     * 初始化市场数据
     */
    init: function() {
        console.log('初始化市场数据...');
        this.loadMarketIndices();
        this.loadPopularStocks();
    },

    /**
     * 加载市场指数数据
     * @param {string} market - 市场类型 ('us' 或 'china')
     */
    loadMarketIndices: function(market = 'us') {
        console.log(`加载${market === 'us' ? '美国' : '中国'}市场指数...`);
        
        // 定义市场指数
        const indices = {
            us: [
                { id: 'index-sp500', symbol: '^GSPC', name: 'S&P 500' },
                { id: 'index-nasdaq', symbol: '^IXIC', name: '纳斯达克' },
                { id: 'index-dji', symbol: '^DJI', name: '道琼斯' }
            ],
            china: [
                { id: 'index-sse', symbol: '000001.SH', name: '上证指数' },
                { id: 'index-szse', symbol: '399001.SZ', name: '深证成指' },
                { id: 'index-csi300', symbol: '399006.SZ', name: '创业板指' }
            ]
        };
        
        // 获取当前日期和7天前的日期
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 为所选市场的每个指数获取并显示数据
        indices[market].forEach(index => {
            this.fetchAndDisplayIndex(index.id, index.symbol, index.name, startDate, endDate);
        });
        
        // 隐藏非当前市场的指数
        const otherMarket = market === 'us' ? 'china' : 'us';
        indices[otherMarket].forEach(index => {
            const element = document.getElementById(index.id);
            if (element) {
                element.style.display = 'none';
                element.classList.add('hidden');
            }
        });
    },
    
    /**
     * 获取并显示指数数据
     * @param {string} elementId - DOM元素ID
     * @param {string} symbol - 指数代码
     * @param {string} name - 指数名称
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     */
    fetchAndDisplayIndex: function(elementId, symbol, name, startDate, endDate) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // 显示加载状态
        element.style.display = '';
        element.classList.remove('hidden');
        element.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-medium">${name}</h3>
                    <div class="animate-pulse bg-gray-200 dark:bg-secondary-700 h-7 w-32 rounded my-1"></div>
                </div>
                <div class="animate-pulse bg-gray-200 dark:bg-secondary-700 h-12 w-24 rounded"></div>
            </div>
        `;
        
        console.log(`正在获取指数数据: ${symbol}，从 ${startDate} 到 ${endDate}，API基础URL: ${API.getBaseUrl()}`);
        
        // 获取指数数据
        API.getPrices(symbol, startDate, endDate)
            .then(data => {
                console.log(`成功获取指数数据: ${symbol}`, data);
                if (!data || data.length === 0) {
                    throw new Error('没有可用数据');
                }
                
                try {
                    // 计算价格变化
                    const latestPrice = parseFloat(data[data.length - 1].close);
                    const previousPrice = data.length > 1 ? parseFloat(data[data.length - 2].close) : parseFloat(data[0].open);
                    
                    // 验证数据有效性
                    if (isNaN(latestPrice) || isNaN(previousPrice)) {
                        throw new Error('价格数据无效');
                    }
                    
                    const change = latestPrice - previousPrice;
                    const changePercent = (change / previousPrice) * 100;
                    
                    // 更新DOM
                    element.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <h3 class="text-lg font-medium">${name}</h3>
                                <div class="text-2xl font-bold">${Utils.formatNumber(latestPrice, 2)}</div>
                            </div>
                            <div class="text-right">
                                <div class="${change >= 0 ? 'text-green-500' : 'text-red-500'} text-xl font-semibold">
                                    ${change >= 0 ? '+' : ''}${Utils.formatNumber(change, 2)}
                                </div>
                                <div class="${change >= 0 ? 'text-green-500' : 'text-red-500'}">
                                    (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)
                                </div>
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error(`处理${name}数据时出错:`, error);
                    throw error;
                }
            })
            .catch(error => {
                console.error(`加载${name}数据失败:`, error);
                element.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 class="text-lg font-medium">${name}</h3>
                            <div class="text-sm text-gray-500 dark:text-secondary-400">数据加载失败</div>
                        </div>
                        <div class="text-right">
                            <div class="text-gray-500 dark:text-secondary-400">--</div>
                        </div>
                    </div>
                `;
                
                // 显示更详细的错误信息
                Utils.showToast(`加载${name}数据失败: ${error.message}`, 'error');
            });
    },
    
    /**
     * 加载热门股票数据
     */
    loadPopularStocks: function() {
        console.log('加载热门股票...');
        
        // 常见热门股票
        const popularStocks = [
            { symbol: 'AAPL', name: '苹果' },
            { symbol: 'MSFT', name: '微软' },
            { symbol: 'GOOGL', name: '谷歌' },
            { symbol: 'AMZN', name: '亚马逊' },
            { symbol: 'TSLA', name: '特斯拉' }
        ];
        
        const popularStocksContainer = document.getElementById('popularStocks');
        if (!popularStocksContainer) return;
        
        // 清空容器
        popularStocksContainer.innerHTML = '';
        
        // 获取当前日期和前一天的日期
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // 为每个热门股票获取数据
        popularStocks.forEach(stock => {
            // 创建加载占位符
            const stockElement = document.createElement('div');
            stockElement.classList.add('popular-stock', 'bg-white', 'dark:bg-secondary-800', 'rounded-xl', 'p-4', 'shadow-sm');
            stockElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <div class="text-sm text-gray-600 dark:text-secondary-400">${stock.symbol}</div>
                        <div class="text-md font-medium">${stock.name}</div>
                    </div>
                    <div class="animate-pulse bg-gray-200 dark:bg-secondary-700 h-10 w-20 rounded"></div>
                </div>
            `;
            popularStocksContainer.appendChild(stockElement);
            
            // 获取股票数据
            API.getPrices(stock.symbol, startDate, endDate)
                .then(data => {
                    if (!data || data.length === 0) {
                        throw new Error('没有可用数据');
                    }
                    
                    try {
                        // 计算价格变化
                        const latestPrice = parseFloat(data[data.length - 1].close);
                        const previousPrice = data.length > 1 ? parseFloat(data[data.length - 2].close) : parseFloat(data[0].open);
                        
                        // 验证数据有效性
                        if (isNaN(latestPrice) || isNaN(previousPrice)) {
                            throw new Error('价格数据无效');
                        }
                        
                        const change = latestPrice - previousPrice;
                        const changePercent = (change / previousPrice) * 100;
                        
                        // 更新DOM
                        stockElement.innerHTML = `
                            <div class="flex justify-between items-center">
                                <div>
                                    <div class="text-sm text-gray-600 dark:text-secondary-400">${stock.symbol}</div>
                                    <div class="text-md font-medium">${stock.name}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-bold">${Utils.formatCurrency(latestPrice)}</div>
                                    <div class="${change >= 0 ? 'text-green-500' : 'text-red-500'} text-sm">
                                        ${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // 添加点击事件
                        stockElement.style.cursor = 'pointer';
                        stockElement.addEventListener('click', () => {
                            if (typeof showTickerDetails === 'function') {
                                showTickerDetails(stock.symbol);
                            }
                        });
                    } catch (error) {
                        console.error(`处理${stock.name}数据时出错:`, error);
                        throw error;
                    }
                })
                .catch(error => {
                    console.error(`加载${stock.name}数据失败:`, error);
                    stockElement.innerHTML = `
                        <div class="flex justify-between items-center">
                            <div>
                                <div class="text-sm text-gray-600 dark:text-secondary-400">${stock.symbol}</div>
                                <div class="text-md font-medium">${stock.name}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-gray-500 dark:text-secondary-400">--</div>
                            </div>
                        </div>
                    `;
                    
                    // 仍然添加点击事件，即使加载失败
                    stockElement.style.cursor = 'pointer';
                    stockElement.addEventListener('click', () => {
                        if (typeof showTickerDetails === 'function') {
                            showTickerDetails(stock.symbol);
                        }
                    });
                });
        });
    },
    
    /**
     * 切换市场 (美国/中国)
     * @param {string} market - 市场类型 ('us' 或 'china')
     */
    switchMarket: function(market) {
        console.log(`切换到${market === 'us' ? '美国' : '中国'}市场`);
        this.loadMarketIndices(market);
        
        // TODO: 根据市场切换热门股票显示
    }
};

// 当页面加载完成时初始化市场数据
document.addEventListener('DOMContentLoaded', function() {
    MarketData.init();
    
    // 为市场选项卡添加事件监听器
    const marketTabs = document.querySelectorAll('.market-tab');
    marketTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const market = this.dataset.market;
            
            // 更新UI
            marketTabs.forEach(t => {
                t.classList.remove('active');
                t.classList.remove('bg-primary-100');
                t.classList.remove('text-primary-700');
                t.classList.add('border-gray-200');
                t.classList.add('text-gray-700');
            });
            
            this.classList.add('active');
            this.classList.add('bg-primary-100');
            this.classList.add('text-primary-700');
            this.classList.remove('border-gray-200');
            this.classList.remove('text-gray-700');
            
            // 切换市场数据
            MarketData.switchMarket(market);
        });
    });
});
