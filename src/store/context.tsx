import { createContext } from "react";
import type { Task, WorkflowStep, StoryboardItem } from "../types";

export interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (title: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  getTask: (id: string) => Task | undefined;
  updateStep: (
    taskId: string,
    stepId: string,
    updates: Partial<WorkflowStep>
  ) => Promise<void>;
  updateStoryboards: (
    taskId: string,
    storyboards: StoryboardItem[]
  ) => Promise<void>;
}

export const TaskContext = createContext<TaskContextType | null>(null);
