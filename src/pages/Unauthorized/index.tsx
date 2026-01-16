import { useState, useEffect } from 'react';
import { useAuth } from '../../store/auth';
import {
  Mail,
  CheckCircle,
  Lock as LockIcon,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
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
      // Using abstract/minimal keywords to ensure background isn't too busy for login
      const data = await getRandomWallpaper(
        'abstract landscape, minimal, geometric',
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
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop';

  return (
    <div className="min-h-screen text-white overflow-hidden relative font-sans selection:bg-primary/30 flex flex-col items-center justify-center">
      {/* Cinematic Background Layer - Matching Home Page */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-[ken-burns_30s_ease-in-out_infinite_alternate]"
          style={{ backgroundImage: `url(${activeWallpaper})` }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-indigo-950/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in zoom-in-95 duration-700">
        {/* Brand Section */}
        <div className="flex flex-col items-center mb-10 group cursor-default">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse-slow group-hover:bg-primary/40 transition-colors duration-1000" />
            <img
              src={jellyfishIcon}
              alt="JellyFlow"
              className="relative w-20 h-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-transform duration-700 group-hover:scale-105"
            />
            {/* Ping indicator */}
            <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-black shadow-[0_0_8px_rgba(74,222,128,1)] animate-ping" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 drop-shadow-lg">
              JellyFlow
            </h1>
            <p className="text-primary/90 text-xs font-bold tracking-[0.4em] uppercase pl-1">
              AI Studio
            </p>
          </div>
        </div>

        {/* Glass Card */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-1 shadow-2xl overflow-hidden ring-1 ring-white/5">
          <div className="bg-white/5 rounded-[22px] p-6 md:p-8 space-y-8 relative overflow-hidden">
            {/* Subtle internal gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                {user ? '访问受限' : '开启创作之旅'}
              </h2>
              <p className="text-white/40 text-sm font-medium leading-relaxed">
                {user
                  ? '当前账号暂无权限，请切换账号。'
                  : '登录账号以同步你的工作流'}
              </p>
            </div>

            <div className="space-y-4">
              {user ? (
                // Logged in but unauthorized state
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-white/40">无访问权限</p>
                    </div>
                  </div>

                  <button
                    onClick={signOut}
                    disabled={isLoading}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all border border-white/10 hover:border-white/20 group"
                  >
                    <LockIcon className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                    切换账号
                  </button>
                </div>
              ) : (
                // Login Options
                <div className="space-y-5">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="relative w-full h-14 flex items-center justify-center gap-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-white/5 overflow-hidden group"
                  >
                    {/* Ripple effect on hover could go here, but simple is premium too */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                    <span>Google 账号登录</span>
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-white/20 tracking-widest uppercase">
                      Or
                    </span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  {/* Email Login Flow */}
                  {isSent ? (
                    <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2 ring-1 ring-primary/40">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">已发送验证邮件</h3>
                        <p className="text-white/50 text-xs mt-1">{email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsSent(false);
                          setEmail('');
                        }}
                        className="text-xs text-primary hover:text-primary/80 transition-colors font-bold"
                      >
                        使用其他邮箱重试
                      </button>
                    </div>
                  ) : !showEmailLogin ? (
                    <button
                      onClick={() => setShowEmailLogin(true)}
                      className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors group"
                    >
                      <Mail className="w-4 h-4" />
                      <span>使用邮箱链接</span>
                      <ChevronDown className="w-3 h-3 opacity-0 -translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ) : (
                    <form
                      onSubmit={handleSubmit}
                      className="space-y-4 animate-in slide-in-from-top-2 duration-300"
                    >
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/70 transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-black/20 hover:bg-black/30 focus:bg-black/40 rounded-xl h-12 pl-10 pr-4 text-sm font-medium border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none placeholder:text-white/20 text-white"
                          disabled={isSending}
                          autoFocus
                        />
                      </div>

                      {error && (
                        <p className="text-xs text-red-400 font-medium pl-1 animate-in slide-in-from-left-2">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={!email.trim() || isSending}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>发送登录链接</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowEmailLogin(false)}
                        className="w-full text-center text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      >
                        取消
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex justify-center space-x-6 text-[10px] font-medium text-white/20 uppercase tracking-widest">
          <span className="hover:text-white/40 transition-colors cursor-pointer">
            Privacy
          </span>
          <span className="hover:text-white/40 transition-colors cursor-pointer">
            Terms
          </span>
          <span className="hover:text-white/40 transition-colors cursor-pointer">
            Help
          </span>
        </div>
      </div>
    </div>
  );
}
