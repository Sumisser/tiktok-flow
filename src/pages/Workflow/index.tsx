import { useParams, Link } from "react-router-dom";
import { useTasks } from "../../store/hooks";
import Timeline from "../../components/Timeline";
import WorkflowStep from "../../components/WorkflowStep";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Edit3, Check, X, LayoutDashboard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Workflow() {
  const { id } = useParams<{ id: string }>();
  const { getTask, updateTask, updateStep, updateStoryboards, isLoading } =
    useTasks();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

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

  const completedCount = task.steps.filter(
    (s) => s.status === "completed"
  ).length;
  const progressPercent = Math.round(
    (completedCount / task.steps.length) * 100
  );

  return (
    <div className="min-h-screen pb-32">
      {/* 头部 */}
      <header className="sticky top-0 z-50 glass border-b border-primary/20 py-6 px-8 mb-16 overflow-hidden">
        {/* 头部装饰背景 */}
        <div className="absolute top-0 left-1/4 w-64 h-full bg-primary/10 blur-[100px] -z-10 animate-pulse" />

        <div className="max-w-6xl mx-auto flex items-center gap-10">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-2xl hover:bg-primary/10 shrink-0 h-14 w-14 border border-border group transition-all shadow-sm"
          >
            <Link to="/">
              <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </Button>

          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                <Input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-3xl font-black bg-secondary border-primary/20 h-14 px-6 rounded-2xl ring-primary/20 shadow-inner"
                />
                <Button
                  onClick={handleTitleSave}
                  className="h-14 px-6 rounded-2xl shadow-2xl shadow-primary/20 font-black tracking-widest uppercase"
                >
                  <Check className="w-6 h-6 mr-2" />
                  保存
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditingTitle(false)}
                  className="h-14 w-14 rounded-2xl text-muted-foreground hover:bg-secondary border border-border"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-5 group">
                <h1 className="text-4xl font-black tracking-tighter truncate text-gradient text-neon">
                  {task.title}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingTitle(true)}
                  className="w-12 h-12 md:opacity-0 group-hover:opacity-100 transition-all rounded-2xl hover:bg-primary/5 hover:text-primary border border-border/50"
                >
                  <Edit3 className="w-6 h-6" />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
                <Badge
                  variant="outline"
                  className="text-[10px] h-6 font-black tracking-[0.2em] border-primary/20 bg-primary/5 text-primary px-3 rounded-md uppercase"
                >
                  核心架构-{task.id.slice(0, 8).toUpperCase()}
                </Badge>
              </div>
              <div className="h-4 w-px bg-border" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black opacity-40 flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                自主内容生成流水线
              </p>
            </div>
          </div>

          <div className="hidden xl:flex flex-col items-end gap-3 min-w-[240px]">
            <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 px-1">
              <span>流水线状态</span>
              <span className="text-primary font-black animate-pulse">
                {progressPercent}% 同步中
              </span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border shadow-inner p-0.5">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary to-accent rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--color-primary),0.2)]"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-5xl mx-auto px-6">
        <Timeline>
          {task.steps.map((step, index) => (
            <WorkflowStep
              key={step.id}
              taskId={task.id}
              step={step}
              stepNumber={index + 1}
              prevStepOutput={index > 0 ? task.steps[index - 1].output : ""}
              onUpdate={(updates) => updateStep(task.id, step.id, updates)}
              storyboards={task.storyboards || []}
              onUpdateStoryboards={(storyboards) =>
                updateStoryboards(task.id, storyboards)
              }
            />
          ))}
        </Timeline>
      </main>
    </div>
  );
}
