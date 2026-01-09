import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { Task, WorkflowStep, StoryboardItem } from '../types';
import { getAllTasks, saveTask, deleteTaskById } from './db';
import { TaskContext, type WallpaperAttribution } from './context';
import {
  createDefaultSteps,
  hydrateTasksWithPrompts,
  dehydrateTaskForStorage,
} from './utils';
import { getRandomWallpaper } from '../lib/unsplash';

// Provider 组件
export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [wallpaperAttribution, setWallpaperAttribution] =
    useState<WallpaperAttribution | null>(null);
  const isInitializedRef = useRef(false);

  // 初始化壁纸 - 使用 Unsplash API
  useEffect(() => {
    const fetchWallpaper = async () => {
      const data = await getRandomWallpaper('nature landscape');
      if (data) {
        setWallpaperUrl(data.url);
        setWallpaperAttribution({
          photographerName: data.photographerName,
          photographerUrl: data.photographerUrl,
          unsplashUrl: data.unsplashUrl,
        });
      } else {
        // 如果 Unsplash API 失败，使用备用壁纸（无归属信息）
        setWallpaperUrl(
          `https://bing.biturl.top/?resolution=1920&format=image&index=random&_t=${Date.now()}`,
        );
        setWallpaperAttribution(null);
      }
    };
    fetchWallpaper();
  }, []);

  // 初始化：从 IndexedDB 加载数据
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const loadTasks = async () => {
      try {
        // 从 Supabase 加载任务
        const storedTasks = await getAllTasks();
        const hydratedTasks = hydrateTasksWithPrompts(storedTasks);
        setTasks(hydratedTasks);
      } catch (error) {
        console.error('加载任务失败:', error);
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
      title: title || '未命名项目',
      createdAt: now,
      updatedAt: now,
      steps: createDefaultSteps(),
      storyboards: [],
      tags: [],
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    await saveTask(dehydrateTaskForStorage(newTask));
    return newTask;
  };

  const deleteTask = async (id: string) => {
    // 找到要删除的任务，检查是否有图片需要清理
    const taskToDelete = tasks.find((t) => t.id === id);

    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    await deleteTaskById(id);

    // 如果任务存在，异步清理存储中的图片
    if (taskToDelete) {
      const { deleteTaskImages } = await import('../lib/storage');
      await deleteTaskImages(id);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task,
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
    updates: Partial<WorkflowStep>,
  ) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        const updatedSteps = task.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step,
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

  // 用于防抖的 ref
  const saveStoryboardsTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const pendingStoryboardsRef = useRef<{
    taskId: string;
    storyboards: StoryboardItem[];
  } | null>(null);
  const tasksRef = useRef(tasks);

  // 保持 tasksRef 与 tasks 同步
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const updateStoryboards = useCallback(
    async (taskId: string, storyboards: StoryboardItem[]) => {
      // 立即更新本地状态
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, storyboards, updatedAt: new Date().toISOString() }
            : task,
        ),
      );

      // 保存待处理的数据
      pendingStoryboardsRef.current = { taskId, storyboards };

      // 取消之前的保存定时器
      if (saveStoryboardsTimeoutRef.current) {
        clearTimeout(saveStoryboardsTimeoutRef.current);
      }

      // 延迟保存到数据库（防抖 500ms）
      saveStoryboardsTimeoutRef.current = setTimeout(async () => {
        const pending = pendingStoryboardsRef.current;
        if (pending) {
          try {
            // 使用 ref 获取最新的任务状态，避免闭包问题
            const currentTask = tasksRef.current.find(
              (t) => t.id === pending.taskId,
            );
            if (currentTask) {
              const taskToSave = {
                ...currentTask,
                storyboards: pending.storyboards,
                updatedAt: new Date().toISOString(),
              };
              await saveTask(dehydrateTaskForStorage(taskToSave));
            }
          } catch (error) {
            // 忽略 AbortError，因为它通常是因为新请求取消了旧请求
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error('保存分镜失败:', error);
            }
          }
          pendingStoryboardsRef.current = null;
        }
      }, 500);
    },
    [], // 空依赖数组，函数引用稳定
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        addTask,
        deleteTask,
        updateTask,
        getTask,
        updateStep,
        updateStoryboards,
        wallpaperUrl,
        wallpaperAttribution,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
