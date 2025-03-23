# AI Hedge Fund 技术文档

## 1. 项目概述

AI Hedge Fund 是一个概念验证项目，旨在探索人工智能在交易决策中的应用。该系统采用多代理架构，模拟多位著名投资者的投资策略，通过分析市场数据、公司基本面和技术指标来做出交易决策。

**重要说明**：本项目仅用于教育和研究目的，不适用于实际交易或投资。

### 1.1 核心功能

- 多代理投资决策系统
- 基于历史数据的回测功能
- 支持美股和中国A股市场
- 可视化交易结果和投资组合表现
- 网页界面展示和交互

### 1.2 系统架构

AI Hedge Fund 采用前后端分离的架构：

- **后端**：Python 实现的多代理系统，基于 LangChain 和 LangGraph 框架
- **前端**：基于 HTML, CSS 和 JavaScript 的 Web 界面
- **API**：FastAPI 实现的 RESTful API，连接前后端

## 2. 技术栈

### 2.1 后端技术

- **Python 3.9+**：核心编程语言
- **LangChain (0.3.0)**：大型语言模型应用框架
- **LangGraph (0.2.56)**：构建多代理工作流
- **FastAPI**：Web API 框架
- **Pandas & NumPy**：数据处理和分析
- **Matplotlib**：数据可视化
- **Poetry**：依赖管理

### 2.2 前端技术

- **HTML5/CSS3**：页面结构和样式
- **JavaScript**：客户端交互逻辑
- **Tailwind CSS**：CSS 框架
- **Chart.js**：图表可视化
- **Flatpickr**：日期选择器

### 2.3 LLM 集成

系统支持多种大型语言模型提供商：
- OpenAI (GPT-4o, GPT-4o-mini 等)
- Groq (DeepSeek, Llama3 等)
- Anthropic
- DeepSeek

## 3. 系统架构详解

### 3.1 多代理系统

AI Hedge Fund 的核心是一个由多个专业代理组成的系统，每个代理模拟不同的投资策略：

1. **投资者代理**：
   - **Warren Buffett Agent**：价值投资策略，寻找优质企业
   - **Ben Graham Agent**：价值投资之父，寻找具有安全边际的隐藏宝石
   - **Bill Ackman Agent**：激进投资者，采取大胆立场并推动变革
   - **Cathie Wood Agent**：成长投资女王，相信创新和颠覆的力量
   - **Charlie Munger Agent**：沃伦·巴菲特的合作伙伴，以合理价格购买优质企业
   - **Phil Fisher Agent**：精通"窥探"分析的传奇成长型投资者
   - **Stanley Druckenmiller Agent**：宏观传奇，寻找具有增长潜力的不对称机会

2. **分析代理**：
   - **Valuation Agent**：计算股票内在价值并生成交易信号
   - **Sentiment Agent**：分析市场情绪并生成交易信号
   - **Fundamentals Agent**：分析基本面数据并生成交易信号
   - **Technicals Agent**：分析技术指标并生成交易信号

3. **管理代理**：
   - **Risk Manager**：计算风险指标并设置仓位限制
   - **Portfolio Manager**：做出最终交易决策并生成订单

### 3.2 工作流程

系统工作流程如下：

1. 用户输入股票代码和日期范围
2. 系统获取相关的市场和公司数据
3. 各个投资者代理分析数据并生成交易信号
4. 风险管理代理评估风险并设置仓位限制
5. 投资组合管理代理整合所有信号，做出最终决策
6. 系统返回交易决策和分析结果

### 3.3 LangGraph 工作流

系统使用 LangGraph 构建代理工作流：

```
start_node → [投资者代理1, 投资者代理2, ...] → risk_management_agent → portfolio_management_agent → END
```

每个代理接收状态对象，处理数据，并将更新后的状态传递给下一个代理。

## 4. 代码结构

### 4.1 目录结构

