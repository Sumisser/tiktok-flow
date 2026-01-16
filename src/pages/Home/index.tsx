import { useTasks } from '../../store/hooks';
import { useAuth } from '../../store/auth';
import TaskCard from '../../components/TaskCard';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, LogOut } from 'lucide-react';
import jellyfishIcon from '@/assets/jellyfish.png';

const useTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
};

const useQuote = () => {
  const [quote, setQuote] = useState<{
    content: string;
    origin?: string;
    author?: string;
  } | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch('https://api.xygeng.cn/one');
        const data = await response.json();
        if (data.code === 200 && data.data) {
          setQuote({
            content: data.data.content,
            origin: data.data.origin,
            author: data.data.name !== '佚名' ? data.data.name : undefined,
          });
        }
      } catch (error) {
        console.error('获取名言失败:', error);
        setQuote({
          content: '一个人至少拥有一个梦想，有一个理由去强大。',
          author: '三毛',
        });
      }
    };

    fetchQuote();
  }, []);

  return quote;
};

export default function Home() {
  const { tasks, isLoading, addTask, deleteTask, wallpaperUrl } = useTasks();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const currentTime = useTime();
  const quote = useQuote();

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    '创作者';

  const greeting =
    currentTime.getHours() < 12
      ? '早上好'
      : currentTime.getHours() < 18
        ? '下午好'
        : '晚上好';

  const handleCreate = async () => {
    if (newTitle.trim()) {
      const newTask = await addTask(newTitle.trim());
      setNewTitle('');
      setIsCreating(false);
      navigate(`/workflow/${newTask.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewTitle('');
    }
  };

  // 提取所有唯一标签
  const allTags = Array.from(
    new Set(tasks.flatMap((task) => task.tags || [])),
  ).sort();

  const filteredTasks = tasks.filter((task) => {
    const searchLower = searchQuery.toLowerCase();
    const matchTitle = task.title.toLowerCase().includes(searchLower);
    const matchTags = task.tags?.some((tag) =>
      tag.toLowerCase().includes(searchLower),
    );
    const matchSelectedTag = selectedTag
      ? task.tags?.includes(selectedTag)
      : true;

    return (matchTitle || matchTags) && matchSelectedTag;
  });

  const hasTasks = tasks.length > 0;

  // Default Cinematic Wallpaper
  const defaultWallpaper =
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop';
  const activeWallpaper =
    wallpaperUrl && wallpaperUrl.trim() !== ''
      ? wallpaperUrl
      : defaultWallpaper;

  return (
    <div className="min-h-screen text-white overflow-x-hidden selection:bg-primary/30 relative font-sans">
      {/* Cinematic Background Layer */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-[ken-burns_30s_ease-in-out_infinite_alternate]"
          style={{ backgroundImage: `url(${activeWallpaper})` }}
        />
        {/* Gradient Overlay - Vibrant but legible */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-indigo-950/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[0px]" />
      </div>

      {/* Floating HUD Header - Always Centered/Available */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 pointer-events-none flex justify-center">
        <div className="flex items-center gap-3 p-1.5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl ring-1 ring-white/5 pointer-events-auto transition-all duration-500 hover:bg-black/70 hover:scale-[1.01] hover:shadow-primary/5">
          {/* Brand / Home Shortcut */}
          <div
            className="pl-4 pr-4 flex items-center gap-3 border-r border-white/10 group cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full animate-pulse-slow group-hover:bg-primary/50 transition-colors" />
              <img
                src={jellyfishIcon}
                alt="JellyFlow"
                className="relative w-7 h-7 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-green-400 rounded-full border border-black shadow-[0_0_8px_rgba(74,222,128,1)] animate-ping" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-extrabold tracking-tight text-sm leading-none text-white group-hover:text-primary transition-colors">
                JellyFlow
              </span>
              <span className="text-[9px] font-bold text-primary/80 tracking-[0.2em] uppercase leading-none mt-1 scale-90 origin-left">
                AI Studio
              </span>
            </div>
          </div>

          {/* Search Bar - Expands when tasks exist */}
          {hasTasks && !isCreating && (
            <div className="relative group w-64 transition-all focus-within:w-80 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索创作流..."
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-full h-9 pl-9 pr-4 text-xs font-medium placeholder:text-white/20 border-none outline-none ring-1 ring-transparent focus:ring-white/10 transition-all"
              />
            </div>
          )}

          {/* Create Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold text-xs transition-all shadow-lg hover:shadow-primary/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建</span>
            </button>
          )}

          {isCreating && (
            <button
              onClick={() => setIsCreating(false)}
              className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* User Profile */}
          {user && (
            <div className="pl-2 flex items-center gap-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] cursor-pointer group relative overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={signOut}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 pt-28 pb-32 px-4 md:px-8 max-w-[1920px] mx-auto min-h-screen flex flex-col">
        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-b-2 border-primary/50 rounded-full animate-spin [animation-direction:reverse]"></div>
            </div>
            <p className="text-white/30 text-xs font-bold tracking-[0.2em] animate-pulse">
              正在载入工作区
            </p>
          </div>
        )}

        {/* Empty / Creation Hero State */}
        {!isLoading && (!hasTasks || isCreating) && (
          <div className="flex-1 flex flex-col items-center justify-center -mt-20 animate-in fade-in duration-700 slide-in-from-bottom-4">
            <h1 className="text-[8rem] md:text-[12rem] font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/10 select-none drop-shadow-2xl">
              {timeString}
            </h1>
            <div className="text-xl md:text-2xl font-medium text-white/60 tracking-tight mb-12">
              {greeting}, {displayName}
            </div>

            <div
              className={`w-full max-w-xl transition-all duration-500 ${isCreating ? 'scale-100 opacity-100' : 'scale-95 opacity-0 hidden'}`}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-2 flex items-center">
                  <input
                    autoFocus
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="今天想创作什么？"
                    className="flex-1 bg-transparent border-none outline-none h-14 px-6 text-xl font-bold placeholder:text-white/20 text-center text-white"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim()}
                    className="h-12 px-8 bg-white text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    开始
                  </button>
                </div>
              </div>
              <div className="mt-4 text-center text-white/20 text-xs font-medium">
                按{' '}
                <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/5 mx-1">
                  Enter
                </span>{' '}
                键开始创作
              </div>
            </div>

            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="group relative flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform duration-500" />
                <span className="font-bold tracking-wide">开始新创作</span>
              </button>
            )}
          </div>
        )}

        {/* Task Grid */}
        {!isLoading && hasTasks && !isCreating && (
          <div className="animate-in fade-in duration-500 slide-in-from-bottom-8">
            {/* 标签/分类筛选器 */}
            {allTags.length > 0 && (
              <div className="flex items-center justify-center mb-8 gap-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedTag === null
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  全部
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      selectedTag === tag
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-transparent border-white/10 text-white/60 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 max-w-[1920px] mx-auto">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={deleteTask} />
              ))}
            </div>

            {filteredTasks.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Search className="w-12 h-12 mb-4 text-white/20" />
                <p className="font-bold text-white/40">未找到相关项目</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-primary hover:underline text-sm"
                >
                  清除搜索
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Quote - Minimalist with improved visibility */}
      {!isLoading && quote && (
        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-auto max-w-lg px-6 py-2 rounded-full backdrop-blur-md bg-black/20 border border-white/5 shadow-2xl transition-opacity duration-500">
          <p className="text-[10px] md:text-xs font-medium tracking-widest text-white/50 text-center leading-relaxed uppercase whitespace-nowrap overflow-hidden text-ellipsis">
            “{quote.content}” —{' '}
            <span className="text-white/30">{quote.author || '佚名'}</span>
          </p>
        </footer>
      )}
    </div>
  );
}
