import { useParams, Link } from "react-router-dom";
import { useTasks } from "../../store/hooks";

import WorkflowStep from "../../components/WorkflowStep";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Edit3, Check, X, Home, Tag } from "lucide-react";

export default function Workflow() {
  const { id } = useParams<{ id: string }>();
  const {
    getTask,
    updateTask,
    updateStep,
    updateStoryboards,
    isLoading,
    wallpaperUrl,
    wallpaperAttribution,
  } = useTasks();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const task = getTask(id || "");

  useEffect(() => {
    if (task) {
      setTitleInput(task.title);
    }
  }, [task?.id]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="space-y-8 text-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-12 h-12 border-4 border-primary/5 border-t-primary/60 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1s",
                }}
              />
            </div>
          </div>
          <p className="text-lg font-black tracking-widest uppercase text-muted-foreground">
            正在加载项目...
          </p>
        </div>
      </div>
    );
  }

  // 项目不存在
  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="w-24 h-24 bg-destructive/10 rounded-[2.5rem] mx-auto flex items-center justify-center border border-destructive/20 relative z-10">
              <X className="w-12 h-12 text-destructive" />
            </div>
            <div className="absolute -inset-8 bg-destructive/10 blur-[60px] opacity-40 -z-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">项目不存在</h2>
            <p className="text-muted-foreground">
              该项目可能已被删除，或链接地址有误。
            </p>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-2xl px-8 h-12 border-border hover:bg-secondary shadow-sm"
          >
            <Link to="/" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              返回首页
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== task.title) {
      updateTask(task.id, { title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitleInput(task.title);
      setIsEditingTitle(false);
    }
  };

  // const completedCount = task.steps.filter(
  //   (s) => s.status === "completed"
  // ).length;
  // const progressPercent = Math.round(
  //   (completedCount / task.steps.length) * 100
  // );

  return (
    <div className="min-h-screen pb-32 relative text-white">
      {/* 背景图片 */}
      {wallpaperUrl && (
        <>
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${wallpaperUrl})`,
            }}
          />
          {/* 浅色遮罩层 */}
          <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        </>
      )}
      {/* 头部 */}
      <header className="fixed top-0 left-0 right-0 border-b border-primary/20 py-3 px-6  overflow-hidden z-20 bg-background/80 backdrop-blur-md">
        {/* 头部装饰背景 */}
        <div className="absolute top-0 left-1/4 w-64 h-full bg-primary/10 blur-[100px] -z-10 animate-pulse" />

        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-primary/10 shrink-0 h-10 w-10 border border-border group transition-all shadow-sm"
          >
            <Link to="/">
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>

          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-2xl font-black bg-secondary border-primary/20 h-11 px-5 rounded-xl ring-primary/20 shadow-inner"
                />
                <Button
                  onClick={handleTitleSave}
                  className="h-11 px-5 rounded-xl shadow-xl shadow-primary/20 font-black tracking-wider uppercase text-sm"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  保存
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditingTitle(false)}
                  className="h-11 w-11 rounded-xl text-muted-foreground hover:bg-secondary border border-border"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 group min-w-0">
                  <h1 className="text-2xl font-black tracking-tight truncate text-gradient text-neon">
                    {task.title}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingTitle(true)}
                    className="w-9 h-9 md:opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-primary/5 hover:text-primary border border-border/50"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>

                {/* 标签管理区域 - 居中对齐 */}
                <div className="flex flex-wrap items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4 duration-500 shrink-0">
                  {task.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1 pl-2.5 pr-1.5 py-0.5 h-6 text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-default"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          const newTags = task.tags?.filter(
                            (_, i) => i !== index
                          );
                          updateTask(task.id, { tags: newTags });
                        }}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}

                  <div className="relative group/tag">
                    {isAddingTag ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && tagInput.trim()) {
                              const newTags = [
                                ...(task.tags || []),
                                tagInput.trim(),
                              ];
                              updateTask(task.id, { tags: newTags });
                              setTagInput("");
                              setIsAddingTag(false);
                            } else if (e.key === "Escape") {
                              setIsAddingTag(false);
                              setTagInput("");
                            }
                          }}
                          autoFocus
                          onBlur={() => {
                            if (!tagInput.trim()) setIsAddingTag(false);
                          }}
                          placeholder="输入标签..."
                          className="h-6 w-24 text-xs bg-black/20 border-white/10 px-2 rounded-lg"
                        />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingTag(true)}
                        className="h-6 px-2 text-[10px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg transition-all"
                      >
                        <Tag className="w-3 h-3 mr-1.5" />
                        添加标签
                      </Button>
                    )}
                  </div>

                  {/* Unsplash 归属信息 */}
                  {wallpaperAttribution && (
                    <div className="flex items-center gap-1.5 ml-3 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] text-white/80 drop-shadow-md">
                      <span>Photo by</span>
                      <a
                        href={wallpaperAttribution.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-white transition-colors"
                      >
                        {wallpaperAttribution.photographerName}
                      </a>
                      <span>on</span>
                      <a
                        href={wallpaperAttribution.unsplashUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-white transition-colors"
                      >
                        Unsplash
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="w-full overflow-x-hidden pb-12 mt-36">
        <div className="w-full px-4 md:px-12 lg:px-24">
          <div className="max-w-7xl mx-auto space-y-12">
            {task.steps.length > 0 && (
              <WorkflowStep
                key={task.steps[0].id}
                taskId={task.id}
                step={task.steps[0]}
                stepNumber={1}
                prevStepOutput="" // Single step workflow doesn't need prev output
                onUpdate={(updates) =>
                  updateStep(task.id, task.steps[0].id, updates)
                }
                storyboards={task.storyboards || []}
                onUpdateStoryboards={(storyboards) =>
                  updateStoryboards(task.id, storyboards)
                }
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
