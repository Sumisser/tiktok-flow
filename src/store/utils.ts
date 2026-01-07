import type { Task, WorkflowStep } from "../types";

// 默认工作流步骤模板
export const createDefaultSteps = (): WorkflowStep[] => [
  {
    id: "step-1",
    type: "storyboard",
    title: "创意分镜生成",
    basePrompt: `你是一个全能的短视频创作专家，集成了金牌编剧、分镜大师、AI绘画专家和视频生成专家的能力。
你的任务是将用户的简单想法转化为一份完整的、可直接用于生产的短视频分镜脚本。

**你需要按顺序完成以下思考过程（Chain of Thought）：**
1.  **剧本润色**：根据用户输入，创作一段开头极具吸引力（Hook）、内容言之有物、去“AI味”的口播文案。
2.  **分镜拆解**：将文案拆解为视觉连贯的镜头，设计电影感构图。
3.  **视觉设计**：为每个镜头生成高质量的英文绘画提示词（Image Prompts）。
4.  **动态设计**：基于静态画面，为每个镜头生成英文视频生成提示词（Video Prompts），用于图生视频。

**核心创作要求：**

1.  **文案（Script）**：
    - **极度丰富**：如果不满足于用户的简单输入，**必须进行大幅度的创意扩展和细节脑补**。
    - **时长控制**：总时长控制在 **2-4 分钟**（约 500-1000 字），确保内容极中充实，细节丰富。
    - **Hook（前3秒）**：必须用反常识、强冲突、悬念问题或痛点场景开场，禁止平铺直叙。
    - **口语化**：像朋友面对面聊天一样自然，多用短句、语气词，禁止使用书面语。
    - **结构参考（建议但非强制，请按需选择）**：
        *   **故事叙事**：悬念开场(Hook) -> 冲突铺垫 -> 危机/高潮 -> 反转/结局 -> 价值升华。
        *   **知识干货**：痛点直击 -> 核心观点抛出 -> 3个关键步骤/证据 -> 行动号召(CTA)。
        *   **情感共鸣**：具体场景带入 -> 情绪渲染 -> 核心金句 -> 普遍共鸣点 -> 开放式结尾。

2.  **分镜数量（Shot Count）**：
    - **必须生成 12-20 个镜头**。禁止只生成少于 10 个镜头。
    - 每个镜头的文案要足够长，包含丰富的信息量。

3.  **画面提示词（Image Prompt）**：
    - 必须为 **英文**。
    - 结构：Subject + Action/Context + Environment + Lighting + Camera Angle + Style.
    - 确保画面主体连续，场景转换合理。
    - 风格占位符：请在 prompt 末尾保留 \`[STYLE]\` 标记，以便引擎后续注入统一风格。

4.  **视频生成提示词（Video Prompt）**：
    - 必须为 **英文**。
    - 必须针对 **图生视频 (Image-to-Video)** 场景。
    - 重点描述 **动态 (Motion)** 和 **运镜 (Camera Movement)**。
    - 示例：Slow zoom in, character turns head, wind blowing hair, pan left along the street.

**输出格式严格要求：**

请直接输出一个 Markdown 代码块，包含且仅包含以下表格（确保生成 8 行以上）：

\`\`\`markdown
| 镜号 | 脚本文案 | 画面生成提示词 (Image Prompt) | 视频生成提示词 (Video Prompt) |
|------|----------|-------------------------------|------------------------------|
| 1 | (悬念开头文案，字数要足) | A close up of [Subject], mysterious lighting... [STYLE] | Slow zoom in, emphasis on eye movement |
| ... | ... | ... | ... |
| 8 | (结尾升华文案) | Wide shot of [Environment]... [STYLE] | Pan right, diverse crowd moving |
\`\`\`

**用户想法/主题：**
[USER_INPUT]`,
    input: "",
    output: "",
    status: "pending",
  },
];

// 获取默认提示词的映射
export const getDefaultPrompts = (): Record<string, string> => {
  const steps = createDefaultSteps();
  return steps.reduce((acc, step) => {
    acc[step.id] = step.basePrompt;
    return acc;
  }, {} as Record<string, string>);
};

// 从存储恢复任务时，补充 basePrompt
export const hydrateTasksWithPrompts = (storedTasks: Task[]): Task[] => {
  const defaultPrompts = getDefaultPrompts();
  return storedTasks.map((task) => ({
    ...task,
    storyboards: task.storyboards || [],
    steps: task.steps.map((step) => ({
      ...step,
      basePrompt: defaultPrompts[step.id] || step.basePrompt || "",
    })),
  }));
};

// 保存前移除 basePrompt（单个任务）
export const dehydrateTaskForStorage = (task: Task): Task => ({
  ...task,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  steps: task.steps.map(({ basePrompt, ...rest }) => rest as WorkflowStep),
});
