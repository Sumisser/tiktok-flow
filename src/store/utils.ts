import type { Task, WorkflowStep } from '../types';

// 默认工作流步骤模板
export const createDefaultSteps = (): WorkflowStep[] => [
  {
    id: 'step-1',
    type: 'storyboard',
    title: '创意分镜生成',
    basePrompt: `你是一个全能的短视频创作专家，集成了金牌编剧、分镜大师、AI绘画专家和视频生成专家的能力。
你的任务是将用户的简单想法转化为一份完整的、可直接用于生产的短视频分镜脚本。

**用户想法/主题：**
[USER_INPUT]

**画面风格要求：**
[STYLE_INSTRUCTION]

**创作流程（严格按顺序执行）：**

**第一步：撰写完整口播文案 (Full Script)**
请先忽略分镜，专注于创作一份高质量的、完整的口播文案。
- **时长**：30-60 秒（约 150-300 字）。
- **扩展**：如果用户输入简单，必须进行大幅度的创意脑补和细节填充，确保内容丰富深刻。
- **风格**：口语化、自然、有感染力。拒绝僵硬的 AI 味。
- **结构参考**（可选）：
    *   **故事叙事**：悬念开场 -> 冲突铺垫 -> 危机/高潮 -> 反转/结局 -> 价值升华。
    *   **知识干货**：痛点直击 -> 核心观点 -> 关键步骤/证据 -> 行动号召。
    *   **情感共鸣**：场景带人 -> 情绪渲染 -> 核心金句 -> 普遍共鸣 -> 开放结尾。

**第二步：分镜拆解与视觉设计 (Storyboard & Design)**
基于第一步创作的完整文案，将其拆解为 **6-10 个** 视觉连贯的镜头。
- **完整性（关键）**：表格中所有 '脚本文案' 单元格的内容按顺序拼接后，**必须与第一步生成的完整文案完全一致**。严禁删减、概括或仅截取片段。
- **文案分配**：将完整文案合理分配到每个镜头中，确保画面与文字节奏同步。
- **画面提示词 (Image Prompt)**：
    - 英文。
    - 结构：Subject + Action/Context + Environment + Lighting + Camera Angle + Style.
    - **风格融合**：请将上述【画面风格要求】自然地融入到每个镜头的 Image Prompt 中，作为风格描述词的一部分。不要简单拼接，而是要根据镜头内容进行有机的语言融合。
- **视频提示词 (Video Prompt)**：
    - 英文。
    - 专注描述动态 (Motion) 和运镜 (Camera Movement)。

**输出格式要求：**

请输出一个 Markdown 代码块，严格包含以下两部分内容：

### 1. 完整口播文案
(在此处输出生成的 300-500 字完整文案)

### 2. 分镜表
\`\`\`markdown
| 镜号 | 脚本文案 | 画面生成提示词 (Image Prompt) | 视频生成提示词 (Video Prompt) |
|------|----------|-------------------------------|------------------------------|
| 1 | (文案片段) | A close up of... [Style Description Blended] | Slow zoom in... |
...
\`\`\`
    `,
    input: '',
    output: '',
    status: 'pending',
  },
];

// 获取默认提示词的映射
export const getDefaultPrompts = (): Record<string, string> => {
  const steps = createDefaultSteps();
  return steps.reduce(
    (acc, step) => {
      acc[step.id] = step.basePrompt;
      return acc;
    },
    {} as Record<string, string>,
  );
};

// 从存储恢复任务时，补充 basePrompt
export const hydrateTasksWithPrompts = (storedTasks: Task[]): Task[] => {
  const defaultPrompts = getDefaultPrompts();
  return storedTasks.map((task) => ({
    ...task,
    storyboards: task.storyboards || [],
    steps: task.steps.map((step) => ({
      ...step,
      basePrompt: defaultPrompts[step.id] || step.basePrompt || '',
    })),
  }));
};

// 保存前移除 basePrompt（单个任务）
export const dehydrateTaskForStorage = (task: Task): Task => ({
  ...task,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  steps: task.steps.map(({ basePrompt, ...rest }) => rest as WorkflowStep),
});
