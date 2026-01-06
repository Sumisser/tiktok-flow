import { useTasks } from "../../store/hooks";
import TaskCard from "../../components/TaskCard";
import { useState } from "react";

export default function Home() {
  const { tasks, addTask, deleteTask } = useTasks();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎬</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI 视频工作流
            </h1>
          </div>

          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl
                         hover:from-purple-600 hover:to-pink-600 transition-all duration-300
                         shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40
                         flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              新建项目
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入项目名称..."
                autoFocus
                className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
                           transition-all duration-300 w-64"
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl
                           hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                创建
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewTitle("");
                }}
                className="px-4 py-2.5 bg-white/10 text-white/70 font-medium rounded-xl
                           hover:bg-white/20 transition-all"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="w-32 h-32 mb-8 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 
                            flex items-center justify-center border border-white/10"
            >
              <span className="text-6xl">📽️</span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">
              还没有项目
            </h2>
            <p className="text-white/60 mb-8 text-center max-w-md">
              点击「新建项目」开始你的第一个 AI 短视频创作之旅
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl
                         hover:from-purple-600 hover:to-pink-600 transition-all duration-300
                         shadow-lg shadow-purple-500/25"
            >
              开始创作
            </button>
          </div>
        ) : (
          /* Task Gallery */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onDelete={deleteTask} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
