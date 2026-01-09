import { createContext } from 'react';
import type { Task, WorkflowStep, StoryboardItem } from '../types';

// Unsplash 壁纸归属信息
export interface WallpaperAttribution {
  photographerName: string;
  photographerUrl: string;
  unsplashUrl: string;
}

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
    updates: Partial<WorkflowStep>,
  ) => Promise<void>;
  updateStoryboards: (
    taskId: string,
    storyboards: StoryboardItem[],
  ) => Promise<void>;
  wallpaperUrl: string | null;
  wallpaperAttribution: WallpaperAttribution | null;
}

export const TaskContext = createContext<TaskContextType | null>(null);
