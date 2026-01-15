import { useState, useRef, useEffect } from 'react';
import type { StoryboardItem } from '../types';
import {
  uploadStoryboardImage,
  uploadStoryboardVideo,
  deleteStoryboardImage,
  uploadGeneratedVideo,
} from '../lib/storage';
import {
  generateVideo,
  recoverVideoTask,
  generateImageBanana,
} from '../lib/video';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileCode,
  LayoutGrid,
  Video as VideoIcon,
  Image as ImageIcon,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AudioWaveform,
  Play,
  Pause,
  Download,
  Sparkles,
} from 'lucide-react';
import { parseStoryboardTable } from '../lib/storyboard';
import { generateMinimaxTts } from '../lib/tts';
import { uploadTtsAudio, deleteTtsAudio } from '../lib/storage';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface StoryboardEditorProps {
  taskId: string;
  output: string;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
  isRawMode: boolean;
  setIsRawMode: (mode: boolean) => void;
  onReset?: () => void;
  ttsAudioUrl?: string;
  onUpdateTtsAudioUrl?: (url: string) => void;
  taskTitle?: string;
}

export default function StoryboardEditor({
  taskId,
  output,
  storyboards,
  onUpdateStoryboards,
  isRawMode,
  setIsRawMode,
  ttsAudioUrl,
  onUpdateTtsAudioUrl,
  taskTitle,
}: StoryboardEditorProps) {
  /* eslint-disable react-hooks/exhaustive-deps */
  // 上传状态管理：支持多个分镜并行上传
  const [uploadingMap, setUploadingMap] = useState<Map<string, boolean>>(
    new Map(),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullScriptCopied, setIsFullScriptCopied] = useState(false);
  const storyboardsRef = useRef(storyboards);
  const [rawText, setRawText] = useState(output);
  const [currentIndex, setCurrentIndex] = useState(0);
  // TTS 状态管理
  const [isTtsGenerating, setIsTtsGenerating] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 视频生成状态：支持多个分镜并行生成，包含进度和状态文本
  const [videoGeneratingMap, setVideoGeneratingMap] = useState<
    Map<string, { progress: number; status: string }>
  >(new Map());
  // 媒体视图模式：'video' 默认显示视频，'image' 显示图片
  const [mediaViewMode, setMediaViewMode] = useState<'video' | 'image'>(
    'video',
  );
  const [isExporting, setIsExporting] = useState(false);

  // 任务持久化相关辅助函数
  const savePendingTask = (itemId: string, taskId: string) => {
    try {
      const tasks = JSON.parse(
        localStorage.getItem('tiktok_pending_tasks') || '{}',
      );
      tasks[itemId] = taskId;
      localStorage.setItem('tiktok_pending_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save pending task', e);
    }
  };

  const removePendingTask = (itemId: string) => {
    try {
      const tasks = JSON.parse(
        localStorage.getItem('tiktok_pending_tasks') || '{}',
      );
      delete tasks[itemId];
      localStorage.setItem('tiktok_pending_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to remove pending task', e);
    }
  };

  // 统一处理视频生成成功后的保存逻辑
  const handleVideoSuccess = async (
    itemId: string,
    videoUrl: string,
    shotNumber: number,
  ) => {
    // 显示上传状态
    setVideoGeneratingMap((prev) =>
      new Map(prev).set(itemId, { progress: 100, status: 'uploading' }),
    );

    try {
      const videoResponse = await fetch(videoUrl);
      const videoBlob = await videoResponse.blob();
      const uploadedUrl = await uploadGeneratedVideo(
        videoBlob,
        taskId,
        shotNumber,
      );

      const updated = storyboardsRef.current.map((s) =>
        s.id === itemId ? { ...s, videoUrl: uploadedUrl } : s,
      );
      onUpdateStoryboards(updated);
      toast.success(`分镜 ${shotNumber} 视频生成并保存成功！`);
    } catch (err) {
      console.error('视频保存失败', err);
      toast.error(`分镜 ${shotNumber} 视频保存失败`);
    } finally {
      removePendingTask(itemId);
      setVideoGeneratingMap((prev) => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // 初始化：恢复未完成的任务
  useEffect(() => {
    const recover = async () => {
      const tasksStr = localStorage.getItem('tiktok_pending_tasks');
      if (!tasksStr) return;

      try {
        const tasks = JSON.parse(tasksStr);
        Object.entries(tasks).forEach(async ([itemId, taskId]) => {
          // 找到对应的 item 以获取 shotNumber 等信息
          // 注意：这里依赖 storyboards 已经加载。如果 storyboards 是异步获取的，可能需要更复杂的依赖处理
          // 暂时假设 storyboardsRef.current 可用
          const item = storyboardsRef.current.find((s) => s.id === itemId);
          if (!item) {
            // 如果找不到 item（可能是删除了），移除任务
            removePendingTask(itemId);
            return;
          }

          // 恢复状态显示
          setVideoGeneratingMap((prev) =>
            new Map(prev).set(itemId, { progress: 0, status: 'recovering' }),
          );

          try {
            const videoUrl = await recoverVideoTask(
              taskId as string,
              (progress, status, _extraData) => {
                setVideoGeneratingMap((prev) =>
                  new Map(prev).set(itemId, { progress, status }),
                );
              },
            );

            await handleVideoSuccess(itemId, videoUrl, item.shotNumber);
          } catch (err) {
            console.error('恢复任务失败', err);
            toast.error(`分镜 ${item.shotNumber} 任务恢复失败`);
            removePendingTask(itemId);
            setVideoGeneratingMap((prev) => {
              const next = new Map(prev);
              next.delete(itemId);
              return next;
            });
          }
        });
      } catch (e) {
        console.error('Error parsing pending tasks', e);
      }
    };

    // 延迟一点执行以确保 storyboards 已加载 (简单处理)
    if (storyboards.length > 0) {
      recover();
    }
  }, [storyboards.length]); // 仅在 storyboards 长度变化（初次加载）时尝试恢复

  const handleGenerateImage = async (inputItem: StoryboardItem) => {
    const item =
      storyboardsRef.current.find((s) => s.id === inputItem.id) || inputItem;

    if (!item.imagePrompt) {
      toast.error('缺少画面提示词');
      return;
    }

    if (videoGeneratingMap.has(item.id)) {
      toast.info('该分镜正在处理中');
      return;
    }

    setVideoGeneratingMap((prev) =>
      new Map(prev).set(item.id, { progress: 0, status: 'generating_image' }),
    );

    try {
      let prompt = item.imagePrompt;
      if (item.stylePrompt) {
        prompt = `内容: ${prompt}\n风格: ${item.stylePrompt}`;
      }

      const imageUrl = await generateImageBanana(prompt);

      // 下载并上传到储存
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `${item.shotNumber === 0 ? 'cover' : `ref-${item.shotNumber}`}.png`,
        { type: 'image/png' },
      );

      const savedUrl = await uploadStoryboardImage(
        file,
        taskId,
        item.shotNumber,
      );

      const updated = storyboardsRef.current.map((s) =>
        s.id === item.id ? { ...s, imageUrl: savedUrl } : s,
      );
      storyboardsRef.current = updated;
      onUpdateStoryboards(updated);
      toast.success(item.shotNumber === 0 ? '封面生成成功' : '参考图生成成功');
    } catch (error: any) {
      console.error('Image generation failed:', error);
      toast.error(`生成失败: ${error.message || '未知错误'}`);
    } finally {
      setVideoGeneratingMap((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleGenerateVideo = async (inputItem: StoryboardItem) => {
    // 获取最新的分镜数据，防止闭包导致的状态陈旧
    const item =
      storyboardsRef.current.find((s) => s.id === inputItem.id) || inputItem;

    // 只需要视频提示词
    if (!item.videoPrompt) {
      toast.error('缺少视频提示词');
      return;
    }

    // 如果该 item 已经在生成中，不重复触发
    if (videoGeneratingMap.has(item.id)) {
      toast.info('该分镜正在生成中，请稍候');
      return;
    }

    // 添加到生成状态 Map
    setVideoGeneratingMap((prev) =>
      new Map(prev).set(item.id, { progress: 0, status: 'queued' }),
    );

    // 仅显示一个简单的开始提示，不持续更新
    toast.info(`分镜 ${item.shotNumber} 开始生成视频...`);

    try {
      // 构造图片生成提示词 (包含内容与风格)
      let imageGenPrompt = item.imagePrompt;
      if (imageGenPrompt && item.stylePrompt) {
        imageGenPrompt = `内容: ${imageGenPrompt}\n风格: ${item.stylePrompt}`;
      }

      // 1. 调用灵芽 AI 生成视频
      const videoUrl = await generateVideo(
        {
          prompt: item.videoPrompt, // 视频生成提示词 (仅动态)
          imagePrompt: imageGenPrompt || undefined, // 图片生成提示词 (内容+风格)
          imageUrl: item.imageUrl || undefined, // 现有的参考图（如果有）
          model: 'sora-2',
          seconds: 10,
          size: '1280x720',
        },
        async (progress, status, extraData) => {
          setVideoGeneratingMap((prev) =>
            new Map(prev).set(item.id, { progress, status }),
          );

          // 如果生成了参考图，自动保存
          if (
            status === 'generating_reference_success' &&
            extraData?.imageUrl
          ) {
            try {
              const imgRes = await fetch(extraData.imageUrl);
              const imgBlob = await imgRes.blob();
              const imgFile = new File([imgBlob], `ref-${item.id}.png`, {
                type: 'image/png',
              });

              const savedUrl = await uploadStoryboardImage(
                imgFile,
                taskId,
                item.shotNumber,
              );

              // 更新分镜数据中的图片
              const updated = storyboardsRef.current.map((s) =>
                s.id === item.id ? { ...s, imageUrl: savedUrl } : s,
              );
              storyboardsRef.current = updated; // 立即更新 Ref 防止后续状态不同步
              onUpdateStoryboards(updated);

              toast.success(`分镜 ${item.shotNumber} 参考图已保存`);
            } catch (err) {
              console.error('自动保存参考图失败:', err);
            }
          }
        },
        (taskId) => {
          // 任务创建成功，保存到 localStorage
          savePendingTask(item.id, taskId);
        },
      );

      // 2. 下载视频并上传到 Supabase (抽离的公共逻辑)
      await handleVideoSuccess(item.id, videoUrl, item.shotNumber);
    } catch (error: any) {
      console.error('视频生成失败:', error);
      toast.error(
        `分镜 ${item.shotNumber}: ${error.message || '视频生成失败'}`,
      );
      // 失败也要移除任务
      removePendingTask(item.id);
      setVideoGeneratingMap((prev) => {
        const next = new Map(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    item: StoryboardItem,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingMap((prev) => new Map(prev).set(item.id, true));
      try {
        const url = await uploadStoryboardImage(file, taskId, item.shotNumber);
        const updated = storyboardsRef.current.map((s) =>
          s.id === item.id ? { ...s, imageUrl: url } : s,
        );
        onUpdateStoryboards(updated);
        toast.success(`分镜 ${item.shotNumber} 图片上传成功`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('上传图片失败');
      } finally {
        setUploadingMap((prev) => new Map(prev).set(item.id, false));
        // Reset input value to allow selecting same file again
        e.target.value = '';
      }
    }
  };

  const handleVideoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    item: StoryboardItem,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingMap((prev) => new Map(prev).set(item.id, true));
      try {
        const url = await uploadStoryboardVideo(file, taskId, item.shotNumber);
        const updated = storyboardsRef.current.map((s) =>
          s.id === item.id ? { ...s, videoUrl: url } : s,
        );
        onUpdateStoryboards(updated);
        toast.success(`分镜 ${item.shotNumber} 视频上传成功`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('上传视频失败');
      } finally {
        setUploadingMap((prev) => new Map(prev).set(item.id, false));
        e.target.value = '';
      }
    }
  };

  const handleRemoveImage = async (item: StoryboardItem) => {
    if (item.imageUrl) {
      try {
        await deleteStoryboardImage(item.imageUrl);
        const updated = storyboardsRef.current.map((s) =>
          s.id === item.id ? { ...s, imageUrl: '' } : s,
        );
        onUpdateStoryboards(updated);
        toast.success('图片已删除');
      } catch (err) {
        console.error('Delete image error:', err);
        toast.error('删除图片失败');
      }
    }
  };

  const handleRemoveVideo = async (item: StoryboardItem) => {
    if (item.videoUrl) {
      try {
        await deleteStoryboardImage(item.videoUrl); // Reuse delete image prompt for now as per previous logic
        const updated = storyboardsRef.current.map((s) =>
          s.id === item.id ? { ...s, videoUrl: '' } : s,
        );
        onUpdateStoryboards(updated);
        toast.success('视频已删除');
      } catch (err) {
        console.error('Delete video error:', err);
        toast.error('删除视频失败');
      }
    }
  };

  const handleGenerateTts = async () => {
    // 拼接完整脚本
    const fullScript = storyboards
      .filter((s) => s.shotNumber !== 0)
      .map((s) => s.script)
      .join('\n\n');

    if (!fullScript.trim()) {
      toast.error('脚本内容为空，无法生成语音');
      return;
    }

    setIsTtsGenerating(true);
    const toastId = toast.loading('正在合成语音...');

    try {
      // 1. 如果已有音频，先删除旧的
      if (ttsAudioUrl) {
        // 虽然当前逻辑是按钮互斥，但防御性编程
        // 这里的删除可以是异步后的，不一定阻塞
        deleteTtsAudio(ttsAudioUrl).catch(console.error);
      }

      // 2. 生成新音频 (使用默认音色 Boyan_new_platform)
      const localUrl = await generateMinimaxTts({
        text: fullScript,
        voice_id: 'Boyan_new_platform',
      });

      // 3. 上传到 Supabase
      const response = await fetch(localUrl);
      const audioBlob = await response.blob();
      const uploadedUrl = await uploadTtsAudio(audioBlob, taskId);

      // 4. 更新状态
      onUpdateTtsAudioUrl?.(uploadedUrl);
      URL.revokeObjectURL(localUrl); // 清理本地内存

      toast.success('语音合成成功', { id: toastId });

      // 自动播放处理
      if (audioRef.current) {
        // 先停止当前播放
        audioRef.current.pause();
        // 设置新源码并加载
        audioRef.current.src = uploadedUrl;
        audioRef.current.load();

        // 尝试播放 (可能会被浏览器自动播放策略拦截，所以需要 catch)
        audioRef.current.play().catch((err) => {
          console.warn('自动播放被拦截或失败:', err);
          // 不在这里设置状态，由事件监听器统一处理
        });
      }
    } catch (error: any) {
      console.error('TTS Error:', error);
      toast.error(error.message || '语音合成失败', { id: toastId });
    } finally {
      setIsTtsGenerating(false);
    }
  };

  const handlePlayPauseTts = () => {
    if (!audioRef.current || !ttsAudioUrl) return;

    if (isTtsPlaying) {
      audioRef.current.pause();
    } else {
      // 确保 src 正确且已加载
      if (
        !audioRef.current.src ||
        audioRef.current.src === '' ||
        audioRef.current.src.indexOf('undefined') !== -1
      ) {
        audioRef.current.src = ttsAudioUrl;
        audioRef.current.load();
      }

      audioRef.current.play().catch((err) => {
        console.error('Play error:', err);
        toast.error('播放失败，请重试');
      });
    }
  };

  // 同步音频状态
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsTtsPlaying(true);
    const handlePause = () => setIsTtsPlaying(false);
    const handleEnded = () => setIsTtsPlaying(false);
    const handleError = (e: any) => {
      console.error('音频播放错误:', e);
      setIsTtsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    storyboardsRef.current = storyboards;
  }, [storyboards]);
  useEffect(() => {
    if (currentIndex >= storyboards.length && storyboards.length > 0) {
      setCurrentIndex(storyboards.length - 1);
    }
  }, [storyboards.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isRawMode) return;
      if (e.key === 'ArrowLeft')
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      else if (e.key === 'ArrowRight')
        setCurrentIndex((prev) => Math.min(storyboards.length - 1, prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRawMode, storyboards.length]);

  const hasInitializedRef = useRef(false);
  const lastParsedOutputRef = useRef<string>('');

  const handleParseAndMerge = (markdown: string) => {
    if (markdown === lastParsedOutputRef.current) return;
    const newItems = parseStoryboardTable(markdown);
    const mergedItems = newItems.map((newItem) => {
      const existingItem = storyboardsRef.current.find(
        (s) => s.shotNumber === newItem.shotNumber,
      );
      if (existingItem) {
        return {
          ...newItem,
          id: existingItem.id,
          imageUrl: existingItem.imageUrl || newItem.imageUrl,
          videoUrl: existingItem.videoUrl || newItem.videoUrl,
        };
      }
      return newItem;
    });
    if (mergedItems.length > 0) {
      lastParsedOutputRef.current = markdown;
      onUpdateStoryboards(mergedItems);
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current && output && storyboards.length === 0) {
      hasInitializedRef.current = true;
      handleParseAndMerge(output);
    }
  }, []);

  const prevOutputRef = useRef(output);
  useEffect(() => {
    if (
      output &&
      output !== prevOutputRef.current &&
      output !== lastParsedOutputRef.current
    ) {
      prevOutputRef.current = output;
      setRawText(output);
      handleParseAndMerge(output);
    }
  }, [output]);

  const handleRawTextChange = (value: string) => {
    setRawText(value);
    lastParsedOutputRef.current = '';
    handleParseAndMerge(value);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const handleCopyFullScript = async () => {
    const fullScript = storyboards
      .filter((s) => s.shotNumber !== 0)
      .map((s) => s.script)
      .join('\n\n');
    try {
      // 将标点替换为换行以方便提词器阅读，并清理重复换行
      const cleanedScript = fullScript
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      await navigator.clipboard.writeText(cleanedScript);
      setIsFullScriptCopied(true);
      setTimeout(() => setIsFullScriptCopied(false), 1500);
    } catch {}
  };

  const handleExportAll = async () => {
    if (!storyboards.length) return;
    setIsExporting(true);
    const toastId = toast.loading('正在打包导出所有媒体...');

    try {
      const zip = new JSZip();
      const safeTitle = (taskTitle || 'project').replace(/[\\/:*?"<>|]/g, '_');
      const rootFolder = zip.folder(safeTitle);

      if (!rootFolder) throw new Error('Failed to create ZIP folder');

      // 1. 导出音频
      if (ttsAudioUrl) {
        try {
          const audioRes = await fetch(ttsAudioUrl);
          const audioBlob = await audioRes.blob();
          rootFolder.file('full-audio.mp3', audioBlob);
        } catch (err) {
          console.error('Failed to fetch audio for export', err);
        }
      }

      // 2. 导出分镜媒体
      const fetchPromises = storyboards.map(async (item) => {
        const shotName =
          item.shotNumber === 0 ? 'cover' : `shot-${item.shotNumber}`;

        // 图片
        if (item.imageUrl) {
          try {
            const res = await fetch(item.imageUrl);
            const blob = await res.blob();
            // Try to get extension from URL or default to png
            const extension =
              item.imageUrl.split('.').pop()?.split('?')[0] || 'png';
            rootFolder.file(`${shotName}.${extension}`, blob);
          } catch (err) {
            console.error(`Failed to fetch image for ${shotName}`, err);
          }
        }

        // 视频
        if (item.videoUrl) {
          try {
            const res = await fetch(item.videoUrl);
            const blob = await res.blob();
            rootFolder.file(`${shotName}.mp4`, blob);
          } catch (err) {
            console.error(`Failed to fetch video for ${shotName}`, err);
          }
        }
      });

      await Promise.all(fetchPromises);

      // 3. 生成并下载 ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${safeTitle}.zip`);
      toast.success('导出完成！', { id: toastId });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('导出失败，请重试', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (storyboards.length === 0 && !isRawMode) {
    return (
      <div
        onClick={() => setIsRawMode(true)}
        className="group relative flex flex-col items-center justify-center py-10 bg-white/5 border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all"
      >
        <div className="p-3 rounded-full bg-white/5 group-hover:bg-primary/20 transition-all mb-3">
          <FileCode className="w-6 h-6 text-white/30 group-hover:text-primary" />
        </div>
        <p className="text-white/50 text-xs font-bold">暂无分镜数据</p>
      </div>
    );
  }

  return (
    <>
      {/* 左侧集成垂直工具栏 - 移除所有动画以防位置闪烁 */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-1.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsRawMode(!isRawMode)}
          className={cn(
            'w-12 h-12 rounded-xl transition-all',
            isRawMode
              ? 'text-primary bg-primary/10'
              : 'text-white/50 hover:text-primary hover:bg-primary/10',
          )}
          title={isRawMode ? '返回预览' : '源码编辑'}
        >
          {isRawMode ? (
            <LayoutGrid className="w-5 h-5" />
          ) : (
            <FileCode className="w-5 h-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyFullScript}
          className="w-12 h-12 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-all"
          title="复制全卷脚本"
        >
          {isFullScriptCopied ? (
            <Check className="w-5 h-5 text-green-500" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
        </Button>
        <div className="h-px w-8 mx-auto bg-white/5" />

        {/* TTS 语音合成与播放控制 */}
        <div className="flex flex-col gap-2 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={ttsAudioUrl ? handlePlayPauseTts : handleGenerateTts}
            disabled={isTtsGenerating}
            className={cn(
              'w-12 h-12 rounded-xl transition-all relative',
              ttsAudioUrl
                ? isTtsPlaying
                  ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20'
                  : 'text-primary bg-primary/10 hover:bg-primary/20'
                : 'text-white/50 hover:text-primary hover:bg-primary/10',
            )}
            title={
              ttsAudioUrl ? (isTtsPlaying ? '暂停' : '播放语音') : '生成语音'
            }
          >
            {isTtsGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : ttsAudioUrl ? (
              isTtsPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )
            ) : (
              <AudioWaveform className="w-5 h-5" />
            )}
          </Button>

          {/* 语音合成后的导操作：导出全部 */}
          {ttsAudioUrl && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExportAll}
                disabled={isExporting}
                className="w-12 h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="导出全部媒体 (ZIP)"
              >
                {isExporting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleGenerateTts}
                disabled={isTtsGenerating}
                className="w-12 h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="重新生成语音"
              >
                <AudioWaveform className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-full flex flex-col items-center h-full">
        {/* 顶部居中的生成进度提示 - 恢复至顶部视觉焦点 */}
        {!isRawMode && videoGeneratingMap.size > 0 && (
          <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 pointer-events-none">
            <div
              className="flex items-center gap-2.5 px-3 py-1 rounded-full backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto"
              style={{
                background:
                  'linear-gradient(135deg, rgba(15, 10, 30, 0.85) 0%, rgba(30, 20, 50, 0.8) 100%)',
                boxShadow:
                  '0 4px 20px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                border: '1px solid rgba(139, 92, 246, 0.5)',
              }}
            >
              {/* 流光效果 */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />

              {/* 魔力图标 */}
              <div className="relative flex-shrink-0">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>

              {/* 任务列表 - 水平排列 */}
              <div className="flex items-center gap-3">
                {Array.from(videoGeneratingMap.entries()).map(
                  ([id, state], index) => {
                    const item = storyboards.find((s) => s.id === id);
                    if (!item) return null;

                    const statusEmoji =
                      state.status === 'queued'
                        ? '⏳'
                        : state.status === 'generating_image'
                          ? '🖼️'
                          : state.status === 'generating_video'
                            ? '🎬'
                            : state.status === 'uploading'
                              ? '💾'
                              : '⚡';

                    return (
                      <div key={id} className="flex items-center gap-1.5">
                        {index > 0 && <span className="text-white/20">·</span>}
                        <span className="text-[10px]">{statusEmoji}</span>
                        <span className="text-xs font-bold text-white/90 tabular-nums">
                          #{item.shotNumber}
                        </span>
                        <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${state.progress}%`,
                              background:
                                'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* 总体状态 */}
              <span className="text-[10px] text-white/50 font-medium pl-2 border-l border-white/10">
                {videoGeneratingMap.size} 个任务
              </span>
            </div>
          </div>
        )}

        <div className="w-[92vw] max-w-[1400px] mx-auto px-2 flex flex-col h-full grow">
          {isRawMode ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative group">
                <Textarea
                  value={rawText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  placeholder="支持 JSON 格式或 Markdown 表格: | 镜号 | 脚本 | 画面提示词 | 视频生成提示词 |"
                  className="h-[500px] bg-black/40 border-white/10 focus:border-primary/50 placeholder:text-white/10 font-mono text-sm leading-relaxed text-white/80 resize-none p-6 rounded-2xl backdrop-blur-xl"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-green-500 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                  已解析 {storyboards.length} 个分镜
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-1 h-full flex flex-col grow">
              {/* 分镜卡片轮播区域 */}
              <div className="relative h-[72vh] min-h-[500px] w-full shrink-0">
                {storyboards.map((item, idx) => {
                  // 判断是否是封面镜头
                  const isCover = item.shotNumber === 0;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'absolute inset-0 transition-all duration-700 ease-in-out',
                        idx === currentIndex
                          ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                          : idx < currentIndex
                            ? 'opacity-0 -translate-x-20 scale-95 pointer-events-none'
                            : 'opacity-0 translate-x-20 scale-95 pointer-events-none',
                      )}
                    >
                      {isCover ? (
                        /* 封面 UI - 极简一体化设计 */
                        <div className="bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-full relative">
                          {/* 封面内容区：两栏布局 */}
                          <div className="grid grid-cols-2 h-full">
                            {/* 左侧：封面图预览区 - 填满整个半边 */}
                            <div className="relative group/cover bg-black/40 overflow-hidden border-r border-white/5 flex flex-col items-center justify-center">
                              {item.imageUrl ? (
                                <>
                                  <img
                                    src={item.imageUrl}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/20 group-hover/cover:bg-black/10 transition-colors" />
                                  <button
                                    onClick={() => handleRemoveImage(item)}
                                    className="absolute top-6 right-6 w-10 h-10 bg-red-500/90 rounded-full flex items-center justify-center text-white text-xl opacity-0 group-hover/cover:opacity-100 transition-all hover:bg-red-500 shadow-2xl z-20"
                                  >
                                    ×
                                  </button>
                                </>
                              ) : videoGeneratingMap.has(item.id) ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-amber-500/10 to-transparent">
                                  <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                                  <p className="text-sm font-bold text-amber-500 animate-pulse">
                                    魔力生成中...
                                  </p>
                                </div>
                              ) : (
                                <div className="relative z-10 flex flex-col items-center gap-6">
                                  <div className="relative">
                                    <ImageIcon className="w-24 h-24 text-white/[0.05]" />
                                    <div className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full" />
                                  </div>
                                  <div className="flex flex-col gap-3">
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      onClick={() => handleGenerateImage(item)}
                                      disabled={videoGeneratingMap.has(item.id)}
                                      className="rounded-2xl border-amber-500/40 text-amber-400 bg-amber-500/5 hover:bg-amber-500/20 font-bold px-10 h-14 text-base shadow-2xl shadow-amber-500/20"
                                    >
                                      ✨ AI 一键生成封面
                                    </Button>
                                    <label className="h-14 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-10 text-sm font-bold text-white/40 hover:bg-white/10 cursor-pointer transition-all hover:text-white/60">
                                      手动上传本地图片
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) =>
                                          handleFileSelect(e, item)
                                        }
                                      />
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* 悬浮标签 - 始终在最上层 */}
                              <div className="absolute top-10 left-10 flex items-center gap-4 z-20">
                                <span className="px-5 py-2 bg-amber-500 text-black rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xl shadow-black/50">
                                  SHOT 0
                                </span>
                                <span className="text-lg font-black text-white drop-shadow-lg [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                                  视频封面
                                </span>
                              </div>
                            </div>

                            {/* 右侧：提示词区 */}
                            <div className="p-10 flex flex-col bg-black/10 relative">
                              <div className="flex items-center justify-between mb-8">
                                <span className="text-[11px] font-black text-amber-500/60 uppercase tracking-[0.2em]">
                                  Design Meta
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleCopy(
                                      item.stylePrompt
                                        ? `内容: ${item.imagePrompt}\n风格: ${item.stylePrompt}`
                                        : item.imagePrompt,
                                      `ip-${item.id}`,
                                    )
                                  }
                                  className="h-10 w-10 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 text-amber-500/40 hover:text-amber-500 transition-all"
                                >
                                  {copiedId === `ip-${item.id}` ? (
                                    <Check className="w-5 h-5 text-green-400" />
                                  ) : (
                                    <Copy className="w-5 h-5" />
                                  )}
                                </Button>
                              </div>

                              <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 space-y-8">
                                {item.imagePrompt && (
                                  <div className="space-y-3">
                                    <div className="text-[10px] text-amber-500/30 font-black uppercase tracking-widest pl-1">
                                      Content Prompt
                                    </div>
                                    <p className="text-base text-white/80 leading-relaxed font-medium pl-1">
                                      {item.imagePrompt}
                                    </p>
                                  </div>
                                )}
                                {item.stylePrompt && (
                                  <div className="space-y-3 pt-8 border-t border-white/5">
                                    <div className="text-[10px] text-amber-500/30 font-black uppercase tracking-widest pl-1">
                                      Artistic Style
                                    </div>
                                    <p className="text-sm text-white/40 leading-relaxed italic pl-1">
                                      {item.stylePrompt}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* 装饰图标 */}
                              <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.02]">
                                <Sparkles className="w-32 h-32 text-amber-500" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* 普通分镜 UI - 新布局 */
                        <div className="bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-full flex flex-col">
                          {/* 脚本标题区 */}
                          <div className="px-6 py-3 border-b border-white/5 bg-gradient-to-br from-primary/10 to-transparent shrink-0">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                                SHOT {item.shotNumber} /{' '}
                                {
                                  storyboards.filter((s) => s.shotNumber !== 0)
                                    .length
                                }
                              </span>
                              <div className="flex items-center gap-3">
                                {/* 图片/视频切换开关 */}
                                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                                  <button
                                    onClick={() => setMediaViewMode('image')}
                                    className={cn(
                                      'px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                                      mediaViewMode === 'image'
                                        ? 'bg-blue-500/30 text-blue-400'
                                        : 'text-white/30 hover:text-white/50',
                                    )}
                                  >
                                    <ImageIcon className="w-3 h-3" />
                                    图片
                                  </button>
                                  <button
                                    onClick={() => setMediaViewMode('video')}
                                    className={cn(
                                      'px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                                      mediaViewMode === 'video'
                                        ? 'bg-purple-500/30 text-purple-400'
                                        : 'text-white/30 hover:text-white/50',
                                    )}
                                  >
                                    <VideoIcon className="w-3 h-3" />
                                    视频
                                  </button>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleCopy(
                                      item.script
                                        .replace(
                                          /[^\u4e00-\u9fa5a-zA-Z0-9\s]/g,
                                          '\n',
                                        )
                                        .replace(/[ \t]+/g, ' ')
                                        .replace(/\n\s*\n/g, '\n')
                                        .trim(),
                                      `s-${item.id}`,
                                    )
                                  }
                                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                                >
                                  {copiedId === `s-${item.id}` ? (
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-white/40" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <p className="text-lg text-white font-semibold leading-tight tracking-tight">
                              {item.script}
                            </p>
                          </div>

                          {/* 媒体与提示词区域 - 左右布局 */}
                          <div className="flex-1 flex overflow-hidden">
                            {/* 左侧：媒体预览区（更宽） */}
                            <div className="flex-[3] p-1 flex items-stretch">
                              <div className="w-full overflow-hidden relative group/media">
                                {mediaViewMode === 'video' ? (
                                  /* 视频视图 */
                                  <>
                                    <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-purple-500/80 backdrop-blur-md rounded text-[9px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                      <VideoIcon className="w-3 h-3" /> VIDEO
                                    </div>
                                    {item.videoUrl ? (
                                      <>
                                        <video
                                          src={item.videoUrl}
                                          controls
                                          className="w-full h-full object-contain bg-black"
                                        />
                                        <button
                                          onClick={() =>
                                            handleRemoveVideo(item)
                                          }
                                          className="absolute top-3 right-3 w-7 h-7 bg-red-500/90 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 shadow-lg"
                                        >
                                          ×
                                        </button>
                                      </>
                                    ) : videoGeneratingMap.has(item.id) ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        <div className="relative">
                                          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] font-black text-purple-400">
                                              {videoGeneratingMap.get(item.id)
                                                ?.progress || 0}
                                              %
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-sm font-bold text-purple-400">
                                            {videoGeneratingMap.get(item.id)
                                              ?.status === 'generating_image'
                                              ? 'AI 生成参考图中'
                                              : videoGeneratingMap.get(item.id)
                                                    ?.status === 'uploading'
                                                ? '保存结果中'
                                                : 'AI 视频生成中'}
                                          </p>
                                          <p className="text-xs text-white/30 mt-1">
                                            请耐心等待...
                                          </p>
                                        </div>
                                      </div>
                                    ) : uploadingMap.get(item.id) ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-10 h-10 text-white/50 animate-spin" />
                                        <p className="text-xs font-bold text-white/50">
                                          上传视频中...
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-5">
                                        <VideoIcon className="w-16 h-16 text-white/5" />
                                        <div className="flex gap-3">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleGenerateVideo(item)
                                            }
                                            disabled={videoGeneratingMap.has(
                                              item.id,
                                            )}
                                            className="h-10 rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/20 font-bold px-6 text-sm disabled:opacity-50"
                                          >
                                            ✨ AI 生成视频
                                          </Button>
                                          <label className="h-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-bold text-white/40 hover:bg-white/10 cursor-pointer">
                                            上传视频
                                            <input
                                              type="file"
                                              accept="video/*"
                                              className="hidden"
                                              onChange={(e) =>
                                                handleVideoSelect(e, item)
                                              }
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  /* 图片视图 */
                                  <>
                                    <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-blue-500/80 backdrop-blur-md rounded text-[9px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                      <ImageIcon className="w-3 h-3" /> IMAGE
                                    </div>
                                    {item.imageUrl ? (
                                      <>
                                        <img
                                          src={item.imageUrl}
                                          className="w-full h-full object-contain bg-black"
                                        />
                                        <button
                                          onClick={() =>
                                            handleRemoveImage(item)
                                          }
                                          className="absolute top-3 right-3 w-7 h-7 bg-red-500/90 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 shadow-lg"
                                        >
                                          ×
                                        </button>
                                      </>
                                    ) : videoGeneratingMap.has(item.id) &&
                                      videoGeneratingMap.get(item.id)
                                        ?.status === 'generating_image' ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        <div className="relative">
                                          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                                        </div>
                                        <div className="text-center">
                                          <p className="text-sm font-bold text-blue-400">
                                            AI 生成图片中
                                          </p>
                                          <p className="text-xs text-white/30 mt-1">
                                            请耐心等待...
                                          </p>
                                        </div>
                                      </div>
                                    ) : uploadingMap.get(item.id) ? (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-10 h-10 text-white/50 animate-spin" />
                                        <p className="text-xs font-bold text-white/50">
                                          上传图片中...
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-5">
                                        <ImageIcon className="w-16 h-16 text-white/5" />
                                        <div className="flex gap-3">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              handleGenerateImage(item)
                                            }
                                            disabled={videoGeneratingMap.has(
                                              item.id,
                                            )}
                                            className="h-10 rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/20 font-bold px-6 text-sm disabled:opacity-50"
                                          >
                                            ✨ AI 生成图片
                                          </Button>
                                          <label className="h-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-sm font-bold text-white/40 hover:bg-white/10 cursor-pointer">
                                            上传图片
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) =>
                                                handleFileSelect(e, item)
                                              }
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 右侧：仅显示当前模式对应的提示词 */}
                            <div className="flex-1 p-3 bg-black/40 flex flex-col gap-3 overflow-y-auto min-w-[260px] max-w-[320px]">
                              {mediaViewMode === 'image'
                                ? /* 图片模式：显示画面提示词 */
                                  item.imagePrompt && (
                                    <div className="flex flex-col gap-3 h-full overflow-hidden">
                                      <div className="flex items-center justify-between shrink-0">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                          画面提示词
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleCopy(
                                              item.stylePrompt
                                                ? `内容: ${item.imagePrompt}\n风格: ${item.stylePrompt}`
                                                : item.imagePrompt,
                                              `ip-${item.id}`,
                                            )
                                          }
                                          className="h-6 w-6 rounded-lg bg-blue-500/10"
                                        >
                                          {copiedId === `ip-${item.id}` ? (
                                            <Check className="w-3 h-3 text-green-400" />
                                          ) : (
                                            <Copy className="w-3 h-3 text-blue-400/40" />
                                          )}
                                        </Button>
                                      </div>
                                      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                                        <div className="space-y-1.5">
                                          <div className="text-[9px] text-blue-400/80 font-black uppercase tracking-[0.15em]">
                                            内容 (Content)
                                          </div>
                                          <p className="text-[12px] text-white/90 leading-relaxed font-medium">
                                            {item.imagePrompt}
                                          </p>
                                        </div>
                                        {item.stylePrompt && (
                                          <div className="space-y-1.5 pt-3 border-t border-white/10">
                                            <div className="text-[9px] text-blue-300/80 font-black uppercase tracking-[0.15em]">
                                              风格 (Style)
                                            </div>
                                            <p className="text-[11px] text-blue-200/70 leading-relaxed font-medium italic">
                                              {item.stylePrompt}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                : /* 视频模式：显示视频提示词 */
                                  item.videoPrompt && (
                                    <div className="flex flex-col gap-3 h-full overflow-hidden">
                                      <div className="flex items-center justify-between shrink-0">
                                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
                                          视频提示词
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() =>
                                            handleCopy(
                                              `${item.imagePrompt}\n\nStyle: ${item.stylePrompt || 'Default'}\n\nMotion: ${item.videoPrompt}`,
                                              `vp-${item.id}`,
                                            )
                                          }
                                          className="h-6 w-6 rounded-lg bg-purple-500/10"
                                        >
                                          {copiedId === `vp-${item.id}` ? (
                                            <Check className="w-3 h-3 text-green-400" />
                                          ) : (
                                            <Copy className="w-3 h-3 text-purple-400/40" />
                                          )}
                                        </Button>
                                      </div>
                                      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
                                        {/* 内容部分 */}
                                        <div className="space-y-1.5">
                                          <div className="text-[9px] text-blue-400/80 font-black uppercase tracking-[0.15em]">
                                            内容 (Content)
                                          </div>
                                          <p className="text-[12px] text-white/90 leading-relaxed font-medium">
                                            {item.imagePrompt}
                                          </p>
                                        </div>

                                        {/* 风格部分 */}
                                        {item.stylePrompt && (
                                          <div className="space-y-1.5 pt-3 border-t border-white/10">
                                            <div className="text-[9px] text-blue-300/80 font-black uppercase tracking-[0.15em]">
                                              风格 (Style)
                                            </div>
                                            <p className="text-[11px] text-blue-200/70 leading-relaxed font-medium italic">
                                              {item.stylePrompt}
                                            </p>
                                          </div>
                                        )}

                                        {/* 动态部分 */}
                                        <div className="space-y-1.5 pt-3 border-t border-white/10">
                                          <div className="text-[9px] text-purple-400/80 font-black uppercase tracking-[0.15em]">
                                            动态 (Motion)
                                          </div>
                                          <p className="text-[12px] text-white/90 leading-relaxed font-medium">
                                            {item.videoPrompt}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 底部居中轮播导航 - 增强视觉样式 */}
              <div className="flex items-center gap-6 shrink-0 bg-black/40 backdrop-blur-2xl px-6 py-1.5 rounded-full border border-white/10 shadow-2xl mx-auto">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentIndex === 0}
                  className="w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-2">
                  {storyboards.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        'transition-all duration-500 rounded-full',
                        idx === currentIndex
                          ? 'w-6 h-1.5 bg-primary shadow-lg shadow-primary/50'
                          : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40',
                      )}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(storyboards.length - 1, prev + 1),
                    )
                  }
                  disabled={currentIndex === storyboards.length - 1}
                  className="w-8 h-8 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-5"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 隐藏的音频播放器用于全局 TTS 播放 */}
      <audio
        ref={audioRef}
        src={ttsAudioUrl}
        className="hidden"
        preload="auto"
      />
    </>
  );
}
