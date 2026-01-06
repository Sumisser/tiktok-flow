import { openDB, type IDBPDatabase } from "idb";
import type { Task } from "../types";

const DB_NAME = "video-workflow-db";
const DB_VERSION = 1;
const STORE_NAME = "tasks";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// 获取所有任务
export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  const tasks = await db.getAll(STORE_NAME);
  return tasks.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// 获取单个任务
export async function getTaskById(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

// 保存任务（新增或更新）
export async function saveTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, task);
}

// 删除任务
export async function deleteTaskById(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

// 批量保存任务
export async function saveTasks(tasks: Task[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await Promise.all([...tasks.map((task) => tx.store.put(task)), tx.done]);
}

// 迁移 localStorage 数据到 IndexedDB
export async function migrateFromLocalStorage(): Promise<boolean> {
  const LEGACY_KEY = "video-workflow-tasks";
  const stored = localStorage.getItem(LEGACY_KEY);

  if (stored) {
    try {
      const tasks = JSON.parse(stored) as Task[];
      if (tasks.length > 0) {
        await saveTasks(tasks);
        localStorage.removeItem(LEGACY_KEY);
        console.log(`已迁移 ${tasks.length} 个任务到 IndexedDB`);
        return true;
      }
    } catch (e) {
      console.error("迁移失败:", e);
    }
  }
  return false;
}
