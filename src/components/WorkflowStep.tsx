import { useState, useEffect, useRef } from 'react';
import { domesticOpenai, openai } from '@/lib/ai';

import type {
  WorkflowStep as WorkflowStepType,
  StoryboardItem,
} from '../types';

import {
  parseStoryboardTable,
  extractJsonFromMarkdown,
  injectStyleIntoJson,
} from '../lib/storyboard';
import StoryboardEditor from './StoryboardEditor';
import PromptSidebar from './PromptSidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import {
  ListTodo,
  Wand2,
  LayoutGrid,
  Sparkles,
  FileCode,
  Copy,
  Check,
  AudioWaveform,
  Play,
  Pause,
  Download,
  Loader2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { MODELS, STYLE_CATEGORIES } from '../constants/workflow';
import GeneratingView from './Workflow/GeneratingView';
import StyleSelector from './Workflow/StyleSelector';
import ModelSelector from './Workflow/ModelSelector';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateMinimaxTts } from '../lib/tts';
import { uploadTtsAudio, deleteTtsAudio } from '../lib/storage';

interface WorkflowStepProps {
  taskId: string;
  step: WorkflowStepType;
  stepNumber: number;
  prevStepOutput: string;
  onUpdate: (updates: Partial<WorkflowStepType>) => void;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
  ttsAudioUrl?: string;
  onUpdateTtsAudioUrl?: (url: string) => void;
  taskTitle: string;
  showResultView: boolean;
  setShowResultView: (show: boolean) => void;
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;
}

