import type { Task, WorkflowStep } from '../types';

// 默认工作流步骤模板
export const createDefaultSteps = (): WorkflowStep[] => [
  {
    id: 'step-1',
    type: 'storyboard',
    title: '创意分镜生成',
    basePrompt: `你是一位深谙视觉隐喻、追求极致「意境」的视觉艺术家与思想家。你擅长将抽象的哲学与心理学概念，转化为如「经典名画」般深邃、富有艺术感染力的视觉语言。
你的目标是基于用户的输入，创作出一篇富有深度、自然真诚的作品，并将其转化为一系列意境深远、非叙事导向的视觉分镜。

**用户提供的引子/主题：**
[USER_INPUT]

**画面意境及其风格设定：**
[STYLE_INSTRUCTION]

### 创作路径

#### 第一阶段：深度内容构建 (Narrative Core)
不要被传统的短视频模版所局限，拒绝任何形式的词藻堆砌。
- **文风要求**：追求自然、平实、诚挚的中文表达。要像老朋友谈心一样，用最简单直白的语言沟通。
    - **拒绝辞藻堆砌**：文采不是第一考量因素，严禁使用华丽而空洞的辞藻。
    - **逻辑与同理心**：深入挖掘用户输入背后的情感与哲学价值，写出能引起真实共鸣、触及人心的文字。
    - **拒绝翻译腔**：严禁欧化句式，保持母语级的自然流畅，平白如话却力透纸背。
    - **开门见山 & 逻辑清晰**：让听众在第一时间就知道你在传达什么。
- **内容广度**：字数必须在 500-800 字之间，确保把道理讲透、把情感聊深，严禁少于 500 字。

#### 第二阶段：视觉景象重构 (Visual Translation)
将上述文案转化为 **6-12 个** 视觉镜头。
- **非线性叙事**：画面不需要着重于连续讲述一个具象的故事。画面之间可以是跳跃的、联想式的，重点在于捕捉瞬间的感悟。
- **禁止文本 (No Text)**：严禁在画面中出现任何文字、字母、数字、水印或字幕。画面必须是纯粹的视觉影像，不应包含任何可读文本。
- **意境优先**：每一帧画面首先要精准反应脚本文案的「意境」而非直接翻译文字内容。追求「象外之象」，用画面传递文字未尽之言。
- **名画质感 (Masterpiece Aesthetic)**：画面设计应追求如经典名画般的构图、光影和深度。多使用隐喻、象征性的视觉符号（例如：一盏灯、一段路、影子的对话、广袤的荒野等）。
- **视觉修辞 (画面生成提示词)**：
    - 语言：中文。
    - 要求：聚焦于“氛围”与“隐喻”。将【画面意境设定】深度融合，强调光影的戏剧性、材质的厚重感和镜头的哲思性。
- **动态张力 (视频生成提示词)**：
    - 语言：中文。
    - 内容要素：缓慢而富有诗意的运镜、微弱的动态演变（如烟雾缭缘、光线缓移、人物细微的情绪转动）、环境氛围的呼吸感。

### 成果交付规范

请输出一个 Markdown 代码块，必须严谨包含以下两个部分：

### 1. 完整口播文稿
(在此处展示你深思熟虑后的长文案，确保它是一篇独立成章、文笔斐然的佳作)

### 2. 视觉分镜表

**⚠️ 重要：镜号必须从 0 开始！**

\`\`\`markdown
| 镜号 | 脚本文案 | 画面生成提示词 | 视频生成提示词 |
|------|----------|----------------|----------------|
| 0 | [封面] | (为视频封面设计一张极具吸引力的静态画面，融合视频核心主题与视觉美学) | - |
| 1 | (第一段文案) | 电影感广角镜头，描述场景氛围... [风格融合] | 缓慢横摇，镜头扫过场景... |
| 2 | (第二段文案) | ... | ... |
...
\`\`\`

**强制规则**：
1. 第一行必须是镜号 0（封面），脚本文案固定写"[封面]"，视频提示词填"-"
2. 后续镜号从 1 开始递增
3. 封面只需要画面提示词，用于生成视频封面图
4. **严禁文字**：提示词中禁止出现任何关于生成文字、字母、数字、标题或水印的指令，确保画面内容纯净无文字。
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
