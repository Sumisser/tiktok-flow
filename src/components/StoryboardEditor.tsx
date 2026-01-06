import { useState, useRef, useEffect } from "react";
import type { StoryboardItem } from "../types";
import { uploadStoryboardImage, deleteStoryboardImage } from "../lib/storage";

interface StoryboardEditorProps {
  taskId: string;
  output: string;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
}

// 解析 Markdown 表格
function parseMarkdownTable(markdown: string): StoryboardItem[] {
  const lines = markdown.split("\n").filter((line) => line.trim());
  const items: StoryboardItem[] = [];

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
        id: `shot-${shotNumber}`,
        shotNumber,
        script: cells[1] || "",
        imagePrompt: cells[2] || "",
        imageUrl: "",
      });
    }
  }

  return items;
}

export default function StoryboardEditor({
  taskId,
  output,
  storyboards,
  onUpdateStoryboards,
}: StoryboardEditorProps) {
  /* eslint-disable react-hooks/exhaustive-deps */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // 监听 output 变化，自动解析并重置所有分镜内容
  useEffect(() => {
    if (output) {
      const newItems = parseMarkdownTable(output);
      onUpdateStoryboards(newItems);
    }
  }, [output]);

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
            alert("图片上传失败，请重试");
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
      alert("图片上传失败，请重试");
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

  if (items.length === 0) {
    return (
      <div className="text-white/50 text-center py-8">
        暂无分镜数据，请先粘贴 AI 生成的分镜表格
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">分镜图片管理</h4>
        <span className="text-white/50 text-sm">{items.length} 个分镜</span>
      </div>

      <div className="grid gap-4">
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
                    onClick={() => handleCopy(item.script, `script-${item.id}`)}
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
                <p className="text-foreground/90 text-sm leading-relaxed font-medium">
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
                <p className="text-muted-foreground text-xs leading-relaxed font-mono whitespace-pre-wrap break-all">
                  {item.imagePrompt}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
