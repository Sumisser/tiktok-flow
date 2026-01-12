import { useState, useRef, useEffect } from 'react';
import type { StoryboardItem } from '../types';
import {
  uploadStoryboardImage,
  uploadStoryboardVideo,
  deleteStoryboardImage,
} from '../lib/storage';
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
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { parseStoryboardTable } from '../lib/storyboard';

interface StoryboardEditorProps {
  taskId: string;
  output: string;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
  isRawMode: boolean;
  setIsRawMode: (mode: boolean) => void;
  onBack?: () => void;
  onReset?: () => void;
}

export default function StoryboardEditor({
  taskId,
  output,
  storyboards,
  onUpdateStoryboards,
  isRawMode,
  setIsRawMode,
  onBack,
  onReset,
}: StoryboardEditorProps) {
  /* eslint-disable react-hooks/exhaustive-deps */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullScriptCopied, setIsFullScriptCopied] = useState(false);
  const storyboardsRef = useRef(storyboards);
  const [rawText, setRawText] = useState(output);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    const fullScript = storyboards.map((s) => s.script).join('\n\n');
    try {
      await navigator.clipboard.writeText(fullScript);
      setIsFullScriptCopied(true);
      setTimeout(() => setIsFullScriptCopied(false), 1500);
    } catch {}
  };

  const handlePaste = async (e: React.ClipboardEvent, item: StoryboardItem) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;
    for (const clipItem of clipboardItems) {
      if (clipItem.type.startsWith('image/')) {
        e.preventDefault();
        setIsProcessing(true);
        const file = clipItem.getAsFile();
        if (file) {
          try {
            const imageUrl = await uploadStoryboardImage(
              file,
              taskId,
              item.shotNumber,
            );
            const updated = storyboards.map((s) =>
              s.id === item.id ? { ...s, imageUrl } : s,
            );
            onUpdateStoryboards(updated);
            setEditingId(null);
          } catch {
            toast.error('图片上传失败');
          }
        }
        setIsProcessing(false);
        return;
      }
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    item: StoryboardItem,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsProcessing(true);
    try {
      const imageUrl = await uploadStoryboardImage(
        file,
        taskId,
        item.shotNumber,
      );
      const updated = storyboards.map((s) =>
        s.id === item.id ? { ...s, imageUrl } : s,
      );
      onUpdateStoryboards(updated);
      setEditingId(null);
    } catch {
      toast.error('图片上传失败');
    }
    setIsProcessing(false);
  };

  const handleRemoveImage = async (item: StoryboardItem) => {
    if (item.imageUrl) await deleteStoryboardImage(item.imageUrl);
    const updated = storyboards.map((s) =>
      s.id === item.id ? { ...s, imageUrl: '' } : s,
    );
    onUpdateStoryboards(updated);
  };

  const handleVideoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    item: StoryboardItem,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;
    setIsProcessing(true);
    try {
      const videoUrl = await uploadStoryboardVideo(
        file,
        taskId,
        item.shotNumber,
      );
      const updated = storyboards.map((s) =>
        s.id === item.id ? { ...s, videoUrl } : s,
      );
      onUpdateStoryboards(updated);
      setEditingId(null);
    } catch {
      toast.error('视频上传失败');
    }
    setIsProcessing(false);
  };

  const handleRemoveVideo = async (item: StoryboardItem) => {
    if (item.videoUrl) await deleteStoryboardImage(item.videoUrl);
    const updated = storyboards.map((s) =>
      s.id === item.id ? { ...s, videoUrl: '' } : s,
    );
    onUpdateStoryboards(updated);
  };

  const handleGenerateVideo = async (_item: StoryboardItem) => {
    toast.info('视频生成中...');
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
      {!isRawMode && (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 p-1.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-12 h-12 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-all"
            title="返回输入"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="h-px w-8 mx-auto bg-white/5" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRawMode(true)}
            className="w-12 h-12 rounded-xl text-white/50 hover:text-primary hover:bg-primary/10 transition-all"
            title="源码编辑"
          >
            <FileCode className="w-5 h-5" />
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="w-12 h-12 rounded-xl text-white/30 hover:text-red-500 hover:bg-red-500/10 transition-all"
            title="重置任务"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      )}

      <div className="relative w-full flex flex-col items-center h-full">
        {/* 源码模式退出按钮 */}
        {isRawMode && (
          <div className="fixed top-8 right-8 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRawMode(false)}
              className="bg-black/40 backdrop-blur-xl border-white/10 text-primary font-black uppercase tracking-widest text-[10px] rounded-full px-6 h-10"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              返回预览
            </Button>
          </div>
        )}

        <div className="w-full max-w-[1400px] mx-auto px-4 flex flex-col h-full grow">
          {isRawMode ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative group">
                <Textarea
                  value={rawText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  placeholder="| 镜号 | 脚本 | 画面提示词 | 视频生成提示词 |"
                  className="h-[500px] bg-black/40 border-white/10 focus:border-primary/50 placeholder:text-white/10 font-mono text-sm leading-relaxed text-white/80 resize-none p-6 rounded-2xl backdrop-blur-xl"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-green-500 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20">
                  已解析 {storyboards.length} 个分镜
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-2 h-full flex flex-col grow">
              {/* 分镜卡片轮播区域 */}
              <div className="relative h-[480px] w-full shrink-0">
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
                        /* 封面专用 UI - 只有图片上传，无脚本和视频 */
                        <div className="bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl h-full flex flex-col">
                          <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent shrink-0">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-amber-500 text-black rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                                SHOT 0 /{' '}
                                {
                                  storyboards.filter((s) => s.shotNumber !== 0)
                                    .length
                                }
                              </span>
                              <span className="text-sm text-white/50 font-medium">
                                视频封面
                              </span>
                            </div>
                          </div>

                          {/* 内容区：图片 + 提示词 (左右排布) */}
                          <div className="flex-1 grid grid-cols-2 gap-px bg-white/5 overflow-hidden">
                            {/* 左侧：封面图上传区 */}
                            <div className="p-6 flex flex-col items-center justify-center bg-black/20 overflow-hidden h-full">
                              <div className="w-full aspect-video bg-black/60 rounded-2xl overflow-hidden relative group/media ring-2 ring-amber-500/30 shadow-2xl">
                                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500/80 backdrop-blur-md rounded-lg text-[10px] text-black font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                                  <ImageIcon className="w-3.5 h-3.5" /> COVER
                                  IMAGE
                                </div>
                                {item.imageUrl ? (
                                  <>
                                    <img
                                      src={item.imageUrl}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      onClick={() => handleRemoveImage(item)}
                                      className="absolute top-4 right-4 w-8 h-8 bg-red-500/90 rounded-full flex items-center justify-center text-white text-sm opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 shadow-lg"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                    {editingId === item.id ? (
                                      <div
                                        onPaste={(e) => handlePaste(e, item)}
                                        className="w-full h-full flex flex-col items-center justify-center p-4 outline-none"
                                        tabIndex={0}
                                      >
                                        <label className="cursor-pointer flex flex-col items-center gap-3">
                                          {isProcessing ? (
                                            <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
                                          ) : (
                                            <>
                                              <ImageIcon className="w-16 h-16 text-amber-500/40" />
                                              <span className="text-sm text-amber-400/70 font-bold">
                                                Ctrl+V 粘贴 或 点击上传
                                              </span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                  handleFileSelect(e, item)
                                                }
                                              />
                                            </>
                                          )}
                                        </label>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setEditingId(item.id)}
                                        className="flex flex-col items-center gap-4 text-white/20 hover:text-amber-500 transition-all group/add"
                                      >
                                        <ImageIcon className="w-20 h-20 group-hover/add:scale-110 transition-transform" />
                                        <span className="text-sm font-bold">
                                          添加封面图
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 右侧：封面图提示词 */}
                            <div className="p-6 flex flex-col bg-black/40 overflow-hidden h-full">
                              {item.imagePrompt && (
                                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                                  <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex-1 flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-3 shrink-0">
                                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                        封面设计提示词
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleCopy(
                                            item.imagePrompt!,
                                            `ip-${item.id}`,
                                          )
                                        }
                                        className="h-8 w-8 rounded-lg bg-amber-500/10"
                                      >
                                        {copiedId === `ip-${item.id}` ? (
                                          <Check className="w-4 h-4 text-green-400" />
                                        ) : (
                                          <Copy className="w-4 h-4 text-amber-400/50" />
                                        )}
                                      </Button>
                                    </div>
                                    <p className="text-sm text-amber-100/60 leading-relaxed font-mono overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                      {item.imagePrompt}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* 普通分镜 UI */
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleCopy(item.script, `s-${item.id}`)
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
                            <p className="text-lg text-white font-semibold leading-tight tracking-tight">
                              {item.script}
                            </p>
                          </div>

                          {/* 媒体与提示词混合区 */}
                          <div className="flex-1 grid grid-cols-2 gap-px bg-white/5 overflow-hidden">
                            {/* 左侧：画面预览与提示词 */}
                            <div className="p-3 flex flex-col gap-3 bg-black/20 overflow-hidden h-full">
                              <div className="aspect-[21/9] w-full bg-black/60 rounded-xl overflow-hidden relative group/media ring-1 ring-blue-500/20 shadow-xl shrink-0">
                                <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-blue-500/80 backdrop-blur-md rounded text-[9px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                  <ImageIcon className="w-3 h-3" /> IMAGE
                                </div>
                                {item.imageUrl ? (
                                  <>
                                    <img
                                      src={item.imageUrl}
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      onClick={() => handleRemoveImage(item)}
                                      className="absolute top-3 right-3 w-7 h-7 bg-red-500/90 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 shadow-lg"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    {editingId === item.id ? (
                                      <div
                                        onPaste={(e) => handlePaste(e, item)}
                                        className="w-full h-full flex flex-col items-center justify-center p-2 outline-none"
                                        tabIndex={0}
                                      >
                                        <label className="cursor-pointer flex flex-col items-center gap-1">
                                          {isProcessing ? (
                                            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                                          ) : (
                                            <>
                                              <ImageIcon className="w-8 h-8 text-blue-500/40" />
                                              <span className="text-[9px] text-blue-400/60 font-black uppercase text-center">
                                                Ctrl+V or Click
                                              </span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) =>
                                                  handleFileSelect(e, item)
                                                }
                                              />
                                            </>
                                          )}
                                        </label>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => setEditingId(item.id)}
                                        className="flex flex-col items-center gap-2 text-white/10 hover:text-blue-500 transition-all group/add"
                                      >
                                        <ImageIcon className="w-10 h-10 group-hover/add:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                          Add Reference
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              {item.imagePrompt && (
                                <div className="p-3 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex flex-col gap-2 overflow-hidden flex-1">
                                  <div className="flex items-center justify-between shrink-0">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                      画面提示词
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleCopy(
                                          item.imagePrompt!,
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
                                  <p className="text-[11px] text-blue-100/60 leading-relaxed font-mono tracking-tight overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                    {item.imagePrompt}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* 右侧：视频预览与提示词 */}
                            <div className="p-3 flex flex-col gap-3 bg-black/40 overflow-hidden h-full">
                              <div className="aspect-[21/9] w-full bg-black/60 rounded-xl overflow-hidden relative group/media ring-1 ring-purple-500/20 shadow-xl shrink-0">
                                <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-purple-500/80 backdrop-blur-md rounded text-[9px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                                  <VideoIcon className="w-3 h-3" /> VIDEO
                                </div>
                                {item.videoUrl ? (
                                  <>
                                    <video
                                      src={item.videoUrl}
                                      controls
                                      className="w-full h-full object-cover"
                                    />
                                    <button
                                      onClick={() => handleRemoveVideo(item)}
                                      className="absolute top-3 right-3 w-7 h-7 bg-red-500/90 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 shadow-lg"
                                    >
                                      ×
                                    </button>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                                    <VideoIcon className="w-10 h-10 text-white/5" />
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleGenerateVideo(item)
                                        }
                                        className="h-8 rounded-lg border-purple-500/30 text-purple-400 hover:bg-purple-500/20 font-black uppercase tracking-widest px-4 text-[9px]"
                                      >
                                        ✨ 智能生成
                                      </Button>
                                      <label className="h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-[9px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 cursor-pointer">
                                        上传
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
                              </div>
                              {item.videoPrompt && (
                                <div className="p-3 bg-purple-500/5 rounded-2xl border border-purple-500/10 flex flex-col gap-2 overflow-hidden flex-1">
                                  <div className="flex items-center justify-between shrink-0">
                                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                                      视频同步提示词
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleCopy(
                                          item.videoPrompt!,
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
                                  <p className="text-[11px] text-purple-100/60 leading-relaxed font-mono tracking-tight overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                    {item.videoPrompt}
                                  </p>
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
              <div className="flex items-center gap-6 shrink-0 bg-black/40 backdrop-blur-2xl px-6 py-1.5 rounded-full border border-white/10 shadow-2xl mx-auto mt-2">
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
    </>
  );
}
