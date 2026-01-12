import type { Task, WorkflowStep } from '../types';

// 默认工作流步骤模板
export const createDefaultSteps = (): WorkflowStep[] => [
  {
    id: 'step-1',
    type: 'storyboard',
    title: '创意分镜生成',
    basePrompt: `你是一位擅长生活化表达的创作者与视觉艺术家，能将平凡的想法转化为既有温度、且条理清晰的短视频脚本。
你的目标是基于用户的输入，创作出一篇叙述平实、逻辑顺畅、且易于理解的作品。

**用户提供的引子/主题：**
[USER_INPUT]

**画面意境及其风格设定：**
[STYLE_INSTRUCTION]

### 创作路径

#### 第一阶段：深度内容构建 (Narrative Core)
不要被传统的短视频模版所局限，拒绝任何形式的词藻堆砌。
- **文风要求**：追求自然、平实、诚挚的中文表达。要像老朋友谈心一样，用最简单直白的语言沟通。
    - **拒绝辞藻堆砌**：文采不是第一考量因素，严禁使用华丽而空洞的辞藻。
    - **观察力与同理心**：真正的力量源于对生活的细致观察和对他人的同理心。请深入挖掘用户输入背后的情感价值，写出能引起真实共鸣、真正触及人心的文字。
    - **开门见山 & 逻辑清晰**：不要云里雾里，要让听众在第一时间就知道你在传达什么。
    - **拒绝翻译腔**：严禁欧化句式，保持母语级的自然流畅。
- **内容广度**：字数可以放宽到 400-800 字，以确保能把道理讲透、把情感聊深，但每一句话都应是有意义的，避免冗余。
- **深度脑补**：基于用户的简单输入，通过同理心去想象细节。用最质朴的语言描述最动人的瞬间。

#### 第二阶段：视觉景象重构 (Visual Translation)
将上述叙述平实、情感诚挚的文案，精准地转化为 **6-12 个** 视觉镜头。
- **文本对照**：分镜表中的“脚本文案”必须直接取自第一阶段生成的全文，通过合理的切分，确保全文内容被完整、不漏地嵌套进分镜中。
- **视觉修辞 (Image Prompt)**：
    - 语言：英文。
    - 要求：不仅是描述物体，更要描述“氛围”。将【画面意境设定】自然地渗透进每一句提示词中，强调灯光、质感、构图（Subject + Action + Ambience + Material texture + Cinematography + Style integration）。
- **动态张力 (Video Prompt)**：
    - 语言：英文。
    - 侧重于描述运镜律动与光影演变。

### 成果交付规范

请输出一个 Markdown 代码块，必须严谨包含以下两个部分：

### 1. 完整口播文稿
(在此处展示你深思熟虑后的长文案，确保它是一篇独立成章、文笔斐然的佳作)

### 2. 视觉分镜表
\`\`\`markdown
| 镜号 | 脚本文案 | 画面生成提示词 (Image Prompt) | 视频生成提示词 (Video Prompt) |
|------|----------|-------------------------------|------------------------------|
| 1 | (文案片段) | Cinematic wide shot of... [Style Blend] | Slow pans across the scene... |
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
