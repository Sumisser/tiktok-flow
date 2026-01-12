import { useState, useEffect } from 'react';
import { useAuth } from '../../store/auth';
import { Mail, Sparkles, CheckCircle, Wand2 } from 'lucide-react';
import { getRandomWallpaper, type WallpaperData } from '../../lib/unsplash';

export default function Unauthorized() {
  const { user, signInWithEmail, signOut, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null);

  // 获取背景壁纸
  useEffect(() => {
    const fetchWallpaper = async () => {
      const data = await getRandomWallpaper('nature landscape');
      if (data) {
        setWallpaper(data);
      }
    };
    fetchWallpaper();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    setError(null);

    const result = await signInWithEmail(email.trim());

    setIsSending(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      setIsSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-white relative overflow-hidden">
      {/* 背景图片 */}
      {wallpaper && (
        <>
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${wallpaper.url})`,
            }}
          />
          {/* 渐变遮罩层 */}
          <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
        </>
      )}

      {/* 背景装饰光晕 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[200px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[180px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 text-center space-y-12 max-w-md w-full">
        {/* 友好的图标 */}
        <div className="relative inline-flex">
          <div className="absolute inset-[-25px] rounded-full border border-primary/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="absolute inset-[-12px] rounded-full border border-primary/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
          <div className="p-7 rounded-full bg-primary/10 ring-1 ring-primary/30 shadow-[0_0_60px_rgba(var(--primary),0.2)] backdrop-blur-sm">
            <Wand2 className="w-12 h-12 text-primary" />
          </div>
        </div>

        {/* 标题 - 友好温和的语气 */}
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            {user ? '权限验证' : '欢迎来到工作台'}
          </h1>
          <p className="text-lg text-white/60 font-medium leading-relaxed">
            {user
              ? '当前账号暂无访问权限，请联系管理员或切换账号。'
              : '输入你的邮箱，我们将发送一个魔法登录链接给你。'}
          </p>
        </div>

        {/* 操作区域 */}
        <div className="flex flex-col items-center gap-6">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-base font-bold text-primary">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-base text-white/80 font-medium">
                  {user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                disabled={isLoading}
                className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl font-bold tracking-wide transition-all border border-white/10 disabled:opacity-50"
              >
                切换其他账号
              </button>
            </>
          ) : isSent ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500 w-full">
              <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-4">
                <CheckCircle className="w-7 h-7 text-primary shrink-0" />
                <div className="text-left">
                  <p className="text-primary font-bold">登录链接已发送！</p>
                  <p className="text-sm text-white/50 mt-1">{email}</p>
                </div>
              </div>
              <p className="text-sm text-white/40">
                请检查你的邮箱，点击链接即可登录
              </p>
              <button
                onClick={() => {
                  setIsSent(false);
                  setEmail('');
                }}
                className="text-sm text-primary hover:text-white transition-colors font-medium"
              >
                使用其他邮箱
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/5 backdrop-blur-xl rounded-2xl h-16 pl-14 pr-5 text-lg font-medium border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none placeholder:text-white/20"
                  disabled={isSending}
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 text-left">{error}</p>
              )}
              <button
                type="submit"
                disabled={!email.trim() || isSending}
                className="w-full flex items-center justify-center gap-3 h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:scale-100 text-lg"
              >
                {isSending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在发送...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    发送魔法链接
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* 底部装饰 */}
        <div className="pt-8 flex items-center justify-center gap-3 text-[11px] text-white/25 font-bold uppercase tracking-[0.25em]">
          <div className="w-8 h-px bg-white/10" />
          <span>创意工作台</span>
          <div className="w-8 h-px bg-white/10" />
        </div>
      </div>
    </div>
  );
}
