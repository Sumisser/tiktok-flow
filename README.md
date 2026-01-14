# 🎬 TikFlow - 智能 AI 视频创意工作流

TikFlow 是一个专为 AI 短视频创作者设计的现代化工作流平台。它集成了最前沿的 AI 能力，帮助创作者完成从**剧本构思**、**视觉分镜设计**、**语音合成**到**多媒体生成**的全链路闭环。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css)
![Bun](https://img.shields.io/badge/Bun-1.1-f9f1e1?logo=bun)

---

## ✨ 核心特性

- **🧠 多模型创意驱动**：支持 Gemini 2.0, Grok-4, DeepSeek V3 等主流模型，一键将碎片化灵感转化为专业分镜剧本。
- **🎨 视觉风格定制**：内置多种视觉预设（诗意油画、电影质感、新海诚风等），通过 AI 自动生成高质量分镜图片。
- **🎬 视频生成引擎**：集成高性能 AI 视频模型，支持分镜级别的视频合成与任务进度实时追踪。
- **🎙️ 专业级 TTS**：采用 MiniMax **Speech-2.6-HD** 模型，生成具有极致韵律感的高质量配音。
- **📝 提词器友好**：一键导出/复制脚本，支持将标点自动转换为换行，完美适配第三方提词器与 TTS 工具。
- **☁️ 混合存储架构**：使用 IndexedDB 进行本地高性能任务缓存，结合 Supabase Storage 实现跨端媒体资源持久化。
- **📦 一键打包导出**：支持将全部分镜图片、视频及音频素材一键打包为 ZIP 导出。

## 🛠️ 技术栈

- **前端框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 7 (Rolldown)](https://vite.dev/)
- **包管理器/运行环境**: [Bun](https://bun.sh/)
- **样式方案**: [TailwindCSS 4](https://tailwindcss.com/) (极简深色系/毛玻璃美学)
- **云端服务**: [Supabase](https://supabase.com/) (存储 & 鉴权)
- **本地数据库**: [idb](https://www.npmjs.com/package/idb) (IndexedDB 管理)
- **图标库**: [Lucide React](https://lucide.dev/)

## 🚀 快速开始

### 环境准备

- 推荐使用 [Bun](https://bun.sh/) (安装简单，速度极快)
- Node.js v20+

### 安装与运行

1. **克隆项目**

   ```bash
   git clone https://github.com/Sumisser/tiktok-flow.git
   cd tiktok-flow
   ```

2. **环境变量配置**
   创建 `.env.local` 文件，填入相关的 API 密钥：

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_key
   VITE_AI_API_KEY=your_llm_api_key
   VITE_MINIMAX_KEY=your_minimax_key
   VITE_MINIMAX_GROUP_ID=your_group_id
   ```

3. **依赖安装**

   ```bash
   bun install
   ```

4. **启动开发环境**
   ```bash
   bun start
   ```

## 📂 项目结构

```text
src/
├── components/     # UI 组件 (StoryboardEditor 核心编辑器, TtsDrawer 等)
├── lib/            # 服务逻辑 (ai.ts 调用, storage.ts 存储, tts.ts 语音)
├── store/          # 状态中心 (TaskProvider 数据持久化与分发)
├── pages/          # 路由页面 (Home 任务列表, Workflow 详情)
├── types/          # TS 类型申明
└── assets/         # 样式与静态资源
```

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议。
