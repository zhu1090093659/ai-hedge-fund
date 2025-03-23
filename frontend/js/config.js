/**
 * AI Hedge Fund Dashboard Configuration
 */
const CONFIG = {
    // Environment configuration (production or development)
    ENV: 'production',
    
    // API configuration
    API: {
        BASE_URL: 'http://127.0.0.1:8092',  // Default API endpoint (can be overridden in settings)
        ENDPOINTS: {
            TICKER_INFO: '/api/ticker-info',
            VALIDATE_TICKERS: '/api/validate-tickers',
            ANALYSTS: '/api/analysts',
            MODELS: '/api/models',
            STOCK_DATA: '/api/stock',
            PRICES: '/api/prices',
            FINANCIALS: '/api/financials',
            NEWS: '/api/news',
            INSIDER_TRADES: '/api/insider-trades',
            ANALYZE: '/api/analyze',
            BACKTEST: '/api/backtest',
            TASK: '/api/task',
            PORTFOLIO: '/api/portfolio'
        },
        // Default request timeout in milliseconds
        TIMEOUT: 30000,
        // Maximum number of retries for failed requests
        MAX_RETRIES: 3,
        // Whether to show detailed error messages
        VERBOSE_ERRORS: false
    },

    // Default markets
    MARKETS: {
        US: {
            name: 'US Market',
            currency: 'USD',
            indices: ['S&P 500', 'NASDAQ', 'Russell 2000']
        },
        ASHARE: {
            name: 'China A-Shares',
            currency: 'CNY',
            indices: ['SSE Composite', 'SZSE Component', 'CSI 300']
        }
    },

    // Chart colors
    CHART_COLORS: {
        DEFAULT: {
            primary: '#3b82f6',
            secondary: '#10b981',
            tertiary: '#ef4444',
            quaternary: '#f59e0b',
            positive: '#10b981',
            negative: '#ef4444',
            neutral: '#64748b'
        },
        MONOCHROME: {
            primary: '#2563eb',
            secondary: '#4b5563',
            tertiary: '#64748b',
            quaternary: '#94a3b8',
            positive: '#065f46',
            negative: '#b91c1c',
            neutral: '#4b5563'
        },
        COLORBLIND: {
            primary: '#0284c7',
            secondary: '#ca8a04',
            tertiary: '#a855f7',
            quaternary: '#f97316',
            positive: '#0284c7',
            negative: '#f97316',
            neutral: '#64748b'
        },
        VIBRANT: {
            primary: '#8b5cf6',
            secondary: '#ec4899',
            tertiary: '#06b6d4',
            quaternary: '#f97316',
            positive: '#10b981',
            negative: '#ef4444',
            neutral: '#64748b'
        }
    },

    // Default settings
    DEFAULTS: {
        THEME: 'system',
        DATE_FORMAT: 'YYYY-MM-DD',
        CHART_COLOR_SCHEME: 'DEFAULT',
        MARKET: 'all',
        MODEL_NAME: 'gpt-4o',
        MODEL_PROVIDER: 'OpenAI',
        ANALYSTS: [
            'warren_buffett',
            'bill_ackman',
            'cathie_wood',
            'fundamentals_analyst',
            'technical_analyst'
        ],
        INITIAL_CAPITAL: 100000,
        MARGIN_REQUIREMENT: 0.0
    },

    // Local storage keys
    STORAGE: {
        SETTINGS: 'ai-hedge-fund-settings',
        PORTFOLIO: 'ai-hedge-fund-portfolio',
        WATCHLIST: 'ai-hedge-fund-watchlist',
        RECENT_ANALYSES: 'ai-hedge-fund-recent-analyses',
        THEME: 'ai-hedge-fund-theme',
        API_ENDPOINT: 'ai-hedge-fund-api-endpoint',
        API_KEY: 'ai-hedge-fund-api-key'
    }
};