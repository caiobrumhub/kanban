import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import type { Board } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const COLORS = ['bg-primary-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
const ICONS = ['fi-rr-chalkboard', 'fi-rr-briefcase', 'fi-rr-rocket', 'fi-rr-star', 'fi-rr-heart', 'fi-rr-book', 'fi-rr-lightbulb', 'fi-rr-shopping-cart', 'fi-rr-bell', 'fi-rr-shield', 'fi-rr-graduation-cap', 'fi-rr-target'];

const DashboardPage = () => {
  const navigate = useNavigate();
  const { boards, setBoards } = useBoardStore();
  const [error, setError] = useState('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [newBoardId, setNewBoardId] = useState<number | null>(null);
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newIcon, setNewIcon] = useState(ICONS[0]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleToCreate = newTitle.trim();
    if (!titleToCreate) return;

    let finalTitle = titleToCreate;
    const exactMatch = boards.find(b => b.title.toLowerCase() === titleToCreate.toLowerCase());

    if (exactMatch && !duplicateWarning) {
      setDuplicateWarning(true);
      return;
    }

    if (exactMatch && duplicateWarning) {
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
      const { data } = await api.post('/boards', { title: finalTitle, color: newColor, icon: newIcon });
      setBoards([data, ...boards]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewColor(COLORS[0]);
      setNewIcon(ICONS[0]);
      setDuplicateWarning(false);
      setNewBoardId(data.id);
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
              className="group card-surface relative p-5 hover:-translate-y-1 hover:shadow-glow hover:border-primary-500/50 transition-all duration-300 flex flex-col h-40"
            >
              {newBoardId === board.id && (
                <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5" title="Quadro recém-criado">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-surface-900"></span>
                </span>
              )}
              <div className="flex gap-3 items-center mb-3">
                <div className={`w-10 h-10 rounded-lg ${board.color || 'bg-primary-500'} flex items-center justify-center text-white shrink-0`}>
                  <i className={`fi ${board.icon || 'fi-rr-chalkboard'} text-xl`}></i>
                </div>
                <div className="flex justify-between items-start flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate pr-4" title={board.title}>
                    {board.title}
                  </h3>
                  <button 
                    onClick={(e) => handleDelete(board.id, e)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-surface-700 flex items-center justify-center shrink-0"
                    title="Excluir quadro"
                  >
                    <i className="fi fi-rr-trash"></i>
                  </button>
                </div>
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
        onClose={() => { setIsModalOpen(false); setDuplicateWarning(false); setNewTitle(''); setNewColor(COLORS[0]); setNewIcon(ICONS[0]); }} 
        title="Criar novo quadro"
      >
        <form onSubmit={handleCreateBoard} className="space-y-4">
          <Input
            label="Título do quadro"
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              setDuplicateWarning(false);
            }}
            placeholder="Ex: Projeto X, Roadmap da Empresa..."
            autoFocus
            required
            maxLength={80}
          />
          {duplicateWarning && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-sm flex gap-2 items-start">
              <i className="fi fi-rr-triangle-warning mt-0.5"></i>
              <div>
                <p>Você já possui um quadro com este nome.</p>
                <p className="mt-1">Clique em <strong>Criar Quadro</strong> novamente para criá-lo como <strong>"{newTitle.trim()} (1)"</strong>.</p>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cor do Quadro</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-8 h-8 rounded-full ${c} ${newColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900' : 'opacity-70 hover:opacity-100'} transition-all`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Ícone do Quadro</label>
            <div className="grid grid-cols-6 gap-2 bg-surface-900/50 p-2 rounded-lg border border-surface-700">
              {ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNewIcon(i)}
                  className={`h-10 rounded flex items-center justify-center text-xl transition-all ${newIcon === i ? 'bg-surface-700 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'}`}
                >
                  <i className={`fi ${i}`}></i>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-700 mt-4">
            <Button type="button" variant="ghost" onClick={() => { setIsModalOpen(false); setDuplicateWarning(false); setNewTitle(''); setNewColor(COLORS[0]); setNewIcon(ICONS[0]); }}>
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
