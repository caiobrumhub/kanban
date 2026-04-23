import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Tabs and Search
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch {
      setError('Erro ao carregar usuários. Você tem permissão de Admin?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: number, newRole: 'USER' | 'ADMIN') => {
    try {
      await api.patch(`/admin/users/${userId}`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      alert('Erro ao atualizar permissão, tente novamente.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setActionLoading(true);
    try {
      const payload = {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        isActive: editingUser.isActive
      };
      
      const { data } = await api.patch(`/admin/users/${editingUser.id}`, payload);
      setUsers(users.map(u => u.id === data.id ? data : u));
      setEditingUser(null);
    } catch {
      alert('Erro ao editar usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetUser) return;
    
    if (newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/users/${passwordResetUser.id}/reset-password`, { newPassword });
      alert('Senha redefinida com sucesso!');
      setPasswordResetUser(null);
      setNewPassword('');
    } catch {
      alert('Erro ao redefinir a senha.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto w-full pb-20">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Painel Administrativo</h1>
        <p className="text-slate-400">Gerencie usuários e configurações do sistema</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-6 border-b border-surface-600/50 mb-6 overflow-x-auto">
        <button 
          className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'overview' ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white hover:border-surface-500'}`} 
          onClick={() => setActiveTab('overview')}
        >
          <i className="fi fi-rr-apps"></i> Visão Geral
        </button>
        <button 
          className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'users' ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white hover:border-surface-500'}`} 
          onClick={() => setActiveTab('users')}
        >
          <i className="fi fi-rr-users"></i> Gerenciar Usuários
        </button>
        <button 
          className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'reports' ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white hover:border-surface-500'}`} 
          onClick={() => setActiveTab('reports')}
        >
          <i className="fi fi-rr-chart-pie-alt"></i> Relatórios
        </button>
        <button 
          className={`pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'settings' ? 'border-primary-500 text-white' : 'border-transparent text-slate-400 hover:text-white hover:border-surface-500'}`} 
          onClick={() => setActiveTab('settings')}
        >
          <i className="fi fi-rr-settings"></i> Configurações
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            onClick={() => setActiveTab('users')}
            className="card-surface p-6 cursor-pointer hover:-translate-y-1 hover:shadow-glow hover:border-primary-500/50 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-primary-500/20 text-primary-400 rounded-lg flex items-center justify-center mb-4 text-2xl">
              <i className="fi fi-rr-users"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Cadastro de Usuários</h3>
            <p className="text-slate-400 text-sm">Adicione, remova, promova ou inative usuários do sistema. Total: {users.length}</p>
          </div>

          <div className="card-surface p-6 opacity-70 cursor-not-allowed">
            <div className="w-12 h-12 bg-surface-700 text-slate-400 rounded-lg flex items-center justify-center mb-4 text-2xl">
              <i className="fi fi-rr-chart-pie-alt"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex justify-between items-center">
              Relatórios
              <span className="text-[10px] bg-surface-600 px-2 py-0.5 rounded text-slate-300">Em Breve</span>
            </h3>
            <p className="text-slate-400 text-sm">Visualize métricas, tarefas concluídas e produtividade das equipes.</p>
          </div>

          <div className="card-surface p-6 opacity-70 cursor-not-allowed">
            <div className="w-12 h-12 bg-surface-700 text-slate-400 rounded-lg flex items-center justify-center mb-4 text-2xl">
              <i className="fi fi-rr-settings"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex justify-between items-center">
              Configurações Gerais
              <span className="text-[10px] bg-surface-600 px-2 py-0.5 rounded text-slate-300">Em Breve</span>
            </h3>
            <p className="text-slate-400 text-sm">Configure níveis de permissão, integrações e personalização da plataforma.</p>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && !error && (
        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <i className="fi fi-rr-search"></i>
              </div>
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-700/50 border border-surface-600 rounded-lg pl-10 pr-4 py-2 text-white outline-none focus:border-primary-500 transition-colors placeholder:text-slate-500"
              />
            </div>
            <Button variant="primary" className="flex items-center gap-2 opacity-50 cursor-not-allowed" title="Em breve">
              <i className="fi fi-rr-plus"></i> Novo Usuário
            </Button>
          </div>

          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-700/50 border-b border-surface-600">
                    <th className="py-3 px-4 text-sm font-semibold text-slate-300">ID</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-300">Nome</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-300">E-mail</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-300">Cargo</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-300">Status</th>
                    <th className="py-3 px-4 text-sm font-semibold text-slate-300">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={`border-b border-surface-600/50 hover:bg-surface-700/20 transition-colors ${user.isActive === false ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 text-slate-400">#{user.id}</td>
                      <td className="py-3 px-4 font-medium text-white">{user.name}</td>
                      <td className="py-3 px-4 text-slate-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-600 text-slate-300'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.isActive === false ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">Inativo</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">Ativo</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {user.role === 'USER' ? (
                            <Button variant="ghost" onClick={() => handleUpdateRole(user.id, 'ADMIN')} className="!py-2 !px-3 text-xs border border-primary-500/30 flex items-center justify-center gap-1.5 hover:bg-primary-500/10">
                              <i className="fi fi-rr-user-add text-sm"></i> Tornar Admin
                            </Button>
                          ) : (
                            <Button variant="ghost" onClick={() => handleUpdateRole(user.id, 'USER')} className="!py-2 !px-3 text-xs flex items-center justify-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300 transition-colors">
                              <i className="fi fi-rr-user-minus text-sm"></i> Remover Admin
                            </Button>
                          )}
                            <Button 
                              variant="ghost" 
                              onClick={() => setEditingUser(user)} 
                              className="!py-2 !px-3 text-xs border border-surface-600 text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
                              title="Editar/Inativar"
                            >
                              <i className="fi fi-rr-edit text-sm"></i> Editar
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => setPasswordResetUser(user)} 
                              className="!py-2 !px-3 text-xs border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-300 transition-colors flex items-center justify-center"
                              title="alterar a senha de usuário"
                            >
                              <i className="fi fi-rr-key text-sm"></i>
                            </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center">
                <i className="fi fi-rr-search text-3xl mb-2 text-surface-600"></i>
                <p>Nenhum usuário encontrado na sua busca.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORTS / SETTINGS (PLACEHOLDERS) */}
      {(activeTab === 'reports' || activeTab === 'settings') && !error && (
        <div className="card-surface p-12 flex flex-col items-center justify-center text-center">
          <i className={`fi ${activeTab === 'reports' ? 'fi-rr-chart-pie-alt' : 'fi-rr-settings'} text-6xl text-surface-600 mb-4`}></i>
          <h2 className="text-2xl font-bold text-white mb-2">Módulo em Desenvolvimento</h2>
          <p className="text-slate-400 max-w-md">
            Esta funcionalidade está sendo construída e estará disponível nas próximas atualizações.
          </p>
        </div>
      )}


      {/* Modal Editar Usuário */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Editar Usuário">
        {editingUser && (
          <form onSubmit={handleSaveUser} className="space-y-4">
            <Input
              label="Nome Completo"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              required
            />
            <Input
              label="E-mail"
              type="email"
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              required
            />
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Cargo no Sistema</label>
              <select 
                value={editingUser.role} 
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'USER' | 'ADMIN' })}
                className="w-full bg-surface-700/50 border border-surface-600 rounded-lg px-3 py-2 text-white outline-none focus:border-primary-500 transition-colors placeholder:text-slate-500"
              >
                <option value="USER">Usuário (USER)</option>
                <option value="ADMIN">Administrador (ADMIN)</option>
              </select>
            </div>
            
            <div className="p-3 bg-surface-700/30 rounded-lg border border-surface-600/50 mt-4 flex items-center justify-between">
              <div>
                <span className="block text-sm font-medium text-white mb-0.5">Status da Conta</span>
                <span className="text-xs text-slate-400">Contas inativas não podem fazer login.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={editingUser.isActive !== false}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                />
                <div className="w-11 h-6 bg-surface-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={actionLoading}>
                {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Redefinir Senha */}
      <Modal isOpen={!!passwordResetUser} onClose={() => setPasswordResetUser(null)} title="Redefinir Senha">
        {passwordResetUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg text-orange-200 text-sm mb-4">
              Você está redefinindo a senha do usuário <strong>{passwordResetUser.name}</strong>. Ao concluir, as sessões ativas dele serão desconectadas.
            </div>
            
            <Input
              label="Nova Senha Segura"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha..."
              required
              minLength={6}
            />
            
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setPasswordResetUser(null)}>Cancelar</Button>
              <Button type="submit" variant="danger" disabled={actionLoading || newPassword.length < 6}>
                {actionLoading ? 'Redefinindo...' : 'Confirmar e Redefinir'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default AdminPage;
