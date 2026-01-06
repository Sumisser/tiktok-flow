# 🎬 TikTok Flow - AI 视频工作流

TikTok Flow 是一个专为 AI 短视频创作设计的现代化工作流管理平台。它旨在通过体系化的步骤和优雅的交互，帮助创作者更高效地管理从剧本构思、分镜设计到最终生成的全过程。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)

## ✨ 特性

- **🏗️ 体系化工作流**：内置科学的视频创作步骤，涵盖剧本、分镜、生成等核心环节。
- **🌑 极致美学 UI**：基于 TailwindCSS 4 构建的深色系专业界面，采用毛玻璃效果（Glassmorphism）与动感渐变设计。
- **💾 本地优先**：使用 IndexedDB 进行持久化存储，无需注册登录，数据完全保留在用户浏览器中。
- **⚡ 极致性能**：利用 Vite (Rolldown) 与 React 19 的最新特性，确保毫秒级的响应速度。
- **📱 响应式设计**：完美适配桌面端，提供沉浸式的创作体验。

## 🛠️ 技术栈

- **框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 7 (Rolldown)](https://vite.dev/)
- **样式**: [TailwindCSS 4](https://tailwindcss.com/)
- **路由**: [React Router 7](https://reactrouter.com/)
- **数据库**: [idb](https://www.npmjs.com/package/idb) (IndexedDB Wrapper)
- **代码整洁**: [TypeScript](https://www.typescriptlang.org/), [Oxlint](https://oxc.rs/docs/guide/usage/linter.html), [ESLint](https://eslint.org/)

## 🚀 快速开始

### 环境依赖

- [Node.js](https://nodejs.org/) (建议 v20+)
- [pnpm](https://pnpm.io/) (建议 v9+)

### 安装与启动

1. **克隆仓库**

   ```bash
   git clone https://github.com/Sumisser/tiktok-flow.git
   cd tiktok-flow
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **启动开发服务器**

   ```bash
   pnpm dev
   ```

4. **构建生产版本**
   ```bash
   pnpm build
   ```

## 📂 项目结构

```text
src/
├── components/   # 可复用组件 (Timeline, TaskCard, WorkflowStep 等)
├── pages/        # 页面 (Home, Workflow)
├── store/        # 数据流与 IndexedDB 逻辑
├── types/        # TypeScript 类型定义
├── assets/       # 静态资源
└── App.tsx       # 路由配置
```

## 📝 路线图

- [x] 项目基础架构搭建
- [x] IndexedDB 本地持久化
- [x] 剧本与分镜工作流逻辑
- [ ] AI 模型 API 接入
- [ ] 视频预览与导出功能
- [ ] 更多工作流模板支持

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议。
