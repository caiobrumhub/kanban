import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const { logout } = useAuthStore();
  const { setBoards } = useBoardStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const showHomeButton = location.pathname !== '/';

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await api.get('/boards');
      setBoards(data);
    } catch {
      console.error('Error fetching boards for sidebar');
    }
  };

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
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header className="h-16 border-b border-surface-600/50 bg-surface-900/50 backdrop-blur-md sticky top-0 z-40">
          <div className="w-full px-4 md:px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-surface-800 transition-colors"
                title="Abrir menu"
              >
                <i className="fi fi-rr-menu-burger text-lg flex"></i>
              </button>
              
              {showHomeButton && (
                <button 
                  onClick={() => navigate('/')}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-surface-800 transition-colors ml-1 flex items-center gap-2"
                  title="Voltar ao Início"
                >
                  <i className="fi fi-rr-home text-lg flex"></i>
                  <span className="text-sm font-medium hidden sm:block">Dashboard</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm flex items-center gap-2"
                title="Sair do sistema"
              >
                <i className="fi fi-rr-sign-out-alt mt-0.5"></i>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Outlet Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
