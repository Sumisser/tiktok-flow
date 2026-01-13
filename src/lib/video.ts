/**
 * 灵芽 AI 图像与视频生成 API
 * 图片生成: https://api.lingyaai.cn/doc/#/coding/nano-banana
 * 视频生成: https://api.lingyaai.cn/doc/#/coding/sora-2
 */

const LINGYA_API_URL = 'https://api.lingyaai.cn';

// --- 图像生成相关 (Nano Banana) ---

export interface ImageGenerateRequest {
  prompt: string;
  model: 'nano-banana' | 'banana-pro';
  size: '1024x1024' | '1280x720' | '720x1280';
}

export interface ImageTaskResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  data: Array<{ url: string }>;
  created: number;
}

export async function generateImageBanana(
  prompt: string,
  onProgress?: (msg: string) => void,
): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_AI_API_KEY');

  if (onProgress) onProgress('正在生成参考图...');

  // 1. 创建文生图任务
  const response = await fetch(`${LINGYA_API_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nano-banana', // 使用 nano-banana 模型
      prompt: prompt,
      n: 1,
      size: '1280x720', // 与视频默认尺寸保持一致
    } as ImageGenerateRequest),
  });

  if (!response.ok) {
    throw new Error(`图像生成请求失败: ${response.status}`);
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;

  if (!imageUrl) {
    throw new Error('图像生成成功但未返回 URL');
  }

  return imageUrl;
}

// --- 视频生成相关 (Sora-2) ---

export interface VideoGenerateRequest {
  prompt: string;
  imagePrompt?: string; // 新增：用于单独生成参考图的提示词
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
    // 确保 url 是可访问的
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
  maxWaitMs: number = 600000, // 视频生成较慢，延长到10分钟
  pollIntervalMs: number = 5000, // 每 5 秒轮询一次
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

    // 等待下一次轮询 (增加 0-2s 的随机抖动，避免多任务并发时的惊群效应)
    const jitter = Math.random() * 2000;
    await new Promise((resolve) =>
      setTimeout(resolve, pollIntervalMs + jitter),
    );
  }

  throw new Error('视频生成超时');
}

/**
 * 完整的视频生成流程：
 * 1. (该逻辑已调整) 如果提供了 imagePrompt 但没有 imageUrl，则先生成图片作为 references
 * 2. 创建视频任务 -> 等待完成 -> 返回视频 URL
 */
export async function generateVideo(
  req: VideoGenerateRequest,
  onProgress?: (
    progress: number,
    status: string,
    extraData?: { imageUrl?: string },
  ) => void,
): Promise<string> {
  let referenceImageUrl = req.imageUrl;

  // 1. 如果没有参考图但提供了 imagePrompt，则先生成图片 (Banana Pro)
  if (!referenceImageUrl && req.imagePrompt) {
    try {
      if (onProgress) onProgress(0, 'generating_reference');
      // 显式等待图片生成完成
      const generatedUrl = await generateImageBanana(req.imagePrompt, (msg) => {
        // 将图片生成的进度通过 onProgress 简单透传（虽然状态都是 generating_reference）
        if (onProgress) onProgress(0, `generating_reference: ${msg}`);
      });

      if (generatedUrl) {
        referenceImageUrl = generatedUrl;
        console.log(
          'Reference image generated successfully:',
          referenceImageUrl,
        );
        // 回调通知前端：图片生成成功，携带图片 URL
        if (onProgress) {
          onProgress(0, 'generating_reference_success', {
            imageUrl: generatedUrl,
          });
        }
      } else {
        throw new Error('生成的图片 URL 为空');
      }
    } catch (e: any) {
      console.error('Reference image generation failed:', e);
      throw new Error(`参考图片生成失败: ${e.message || '未知错误'}`);
    }
  }

  // 2. 创建视频任务 (Sora-2)
  // 如果之前生成了图片，这里会将 referenceImageUrl 传入
  const task = await createVideoTask({
    ...req,
    imageUrl: referenceImageUrl,
  });

  if (onProgress) {
    onProgress(0, 'queued');
  }

  // 3. 等待完成
  const completedTask = await waitForVideoCompletion(task.id, onProgress);

  // 4. 返回视频 URL
  if (!completedTask.video_url) {
    throw new Error('视频生成完成但未返回 URL');
  }

  return completedTask.video_url;
}
