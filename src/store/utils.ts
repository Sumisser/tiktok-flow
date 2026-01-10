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

**内容风格要求（核心原则）：**

🚫 **绝对禁止的营销号特征**：
- 空洞口号（"改变命运"、"突破自我"、"成功的秘诀"）
- 励志鸡汤（"相信自己"、"坚持就是胜利"、"你值得拥有"）
- 虚假紧迫（"99%的人不知道"、"错过就没了"、"最后一次机会"）
- 无意义排比和煽情结尾
- 夸大其词、标题党式表达

✅ **必须做到的吸引力法则**：
- **开头3秒抓人**：用反常识、冲突、悬念或具体场景直接切入，不要铺垫
- **信息密度高**：每句话都有新信息，删掉所有"正确的废话"
- **具体细节**：用数字、案例、对比、场景让抽象概念落地
- **真实感**：像朋友私下分享，可以有口语化表达、停顿、自嘲
- **留有余地**：不把话说死，给观众思考空间，不强行给结论
- **情绪克制**：点到为止，不煽情不说教，让内容本身打动人

📝 **干货内容技巧**：
- 一个视频只讲一个核心观点，讲透
- 用"是什么→为什么→怎么做"或"问题→原因→方案"结构
- 举例子比讲道理有效100倍
- 反面案例、踩坑经历比正面说教更吸引人

**创作流程：**

**第一步：撰写完整口播文案**
- 时长：30-60 秒（约 150-300 字）
- 开头：必须在3秒内让人想继续听（反常识/冲突/具体问题/有趣场景）
- 中间：有料、有细节、有逻辑，像在给朋友解释一件事
- 结尾：自然收束，可以抛问题、留悬念，但不要升华和号召

**第二步：分镜拆解（6-10 个镜头）**
- **完整性**：所有 '脚本文案' 拼接后必须与第一步文案完全一致，严禁删减
- **画面提示词 (Image Prompt)**：
    - 英文，40-60词，富有想象力和视觉冲击力
    - **构图设计**：明确前景/中景/背景的层次关系，使用三分法、对称、引导线等构图技巧
    - **主体描写**：人物表情、姿态、服饰的细节；物体的材质、形态、状态
    - **环境氛围**：时间（黎明/黄昏/深夜）、天气（雨雾/晴朗/暴风）、季节感
    - **光影美学**：光源方向、色温、明暗对比、轮廓光、逆光剪影等
    - **意境营造**：通过视觉隐喻传达情绪（孤独感、希望、紧张、温馨等）
    - 将【画面风格要求】自然融入
    - 示例：\"A lone figure in a flowing white dress stands at the edge of a cliff, silhouetted against a dramatic sunset sky. Golden hour light creates a warm rim around her hair. Vast ocean stretches to the horizon in the background, waves crashing against rocks below. Cinematic composition, shallow depth of field.\"
- **视频提示词 (Video Prompt)**：
    - 英文，50-80词，要有叙事性和动态细节
    - **主体动作**：人物/物体的具体运动（走、跑、转身、拿起、放下等）
    - **客体变化**：环境中其他元素的动态（风吹树叶、水面涟漪、光影变化等）
    - **运镜设计**：推/拉/摇/移/跟/升降/手持晃动等，说明起始和结束状态
    - **焦点转换**：焦点从A转移到B，或景深由浅变深等
    - **节奏情绪**：慢动作、快切、停顿等节奏处理
    - 示例：\"Camera slowly pushes in from medium shot to close-up as the woman turns her head, her hair flowing in the wind. Focus shifts from the background cityscape to her eyes. Leaves drift past in soft slow motion.\"

**输出格式：**

### 1. 完整口播文案
(在此处输出完整文案)

### 2. 分镜表
\`\`\`markdown
| 镜号 | 脚本文案 | 画面生成提示词 (Image Prompt) | 视频生成提示词 (Video Prompt) |
|------|----------|-------------------------------|------------------------------|
| 1 | (文案片段) | A close up of... | Slow zoom in... |
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