```
ai-hedge-fund/
├── src/
│   ├── agents/                   # 代理定义和工作流
│   │   ├── ben_graham.py         # Ben Graham 代理
│   │   ├── bill_ackman.py        # Bill Ackman 代理
│   │   ├── cathie_wood.py        # Cathie Wood 代理
│   │   ├── charlie_munger.py     # Charlie Munger 代理
│   │   ├── fundamentals.py       # 基本面分析代理
│   │   ├── phil_fisher.py        # Phil Fisher 代理
│   │   ├── portfolio_manager.py  # 投资组合管理代理
│   │   ├── risk_manager.py       # 风险管理代理
│   │   ├── sentiment.py          # 情绪分析代理
│   │   ├── stanley_druckenmiller.py # Stanley Druckenmiller 代理
│   │   ├── technicals.py         # 技术分析代理
│   │   ├── valuation.py          # 估值分析代理
│   │   ├── warren_buffett.py     # Warren Buffett 代理
│   ├── data/                     # 数据处理相关代码
│   ├── graph/                    # LangGraph 工作流定义
│   ├── llm/                      # LLM 模型集成
│   ├── tools/                    # 代理工具
│   │   ├── api.py                # API 工具
│   │   ├── akshare_api.py        # A股数据 API 工具
│   ├── utils/                    # 工具函数
│   ├── backtester.py             # 回测工具
│   ├── main.py                   # 主入口点
├── frontend/                     # 前端代码
│   ├── css/                      # CSS 样式
│   ├── js/                       # JavaScript 代码
│   │   ├── analysis.js           # 分析功能
│   │   ├── api.js                # API 交互
│   │   ├── app.js                # 应用主逻辑
│   │   ├── backtest.js           # 回测功能
│   │   ├── charts.js             # 图表功能
│   │   ├── config.js             # 配置文件
│   │   ├── dashboard.js          # 仪表盘功能
│   │   ├── portfolio.js          # 投资组合功能
│   │   ├── settings.js           # 设置功能
│   │   ├── utils.js              # 工具函数
│   ├── index.html                # 主页面
├── main.py                       # API 服务入口
├── pyproject.toml                # Poetry 配置
├── poetry.lock                   # Poetry 依赖锁定
├── .env.example                  # 环境变量示例
├── README.md                     # 项目说明
```

### 4.2 核心模块详解

#### 4.2.1 代理模块

每个投资者代理都实现了特定的投资策略：

- **Warren Buffett Agent**：
  - 分析公司基本面（ROE, 负债率, 营业利润率）
  - 评估竞争优势（护城河）
  - 计算内在价值
  - 应用安全边际原则

- **Risk Manager**：
  - 评估每只股票的风险
  - 设置最大仓位限制
  - 考虑投资组合多样化

- **Portfolio Manager**：
  - 整合所有代理的交易信号
  - 考虑当前投资组合状态
  - 生成最终交易决策

#### 4.2.2 工具模块

- **api.py**：
  - 获取股票价格数据
  - 获取财务指标
  - 获取公司新闻
  - 获取内部交易数据

- **akshare_api.py**：
  - 处理中国 A 股市场数据

#### 4.2.3 回测模块

- **backtester.py**：
  - 模拟历史交易
  - 计算投资组合表现
  - 生成回测报告

### 4.3 API 服务

系统提供 RESTful API 接口：

- **/api/ticker/{ticker}**：获取股票信息
- **/api/validate-tickers**：验证股票代码
- **/api/analysts**：获取可用分析师
- **/api/models**：获取可用模型
- **/api/stock/{ticker}**：获取综合股票数据
- **/api/prices/{ticker}**：获取历史价格数据
- **/api/financials/{ticker}**：获取财务指标
- **/api/news/{ticker}**：获取公司新闻
- **/api/insider/{ticker}**：获取内部交易活动
- **/api/analyze**：启动股票分析任务
- **/api/backtest**：启动回测任务
- **/api/task/{task_id}**：获取任务状态

## 5. 前端架构

### 5.1 页面结构

前端界面包含以下主要部分：

1. **仪表盘**：
   - 投资组合概览
   - 市场概览
   - 观察列表
   - 最近分析

2. **AI 分析**：
   - 运行分析表单
   - 分析结果展示

3. **回测**：
   - 回测设置表单
   - 回测结果展示

4. **投资组合**：
   - 投资组合概览
   - 持仓明细

