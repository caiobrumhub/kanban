import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useBoardStore } from '../../store/boardStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuthStore();
  const { boards } = useBoardStore();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile & Desktop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-900 border-r border-surface-600/50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-surface-600/50 h-16">
          <Link to="/" className="text-xl font-bold text-white flex items-center gap-2" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">K</span>
            </div>
            Kanban<span className="text-primary-500">Board</span>
          </Link>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-surface-800"
          >
            <i className="fi fi-rr-cross text-sm"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
          
          {/* Main Menu */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Menu</div>
            <nav className="space-y-1">
              <Link 
                to="/" 
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/') && location.pathname === '/' ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:bg-surface-800 hover:text-white'
                }`}
              >
                <i className="fi fi-rr-apps mt-1"></i>
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Boards */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 flex justify-between items-center">
              <span>Seus Quadros</span>
            </div>
            <nav className="space-y-1">
              {boards.map(board => (
                <Link 
                  key={board.id}
                  to={`/board/${board.id}`}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${
                    isActive(`/board/${board.id}`) ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:bg-surface-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <i className={`fi ${board.icon || 'fi-rr-chalkboard'} mt-1`}></i>
                    <span className="truncate">{board.title}</span>
                  </div>
                  {/* Board Counter */}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive(`/board/${board.id}`) ? 'bg-primary-500/20 text-primary-300' : 'bg-surface-700 text-slate-400 group-hover:bg-surface-600 group-hover:text-slate-300'
                  }`}>
                    {board._count?.columns || 0}
                  </span>
                </Link>
              ))}
              
              {boards.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-500 italic">Nenhum quadro criado</div>
              )}
            </nav>
          </div>

          {/* Admin Menu */}
          {user?.role === 'ADMIN' && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                Configurações e Cadastros
              </div>
              <nav className="space-y-1">
                <Link 
                  to="/admin" 
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/admin') ? 'bg-primary-500/10 text-primary-400' : 'text-slate-300 hover:bg-surface-800 hover:text-white'
                  }`}
                >
                  <i className="fi fi-rr-users mt-1"></i>
                  Painel Admin
                </Link>
              </nav>
            </div>
          )}
        </div>

        {/* User Info Bottom */}
        <div className="p-4 border-t border-surface-600/50">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white truncate">{user?.name}</span>
            <span className="text-xs text-slate-400 truncate">{user?.email}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
