import { Routes, Route } from 'react-router-dom';
import { useAuth } from './store/auth';
import Home from './pages/Home';
import Workflow from './pages/Workflow';
import Unauthorized from './pages/Unauthorized';
import { Toaster } from './components/ui/sonner';

function App() {
  const { isLoading, isAuthorized, user } = useAuth();

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // 未登录或无权限：展示 Unauthorized 页面
  if (!user || !isAuthorized) {
    return (
      <>
        <Unauthorized />
        <Toaster />
      </>
    );
  }

  // 已登录且有权限：展示正常路由
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workflow/:id" element={<Workflow />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
