import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
import { useAuth, ADMIN_EMAIL } from '../store/auth';
// 移除未使用的 UI 组件导入
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
import { Calendar, Trash2, Clapperboard, User } from 'lucide-react';
// 移除未使用的 cn 导入

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 当前用户是否是管理员
  const isAdmin = user?.email === ADMIN_EMAIL;
  // 任务是否属于其他人
  const isOthersTask = task.user_email && task.user_email !== user?.email;
  // 是否显示创建者信息（管理员查看他人数据时显示）
  const showOwner = isAdmin && isOthersTask;

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

  // 寻找第一个有图片的分镜作为封面
  const coverImage = task.storyboards?.find((s) => s.imageUrl)?.imageUrl;

  return (
    <div className="relative group">
      {/* 隐藏的删除按钮 - 完全脱离底层导航流 */}
      <div
        className="absolute top-4 right-4 z-30 pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 md:opacity-0 group-hover:opacity-100 transition-all rounded-lg backdrop-blur-3xl border border-white/5 bg-white/5 shadow-2xl"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div
        onClick={() => navigate(`/workflow/${task.id}`)}
        className="block cursor-pointer active:scale-[0.98] transition-all duration-300 pointer-events-auto"
      >
        <div className="glass-card flex items-center gap-4 p-3.5 border border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden relative shadow-lg rounded-2xl h-32">
          {/* 左侧：缩略图/图标区 */}
          <div className="relative w-24 h-full rounded-xl overflow-hidden shrink-0 bg-white/5 shadow-inner">
            {coverImage ? (
              <>
                <img
                  src={coverImage}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <Clapperboard className="w-6 h-6 text-primary/40" />
              </div>
            )}

            {/* 分镜数量角标 - 悬浮在缩略图上 */}
            <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-black text-white/90 border border-white/10 uppercase tracking-tighter">
              {task.storyboards?.length || 0} SHOTS
            </div>
          </div>

          {/* 右侧：信息区 */}
          <div className="flex flex-col justify-center flex-1 min-w-0 pr-10">
            <h3 className="text-[15px] font-black text-white line-clamp-2 group-hover:text-primary transition-colors tracking-tight leading-snug mb-2">
              {task.title}
            </h3>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
                <Calendar className="w-3 h-3 text-primary/30" />
                {formatDate(task.updatedAt)}
              </div>

              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {task.tags.slice(0, 2).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary/80 border border-primary/10 rounded-md font-bold truncate max-w-[80px]"
                    >
                      {tag}
                    </span>
                  ))}
                  {task.tags.length > 2 && (
                    <span className="text-[10px] text-white/20 font-bold">
                      +{task.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右下角：创建者信息（仅管理员查看他人数据时显示） */}
          {showOwner && (
            <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 px-2 py-1 bg-accent/20 backdrop-blur-md rounded-md border border-accent/20">
              <User className="w-3 h-3 text-accent" />
              <span className="text-[9px] font-bold text-accent truncate max-w-[80px]">
                {task.user_email?.split('@')[0]}
              </span>
            </div>
          )}
        </div>
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
