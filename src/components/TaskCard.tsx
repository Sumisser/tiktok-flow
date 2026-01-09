import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Calendar, Trash2, Clapperboard, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 计算完成进度
  // const completedSteps = task.steps.filter(
  //   (s) => s.status === "completed"
  // ).length;
  // const totalSteps = task.steps.length;
  // const progress = (completedSteps / totalSteps) * 100;

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr || Date.now());
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(task.id);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="relative group">
      {/* 隐藏的删除按钮 - 完全脱离底层导航流 */}
      {/* 隐藏的删除按钮 - 完全脱离底层导航流 */}
      <div
        className="absolute top-6 right-6 z-30 pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 md:opacity-0 group-hover:opacity-100 transition-all rounded-xl backdrop-blur-3xl border border-white/5 bg-white/5 shadow-2xl"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div
        onClick={() => navigate(`/workflow/${task.id}`)}
        className="block h-full cursor-pointer active:scale-[0.99] transition-all duration-300 pointer-events-auto"
      >
        <Card className="glass-card border-border hover:border-primary/50 transition-all duration-500 overflow-hidden relative shadow-lg h-full">
          {/* 动态发光背景或图片预览 */}
          {task.storyboards?.[0]?.imageUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${task.storyboards[0].imageUrl})`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/40" />
            </>
          ) : (
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 blur-[50px] group-hover:bg-primary/10 transition-all duration-500" />
          )}

          <CardHeader className="p-6 pb-2 relative z-10">
            <div className="flex justify-between items-start mb-4 pr-12">
              <div
                className={cn(
                  'p-2.5 rounded-xl border transition-transform duration-500 group-hover:scale-110 shadow-sm',
                  task.storyboards?.[0]?.imageUrl
                    ? 'bg-black/40 border-white/10 text-white backdrop-blur-md'
                    : 'bg-gradient-to-br from-primary/10 to-accent/10 border-border text-primary',
                )}
              >
                <Clapperboard className="w-5 h-5" />
              </div>
            </div>
            <CardTitle className="text-xl font-black line-clamp-1 group-hover:text-primary-gradient transition-all duration-300 tracking-tight">
              {task.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-2">
              <Calendar className="w-3 h-3 text-primary/60" />
              {formatDate(task.updatedAt)}
            </CardDescription>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {task.tags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 bg-primary/5 text-primary/70 border-primary/20 rounded-md"
                  >
                    <Tag className="w-2.5 h-2.5 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="p-6 pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5"
                >
                  <Clapperboard className="w-3 h-3 mr-1" />
                  {task.storyboards?.length || 0} 个分镜
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除项目「{task.title}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
