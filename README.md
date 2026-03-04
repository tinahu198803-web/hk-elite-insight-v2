# 港股智通 (HK-Elite Insight)

专业港股IPO专家Agent，为内地企业家提供港股上市一站式服务。

## 功能特性

- 🤖 **AI智能分析** - 基于GPT-4的港股通体检和招股书分析
- 📊 **港股通体检** - 输入公司信息，AI评估入通可行性
- 📄 **招股书分析** - AI解读招股书核心要点
- 💳 **会员服务** - 订阅制会员，尊享全部特权

## 在线访问

**生产环境**: https://hk-ipo-tech.vercel.app

## 技术栈

- **前端**: Next.js 14 + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **AI**: Azure OpenAI (GPT-4)
- **部署**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/tinahu198803-web/hk-ipo-tech.git
cd hk-ipo-tech
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```env
# Azure OpenAI 配置（必填）
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15

# Supabase 配置（可选）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 构建生产版本

```bash
npm run build
npm start
```

## 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署完成

## 项目结构

```
hk-ipo-tech/
├── app/
│   ├── api/
│   │   └── health-check/
│   │       └── route.ts       # 港股通体检API
│   ├── lib/
│   │   └── health-check.ts    # AI提示词配置
│   ├── health-check/
│   │   └── page.tsx          # 港股通体检页面
│   ├── ipo-analysis/
│   │   └── page.tsx          # 招股书分析页面
│   ├── profile/
│   │   └── page.tsx          # 个人中心页面
│   ├── membership/
│   │   └── page.tsx          # 会员中心页面
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 首页
│   └── globals.css           # 全局样式
├── public/                   # 静态资源
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

## 功能说明

### 港股通体检

用户输入公司基本信息、财务数据、股权架构等信息，AI会自动分析并生成：

- 综合评分（0-100分）
- 分项评估（财务指标、股权架构、合规要求、市值达标）
- 改进建议

### 招股书分析

展示近期IPO公司列表，用户可以选择查看AI生成的招股书核心要点分析。

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| AZURE_OPENAI_API_KEY | 是 | Azure OpenAI API密钥 |
| AZURE_OPENAI_ENDPOINT | 是 | Azure OpenAI 端点URL |
| AZURE_OPENAI_DEPLOYMENT_NAME | 是 | 部署的模型名称 |
| AZURE_OPENAI_API_VERSION | 是 | API版本 |

## 许可证

MIT License
