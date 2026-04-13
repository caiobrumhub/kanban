import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const MainLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b border-surface-600/50 bg-surface-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            Kanban<span className="text-primary-500">Board</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-sm font-medium text-white">{user?.name}</span>
              <span className="text-xs text-slate-400">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost text-sm"
              title="Logout"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 flex flex-col h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
