# StartupTasker - 创业助手

AI 驱动的创业团队智能任务管理工具

## 项目简介

StartupTasker 是一款专为创业团队设计的智能任务管理应用，集成 AI 能力，帮助团队更高效地管理任务、生成周报、获取资源推荐。

## 功能特性

### 核心功能

- **任务管理** - 创建、编辑、删除任务，支持看板视图和列表视图
- **AI 任务分解** - 将复杂任务自动拆解为可执行的子任务
- **AI 任务优先级** - 智能分析任务优先级，帮助团队聚焦重点
- **资源推荐** - 基于任务内容推荐相关创业资源
- **周报生成** - AI 自动生成周报，总结团队工作进展
- **计时器** - 番茄钟式专注计时，提升工作效率

### AI 功能

- 任务智能分解
- 任务优先级分析
- 资源详情解读
- 周报自动生成

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI**: React 18
- **AI**: 智谱 AI GLM-4
- **部署**: 支持 Vercel / Netlify / 腾讯云 Serverless

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── ai/            # AI 相关接口
│   │   │   ├── decompose/     # 任务分解
│   │   │   ├── prioritize/    # 优先级分析
│   │   │   ├── recommend/     # 资源推荐
│   │   │   ├── resource-detail/ # 资源详情
│   │   │   └── weekly-report/  # 周报生成
│   │   └── user/          # 用户相关接口
│   │       └── feedback/  # 用户反馈
│   ├── pricing/           # 定价页面
│   ├── resource/[id]/     # 资源详情页
│   ├── task/[id]/         # 任务详情页
│   └── weekly-report/     # 周报页面
├── components/            # React 组件
│   ├── Footer.tsx         # 页脚
│   ├── Kanban.tsx         # 看板组件
│   ├── Modal.tsx          # 模态框
│   ├── Navbar.tsx         # 导航栏
│   ├── ResourceRecommendations.tsx # 资源推荐
│   ├── TaskInput.tsx      # 任务输入
│   ├── TaskList.tsx       # 任务列表
│   ├── TaskSummary.tsx    # 任务摘要
│   ├── UpgradeModal.tsx   # 升级提示
│   └── WeeklyReport.tsx   # 周报组件
├── hooks/                 # React Hooks
│   └── useTasks.ts        # 任务管理 Hook
├── lib/                   # 工具库
│   ├── ai.ts              # AI 调用封装
│   ├── embedding.ts       # 向量嵌入
│   ├── interactions.ts    # 用户交互
│   └── usageLimit.ts      # 使用限制
├── types/                 # TypeScript 类型
│   └── index.ts
└── utils/                 # 工具函数
    └── helpers.ts
```

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env.local` 文件：

```env
AI_API_KEY=你的智谱AI密钥
AI_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
```

### 开发运行

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm run start
```

## 部署

### Vercel 部署

1. Fork 本仓库
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署

### Netlify 部署

1. Fork 本仓库
2. 在 Netlify 导入项目
3. 配置环境变量
4. 部署

项目已包含 `netlify.toml` 配置文件。

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `AI_API_KEY` | 智谱 AI API 密钥 | 是 |
| `AI_API_URL` | AI API 地址 | 否（有默认值） |

## 用户反馈

点击页面底部"我要反馈"按钮，邮箱地址将自动复制到剪贴板。

## 许可证

MIT License

## 联系方式

如有问题或建议，请发送邮件至：1163561479@qq.com
