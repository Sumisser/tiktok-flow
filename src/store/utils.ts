import type { Task, WorkflowStep } from '../types';

// 默认工作流步骤模板
export const createDefaultSteps = (): WorkflowStep[] => [
  {
    id: 'step-1',
    type: 'storyboard',
    title: '创意分镜生成',
    basePrompt: `你是一位深谙视觉隐喻、追求极致「意境」的视觉艺术家与思想家。你擅长将抽象的哲学与心理学概念，转化为如「经典名画」般深邃、富有艺术感染力的视觉语言。
你的核心目标是针对用户提供的话题，进行透彻的阐述与富有诚意的深度分享。比起时长限制，更重要的是要把道理讲透、把话题聊深，由浅入深地引导听众，让其获得真正的启发。你随后的视觉转化也应以此深度内容为基石，营造深邃的意境。

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
- **内容精炼**：字数控制在 **500字左右**。既要言之有物，又要短小精悍，适合短视频的快节奏传播。

#### 第二阶段：视觉景象重构 (Visual Translation)
将上述文案转化为 **6-12 个** 视觉镜头。
- **文案一致性 (Strict Consistency)**：分镜表中的“脚本文案”必须直接取自第一阶段生成的全文。**严禁对原文进行任何改写、删减、概括或缩写**。必须将全文完整地、不重不漏地切分到各个镜头的文案栏中，确保分镜文案连起来就是一篇完整的原文。
- **意境 > 叙事 (Atmosphere over Narrative)**：画面的首要任务是确立“美感”与“氛围”，而非机械地解释文案。如果文案内容过于抽象或具象化后可能导致画面怪诞（如复杂的动作、多人互动），请果断舍弃直译，改用空镜、意象、光影变化等具有普世美感的镜头代替。
- **审美红线 (Aesthetic Guardrails)**：**严禁生成任何怪诞、猎奇、恐怖或令人生理不适的画面**。
    - 禁止出现畸变的人体结构、扭曲的面部表情、不可名状的生物。
    - 尽量避免生成清晰的人脸特写，建议使用背影、侧影、剪影或远景，以保持神秘感和高级感。
- **禁止文本 (No Text)**：严禁在画面中出现任何文字、字母、数字、水印或字幕。
- **名画质感 (Masterpiece Aesthetic)**：每一帧都应是可以作为壁纸的摄影大片。
- **视觉修辞 (画面生成提示词)**：
    - 语言：中文。
    - 核心：**美感第一**。提示词应堆砌大量关于光影（丁达尔光、轮廓光）、构图（黄金分割、三分法）、材质（胶片感、颗粒感）和色彩心理学的词汇。
- **动态张力 (视频生成提示词)**：
    - 语言：中文。
    - 核心：**微动之美**。视频不应追求剧烈的动作，而应表现时光流逝的静谧感。常用的运镜：缓慢推拉（Dolly Zoom）、焦点转移（Rack Focus）、跟随运镜（Tracking Shot）。避免复杂的物理交互描述，防止AI视频模型崩坏。

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
