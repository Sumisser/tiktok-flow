// 任务类型
export interface Task {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  steps: WorkflowStep[];
  storyboards: StoryboardItem[];
  tags?: string[];
}

// 工作流步骤类型
export type StepType = "idea" | "script" | "storyboard";
export type StepStatus = "pending" | "in-progress" | "completed";

export interface WorkflowStep {
  id: string;
  type: StepType;
  title: string;
  basePrompt: string;
  input: string;
  output: string;
  status: StepStatus;
}

// 分镜项
export interface StoryboardItem {
  id: string;
  shotNumber: number;
  script: string;
  imagePrompt: string;
  imageUrl: string;
  videoPrompt?: string;
  videoUrl?: string;
}

// 分镜表格行（旧版兼容）
export interface StoryboardRow {
  id: string;
  shotNumber: number;
  script: string;
  imagePrompt: string;
  videoPrompt: string;
}
