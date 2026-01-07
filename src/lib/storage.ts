import { supabase } from "./supabase";

const BUCKET_NAME = "flow";

/**
 * 上传图片到 Supabase Storage
 * @param file - 图片文件
 * @param taskId - 任务ID（用于生成存储路径）
 * @param shotNumber - 镜号（用于生成存储路径）
 * @returns 图片的公开访问 URL
 */
export async function uploadStoryboardImage(
  file: File,
  taskId: string,
  shotNumber: number
): Promise<string> {
  try {
    // 生成唯一的文件名
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${taskId}/shot-${shotNumber}-${timestamp}.${fileExt}`;

    // 上传文件到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true, // 如果文件已存在则覆盖
      });

    if (error) {
      console.error("Error uploading image:", error);
      throw error;
    }

    // 获取公开访问 URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Failed to upload storyboard image:", error);
    throw error;
  }
}

/**
 * 上传视频到 Supabase Storage
 * @param file - 视频文件
 * @param taskId - 任务ID
 * @param shotNumber - 镜号
 * @returns 视频的公开访问 URL
 */
export async function uploadStoryboardVideo(
  file: File,
  taskId: string,
  shotNumber: number
): Promise<string> {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    // 使用 video 前缀以示区别，或者直接混用也可以，这里加个 video- 前缀
    const fileName = `${taskId}/video-${shotNumber}-${timestamp}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading video:", error);
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Failed to upload storyboard video:", error);
    throw error;
  }
}

/**
 * 删除 Supabase Storage 中的图片
 * @param imageUrl - 图片的公开访问 URL
 */
export async function deleteStoryboardImage(imageUrl: string): Promise<void> {
  try {
    // 从 URL 中提取文件路径
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);

    if (bucketIndex === -1) {
      console.warn("Invalid image URL, cannot extract file path");
      return;
    }

    const filePath = pathParts.slice(bucketIndex + 1).join("/");

    // 删除文件
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to delete storyboard image:", error);
    // 不抛出错误，因为删除失败不应该阻止其他操作
  }
}

/**
 * 删除任务关联的所有图片文件
 * @param taskId - 任务ID
 */
export async function deleteTaskImages(taskId: string): Promise<void> {
  try {
    // 1. 列出该任务目录下的所有文件
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(taskId);

    if (listError) {
      console.error("Error listing task images:", listError);
      return;
    }

    if (!files || files.length === 0) {
      return;
    }

    // 2. 构造文件路径列表
    const filesToRemove = files.map((file) => `${taskId}/${file.name}`);

    // 3. 批量删除文件
    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filesToRemove);

    if (removeError) {
      console.error("Error removing task images:", removeError);
    }
  } catch (error) {
    console.error("Failed to delete task images room storage:", error);
  }
}
