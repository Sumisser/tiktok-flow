import { Link } from "react-router-dom";
import { Task } from "../types";

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
  const progress = Math.round((completedSteps / totalSteps) * 100);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
    <Link to={`/workflow/${task.id}`} className="group relative block">
      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 
                      backdrop-blur-xl border border-white/10
                      hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10
                      transition-all duration-500 hover:-translate-y-1"
      >
        {/* 渐变装饰 */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* 删除按钮 */}
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/20 text-red-400
                     opacity-0 group-hover:opacity-100 transition-all duration-300
                     hover:bg-red-500/40 flex items-center justify-center z-10"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-5">
          {/* 标题 */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
            {task.title}
          </h3>

          {/* 时间信息 */}
          <p className="text-sm text-white/50 mb-4">
            {formatDate(task.updatedAt)}
          </p>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">进度</span>
              <span className="text-purple-400 font-medium">
                {completedSteps}/{totalSteps} 步骤
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 步骤状态指示器 */}
          <div className="flex items-center gap-2 mt-4">
            {task.steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  step.status === "completed"
                    ? "bg-green-500"
                    : step.status === "in-progress"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-white/20"
                }`}
                title={`步骤 ${index + 1}: ${step.title}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
