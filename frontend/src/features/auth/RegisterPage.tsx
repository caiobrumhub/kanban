import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/register', { name, email, password });
      // Registration returns tokens directly based on the backend implementation
      login(response.data);
    } catch (err: any) {
      if (Array.isArray(err.response?.data?.message)) {
          setError(err.response.data.message.join(', '));
      } else {
          setError(err.response?.data?.message || 'Erro ao realizar cadastro.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-surface p-8 shadow-card glass">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-glow">
          <span className="text-white text-xl font-bold">K</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Crie sua conta</h1>
        <p className="text-slate-400">Comece a organizar suas tarefas hoje</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <Input
          label="Nome"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          required
        />
        
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
        />
        
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Pelo menos 6 caracteres"
          required
          minLength={6}
        />

        <Button type="submit" isLoading={isLoading} className="w-full mt-4">
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors">
          Faça login
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;
