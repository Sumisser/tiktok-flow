# TikFlow Agent Guide

本文档旨在帮助 AI 助手快速理解 TikFlow 项目的架构、核心逻辑与开发规范，以便高效进行代码维护与功能扩展。

## 🪐 项目愿景

TikFlow 是一个以“AI 创作流”为核心的生产力工具。它不仅是 API 的简单集成，更是将剧本、视觉、语音通过一套流水线式的 UI（Timeline-based）串联起来。

## 🏗️ 核心架构

### 1. 状态管理 (The Brain)

- **位置**: `src/store/index.tsx` (TaskProvider)
- **逻辑**: 使用 React Context 管理全局 `tasks` 数组。
- **持久化**: 采用“双写策略”。数据同时保存在内存状态（React State）和本地数据库（IndexedDB）。
- **同步**: 初始化时从 `idb` 加载，任何修改都会触发 `db.ts` 的异步保存。

### 2. 多媒体存储

- **本地**: 初始生成的 Base64 或本地 Blob。
- **云端**: 最终资源（生成后的图片、视频、音频）统一上传至 **Supabase Storage**，数据库仅存储公网 URL。相关逻辑在 `src/lib/storage.ts`。

### 3. AI 服务层

- **LLM (`src/lib/ai.ts`)**:
  - `openai`: 通用 LLM 客户端，用于辅助任务。
  - `domesticOpenai`: **核心客户端**。专用国产 AI 接口（灵芽代理），用于生成剧本与分镜。使用独立的 `VITE_DOMESTIC_AI_API_KEY`。
  - 支持模型：`deepseek-v3.2`, `qwen-flash`, `doubao-seed-1.8` 等。
- **Video (`src/lib/video.ts`)**:
  - 采用“创建任务 -> 轮询状态”模式。
  - **重要逻辑**: 视频生成耗时较长，`StoryboardEditor` 在挂载时会检查是否有未完成的 `taskId` 并恢复轮询，确保刷新页面不丢失进度。
- **TTS (`src/lib/tts.ts`)**: 对接 MiniMax V2 接口，目前使用 `speech-2.6-hd` 模型。

## 🧩 核心组件说明

### StoryboardEditor (`src/components/StoryboardEditor.tsx`)

这是项目中最复杂的组件，其职责包括：

- 渲染分镜列表与详情。
- 触发单项图片/视频生成。
- 视频生成进度的持久化与恢复。
- 脚本复制逻辑（包含正则表达式过滤标点为换行的功能）。

### WorkflowStep (`src/components/WorkflowStep.tsx`)

- 负责第一阶段的创意录入。
- 处理不同模型（Gemini/DeepSeek/Grok）的切换。
- 调用解析器（`lib/storyboard.ts`）将 AI 返回的 Markdown 表格转化为结构化数据。

## 🛠️ 开发规范

### 1. 样式规范

- 必须使用 **TailwindCSS 4**。
- 遵循“深色系/毛玻璃”风格。常用类：`glass-card`, `text-gradient`, `backdrop-blur-*`。
- 动画主要参考 `framer-motion` 思路或使用原生的 `animate-*` 类。

### 2. 异步处理

- 所有外部请求必须包裹在 `try...catch` 中。
- 必须使用 `sonner` (toast) 提供用户反馈（。
- 耗时任务（如视频生成）必须支持状态持久化，防止刷新丢失。

### 3. 类型安全

- 新增功能前先在 `src/types/index.ts` 定义接口。
- 避免使用 `any`。

## 💡 常见逻辑修改点

- **修改分镜解析**: 查看 `src/lib/storyboard.ts` 的正则解析逻辑。
- **调整 TTS 参数**: 在 `src/lib/tts.ts` 的 `generateMinimaxTts` 函数中调整 `speed` 或 `model`。
- **优化复制格式**: 修改 `StoryboardEditor.tsx` 中的 `handleCopy` 函数正则。

## 🚀 AI 助手 Checklist

- [ ] 修改 `store` 逻辑后，确保调用了相应的 `db` 保存函数。
- [ ] 增加新环境变量时，同步更新 `.env.example`（如果存在）和 `README.md`。
- [ ] 如果修改了 `StoryboardEditor` 庞大的 JSX，请务必保证其结构完整性。
