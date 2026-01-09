import { useState, useRef, useEffect } from 'react';
import type { StoryboardItem } from '../types';
import {
  uploadStoryboardImage,
  uploadStoryboardVideo,
  deleteStoryboardImage,
} from '../lib/storage';
import { toast } from 'sonner';

interface StoryboardEditorProps {
  taskId: string;
  output: string;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
  isRawMode: boolean;
  setIsRawMode: (mode: boolean) => void;
}

import { Textarea } from '@/components/ui/textarea';
import {
  FileCode,
  LayoutGrid,
  AlertCircle,
  Video,
  Image as ImageIcon,
} from 'lucide-react';

// 解析 Markdown 表格
function parseMarkdownTable(markdown: string): StoryboardItem[] {
  const lines = markdown.split('\n').filter((line) => line.trim());

  // 检查是否包含 Markdown 表格特征 (至少有两个 | )
  const hasTable = lines.some((line) => (line.match(/\|/g) || []).length >= 2);

  const items: StoryboardItem[] = [];

  if (hasTable) {
    for (const line of lines) {
      // 跳过表头（包含"镜号"）
      if (line.includes('镜号')) continue;

      // 跳过分隔线（只包含 |、-、:、空格的行）
      if (/^[\s|:-]+$/.test(line)) continue;

      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean);

      // 跳过分隔线单元格（只有 - 和 : 组成）
      if (cells.length > 0 && cells.every((cell) => /^[-:]+$/.test(cell)))
        continue;

      if (cells.length >= 3) {
        const shotNumber = parseInt(cells[0]) || items.length + 1;
        items.push({
          id: `shot-${shotNumber}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          shotNumber,
          script: cells[1] || '',
          imagePrompt: cells[2] || '',
          imageUrl: '',
          videoPrompt: cells[3] || '',
          videoUrl: '',
        });
      }
    }
  } else {
    // 兜底逻辑：如果是纯文本，按行拆分分镜
    lines.forEach((line, index) => {
      items.push({
        id: `shot-${index + 1}-${Date.now()}`,
        shotNumber: index + 1,
        script: line,
        imagePrompt: '', // 初始没有提示词
        imageUrl: '',
      });
    });
  }

  return items;
}

export default function StoryboardEditor({
  taskId,
  output,
  storyboards,
  onUpdateStoryboards,
  isRawMode,
  setIsRawMode,
}: StoryboardEditorProps) {
  /* eslint-disable react-hooks/exhaustive-deps */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const storyboardsRef = useRef(storyboards);
  const [rawText, setRawText] = useState(output);

  // Sync ref
  useEffect(() => {
    storyboardsRef.current = storyboards;
  }, [storyboards]);

  // Sync raw text from output only if not editing and output changed significantly
  useEffect(() => {
    if (!isRawMode && output && output !== rawText) {
      setRawText(output);
    }
  }, [output]);

  const handleParseAndMerge = (markdown: string) => {
    const newItems = parseMarkdownTable(markdown);
    // 合并现有图片信息，防止重新解析时丢失图片
    const mergedItems = newItems.map((newItem) => {
      const existingItem = storyboardsRef.current.find(
        (s) => s.shotNumber === newItem.shotNumber,
      );
      if (existingItem) {
        return {
          ...newItem,
          id: existingItem.id, // 保留原有ID
          imageUrl: existingItem.imageUrl || newItem.imageUrl, // 优先使用已存图片
          videoUrl: existingItem.videoUrl || newItem.videoUrl, // 优先使用已存视频
        };
      }
      return newItem;
    });

    // 只有当解析出有效内容时才更新
    if (mergedItems.length > 0) {
      onUpdateStoryboards(mergedItems);
    }
  };

  // 监听 output 变化，自动解析
  useEffect(() => {
    if (output) {
      handleParseAndMerge(output);
    }
  }, [output]);

  const handleRawTextChange = (value: string) => {
    setRawText(value);
    handleParseAndMerge(value);
  };

  // 复制文本并显示反馈
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  // 始终使用外部传入的 storyboards
  const items = storyboards;

  // 处理粘贴图片
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
            // 上传图片到 Supabase Storage
            const imageUrl = await uploadStoryboardImage(
              file,
              taskId,
              item.shotNumber,
            );

            const updated = items.map((storyboard) =>
              storyboard.id === item.id
                ? { ...storyboard, imageUrl }
                : storyboard,
            );
            onUpdateStoryboards(updated);
            setEditingId(null);
          } catch (error) {
            console.error('图片上传失败:', error);
            toast.error('图片上传失败，请重试');
          }
        }

        setIsProcessing(false);
        return;
      }
    }
  };

  // 处理文件选择
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    item: StoryboardItem,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsProcessing(true);
    try {
      // 上传图片到 Supabase Storage
      const imageUrl = await uploadStoryboardImage(
        file,
        taskId,
        item.shotNumber,
      );

      const updated = items.map((storyboard) =>
        storyboard.id === item.id ? { ...storyboard, imageUrl } : storyboard,
      );
      onUpdateStoryboards(updated);
      setEditingId(null);
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败，请重试');
    }
    setIsProcessing(false);
  };

  const handleRemoveImage = async (item: StoryboardItem) => {
    // 如果有图片URL，先删除 Supabase Storage 中的图片
    if (item.imageUrl) {
      await deleteStoryboardImage(item.imageUrl);
    }

    const updated = items.map((storyboardItem) =>
      storyboardItem.id === item.id
        ? { ...storyboardItem, imageUrl: '' }
        : storyboardItem,
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

      const updated = items.map((storyboard) =>
        storyboard.id === item.id ? { ...storyboard, videoUrl } : storyboard,
      );
      onUpdateStoryboards(updated);
      setEditingId(null);
    } catch (error) {
      console.error('视频上传失败:', error);
      toast.error('视频上传失败，请重试');
    }
    setIsProcessing(false);
  };

  const handleRemoveVideo = async (item: StoryboardItem) => {
    if (item.videoUrl) {
      await deleteStoryboardImage(item.videoUrl);
    }

    const updated = items.map((storyboardItem) =>
      storyboardItem.id === item.id
        ? { ...storyboardItem, videoUrl: '' }
        : storyboardItem,
    );
    onUpdateStoryboards(updated);
  };

  const isEmpty = items.length === 0;

  if (isEmpty && !isRawMode) {
    return (
      <div
        onClick={() => setIsRawMode(true)}
        className="group relative flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
      >
        <div className="p-4 rounded-full bg-white/5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 mb-4">
          <FileCode className="w-8 h-8 text-white/30 group-hover:text-primary" />
        </div>
        <p className="text-white/50 text-sm font-bold group-hover:text-white/80 transition-colors">
          暂无分镜数据
        </p>
        <p className="text-white/30 text-xs mt-2 group-hover:text-primary/70 transition-colors">
          点击此处切换至“源码编辑”模式粘贴数据
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题栏已移除，由父组件控制视图切换 */}

      {isRawMode ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="relative group">
            <Textarea
              value={rawText}
              onChange={(e) => handleRawTextChange(e.target.value)}
              placeholder="| 镜号 | 脚本 | 画面提示词 | 视频生成提示词 |\n|---|---|---|---|\n| 1 | ... | ... | ... |"
              className="h-[300px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-white/20 font-mono text-sm leading-relaxed text-white/80 resize-none p-6 rounded-xl"
            />
            {items.length > 0 && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] text-green-500 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 animate-in fade-in slide-in-from-bottom-2">
                <LayoutGrid className="w-3 h-3" />
                已解析 {items.length} 个分镜
              </div>
            )}
          </div>
          <p className="mt-3 text-[10px] text-white/30 flex items-center gap-1.5 px-2">
            <AlertCircle className="w-3 h-3" />
            在上方编辑 Markdown 表格，内容将实时同步到预览视图
          </p>
        </div>
      ) : (
        <div className="grid gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-black/20 rounded-2xl border border-white/5 overflow-hidden hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row gap-0">
                {/* 1. Media Area (Left) */}
                <div className="w-full md:w-56 bg-black/10 p-4 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-muted-foreground">
                      SHOT {item.shotNumber}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="aspect-video w-full bg-black/40 rounded-lg overflow-hidden relative group/media ring-1 ring-white/5">
                    <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white/70 font-bold flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Image
                    </div>
                    {item.imageUrl ? (
                      <>
                        <img
                          src={item.imageUrl}
                          alt={`Shot ${item.shotNumber}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(item)}
                          className="absolute top-2 right-2 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500"
                        >
                          ×
                        </button>
                      </>
                    ) : editingId === item.id ? (
                      <div
                        ref={dropzoneRef}
                        onPaste={(e) => handlePaste(e, item)}
                        className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                        tabIndex={0}
                      >
                        {isProcessing ? (
                          <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              Ctrl+V 粘贴或
                            </span>
                            <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] rounded font-bold hover:bg-primary/30">
                              上传文件
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(e, item)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingId(item.id)}
                        className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 hover:text-primary hover:bg-primary/5 transition-all gap-2"
                      >
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">
                          添加参考图
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Video */}
                  <div className="aspect-video w-full bg-black/40 rounded-lg overflow-hidden relative group/media ring-1 ring-white/5">
                    <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] text-white/70 font-bold flex items-center gap-1">
                      <Video className="w-3 h-3" /> Video
                    </div>
                    {item.videoUrl ? (
                      <>
                        <video
                          src={item.videoUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                        <button
                          onClick={() => handleRemoveVideo(item)}
                          className="absolute top-2 right-2 w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover/media:opacity-100 transition-all hover:bg-red-500 z-20"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 hover:text-blue-400 hover:bg-blue-500/5 transition-all cursor-pointer gap-2">
                        <Video className="w-6 h-6" />
                        <span className="text-[10px] font-bold">添加视频</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleVideoSelect(e, item)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* 2. Content Area (Right) */}
                <div className="flex-1 p-5 md:p-6 space-y-6">
                  {/* Script Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        分镜脚本
                      </div>
                      <button
                        onClick={() =>
                          handleCopy(item.script, `script-${item.id}`)
                        }
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedId === `script-${item.id}`
                          ? '已复制'
                          : '复制文本'}
                      </button>
                    </div>
                    <p className="text-base text-foreground leading-relaxed font-medium">
                      {item.script}
                    </p>
                  </div>

                  <div className="h-px bg-white/5 w-full" />

                  {/* Prompts Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Image Prompt */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3" /> Image Prompt
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(item.imagePrompt, `prompt-${item.id}`)
                          }
                          className="text-[10px] text-blue-400/60 hover:text-blue-400 transition-colors"
                        >
                          {copiedId === `prompt-${item.id}` ? '已复制' : '复制'}
                        </button>
                      </div>
                      <div className="p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                        <p className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">
                          {item.imagePrompt}
                        </p>
                      </div>
                    </div>

                    {/* Video Prompt */}
                    {item.videoPrompt && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider flex items-center gap-1.5">
                            <Video className="w-3 h-3" /> Video Prompt
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(
                                item.videoPrompt!,
                                `video-prompt-${item.id}`,
                              )
                            }
                            className="text-[10px] text-purple-400/60 hover:text-purple-400 transition-colors"
                          >
                            {copiedId === `video-prompt-${item.id}`
                              ? '已复制'
                              : '复制'}
                          </button>
                        </div>
                        <div className="p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                          <p className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">
                            {item.videoPrompt}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
