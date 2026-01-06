import { Link } from "react-router-dom";
import type { Task } from "../types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Clapperboard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  // 计算完成进度
  const completedSteps = task.steps.filter(
    (s) => s.status === "completed"
  ).length;
  const totalSteps = task.steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr || Date.now());
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("确定要删除这个项目吗？")) {
      onDelete(task.id);
    }
  };

  return (
    <Link to={`/workflow/${task.id}`} className="block group">
      <Card className="glass-card border-border hover:border-primary/50 transition-all duration-500 overflow-hidden relative active:scale-95 shadow-lg">
        {/* Dynamic Glow background */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 blur-[50px] group-hover:bg-primary/10 transition-all duration-500" />

        <CardHeader className="p-6 pb-2">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border text-primary shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Clapperboard className="w-5 h-5" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 md:opacity-0 group-hover:opacity-100 transition-all rounded-lg"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <CardTitle className="text-xl font-black line-clamp-1 group-hover:text-primary-gradient transition-all duration-300 tracking-tight">
            {task.title}
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-2">
            <Calendar className="w-3 h-3 text-primary/60" />
            {formatDate(task.updatedAt)}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-4 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                Completion
              </span>
              <span className="text-sm font-black text-primary">
                {progress === 100 ? "READY" : `${Math.round(progress)}%`}
              </span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border p-0.5">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--color-primary),0.2)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {task.steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-all duration-500",
                  step.status === "completed"
                    ? "bg-primary shadow-sm"
                    : step.status === "in-progress"
                    ? "bg-primary/40 animate-pulse"
                    : "bg-secondary"
                )}
                title={`第 ${index + 1} 步: ${step.title}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Badge
              variant="secondary"
              className="bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-black tracking-widest px-2.5 py-0.5 border border-primary/20 rounded-lg uppercase"
            >
              {totalSteps} STAGES
            </Badge>
            <div className="flex -space-x-2">
              {task.steps.slice(0, 4).map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-6 h-6 rounded-lg border-2 border-card flex items-center justify-center transition-all duration-300",
                    step.status === "completed"
                      ? "bg-primary text-primary-foreground scale-110 z-10 shadow-sm"
                      : "bg-secondary text-muted-foreground z-0"
                  )}
                >
                  {step.status === "completed" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <span className="text-[8px] font-black">{i + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
