import { useState, useRef, useEffect } from "react";
import type { StoryboardItem } from "../types";
import { uploadStoryboardImage, deleteStoryboardImage } from "../lib/storage";
import { toast } from "sonner";

interface StoryboardEditorProps {
  taskId: string;
  output: string;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
  isRawMode: boolean;
  setIsRawMode: (mode: boolean) => void;
}

import { Textarea } from "@/components/ui/textarea";
import { FileCode, LayoutGrid, AlertCircle } from "lucide-react";

// 解析 Markdown 表格
function parseMarkdownTable(markdown: string): StoryboardItem[] {
  const lines = markdown.split("\n").filter((line) => line.trim());

  // 检查是否包含 Markdown 表格特征 (至少有两个 | )
  const hasTable = lines.some((line) => (line.match(/\|/g) || []).length >= 2);

  const items: StoryboardItem[] = [];

  if (hasTable) {
    for (const line of lines) {
      // 跳过表头（包含"镜号"）
      if (line.includes("镜号")) continue;

      // 跳过分隔线（只包含 |、-、:、空格的行）
      if (/^[\s|:-]+$/.test(line)) continue;

      const cells = line
        .split("|")
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
          script: cells[1] || "",
          imagePrompt: cells[2] || "",
          imageUrl: "",
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
        imagePrompt: "", // 初始没有提示词
        imageUrl: "",
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
        (s) => s.shotNumber === newItem.shotNumber
      );
      if (existingItem) {
        return {
          ...newItem,
          id: existingItem.id, // 保留原有ID
          imageUrl: existingItem.imageUrl || newItem.imageUrl, // 优先使用已存图片
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
      console.error("复制失败:", error);
    }
  };

  // 始终使用外部传入的 storyboards
  const items = storyboards;

  // 处理粘贴图片
  const handlePaste = async (e: React.ClipboardEvent, item: StoryboardItem) => {
    const clipboardItems = e.clipboardData?.items;
    if (!clipboardItems) return;

    for (const clipItem of clipboardItems) {
      if (clipItem.type.startsWith("image/")) {
        e.preventDefault();
        setIsProcessing(true);

        const file = clipItem.getAsFile();
        if (file) {
          try {
            // 上传图片到 Supabase Storage
            const imageUrl = await uploadStoryboardImage(
              file,
              taskId,
              item.shotNumber
            );

            const updated = items.map((storyboard) =>
              storyboard.id === item.id
                ? { ...storyboard, imageUrl }
                : storyboard
            );
            onUpdateStoryboards(updated);
            setEditingId(null);
          } catch (error) {
            console.error("图片上传失败:", error);
            toast.error("图片上传失败，请重试");
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
    item: StoryboardItem
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setIsProcessing(true);
    try {
      // 上传图片到 Supabase Storage
      const imageUrl = await uploadStoryboardImage(
        file,
        taskId,
        item.shotNumber
      );

      const updated = items.map((storyboard) =>
        storyboard.id === item.id ? { ...storyboard, imageUrl } : storyboard
      );
      onUpdateStoryboards(updated);
      setEditingId(null);
    } catch (error) {
      console.error("图片上传失败:", error);
      toast.error("图片上传失败，请重试");
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
        ? { ...storyboardItem, imageUrl: "" }
        : storyboardItem
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
              placeholder="| 镜号 | 脚本 | 画面提示词 |\n|---|---|---|\n| 1 | ... | ... |"
              className="h-[200px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-white/20 font-mono text-sm leading-relaxed text-white/80 resize-none p-6 rounded-xl"
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
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
            >
              {/* 头部：镜号 + 图片 */}
              <div className="flex items-start gap-4 p-4">
                {/* 图片区域 */}
                <div className="w-32 h-24 bg-black/30 flex-shrink-0 relative rounded-lg overflow-hidden">
                  {item.imageUrl ? (
                    <>
                      <img
                        src={item.imageUrl}
                        alt={`分镜 ${item.shotNumber}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(item)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 rounded-full 
                                 flex items-center justify-center text-white text-xs
                                 hover:bg-red-500 transition-all"
                      >
                        ×
                      </button>
                    </>
                  ) : editingId === item.id ? (
                    <div
                      ref={dropzoneRef}
                      onPaste={(e) => handlePaste(e, item)}
                      className="w-full h-full p-2 flex flex-col items-center justify-center
                                 border-2 border-dashed border-primary/50 bg-primary/10"
                      tabIndex={0}
                    >
                      {isProcessing ? (
                        <div className="text-foreground/60 text-xs">
                          处理中...
                        </div>
                      ) : (
                        <>
                          <div className="text-foreground/70 text-xs text-center mb-1">
                            Ctrl+V 粘贴
                          </div>
                          <label
                            className="px-2 py-0.5 bg-primary/50 text-white text-xs rounded cursor-pointer
                                           hover:bg-primary/70 transition-all font-bold"
                          >
                            选择文件
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(e, item)}
                              className="hidden"
                            />
                          </label>
                          <button
                            onClick={() => setEditingId(null)}
                            className="mt-1 text-muted-foreground text-xs hover:text-foreground/60"
                          >
                            取消
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingId(item.id)}
                      className="w-full h-full flex flex-col items-center justify-center 
                                 text-muted-foreground hover:text-foreground/60 hover:bg-black/5 transition-all"
                    >
                      <svg
                        className="w-6 h-6 mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-xs font-bold">添加图片</span>
                    </button>
                  )}
                </div>

                {/* 镜号和脚本 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded font-black">
                      镜 {item.shotNumber}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(item.script, `script-${item.id}`)
                      }
                      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground 
                                 hover:text-foreground hover:bg-black/5 rounded transition-all font-bold"
                    >
                      {copiedId === `script-${item.id}` ? (
                        <svg
                          className="w-3 h-3 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                      {copiedId === `script-${item.id}` ? "已复制" : "复制脚本"}
                    </button>
                  </div>
                  <p className="text-foreground font-medium text-sm leading-relaxed">
                    {item.script}
                  </p>
                </div>
              </div>

              {/* 提示词区域 */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-end mb-2">
                  <button
                    onClick={() =>
                      handleCopy(item.imagePrompt, `prompt-${item.id}`)
                    }
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary 
                               hover:text-primary/80 hover:bg-primary/10 rounded transition-all font-black"
                  >
                    {copiedId === `prompt-${item.id}` ? (
                      <svg
                        className="w-3 h-3 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                    {copiedId === `prompt-${item.id}` ? "已复制" : "复制提示词"}
                  </button>
                </div>
                <div className="p-3 bg-secondary/50 rounded-lg border border-border">
                  <p className="text-foreground/80 text-xs leading-relaxed font-mono whitespace-pre-wrap break-all">
                    {item.imagePrompt}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
