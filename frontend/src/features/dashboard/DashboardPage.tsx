import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import type { Board } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { boards, setBoards } = useBoardStore();
  const [error, setError] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleToCreate = newTitle.trim();
    if (!titleToCreate) return;

    let finalTitle = titleToCreate;
    const exactMatch = boards.find(b => b.title.toLowerCase() === titleToCreate.toLowerCase());

    if (exactMatch) {
      if (!window.confirm(`Você já possui um quadro com o nome "${titleToCreate}". Deseja criar outro com o mesmo nome?`)) {
        return;
      }
      
      let counter = 1;
      let uniqueTitle = `${titleToCreate} (${counter})`;
      while (boards.some(b => b.title.toLowerCase() === uniqueTitle.toLowerCase())) {
        counter++;
        uniqueTitle = `${titleToCreate} (${counter})`;
      }
      finalTitle = uniqueTitle;
    }

    setIsCreating(true);
    try {
      const { data } = await api.post('/boards', { title: finalTitle });
      setBoards([data, ...boards]);
      setIsModalOpen(false);
      setNewTitle('');
      navigate(`/board/${data.id}`);
    } catch (err) {
       console.error("Error creating board", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este quadro?')) return;

    try {
      await api.delete(`/boards/${id}`);
      setBoards(boards.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting board', err);
    }
  };



  return (
    <div className="py-6 px-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Seus Quadros</h1>
          <p className="text-slate-400">Gerencie seus projetos e tarefas</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto shadow-glow flex items-center gap-2">
          <i className="fi fi-rr-plus"></i>
          Novo Quadro
        </Button>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
          {error}
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20 px-4 card-surface border-dashed border-2">
          <div className="w-16 h-16 bg-surface-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 text-3xl">
            <i className="fi fi-rr-folder-open"></i>
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum quadro criado</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Você ainda não tem nenhum quadro. Crie um para começar a organizar suas tarefas.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Criar meu primeiro quadro</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {boards.map((board) => (
            <Link 
              key={board.id} 
              to={`/board/${board.id}`}
              className="group card-surface p-5 hover:-translate-y-1 hover:shadow-glow hover:border-primary-500/50 transition-all duration-300 flex flex-col h-40"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-white truncate pr-4" title={board.title}>
                  {board.title}
                </h3>
                <button 
                  onClick={(e) => handleDelete(board.id, e)}
                  className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-surface-700 flex items-center justify-center"
                  title="Excluir quadro"
                >
                  <i className="fi fi-rr-trash"></i>
                </button>
              </div>
              
              <div className="mt-auto pt-4 border-t border-surface-700 flex justify-between items-center text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <i className="fi fi-rr-list"></i>
                  {board._count?.columns || 0} colunas
                </span>
                
                <span className="text-xs">
                  {new Date(board.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Criar novo quadro"
      >
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <Input
            label="Título do quadro"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Projeto X, Roadmap da Empresa..."
            autoFocus
            required
            maxLength={80}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Criar Quadro
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
