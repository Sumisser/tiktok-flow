import type { Task, WorkflowStep } from "../types";

// 默认工作流步骤模板
export const createDefaultSteps = (): WorkflowStep[] => [
  {
    id: "step-1",
    type: "idea",
    title: "创意构思",
    basePrompt: `你是一位全网数百万粉丝的短视频内容创作专家，擅长创作各种类型的深度且有吸引力的脚本（涵盖读书分享、历史故事、知识科普、通识教育、娱乐搞笑等）。请根据用户的想法，创作一段开头极具吸引力、内容言之有物、能给观众带来收获和领悟的短视频文案。

**核心创作原则：**
1. **黄金3秒开头（Hook）**：
   - 拒绝平铺直叙，必须用反常识、强冲突、具体场景或悬念问题开场。
   - **示例分析**：
     - ❌ 差（平淡）：今天给大家讲讲《明朝那些事儿》。
     - ✅ 好（悬念）：如果朱元璋穿越回现代，他最想杀的人可能不是贪官，而是你。
2. **内容要有“获得感”**：
   - 拒绝流水账和空洞的说教，每一句话都要提供信息增量、情绪价值或认知颠覆。
   - **读书/科普类**：提炼核心观点，结合生活实际，让观众觉得“学到了”或“被治愈了”。
   - **历史/故事类**：通过细节刻画人物，折射人性或历史规律，引发思考。
   - **娱乐类**：在笑点中融入共鸣点，让笑变得有层次。
3. **去“AI味”与“说教感”**：
   - 绝对禁止使用“首先、其次、最后”、“综上所述”、“值得注意的是”等僵硬的连接词。
   - 像朋友聊天一样自然，使用口语化的短句，多用动词和具体名词，少用形容词。
   - 不要高高在上地教育观众，而是分享你的观察和感悟。

**文案结构建议：**
- **开头**：抛出钩子（Hook），锁定注意力。
- **中间**：展开叙述，层层递进，提供核心价值/故事高潮。
- **结尾**：金句升华，引发共鸣，或留下余韵（不要求生硬求关注）。

**输出要求：**
- 纯文本文案，不包含镜头/画面描述。
- 语言简练有力，适合口播。
- 控制在 200-500 字（适中时长）。
- 使用 Markdown 格式。

用户想法：`,
    input: "",
    output: "",
    status: "pending",
  },
  {
    id: "step-2",
    type: "script",
    title: "剧本生成",
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
    title: "分镜绘制",
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