5. **设置**：
   - API 配置
   - 界面设置

### 5.2 前端模块

- **app.js**：应用主逻辑，处理导航和页面切换
- **api.js**：处理与后端 API 的通信
- **dashboard.js**：仪表盘页面功能
- **analysis.js**：AI 分析页面功能
- **backtest.js**：回测页面功能
- **portfolio.js**：投资组合页面功能
- **charts.js**：图表生成和更新
- **utils.js**：通用工具函数

## 6. 数据流

### 6.1 分析流程

1. 用户在前端输入股票代码和参数
2. 前端通过 API 发送请求到后端
3. 后端创建异步任务并返回任务 ID
4. 前端定期轮询任务状态
5. 后端执行多代理分析流程
6. 分析完成后，前端获取结果并展示

### 6.2 回测流程

1. 用户在前端设置回测参数
2. 前端通过 API 发送请求到后端
3. 后端创建异步回测任务并返回任务 ID
4. 前端定期轮询任务状态
5. 后端执行回测过程
6. 回测完成后，前端获取结果并展示性能指标和图表

## 7. 部署指南

### 7.1 环境要求

- Python 3.9 或更高版本
- Node.js 14 或更高版本（用于开发）
- 现代浏览器（Chrome, Firefox, Safari, Edge）

### 7.2 安装步骤

1. 克隆代码库：
   ```bash
   git clone https://github.com/virattt/ai-hedge-fund.git
   cd ai-hedge-fund
   ```

2. 安装 Poetry（如果尚未安装）：
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. 安装依赖：
   ```bash
   poetry install
   ```

4. 设置环境变量：
   ```bash
   cp .env.example .env
   ```
   然后编辑 .env 文件，添加必要的 API 密钥。

### 7.3 运行应用

1. 启动后端 API 服务：
   ```bash
   poetry run python main.py
   ```

2. 在浏览器中打开前端页面：
   ```
   frontend/index.html
   ```

## 8. 开发指南

### 8.1 添加新代理

要添加新的投资者代理：

1. 在 `src/agents/` 目录下创建新的代理文件
2. 实现代理函数，接收和返回 AgentState 对象
3. 在 `src/utils/analysts.py` 中注册新代理
4. 更新工作流以包含新代理

### 8.2 扩展数据源

要添加新的数据源：

1. 在 `src/tools/` 目录下创建新的 API 工具
2. 实现数据获取和处理函数
3. 在相关代理中使用新的数据源

### 8.3 自定义前端

要自定义前端界面：

1. 修改 `frontend/index.html` 添加新的 UI 元素
2. 在 `frontend/js/` 目录下添加或修改 JavaScript 文件
3. 更新 `frontend/css/` 目录下的样式

## 9. 性能优化

### 9.1 后端优化

- 使用异步任务处理长时间运行的分析和回测
- 实现数据缓存以减少 API 调用
- 优化 LLM 提示以减少令牌使用

### 9.2 前端优化

- 实现延迟加载和分页
- 优化图表渲染
- 减少不必要的 API 请求

## 10. 安全考虑

- 不要在代码中硬编码 API 密钥
- 实现适当的错误处理和输入验证
- 考虑添加用户认证和授权
- 定期更新依赖以修复安全漏洞

## 11. 未来扩展

- 添加更多投资策略和代理
- 实现实时市场数据集成
- 添加更复杂的风险管理模型
- 支持更多资产类别（期权、期货、加密货币等）
- 实现投资组合优化算法

## 12. 故障排除

### 12.1 常见问题

- **API 密钥错误**：确保在 .env 文件中设置了正确的 API 密钥
- **数据获取失败**：检查网络连接和 API 限制
- **LLM 响应错误**：检查提示设计和模型参数

### 12.2 日志和调试

- 使用 `--show-reasoning` 标志查看代理推理过程
- 检查控制台输出和日志文件
- 使用浏览器开发工具调试前端问题

## 13. 参考资源

- [LangChain 文档](https://python.langchain.com/docs/get_started/introduction)
- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Chart.js 文档](https://www.chartjs.org/docs/latest/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