export default function WorkflowStep({
  taskId,
  step,
  onUpdate,
  storyboards,
  onUpdateStoryboards,
  ttsAudioUrl,
  onUpdateTtsAudioUrl,
  taskTitle,
  showResultView,
  setShowResultView,
  isGenerating,
  setIsGenerating,
}: WorkflowStepProps) {
  const [input, setInput] = useState(step.input);
  const [output, setOutput] = useState(step.output);
  const [isPromptSidebarOpen, setIsPromptSidebarOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isStoryboardRawMode, setIsStoryboardRawMode] = useState(false);

  const [selectedModel, setSelectedModel] = useState(MODELS[0].id); // 默认 Qwen-Flash
  const [streamingText, setStreamingText] = useState(''); // 新增：用于展示流式文本
  const abortControllerRef = useRef<AbortController | null>(null);

  // TTS & Export States (Lifted from StoryboardEditor)
  const [isTtsGenerating, setIsTtsGenerating] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullScriptCopied, setIsFullScriptCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const storyboardsRef = useRef(storyboards);

  useEffect(() => {
    storyboardsRef.current = storyboards;
  }, [storyboards]);

  // Sync state
  useEffect(() => {
    setInput(step.input);
    setOutput(step.output);
  }, [step.input, step.output]);

  const handleInputChange = (value: string) => {
    setInput(value);
    onUpdate({ input: value, status: 'in-progress' });
  };

  const [selectedStyle, setSelectedStyle] = useState(
    STYLE_CATEGORIES[0].styles[0].id,
  );

  const selectedStyleConfig = STYLE_CATEGORIES.flatMap((c) => c.styles).find(
    (s) => s.id === selectedStyle,
  );

  // 当视觉风格改变时，自动更新所有分镜的 stylePrompt
  useEffect(() => {
    if (selectedStyleConfig && storyboards.length > 0) {
      const needsUpdate = storyboards.some(
        (s) => s.stylePrompt !== selectedStyleConfig.prompt,
      );
      if (needsUpdate) {
        const updated = storyboards.map((s) => ({
          ...s,
          stylePrompt: selectedStyleConfig.prompt,
        }));
        onUpdateStoryboards(updated);

        // 如果 output 是 JSON 格式，同步更新 output 中的 style_prompt
        if (output) {
          const updatedOutput = injectStyleIntoJson(
            output,
            selectedStyleConfig.prompt,
          );
          if (updatedOutput !== output) {
            setOutput(updatedOutput);
            onUpdate({ output: updatedOutput });
          }
        }
      }
    }
  }, [
    selectedStyle,
    selectedStyleConfig,
    storyboards.length,
    onUpdateStoryboards,
    output,
    onUpdate,
  ]);

  const getFullPrompt = () => {
    const stylePrompt = selectedStyleConfig?.prompt || '';
    let finalBasePrompt = step.basePrompt;

    if (!input.trim()) return '';

    const stylePlaceholder = '[STYLE_INSTRUCTION]';
    if (finalBasePrompt.includes(stylePlaceholder)) {
      finalBasePrompt = finalBasePrompt.replace(stylePlaceholder, stylePrompt);
    }

    return finalBasePrompt.replace('[USER_INPUT]', input);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStreamingText(''); // 重置流式文本
    setShowResultView(false); // 生成时切换到输入预览视图

    // 创建新的中止控制器
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let fullText = '';

      // 判断是否为国外模型，从而切换不同的 API Key 实例
      const isOverseasModel = [
        'gemini-3-flash-preview-search',
        'grok-4-1-fast-reasoning',
      ].includes(selectedModel);
      const aiClient = isOverseasModel ? openai : domesticOpenai;

      const response = await aiClient.chat.completions.create(
        {
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content:
                '你是一个专业的视频分镜脚本专家。请根据用户的需求，生成结构化的分镜脚本。',
            },
            {
              role: 'user',
              content: getFullPrompt(),
            },
          ],
          stream: true,
        },
        {
          signal: controller.signal,
        },
      );

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullText += content;
        setStreamingText(fullText);
      }

      const text = fullText;

      if (text) {
        const stylePrefix = selectedStyleConfig?.prompt || '';
        const rawOutput = extractJsonFromMarkdown(text);
        const cleanedOutput = injectStyleIntoJson(rawOutput, stylePrefix);

        setOutput(cleanedOutput);
        onUpdate({ output: cleanedOutput, status: 'in-progress' });

        const rawStoryboards = parseStoryboardTable(text, stylePrefix);
        const styledStoryboards = rawStoryboards.map((item) => {
          const cleanedPrompt = item.imagePrompt.trim();
          return {
            ...item,
            imagePrompt: cleanedPrompt,
            stylePrompt: stylePrefix,
          };
        });

        if (styledStoryboards.length > 0) {
          onUpdateStoryboards(styledStoryboards);
        }
        setShowResultView(true);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('生成已手动终止');
      } else {
        console.error('AI 生成失败:', error);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setShowResultView(false);
  };

  const handleSavePrompt = (newPrompt: string) => {
    onUpdate({ basePrompt: newPrompt });
    setIsPromptSidebarOpen(false);
  };

  const handleCopyFullScript = async () => {
    const fullScript = storyboards
      .filter((s) => s.shotNumber !== 0)
      .map((s) => s.script)
      .join('\n\n');
    try {
      const cleanedScript = fullScript
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
      await navigator.clipboard.writeText(cleanedScript);
      setIsFullScriptCopied(true);
      setTimeout(() => setIsFullScriptCopied(false), 1500);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleGenerateTts = async () => {
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
      if (ttsAudioUrl) {
        deleteTtsAudio(ttsAudioUrl).catch(console.error);
      }

      const localUrl = await generateMinimaxTts({
        text: fullScript,
        voice_id: 'Boyan_new_platform',
      });

      const response = await fetch(localUrl);
      const audioBlob = await response.blob();
      const uploadedUrl = await uploadTtsAudio(audioBlob, taskId);

      onUpdateTtsAudioUrl?.(uploadedUrl);
      URL.revokeObjectURL(localUrl);

      toast.success('语音合成成功', { id: toastId });

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = uploadedUrl;
        audioRef.current.load();
        audioRef.current.play().catch((err) => {
          console.warn('自动播放被拦截:', err);
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

  const handleExportAll = async () => {
    if (!storyboards.length) return;
    setIsExporting(true);
    const toastId = toast.loading('正在打包导出所有媒体...');

    try {
      const zip = new JSZip();
      const safeTitle = (taskTitle || 'project').replace(/[\\/:*?"<>|]/g, '_');
      const rootFolder = zip.folder(safeTitle);

      if (!rootFolder) throw new Error('Failed to create ZIP folder');

      if (ttsAudioUrl) {
        try {
          const audioRes = await fetch(ttsAudioUrl);
          const audioBlob = await audioRes.blob();
          rootFolder.file('full-audio.mp3', audioBlob);
        } catch (err) {
          console.error('Failed to fetch audio for export', err);
        }
      }

      const fetchPromises = storyboards.map(async (item) => {
        const shotName =
          item.shotNumber === 0 ? 'cover' : `shot-${item.shotNumber}`;

        if (item.imageUrl) {
          try {
            const res = await fetch(item.imageUrl);
            const blob = await res.blob();
            const extension =
              item.imageUrl.split('.').pop()?.split('?')[0] || 'png';
            rootFolder.file(`${shotName}.${extension}`, blob);
          } catch (err) {
            console.error(`Failed to fetch image for ${shotName}`, err);
          }
        }

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

  const handleResetClick = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    setInput('');
    setOutput('');
    onUpdate({ input: '', output: '', status: 'pending' });
    onUpdateStoryboards([]);
    setResetDialogOpen(false);
    setShowResultView(false);
  };

  return (
    <div className="space-y-6 relative h-full">
      <audio ref={audioRef} className="hidden" />

      {/* 统一视图控制容器 - 确保工具栏始终挂载 */}
      <div className="w-full h-full transform-gpu">
        {/* 垂直工具栏 - 这里的逻辑在判断渲染视图容器之外 */}
        <div
          className={cn(
            'fixed left-6 top-[20vh] z-50 flex flex-col gap-2 p-1.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl transition-all duration-300',
            isGenerating
              ? 'opacity-0 pointer-events-none translate-x-[-20px]'
              : 'opacity-100 translate-x-0',
          )}
        >
          <TooltipProvider delayDuration={0}>
            {!showResultView ? (
              /* 创意描述态工具栏 */
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowResultView(true)}
                      disabled={storyboards.length === 0}
                      className={cn(
                        'w-12 h-12 rounded-xl transition-all',
                        showResultView
                          ? 'text-primary bg-primary/10'
                          : 'text-white/50 hover:text-primary hover:bg-primary/10',
                      )}
                    >
                      <LayoutGrid className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                  >
                    查看分镜预览
                  </TooltipContent>
                </Tooltip>

                <div className="h-px w-8 mx-auto bg-white/5" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPromptSidebarOpen(true)}
                      className="w-12 h-12 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <ListTodo className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                  >
                    查看系统提示词
                  </TooltipContent>
                </Tooltip>

                <div className="h-px w-8 mx-auto bg-white/5" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleGenerate}
                      disabled={!input.trim()}
                      className={cn(
                        'w-12 h-12 rounded-xl transition-all duration-500 relative overflow-hidden group border',
                        input.trim()
                          ? 'text-white bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 border-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-110'
                          : 'text-white/50 bg-white/5 border-white/10 hover:text-primary hover:bg-primary/10',
                      )}
                    >
                      <Wand2
                        className={cn(
                          'w-5 h-5 transition-transform group-hover:rotate-12',
                          input.trim() && 'animate-pulse',
                        )}
                      />
                      {input.trim() && (
                        <>
                          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-fuchsia-500 blur-lg opacity-30 group-hover:opacity-60 transition-opacity -z-10" />
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                  >
                    生成视觉分镜
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              /* 分镜预览视图工具栏 (从 StoryboardEditor 迁移) */
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowResultView(false)}
                      className="w-12 h-12 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                  >
                    返回创意生成
                  </TooltipContent>
                </Tooltip>

                <div className="h-px w-8 mx-auto bg-white/5" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setIsStoryboardRawMode(!isStoryboardRawMode)
                      }
                      className={cn(
                        'w-12 h-12 rounded-xl transition-all',
                        isStoryboardRawMode
                          ? 'text-primary bg-primary/10'
                          : 'text-white/50 hover:text-primary hover:bg-primary/10',
                      )}
                    >
                      {isStoryboardRawMode ? (
                        <LayoutGrid className="w-5 h-5" />
                      ) : (
                        <FileCode className="w-5 h-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                  >
                    {isStoryboardRawMode ? '返回分镜预览' : '分镜文本编辑'}
                  </TooltipContent>
                </Tooltip>

                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyFullScript}
                        className="w-12 h-12 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        {isFullScriptCopied ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                    >
                      复制全卷脚本
                    </TooltipContent>
                  </Tooltip>

                  <div className="h-px w-8 mx-auto bg-white/5" />

                  <div className="flex flex-col gap-2 items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={
                            ttsAudioUrl ? handlePlayPauseTts : handleGenerateTts
                          }
                          disabled={isTtsGenerating}
                          className={cn(
                            'w-12 h-12 rounded-xl transition-all relative',
                            ttsAudioUrl
                              ? isTtsPlaying
                                ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20'
                                : 'text-primary bg-primary/10 hover:bg-primary/20'
                              : 'text-white/50 hover:text-primary hover:bg-primary/10',
                          )}
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
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                      >
                        {ttsAudioUrl
                          ? isTtsPlaying
                            ? '暂停'
                            : '播放语音'
                          : '生成语音'}
                      </TooltipContent>
                    </Tooltip>

                    {ttsAudioUrl && (
                      <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 fade-in duration-300">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleExportAll}
                              disabled={isExporting}
                              className="w-12 h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            >
                              {isExporting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                          >
                            导出全部媒体 (ZIP)
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleGenerateTts}
                              disabled={isTtsGenerating}
                              className="w-12 h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            >
                              <AudioWaveform className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-black/80 backdrop-blur-xl border-white/10 text-white font-bold text-xs py-2 px-3"
                          >
                            重新生成语音
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              </>
            )}
          </TooltipProvider>
        </div>

        {/* 生成状态视图 - 保持挂载以响应流式文本 */}
        <div
          className={cn(
            'animate-in fade-in duration-300',
            isGenerating ? 'block' : 'hidden',
          )}
        >
          <GeneratingView
            streamingText={streamingText}
            onCancel={handleCancel}
          />
        </div>

        {/* 结果预览视图 */}
        <div
          className={cn(
            'w-[calc(100vw-12rem)] max-w-[1400px] mx-auto animate-in fade-in duration-300 h-full',
            !isGenerating && showResultView && storyboards.length > 0
              ? 'block'
              : 'hidden',
          )}
        >
          <StoryboardEditor
            taskId={taskId}
            output={output}
            storyboards={storyboards}
            onUpdateStoryboards={onUpdateStoryboards}
            isRawMode={isStoryboardRawMode}
            setIsRawMode={setIsStoryboardRawMode}
            onReset={handleResetClick}
            stylePrompt={selectedStyleConfig?.prompt}
          />
        </div>

        {/* 创意描述视图 */}
        <div
          className={cn(
            'w-[calc(100vw-12rem)] max-w-[1400px] mx-auto animate-in fade-in duration-300',
            !isGenerating && !showResultView ? 'block' : 'hidden',
          )}
        >
          <Card className="glass-card border-primary/20 ring-1 ring-primary/10 shadow-2xl relative overflow-hidden gap-0 py-0 h-[85vh] min-h-[540px] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <CardHeader className="px-5 py-4 border-b border-white/5 flex flex-row items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white tracking-wide leading-tight">
                    创意描述
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    输入你的想法，AI 将自动生成视觉预览与分镜提示词
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-5 py-5 space-y-4 flex-1 flex flex-col overflow-hidden h-full">
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider shrink-0">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  创意描述
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="例如：一个年轻人在雨后的城市街道上奔跑..."
                  className="flex-1 min-h-[100px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-white/10 resize-none rounded-xl p-3 text-xs leading-relaxed font-medium transition-all shadow-inner text-white h-screen"
                />
              </div>

              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleSelect={setSelectedStyle}
              />

              <div className="pt-3 border-t border-white/5 w-full">
                <ModelSelector
                  selectedModel={selectedModel}
                  onModelSelect={setSelectedModel}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PromptSidebar
        isOpen={isPromptSidebarOpen}
        onClose={() => setIsPromptSidebarOpen(false)}
        basePrompt={step.basePrompt}
        onSave={handleSavePrompt}
      />

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="max-w-[400px] glass-card border-primary/20 shadow-2xl p-6 z-[100] bg-black/60 backdrop-blur-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-white tracking-tight">
              重置提示词与结果?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium py-3 text-sm">
              此操作将清除您当前所有的输入内容和已生成的全部分镜数据。该操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white h-11 px-6 font-bold">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white border-none shadow-lg shadow-destructive/20 h-11 px-6 font-bold"
            >
              确认重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
