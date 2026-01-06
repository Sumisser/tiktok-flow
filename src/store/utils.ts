import type { Task, WorkflowStep } from "../types";

// 默认工作流步骤模板
export const createDefaultSteps = (): WorkflowStep[] => [
  {
    id: "step-1",
    type: "idea",
    title: "💡 想法输入",
    basePrompt: `你是一个深谙抖音、小红书爆款内容规律的短视频文案高手。请根据用户的想法，写出一段让人忍不住看完的短视频文案。

**爆款文案核心技巧：**
1. **开头直接切入**：用真实的问题、场景或观点引起共鸣
   - ❌ "99%的人都不知道的秘密"
   - ✅ "早起总是失败？问题可能不在闹钟"
2. **客观视角**：不要用"我"的第一人称叙述，用陈述或提问方式
3. **情绪共鸣**：触动焦虑、好奇、认同、惊喜等情绪
4. **节奏紧凑**：短句为主，每句话都有信息量
5. **结尾有力**：用金句、反转或留白收尾，不要求点赞关注

**绝对禁止（去AI味）：**
- 不要用"首先、其次、最后"这类结构化表达
- 不要用"值得注意的是""总而言之"等书面套话
- 不要过度使用形容词堆砌
- 不要有说教感，要有真实感

**输出要求：**
- 只输出纯文本文案，不含镜头/画面描述
- 使用 Markdown 格式
- 控制在 150-300 字（30-60 秒）

用户想法：`,
    input: "",
    output: "",
    status: "pending",
  },
  {
    id: "step-2",
    type: "script",
    title: "📝 分镜脚本",
    basePrompt: `你是一个专业的分镜脚本师和 AI 绘图提示词专家。请根据以下脚本，拆解为分镜脚本表格。

**要求：**
1. 每个分镜 3-5 秒
2. 为每个分镜提供：
   - 镜号
   - 对应的脚本片段
   - 关键帧图片生成提示词（用于 Midjourney/DALL-E/Flux 等 AI 绘图工具生成静态画面）

**关键帧提示词结构（使用英文，逗号分隔，按权重排序）：**

采用以下指定的画面风格：

**[画面风格指令将在此处由引擎自动注入]**

1. **主提示词 prompt** - 核心描述，包含：
   - 画面内容：人物动作、表情、环境细节
   - 环境光影：god rays, lens flare, soft glow, realistic reflections
   - 构图：cinematic composition, close-up / medium shot / wide shot

2. **质量标签**：masterpiece, high quality, highly detailed, 8k resolution, trending on ArtStation

3. **负面提示词 negative_prompt**（避免出现的元素）：
   deformed, ugly, blurry, low quality, messy lines, realistic photo, 3d render style, dark or horror mood

**输出格式（使用 markdown 代码块）：**
\`\`\`markdown
| 镜号 | 脚本 | 关键帧提示词 |
|------|------|-------------|
| 1 | 脚本片段... | masterpiece, high quality, realistic anime style... |
\`\`\`

脚本内容：`,
    input: "",
    output: "",
    status: "pending",
  },
  {
    id: "step-3",
    type: "storyboard",
    title: "🎬 视觉提示词",
    basePrompt: `你是一个专业的 AI 绘图/视频提示词专家。请根据以下分镜脚本，为每个分镜生成：
1. 关键帧图片生成提示词（适用于 Midjourney/DALL-E）
2. 视频生成提示词（适用于 Runway/Pika）

要求：
- 提示词要详细、具体
- 包含画面构图、光线、色调
- 符合短视频的视觉风格

分镜内容：`,
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
