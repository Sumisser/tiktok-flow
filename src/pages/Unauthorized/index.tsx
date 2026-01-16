import { useState, useEffect } from 'react';
import { useAuth } from '../../store/auth';
import { Mail, CheckCircle, Lock as LockIcon, ArrowRight } from 'lucide-react';
import { getRandomWallpaper, type WallpaperData } from '../../lib/unsplash';
import jellyfishIcon from '@/assets/jellyfish.png';

export default function Unauthorized() {
  const { user, signInWithEmail, signInWithGoogle, signOut, isLoading } =
    useAuth();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  // 获取背景壁纸
  useEffect(() => {
    const fetchWallpaper = async () => {
      // 这里的关键词也可以优化，匹配 creative/studio 感觉
      // Using abstract/minimal/dark keywords to ensure background isn't too busy for login
      const data = await getRandomWallpaper(
        'minimal dark abstract, gradient, nebula',
      );
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

  const handleGoogleLogin = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error.message);
    }
  };

  // Default Cinematic Wallpaper if fetch fails or loading
  const activeWallpaper =
    wallpaper?.url ||
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop';

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center p-4 selection:bg-primary/30 font-sans">
      {/* 1. Cinematic Background Layer - Crystal Clear (No Overlay) */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90 transition-transform duration-[30s] ease-in-out scale-105 hover:scale-110"
          style={{ backgroundImage: `url(${activeWallpaper})` }}
        />
        {/* Subtle vignette only at edges to focus center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* 2. Main Card - Premium Split Layout */}
      <div className="relative z-10 w-full max-w-5xl bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden grid lg:grid-cols-5 animate-in fade-in zoom-in-95 duration-700 ring-1 ring-white/5 group/card hover:shadow-primary/5 transition-all">
        {/* Left Panel: Branding & Art (Takes 2/5 space) */}
        <div className="hidden lg:flex lg:col-span-2 relative flex-col justify-between p-12 overflow-hidden bg-white/5">
          {/* Internal decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10 mix-blend-overlay" />
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/30 rounded-full blur-[100px] opacity-60 animate-pulse-slow" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
                <img
                  src={jellyfishIcon}
                  alt="Logo"
                  className="w-8 h-8 drop-shadow-md"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                JellyFlow
              </span>
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              释放你的 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                无限创意
              </span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              从一个灵感片段，到完整的视听盛宴。AI
              驱动的智能脚本与分镜生成，让你的故事画面即刻呈现。
            </p>
          </div>

          {/* Creative Feature Showcase - Abstract & Artistic */}
          <div className="relative z-10 pt-16 mt-auto">
            <div className="flex flex-wrap gap-2.5 max-w-[280px]">
              {['AI 视频生成', '智能分镜', '创意脚本', '4K 渲染'].map(
                (tag, i) => (
                  <div
                    key={tag}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-default backdrop-blur-sm shadow-sm"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {tag}
                  </div>
                ),
              )}
              <div className="px-3 py-1.5 rounded-lg border border-dashed border-white/10 text-[11px] font-bold text-white/30 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                + 无限可能
              </div>
            </div>

            {/* Subtle line decoration */}
            <div className="mt-8 w-12 h-1 bg-gradient-to-r from-primary/50 to-transparent rounded-full" />
          </div>
        </div>

        {/* Right Panel: Auth Form (Takes 3/5 space) */}
        <div className="lg:col-span-3 p-8 md:p-12 md:px-16 flex flex-col justify-center bg-white/[0.02]">
          {/* Mobile Logo View */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center ring-1 ring-white/10 shadow-lg relative">
              <img src={jellyfishIcon} alt="Logo" className="w-10 h-10" />
              <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
            </div>
          </div>

          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                {user ? '账号已锁定' : '开始使用'}
              </h3>
              <p className="text-white/40 text-sm">
                {user ? '请切换账号以继续' : '登录以构建你的 AI 视频工作流'}
              </p>
            </div>

            {user ? (
              // Locked State
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      className="w-12 h-12 rounded-full ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">
                      {user.email}
                    </div>
                    <div className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                      <LockIcon className="w-3 h-3" /> 无访问权限
                    </div>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                >
                  <LockIcon className="w-4 h-4" /> 切换账号
                </button>
              </div>
            ) : (
              // Login State
              <div className="space-y-5">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="group relative w-full h-14 bg-white text-black font-bold rounded-xl hover:shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center gap-3 overflow-hidden active:scale-[0.99]"
                >
                  {/* Use a simple embedded SVG for Google Logo to avoid broken external links */}
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>使用 Google 账号登录</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <span className="relative px-3 bg-transparent text-[10px] uppercase tracking-widest text-white/20 font-bold backdrop-blur-sm">
                    或者
                  </span>
                </div>

                {isSent ? (
                  <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-3 animate-in fade-in zoom-in-95">
                    <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h4 className="text-green-400 font-bold">魔法链接已发送</h4>
                    <p className="text-green-400/60 text-xs">{email}</p>
                    <button
                      onClick={() => {
                        setIsSent(false);
                        setEmail('');
                      }}
                      className="text-xs text-white/40 hover:text-white underline mt-2"
                    >
                      尝试其他邮箱
                    </button>
                  </div>
                ) : !showEmailLogin ? (
                  <button
                    onClick={() => setShowEmailLogin(true)}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 font-medium text-sm transition-all flex items-center justify-center gap-2 group"
                  >
                    <Mail className="w-4 h-4" /> 使用邮箱登录
                  </button>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 animate-in slide-in-from-bottom-2"
                  >
                    <div className="space-y-1.5 container">
                      <label className="text-xs font-bold text-white/40 ml-1">
                        电子邮箱地址
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          autoFocus
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          disabled={isSending}
                          className="w-full bg-black/20 focus:bg-black/40 border border-white/10 focus:border-white/30 rounded-xl px-4 py-3.5 text-white outline-none transition-all placeholder:text-white/10 disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEmailLogin(false)}
                        className="flex-1 py-3 text-xs font-bold text-white/40 hover:text-white transition-colors bg-transparent border border-white/5 hover:border-white/10 rounded-xl"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={!email || isSending}
                        className="flex-[2] py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            发送链接 <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="text-xs text-red-400 text-center">
                        {error}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 w-full text-center">
        <p className="text-[10px] text-white/20 font-medium tracking-[0.2em] uppercase">
          JellyFlow AI Studio © 2026
        </p>
      </div>
    </div>
  );
}
