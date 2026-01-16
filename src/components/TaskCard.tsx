import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../types';
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
import { Calendar, Trash2, Clapperboard, Play } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr || Date.now());
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
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

  // 寻找封面图：优先取 shot 0（专用封面），其次取第一个有图片的分镜
  const coverImage =
    task.storyboards?.find((s) => s.shotNumber === 0 && s.imageUrl)?.imageUrl ||
    task.storyboards?.find((s) => s.imageUrl)?.imageUrl;

  return (
    <div className="relative group">
      {/* 隐藏的删除按钮 - 仅在 hover 时出现 */}
      <div
        className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-white/50 hover:text-red-400 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all ring-1 ring-white/10"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div
        onClick={() => navigate(`/workflow/${task.id}`)}
        className="block cursor-pointer group/card active:scale-[0.98] transition-all duration-500 pointer-events-auto mt-2"
      >
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/5 group-hover/card:border-white/10 shadow-2xl group-hover/card:shadow-primary/10 transition-all duration-500">
          {/* Cover Image */}
          {coverImage ? (
            <div className="absolute inset-0 transition-transform duration-700 group-hover/card:scale-105">
              <img
                src={coverImage}
                alt={task.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover/card:opacity-60 transition-opacity duration-500" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/0 group-hover/card:from-primary/10 group-hover/card:to-primary/5 transition-colors duration-500">
              <Clapperboard className="w-12 h-12 text-white/10 group-hover/card:text-white/20 transition-colors" />
            </div>
          )}

          {/* Shot Count Badge */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5 z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black tracking-wider text-white/90 uppercase">
              {task.storyboards?.length || 0} SHOTS
            </span>
          </div>

          {/* Play Icon Overlay (Center) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-10 scale-90 group-hover/card:scale-100">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Bottom Info Section */}
          <div className="absolute inset-x-0 bottom-0 p-5 translate-y-2 group-hover/card:translate-y-0 transition-transform duration-500 z-20">
            <h3 className="text-lg font-bold text-white leading-tight line-clamp-2 md:line-clamp-1 group-hover/card:line-clamp-2 mb-2 drop-shadow-md group-hover/card:text-primary transition-colors">
              {task.title}
            </h3>

            <div className="flex items-center justify-between opacity-80 group-hover/card:opacity-100 transition-opacity delay-75">
              <div className="flex items-center gap-2 text-xs font-medium text-white/60">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(task.updatedAt)}</span>
              </div>

              {/* Tags */}
              <div className="flex gap-1">
                {task.tags?.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded-md bg-white/10 text-[9px] font-bold text-white/70 border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">确认删除</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              确定要删除项目「{task.title}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
