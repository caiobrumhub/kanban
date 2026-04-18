import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { User } from '../../types';
import Button from '../../components/ui/Button';

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleRoleChange = async (userId: number, newRole: 'USER' | 'ADMIN') => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      alert('Erro ao atualizar permissão, tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Painel Administrativo</h1>
        <p className="text-slate-400">Gerencie usuários e permissões do sistema</p>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-700/50 border-b border-surface-600">
                <th className="py-3 px-4 text-sm font-semibold text-slate-300">ID</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-300">Nome</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-300">E-mail</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-300">Cargo</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-300">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-surface-600/50 hover:bg-surface-700/20 transition-colors">
                  <td className="py-3 px-4 text-slate-400">#{user.id}</td>
                  <td className="py-3 px-4 font-medium text-white">{user.name}</td>
                  <td className="py-3 px-4 text-slate-300">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-600 text-slate-300'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.role === 'USER' ? (
                      <Button variant="ghost" onClick={() => handleRoleChange(user.id, 'ADMIN')} className="!py-1.5 !px-3 text-xs border border-primary-500/30">
                        Tornar Admin
                      </Button>
                    ) : (
                      <Button variant="danger" onClick={() => handleRoleChange(user.id, 'USER')} className="!py-1.5 !px-3 text-xs">
                        Remover Admin
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-8 text-slate-400">Nenhum usuário encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
