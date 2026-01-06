import { useTasks } from "../../store/hooks";
import TaskCard from "../../components/TaskCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clapperboard, Plus, X, Search, Sparkles } from "lucide-react";

export default function Home() {
  const { tasks, addTask, deleteTask } = useTasks();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = () => {
    if (newTitle.trim()) {
      addTask(newTitle.trim());
      setNewTitle("");
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewTitle("");
    }
  };

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 glass border-b border-primary/20 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 text-primary shadow-lg shadow-primary/10">
              <Clapperboard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-neon leading-none">
                TikTok<span className="text-primary-gradient ml-1">Flow</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black opacity-50">
                  AI 视频创作实验室
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-lg relative hidden lg:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
            <Input
              placeholder="搜索项目名称..."
              className="pl-12 bg-secondary border-border focus:border-primary/50 transition-all rounded-2xl h-12 text-sm font-medium tracking-tight shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            {!isCreating ? (
              <Button
                onClick={() => setIsCreating(true)}
                className="rounded-2xl h-12 px-8 bg-primary text-primary-foreground shadow-2xl shadow-primary/30 group transition-all duration-500 hover:scale-[1.05] border-t border-white/20 active:scale-95"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                <span className="font-black uppercase tracking-widest text-xs">
                  新建项目
                </span>
              </Button>
            ) : (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-8 duration-500">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入项目标题..."
                  autoFocus
                  className="w-48 sm:w-80 h-12 bg-secondary border-primary/20 rounded-2xl px-5"
                />
                <Button
                  onClick={handleCreate}
                  className="h-12 px-6 rounded-2xl font-black shadow-2xl shadow-primary/20 border-t border-white/20"
                >
                  初始化
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreating(false)}
                  className="h-12 w-12 text-muted-foreground rounded-2xl hover:bg-secondary border border-border"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-8 py-20">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-48 text-center animate-in fade-in zoom-in duration-1000">
            <div className="relative mb-16">
              <div className="relative z-10 w-32 h-32 rounded-[3rem] bg-white border border-primary/20 flex items-center justify-center shadow-xl">
                <Sparkles className="w-14 h-14 text-primary animate-pulse" />
              </div>
              <div className="absolute -inset-16 bg-primary/10 blur-[120px] opacity-30 -z-10 animate-pulse" />
              <div className="absolute -inset-16 bg-accent/10 blur-[120px] opacity-20 -z-10 animate-pulse delay-1000" />
            </div>
            <h2 className="text-5xl font-black mb-6 tracking-tighter text-gradient text-neon">
              开启你的 AI 创作流
            </h2>
            <p className="text-muted-foreground max-w-lg mb-12 text-lg leading-relaxed font-medium">
              将原始想法转化为高质量视频素材。 <br />
              工业级 AI 视频编排与生产平台。
            </p>
            <Button
              size="lg"
              onClick={() => setIsCreating(true)}
              className="rounded-3xl px-12 h-16 text-lg font-black shadow-[0_20px_50px_rgba(var(--color-primary),0.4)] bg-primary text-primary-foreground transition-all duration-500 hover:scale-105 border-t border-white/20"
            >
              <Plus className="w-6 h-6 mr-3" />
              初始化首个流水线
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            <div className="flex items-end justify-between border-b border-border pb-8">
              <div className="space-y-2">
                <p className="text-[11px] text-primary font-black uppercase tracking-[0.5em] opacity-60">
                  项目注册表
                </p>
                <h2 className="text-4xl font-black tracking-tighter text-gradient">
                  活跃流水线
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="px-5 py-2 glass bg-white/50 rounded-2xl border border-border/50">
                  <p className="text-[10px] text-muted-foreground font-black tracking-[0.2em] uppercase">
                    总资产容量:{" "}
                    <span className="text-primary text-neon ml-2">
                      {filteredTasks.length}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={deleteTask} />
              ))}
            </div>

            {filteredTasks.length === 0 && (
              <div className="py-32 text-center glass border border-dashed border-border rounded-[3rem] animate-in fade-in duration-500">
                <Search className="w-12 h-12 text-primary/10 mx-auto mb-6" />
                <p className="text-muted-foreground font-black tracking-widest uppercase text-xs">
                  未在注册表中发现匹配项目
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
