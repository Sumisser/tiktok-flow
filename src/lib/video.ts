/**
 * 灵芽 AI Sora-2 视频生成 API
 * 文档: https://api.lingyaai.cn/doc/#/coding/sora-2
 */

const LINGYA_API_URL = 'https://api.lingyaai.cn';

export interface VideoGenerateRequest {
  prompt: string;
  imageUrl?: string;
  model?: 'sora-2' | 'sora-2-pro';
  seconds?: 4 | 10 | 15 | 20 | 25;
  size?: '1280x720' | '720x1280' | '1792x1024' | '1024x1792';
}

export interface VideoTaskResponse {
  id: string;
  object: string;
  model: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at: number;
  completed_at?: number;
  expires_at?: number;
  size: string;
  seconds: string;
  quality: string;
  video_url?: string;
  error?: { message: string } | null;
}

/**
 * 创建视频生成任务
 */
export async function createVideoTask(
  req: VideoGenerateRequest,
): Promise<VideoTaskResponse> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_AI_API_KEY');
  }

  const formData = new FormData();
  formData.append('prompt', req.prompt);
  formData.append('model', req.model || 'sora-2');
  formData.append('seconds', String(req.seconds || 10));
  formData.append('size', req.size || '1280x720');

  // 如果有图片参考，添加图片 URL
  if (req.imageUrl) {
    formData.append('input_reference', req.imageUrl);
  }

  const response = await fetch(`${LINGYA_API_URL}/v1/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`视频生成请求失败: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * 查询视频任务状态
 */
export async function getVideoTask(
  videoId: string,
): Promise<VideoTaskResponse> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_AI_API_KEY');
  }

  const response = await fetch(`${LINGYA_API_URL}/v1/videos/${videoId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`查询视频任务失败: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * 获取视频内容（下载）
 */
export async function getVideoContent(videoId: string): Promise<Blob> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_AI_API_KEY');
  }

  const response = await fetch(
    `${LINGYA_API_URL}/v1/videos/${videoId}/content`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`获取视频内容失败: ${response.status} - ${errorText}`);
  }

  return response.blob();
}

/**
 * 轮询等待视频生成完成
 */
export async function waitForVideoCompletion(
  videoId: string,
  onProgress?: (progress: number, status: string) => void,
  maxWaitMs: number = 300000, // 默认最多等待 5 分钟
  pollIntervalMs: number = 3000, // 每 3 秒轮询一次
): Promise<VideoTaskResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const task = await getVideoTask(videoId);

    if (onProgress) {
      onProgress(task.progress, task.status);
    }

    if (task.status === 'completed') {
      return task;
    }

    if (task.status === 'failed') {
      throw new Error(task.error?.message || '视频生成失败');
    }

    // 等待下一次轮询
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('视频生成超时');
}

/**
 * 完整的视频生成流程：创建任务 -> 等待完成 -> 返回视频 URL
 */
export async function generateVideo(
  req: VideoGenerateRequest,
  onProgress?: (progress: number, status: string) => void,
): Promise<string> {
  // 1. 创建任务
  const task = await createVideoTask(req);

  if (onProgress) {
    onProgress(0, 'queued');
  }

  // 2. 等待完成
  const completedTask = await waitForVideoCompletion(task.id, onProgress);

  // 3. 返回视频 URL
  if (!completedTask.video_url) {
    throw new Error('视频生成完成但未返回 URL');
  }

  return completedTask.video_url;
}
