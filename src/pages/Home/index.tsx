import { useTasks } from '../../store/hooks';
import { useAuth } from '../../store/auth';
import TaskCard from '../../components/TaskCard';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Search, CloudRain, LogOut } from 'lucide-react';

const useTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return time;
};

const useWeather = () => {
  const [data, setData] = useState<{
    city: string;
    temp: string;
    condition: string;
  } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Step 1: Get location via IP (using ip-api.com - no API key needed for basic usage)
        const locRes = await fetch('http://ip-api.com/json/');
        const locData = await locRes.json();

        if (locData.status === 'success') {
          // Step 2: Get weather via Open-Meteo (open API)
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${locData.lat}&longitude=${locData.lon}&current_weather=true`,
          );
          const weatherData = await weatherRes.json();

          setData({
            city: locData.city,
            temp: `${Math.round(weatherData.current_weather.temperature)}°`,
            condition: 'Clear', // Simplified context for now
          });
        }
      } catch (error) {
        console.error('Weather fetch failed:', error);
        setData({ city: 'Shanghai', temp: '12°', condition: 'Cloudy' }); // Fallback
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // Update every 30 mins
    return () => clearInterval(interval);
  }, []);

  return data;
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
        // Fallback 名言
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
  const {
    tasks,
    isLoading,
    addTask,
    deleteTask,
    wallpaperUrl,
    wallpaperAttribution,
  } = useTasks();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const currentTime = useTime();
  const weather = useWeather();
  const quote = useQuote();

  const timeString = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 从用户信息中提取显示名称
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
      // 立即跳转到新创建的 workflow 页面
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

  const filteredTasks = tasks.filter((task) => {
    const searchLower = searchQuery.toLowerCase();
    const matchTitle = task.title.toLowerCase().includes(searchLower);
    const matchTags = task.tags?.some((tag) =>
      tag.toLowerCase().includes(searchLower),
    );
    return matchTitle || matchTags;
  });

  const hasTasks = tasks.length > 0;

  return (
    <div className="min-h-screen text-white overflow-x-hidden selection:bg-white/20 relative">
      {/* 背景图片 */}
      {wallpaperUrl && (
        <>
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${wallpaperUrl})`,
            }}
          />
          {/* 浅色遮罩层，保持文本可读性的同时更明亮 */}
          <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
        </>
      )}
      {/* 极简顶栏 - 仅保留功能性图标 */}
      <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full transition-all border border-white/10 group active:scale-95 shadow-2xl"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="text-[11px] font-black tracking-widest uppercase">
                新建创作流
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreating(false)}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full border border-white/10 transition-all shadow-2xl"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* 状态感知的搜索框 - 仅在有任务且不处于创建状态时在顶部显示 */}
          {hasTasks && !isCreating && (
            <div className="ml-4 w-64 md:w-80 transition-all duration-500 animate-in fade-in slide-in-from-left-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索项目..."
                  className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/20 backdrop-blur-3xl rounded-2xl h-11 pl-11 pr-4 text-sm font-bold tracking-tight border border-white/5 focus:border-white/20 transition-all outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 pointer-events-auto">
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 animate-pulse">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            </div>
          )}
          {weather && (
            <div className="flex items-center gap-3 animate-in fade-in duration-1000">
              <CloudRain className="w-4 h-4 opacity-40" />
              <span className="text-[11px] font-black tracking-widest uppercase opacity-40">
                {weather.city} {weather.temp}
              </span>
            </div>
          )}
          {/* Unsplash 归属信息 */}
          {wallpaperAttribution && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] text-white/80 drop-shadow-md animate-in fade-in duration-1000">
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
          {/* 用户信息与登出 */}
          {user && (
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[11px] text-white/70 font-medium max-w-[120px] truncate">
                  {user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="p-2 bg-black/40 hover:bg-red-500/20 backdrop-blur-md rounded-full border border-white/10 hover:border-red-500/30 transition-all group"
                title="退出登录"
              >
                <LogOut className="w-4 h-4 text-white/60 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 动态区域 - 根据是否有任务切换布局 */}
      <main className="relative z-10 min-h-screen">
        {isLoading ? (
          /* Loading 状态：展示加载动画 */
          <section className="min-h-screen flex flex-col items-center justify-center px-8 animate-in fade-in duration-500">
            <div className="space-y-8 text-center">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-white/10 border-t-white/80 rounded-full animate-spin mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-12 h-12 border-4 border-white/5 border-t-white/40 rounded-full animate-spin"
                    style={{
                      animationDirection: 'reverse',
                      animationDuration: '1s',
                    }}
                  />
                </div>
              </div>
              <p className="text-xl font-black tracking-widest uppercase opacity-40">
                正在加载创作流...
              </p>
            </div>
          </section>
        ) : !hasTasks || isCreating ? (
          /* 空状态 / 创建状态：简洁的 Hero 区域 */
          <section className="min-h-screen flex flex-col items-center justify-center px-8 pb-20 animate-in fade-in duration-1000">
            <div className="w-full max-w-2xl space-y-12 text-center">
              {/* 时钟与问候 */}
              <div className="space-y-3 select-none">
                <h1 className="text-[100px] md:text-[140px] font-black tracking-tighter leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                  {timeString}
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white/70">
                  {greeting}, {displayName}
                </h2>
              </div>

              {/* 创建任务区域 */}
              {isCreating ? (
                <div className="animate-in zoom-in-95 fade-in duration-300 space-y-6">
                  <input
                    autoFocus
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入创作主题..."
                    className="w-full bg-white/10 backdrop-blur-xl rounded-2xl h-16 px-6 text-xl font-bold placeholder:text-white/20 border border-white/10 focus:border-white/30 transition-all outline-none text-center"
                  />
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleCreate}
                      disabled={!newTitle.trim()}
                      className="px-10 py-4 bg-white text-black font-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                    >
                      开始创作
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl font-bold transition-all border border-white/10"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl border border-white/10 transition-all group"
                >
                  <Plus className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:rotate-90 transition-all" />
                  <span className="text-base font-bold">新建创作流</span>
                </button>
              )}
            </div>
          </section>
        ) : (
          /* 有任务状态：展示顶部对齐的画廊布局 */
          <section className="pt-24 px-8 pb-40 max-w-[1600px] mx-auto animate-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onDelete={deleteTask} />
              ))}
            </div>

            {filteredTasks.length === 0 && searchQuery && (
              <div className="mt-20 text-center py-32 bg-white/2 backdrop-blur-sm rounded-[3rem] border border-dashed border-white/10 transition-all">
                <Search className="w-16 h-16 opacity-5 mx-auto mb-6" />
                <p className="text-white/30 font-black uppercase tracking-[0.3em] text-xs">
                  未找到匹配的流水线资产
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                >
                  清除所有筛选
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 底部引用 - 灵感来源 */}
      <footer className="fixed bottom-12 left-0 right-0 z-40 flex justify-center px-6 pointer-events-none">
        <div className="max-w-2xl w-full text-center pointer-events-auto">
          {quote ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-1000">
              <div className="relative inline-block">
                {/* 装饰性引号 */}
                <span className="absolute -left-8 -top-4 text-4xl text-white/20 font-serif italic select-none mix-blend-overlay">
                  “
                </span>
                <p className="text-sm md:text-base font-medium tracking-wide text-white/90 selection:bg-primary/30 cursor-text mix-blend-plus-lighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {quote.content}
                </p>
                <span className="absolute -right-8 -bottom-4 text-4xl text-white/20 font-serif italic select-none mix-blend-overlay">
                  ”
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40 font-black mix-blend-plus-lighter">
                <span className="w-8 h-px bg-white/20" />
                <span>
                  {quote.author || '佚名'}
                  {quote.origin && ` · 《${quote.origin}》`}
                </span>
                <span className="w-8 h-px bg-white/20" />
              </div>
            </div>
          ) : (
            <div className="h-4 w-48 bg-white/10 animate-pulse mx-auto rounded-full backdrop-blur-md" />
          )}
        </div>
      </footer>
    </div>
  );
}
