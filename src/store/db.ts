import { supabase } from "../lib/supabase";
import type { Task } from "../types";

const TABLE_NAME = "tasks";

// 获取所有任务
export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .order("updatedAt", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return data as Task[];
}

// 获取单个任务
export async function getTaskById(id: string): Promise<Task | undefined> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching task by id:", error);
    return undefined;
  }

  return data as Task;
}

// 保存任务（新增或更新）
export async function saveTask(task: Task): Promise<void> {
  // Supabase upsert works by checking the primary key (id)
  const { error } = await supabase.from(TABLE_NAME).upsert(task);

  if (error) {
    console.error("Error saving task:", error);
    throw error;
  }
}

// 删除任务
export async function deleteTaskById(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);

  if (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
}
