import { useState, useEffect, useRef, type ReactNode } from "react";
import type { Task, WorkflowStep, StoryboardItem } from "../types";
import {
  getAllTasks,
  saveTask,
  deleteTaskById,
  migrateFromLocalStorage,
} from "./db";
import { TaskContext } from "./context";
import {
  createDefaultSteps,
  hydrateTasksWithPrompts,
  dehydrateTaskForStorage,
} from "./utils";

// Provider 组件
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  // 初始化：从 IndexedDB 加载数据
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const loadTasks = async () => {
      try {
        // 先尝试迁移 localStorage 数据
        await migrateFromLocalStorage();
        // 从 IndexedDB 加载任务
        const storedTasks = await getAllTasks();
        const hydratedTasks = hydrateTasksWithPrompts(storedTasks);
        setTasks(hydratedTasks);
      } catch (error) {
        console.error("加载任务失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const addTask = async (title: string): Promise<Task> => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title || "未命名项目",
      createdAt: now,
      updatedAt: now,
      steps: createDefaultSteps(),
      storyboards: [],
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    await saveTask(dehydrateTaskForStorage(newTask));
    return newTask;
  };

  const deleteTask = async (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    await deleteTaskById(id);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    );
    setTasks(updatedTasks);
    const updatedTask = updatedTasks.find((t) => t.id === id);
    if (updatedTask) {
      await saveTask(dehydrateTaskForStorage(updatedTask));
    }
  };

  const getTask = (id: string) => {
    return tasks.find((task) => task.id === id);
  };

  const updateStep = async (
    taskId: string,
    stepId: string,
    updates: Partial<WorkflowStep>
  ) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const updatedSteps = task.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        );
        return {
          ...task,
          steps: updatedSteps,
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });
    setTasks(updatedTasks);
    const updatedTask = updatedTasks.find((t) => t.id === taskId);
    if (updatedTask) {
      await saveTask(dehydrateTaskForStorage(updatedTask));
    }
  };

  const updateStoryboards = async (
    taskId: string,
    storyboards: StoryboardItem[]
  ) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, storyboards, updatedAt: new Date().toISOString() }
        : task
    );
    setTasks(updatedTasks);
    const updatedTask = updatedTasks.find((t) => t.id === taskId);
    if (updatedTask) {
      await saveTask(dehydrateTaskForStorage(updatedTask));
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 
                      flex items-center justify-center"
      >
        <div className="text-white/60">加载中...</div>
      </div>
    );
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        deleteTask,
        updateTask,
        getTask,
        updateStep,
        updateStoryboards,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
