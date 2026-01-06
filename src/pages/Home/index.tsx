import { useTasks } from "../../store/hooks";
import TaskCard from "../../components/TaskCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Search, CloudRain } from "lucide-react";

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
        const locRes = await fetch("http://ip-api.com/json/");
        const locData = await locRes.json();

        if (locData.status === "success") {
          // Step 2: Get weather via Open-Meteo (open API)
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${locData.lat}&longitude=${locData.lon}&current_weather=true`
          );
          const weatherData = await weatherRes.json();

          setData({
            city: locData.city,
            temp: `${Math.round(weatherData.current_weather.temperature)}°`,
            condition: "Clear", // Simplified context for now
          });
        }
      } catch (error) {
        console.error("Weather fetch failed:", error);
        setData({ city: "Shanghai", temp: "12°", condition: "Cloudy" }); // Fallback
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
        const response = await fetch("https://api.xygeng.cn/one");
        const data = await response.json();
        if (data.code === 200 && data.data) {
          setQuote({
            content: data.data.content,
            origin: data.data.origin,
            author: data.data.name !== "佚名" ? data.data.name : undefined,
          });
        }
      } catch (error) {
        console.error("获取名言失败:", error);
        // Fallback 名言
        setQuote({
          content: "一个人至少拥有一个梦想，有一个理由去强大。",
          author: "三毛",
        });
      }
    };

    fetchQuote();
  }, []);

  return quote;
};

const useBingWallpaper = () => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // 使用指定的随机背景 API，添加时间戳防止缓存
    const randomUrl = `https://bing.biturl.top/?resolution=1920&format=image&index=random&_t=${Date.now()}`;
    setUrl(randomUrl);
  }, []);

  return url;
};

export default function Home() {
  const { tasks, isLoading, addTask, deleteTask } = useTasks();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const currentTime = useTime();
  const weather = useWeather();
  const quote = useQuote();
  const wallpaperUrl = useBingWallpaper();

  const timeString = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const greeting =
    currentTime.getHours() < 12
      ? "早上好"
      : currentTime.getHours() < 18
      ? "下午好"
      : "晚上好";

  const handleCreate = async () => {
    if (newTitle.trim()) {
      const newTask = await addTask(newTitle.trim());
      setNewTitle("");
      setIsCreating(false);
      // 立即跳转到新创建的 workflow 页面
      navigate(`/workflow/${newTask.id}`);
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
                      animationDirection: "reverse",
                      animationDuration: "1s",
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
          /* 空状态 / 创建状态：展示全屏 Hero 区域 */
          <section className="min-h-screen flex flex-col items-center justify-center px-8 pb-32 animate-in fade-in duration-1000">
            <div className="w-full max-w-4xl space-y-16">
              {/* 大时钟 */}
              <div className="text-center space-y-4 select-none">
                <h1 className="text-[140px] md:text-[200px] font-black tracking-tighter leading-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  {timeString}
                </h1>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight opacity-70">
                  {greeting}, Miracle.
                </h2>
              </div>

              {/* 核心交互区 */}
              <div className="relative max-w-2xl mx-auto w-full">
                {isCreating ? (
                  <div className="animate-in zoom-in-95 fade-in duration-500 text-center space-y-10">
                    <p className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-md">
                      为你的新创作流命名
                    </p>
                    <div className="relative">
                      <input
                        autoFocus
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="例如：夏日旅行叙事..."
                        className="w-full bg-white/10 backdrop-blur-[40px] rounded-[2.5rem] h-24 px-10 text-3xl font-black tracking-tight placeholder:text-white/10 border border-white/10 focus:border-white/30 transition-all outline-none text-center shadow-2xl"
                      />
                      <div className="mt-10 flex justify-center gap-6">
                        <button
                          onClick={handleCreate}
                          disabled={!newTitle.trim()}
                          className="px-12 py-5 bg-white text-black font-black rounded-3xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-xl"
                        >
                          开始创作
                        </button>
                        <button
                          onClick={() => setIsCreating(false)}
                          className="px-12 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-3xl font-black transition-all border border-white/10 shadow-xl"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                    <p className="text-2xl font-bold tracking-tight opacity-50">
                      今天的创作核心目标是什么？
                    </p>
                    <div className="h-px bg-white/20 w-32 mx-auto" />
                    <button
                      onClick={() => setIsCreating(true)}
                      className="px-12 py-6 bg-white/10 hover:bg-white/20 backdrop-blur-2xl rounded-[2rem] border border-white/10 transition-all group relative overflow-hidden"
                    >
                      <Plus className="w-8 h-8 opacity-40 group-hover:opacity-100 group-hover:rotate-90 transition-all" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* 有任务状态：展示顶部对齐的画廊布局 */
          <section className="pt-32 px-8 pb-40 max-w-7xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                  onClick={() => setSearchQuery("")}
                  className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                >
                  清除所有筛选
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 底部引用 - 极简版 */}
      <footer className="fixed bottom-12 left-0 right-0 text-center pointer-events-none px-8 z-40">
        {quote ? (
          <div className="max-w-2xl mx-auto space-y-2 animate-in fade-in duration-1000">
            <p className="text-white/40 text-[13px] font-medium tracking-tight italic drop-shadow-sm select-none">
              「{quote.content}」
            </p>
            {(quote.origin || quote.author) && (
              <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase">
                {quote.author && `— ${quote.author}`}
                {quote.origin && ` · ${quote.origin}`}
              </p>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="h-4 w-64 mx-auto bg-white/5 rounded-full animate-pulse" />
          </div>
        )}
      </footer>
    </div>
  );
}
