import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useBoardStore } from '../../store/boardStore';
import type { Board, Column, Card, Priority, Client } from '../../types';
import BoardColumn from './components/BoardColumn';
import TaskCard from './components/TaskCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const COLORS = ['bg-primary-500', 'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
const ICONS = ['fi-rr-chalkboard', 'fi-rr-briefcase', 'fi-rr-rocket', 'fi-rr-star', 'fi-rr-heart', 'fi-rr-book', 'fi-rr-lightbulb', 'fi-rr-shopping-cart', 'fi-rr-bell', 'fi-rr-shield', 'fi-rr-graduation-cap', 'fi-rr-target'];

const BoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentBoard, setCurrentBoard, boards, setBoards } = useBoardStore();

  const [isLoading, setIsLoading] = useState(true);
  
  // Dnd state
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Modals state
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [isShowDoneOpen, setIsShowDoneOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [colTitle, setColTitle] = useState('');
  
  // Board share state
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  
  const [colTitle, setColTitle] = useState('');
  
  // Board edit state
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardColor, setEditBoardColor] = useState('');
  const [editBoardIcon, setEditBoardIcon] = useState('');
  
  // Card form state
  const [selectedColId, setSelectedColId] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardPriority, setCardPriority] = useState<Priority>('MEDIUM');
  const [cardClientId, setCardClientId] = useState<number | ''>('');
  const [cardIsDone, setCardIsDone] = useState(false);
  const [cardChecklists, setCardChecklists] = useState<Checklist[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  
  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [isNewClientMode, setIsNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDoc, setNewClientDoc] = useState('');

  useEffect(() => {
    fetchBoard();
    fetchClients();
  }, [id]);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
    } catch (e) { console.error(e); }
  };

  const fetchBoard = async () => {
    try {
      const { data } = await api.get(`/boards/${id}`);
      setCurrentBoard(data);
    } catch {
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ─── Drag & Drop Handlers ──────────────────────────────────────────────────

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column);
      return;
    }
    if (event.active.data.current?.type === 'Card') {
      setActiveCard(event.active.data.current.card);
      return;
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id === over.id) return;
    if (!currentBoard) return;

    const isActiveCard = active.data.current?.type === 'Card';
    const isOverCard = over.data.current?.type === 'Card';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveCard) return;

    // Card over another card
    if (isActiveCard && isOverCard) {
      setCurrentBoard({
        ...currentBoard,
        columns: currentBoard.columns.map((col) => {
          const activeCardIndex = col.cards.findIndex(c => `card-${c.id}` === active.id);
          const overCardIndex = col.cards.findIndex(c => `card-${c.id}` === over.id);

          if (activeCardIndex !== -1 && overCardIndex !== -1) {
             // In same column
             const newCards = arrayMove(col.cards, activeCardIndex, overCardIndex);
             newCards.forEach((c, idx) => c.order = idx);
             return { ...col, cards: newCards };
          }
          
          if (activeCardIndex !== -1 && overCardIndex === -1) {
            // Removing from source column
            return { ...col, cards: col.cards.filter(c => `card-${c.id}` !== active.id) };
          }

          if (activeCardIndex === -1 && overCardIndex !== -1) {
            // Adding to destination column
            const activeCardData = active.data.current?.card;
            if (activeCardData) {
               const newCards = [...col.cards];
               newCards.splice(overCardIndex, 0, { ...activeCardData, columnId: col.id });
               newCards.forEach((c, idx) => c.order = idx);
               return { ...col, cards: newCards };
            }
          }
          return col;
        })
      });
    }

    // Card over empty column 
    if (isActiveCard && isOverColumn) {
       setCurrentBoard({
        ...currentBoard,
        columns: currentBoard.columns.map((col) => {
          const activeCardIndex = col.cards.findIndex(c => `card-${c.id}` === active.id);
          
          if (activeCardIndex !== -1) {
            return { ...col, cards: col.cards.filter(c => `card-${c.id}` !== active.id) };
          }
          if (`column-${col.id}` === over.id) {
             const activeCardData = active.data.current?.card;
             if (activeCardData) {
               const newCards = [...col.cards, { ...activeCardData, columnId: col.id }];
               newCards.forEach((c, idx) => c.order = idx);
               return { ...col, cards: newCards };
             }
          }
          return col;
        })
      });
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;
    if (!currentBoard) return;

    if (active.id === over.id) return;

    const isActiveColumn = active.data.current?.type === 'Column';
    if (isActiveColumn) {
      const activeIdx = currentBoard.columns.findIndex(c => `column-${c.id}` === active.id);
      const overIdx = currentBoard.columns.findIndex(c => `column-${c.id}` === over.id);

      const newCols = arrayMove(currentBoard.columns, activeIdx, overIdx);
      newCols.forEach((c, idx) => c.order = idx);
      setCurrentBoard({ ...currentBoard, columns: newCols });

      // Save to API
      api.post(`/boards/${currentBoard.id}/columns/reorder`, { orderedIds: newCols.map(c => c.id) }).catch(console.error);
      return;
    }

    const isActiveCard = active.data.current?.type === 'Card';
    if (isActiveCard) {
      // Find where card is now after optimistic update in over handler
      let destColId = -1;
      let newOrder = -1;
      let targetCards: Card[] = [];

      currentBoard.columns.forEach(col => {
         const idx = col.cards.findIndex(c => `card-${c.id}` === active.id);
         if (idx !== -1) {
            destColId = col.id;
            newOrder = idx;
            targetCards = col.cards;
         }
      });

      if (destColId !== -1) {
         const cardId = Number(String(active.id).replace('card-', ''));
         try {
           // Move card
           await api.patch(`/cards/${cardId}`, { columnId: destColId, order: newOrder });
           // Reorder cards in destination column
           await api.post(`/columns/${destColId}/cards/reorder`, { orderedIds: targetCards.map(c => c.id) });
         } catch (e) {
             console.error("Card move error", e);
             fetchBoard(); // Revert on failure
         }
      }
    }
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const openAddCardModal = (colId: number) => {
    setSelectedColId(colId);
    setEditingCard(null);
    setCardTitle('');
    setCardDesc('');
    setCardPriority('MEDIUM');
    setCardClientId('');
    setCardIsDone(false);
    setCardChecklists([]);
    setNewChecklistTitle('');
    setIsNewClientMode(false);
    setNewClientName('');
    setNewClientDoc('');
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (card: Card) => {
     setEditingCard(card);
     setCardTitle(card.title);
     setCardDesc(card.description || '');
     setCardPriority(card.priority);
     setCardClientId(card.clientId || '');
     setCardIsDone(card.isDone || false);
     setCardChecklists(card.checklists || []);
     setNewChecklistTitle('');
     setIsNewClientMode(false);
     setNewClientName('');
     setNewClientDoc('');
     setIsCardModalOpen(true);
  };

  const openEditBoardModal = () => {
     if (!currentBoard) return;
     setEditBoardTitle(currentBoard.title);
     setEditBoardColor(currentBoard.color || 'bg-primary-500');
     setEditBoardIcon(currentBoard.icon || 'fi-rr-chalkboard');
     setIsEditBoardModalOpen(true);
  };

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBoardTitle.trim() || !currentBoard) return;
    try {
      const { data } = await api.patch(`/boards/${currentBoard.id}`, {
        title: editBoardTitle,
        color: editBoardColor,
        icon: editBoardIcon
      });
      setCurrentBoard({ ...currentBoard, ...data });
      setBoards(boards.map(b => b.id === currentBoard.id ? { ...b, ...data } : b));
      setIsEditBoardModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareCodeInput.trim() || !currentBoard) return;
    setIsSharing(true);
    try {
      const { data } = await api.post(`/boards/${currentBoard.id}/share`, { shareCode: shareCodeInput });
      const updatedSharedWith = [...(currentBoard.sharedWith || []), data];
      setCurrentBoard({ ...currentBoard, sharedWith: updatedSharedWith });
      setShareCodeInput('');
      setBoards(boards.map(b => b.id === currentBoard.id ? { ...b, sharedWith: updatedSharedWith } : b));
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao compartilhar quadro.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (sharedUserId: number) => {
    if (!currentBoard) return;
    if (!confirm('Remover acesso deste usuário ao quadro?')) return;
    try {
      await api.delete(`/boards/${currentBoard.id}/share/${sharedUserId}`);
      const updatedSharedWith = (currentBoard.sharedWith || []).filter(s => s.userId !== sharedUserId);
      setCurrentBoard({ ...currentBoard, sharedWith: updatedSharedWith });
      setBoards(boards.map(b => b.id === currentBoard.id ? { ...b, sharedWith: updatedSharedWith } : b));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colTitle.trim() || !currentBoard) return;
    try {
      const { data } = await api.post(`/boards/${currentBoard.id}/columns`, { title: colTitle });
      setCurrentBoard({ ...currentBoard, columns: [...currentBoard.columns, { ...data, cards: [] }] });
      setIsColModalOpen(false);
      setColTitle('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteColumn = async (colId: number) => {
    if(!confirm('Deletar coluna e todos os seus cards?')) return;
    try {
      await api.delete(`/columns/${colId}`);
      if(currentBoard) {
         setCurrentBoard({...currentBoard, columns: currentBoard.columns.filter(c => c.id !== colId)});
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBoard) return;

    try {
      let finalClientId: number | undefined = cardClientId === '' ? undefined : Number(cardClientId);

      if (isNewClientMode && newClientName.trim()) {
         const { data: newClient } = await api.post('/clients', { name: newClientName, document: newClientDoc });
         finalClientId = newClient.id;
         setClients([...clients, newClient].sort((a, b) => a.name.localeCompare(b.name)));
      }

      const payload = {
          title: cardTitle,
          description: cardDesc,
          priority: cardPriority,
          clientId: finalClientId,
          isDone: cardIsDone
      };

      if (editingCard) {
         const { data } = await api.patch(`/cards/${editingCard.id}`, payload);
         
         const newCols = currentBoard.columns.map(col => ({
             ...col,
             cards: col.cards.map(c => c.id === editingCard.id ? data : c)
         }));
         setCurrentBoard({ ...currentBoard, columns: newCols });
      } else if (selectedColId) {
         const { data } = await api.post(`/columns/${selectedColId}/cards`, payload);

         const newCols = currentBoard.columns.map(col => {
             if (col.id === selectedColId) {
                 return { ...col, cards: [...col.cards, data] };
             }
             return col;
         });
         setCurrentBoard({ ...currentBoard, columns: newCols });
      }
      setIsCardModalOpen(false);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erro ao salvar cartão.');
      console.error(e);
    }
  };

  const handleDeleteCard = async () => {
     if(!editingCard || !currentBoard) return;
     if(!confirm('Deletar este cartão?')) return;

     try {
       await api.delete(`/cards/${editingCard.id}`);
       const newCols = currentBoard.columns.map(col => ({
           ...col,
           cards: col.cards.filter(c => c.id !== editingCard.id)
       }));
       setCurrentBoard({...currentBoard, columns: newCols});
       setIsCardModalOpen(false);
     } catch (e) {
       console.error(e);
     }
  }

  // --- Checklist Handlers ---
  const handleAddChecklist = async () => {
    if (!editingCard || !newChecklistTitle.trim()) return;
    try {
      const { data } = await api.post(`/cards/${editingCard.id}/checklists`, { title: newChecklistTitle });
      setCardChecklists([...cardChecklists, data]);
      setNewChecklistTitle('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    if (!editingCard) return;
    try {
      await api.delete(`/cards/${editingCard.id}/checklists/${checklistId}`);
      setCardChecklists(cardChecklists.filter(c => c.id !== checklistId));
    } catch (e) { console.error(e); }
  };

  const handleAddChecklistItem = async (checklistId: number, text: string, isMandatory: boolean) => {
    if (!editingCard || !text.trim()) return;
    try {
      const { data } = await api.post(`/cards/${editingCard.id}/checklists/${checklistId}/items`, { text, isMandatory });
      setCardChecklists(cardChecklists.map(c => c.id === checklistId ? { ...c, items: [...c.items, data] } : c));
    } catch (e) { console.error(e); }
  };

  const handleToggleChecklistItem = async (checklistId: number, itemId: number, isCompleted: boolean) => {
    if (!editingCard) return;
    try {
      const { data } = await api.patch(`/cards/${editingCard.id}/checklists/${checklistId}/items/${itemId}`, { isCompleted });
      setCardChecklists(cardChecklists.map(c => c.id === checklistId ? { ...c, items: c.items.map(i => i.id === itemId ? data : i) } : c));
    } catch (e) { console.error(e); }
  };
  
  const handleDeleteChecklistItem = async (checklistId: number, itemId: number) => {
    if (!editingCard) return;
    try {
      await api.delete(`/cards/${editingCard.id}/checklists/${checklistId}/items/${itemId}`);
      setCardChecklists(cardChecklists.map(c => c.id === checklistId ? { ...c, items: c.items.filter(i => i.id !== itemId) } : c));
    } catch (e) { console.error(e); }
  };

  if (isLoading) return <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;
  if (!currentBoard) return <div className="p-8 text-center text-red-400">Board not found</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
           <div className={`w-12 h-12 rounded-xl ${currentBoard.color || 'bg-primary-500'} flex items-center justify-center text-white shadow-glow shrink-0`}>
             <i className={`fi ${currentBoard.icon || 'fi-rr-chalkboard'} text-2xl`}></i>
           </div>
           <div>
             <h1 className="text-2xl font-bold text-white break-words w-full sm:w-auto">{currentBoard.title}</h1>
             <button onClick={openEditBoardModal} className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 mt-0.5 transition-colors">
               <i className="fi fi-rr-edit"></i> Editar quadro
             </button>
           </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {user?.id === currentBoard.userId && (
            <Button variant="ghost" onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2">
              <i className="fi fi-rr-share"></i> Compartilhar
            </Button>
          )}
          <Button variant="ghost" onClick={() => setIsShowDoneOpen(true)} className="flex items-center gap-2">
            <i className="fi fi-rr-check-circle"></i> Ver Concluídos
          </Button>
          <Button onClick={() => setIsColModalOpen(true)}>Adicionar Coluna</Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-6 h-full items-start px-2">
            <SortableContext 
              items={currentBoard.columns.map(c => `column-${c.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {currentBoard.columns.map((col) => {
                const activeCards = col.cards.filter(c => !c.isDone);
                return (
                  <BoardColumn 
                    key={col.id} 
                    column={col} 
                    cards={activeCards}
                    onAddCard={openAddCardModal}
                    onCardClick={openEditCardModal}
                    onDeleteColumn={handleDeleteColumn}
                  />
                );
              })}
            </SortableContext>
            
            {/* Empty state visually representing "add zone" */}
            <button 
              onClick={() => setIsColModalOpen(true)}
              className="w-72 flex-shrink-0 rounded-xl border-2 border-dashed border-surface-600/50 bg-surface-800/20 hover:bg-surface-800/50 hover:border-surface-500 text-surface-600 hover:text-slate-400 transition-all flex items-center justify-center min-h-[120px] group"
              title="Adicionar Nova Coluna"
            >
               <i className="fi fi-rr-plus text-3xl group-hover:scale-110 transition-transform"></i>
            </button>
          </div>

          <DragOverlay>
            {activeColumn && (
              <BoardColumn 
                column={activeColumn} 
                cards={activeColumn.cards} 
                onAddCard={()=>{}} 
                onCardClick={()=>{}} 
                onDeleteColumn={()=>{}}
              />
            )}
            {activeCard && (
              <TaskCard card={activeCard} onClick={()=>{}} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      </div>

       {/* Column Modal */}
       <Modal isOpen={isColModalOpen} onClose={() => setIsColModalOpen(false)} title="Nova Coluna">
          <form onSubmit={handleCreateColumn} className="space-y-4">
             <Input label="Título" value={colTitle} onChange={e => setColTitle(e.target.value)} required autoFocus/>
             <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsColModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Criar</Button>
             </div>
          </form>
       </Modal>

       {/* Card Modal */}
       <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title={editingCard ? "Editar Cartão" : "Novo Cartão"}>
          <div className="flex gap-4 mb-4">
             {editingCard && (
               <label className="flex items-center gap-2 cursor-pointer bg-surface-800 border border-surface-600 px-3 py-2 rounded-lg hover:border-primary-500 transition-colors">
                 <input 
                   type="checkbox" 
                   checked={cardIsDone} 
                   onChange={(e) => setCardIsDone(e.target.checked)}
                   className="w-4 h-4 text-primary-500 rounded border-surface-600 focus:ring-primary-500 bg-surface-900"
                 />
                 <span className={`font-semibold ${cardIsDone ? 'text-green-400' : 'text-slate-300'}`}>
                    Marcar como Concluído
                 </span>
               </label>
             )}
          </div>
          <form onSubmit={handleSaveCard} className="space-y-4">
             <Input label="Título" value={cardTitle} onChange={e => setCardTitle(e.target.value)} required autoFocus/>
             <div className="w-full">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição</label>
                <textarea 
                  className="input-field min-h-[100px] resize-y" 
                  value={cardDesc} 
                  onChange={e => setCardDesc(e.target.value)} 
                />
             </div>
             
             <div className="border border-surface-600 rounded-lg p-3 bg-surface-800/50">
               <div className="flex justify-between items-center mb-2">
                 <label className="block text-sm font-medium text-primary-400">Cliente / CRM</label>
                 <button 
                   type="button" 
                   onClick={() => setIsNewClientMode(!isNewClientMode)} 
                   className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                 >
                   <i className={`fi ${isNewClientMode ? 'fi-rr-list' : 'fi-rr-plus'}`}></i>
                   {isNewClientMode ? 'Selecionar Existente' : 'Cadastrar Novo'}
                 </button>
               </div>
               
               {isNewClientMode ? (
                 <div className="space-y-3 animate-fade-in bg-surface-900/50 p-3 rounded border border-surface-700">
                   <Input label="Nome / Razão Social" value={newClientName} onChange={e => setNewClientName(e.target.value)} required={isNewClientMode} />
                   <Input label="CPF ou CNPJ (Opcional)" value={newClientDoc} onChange={e => setNewClientDoc(e.target.value)} />
                   <p className="text-xs text-slate-500 mt-1"><i className="fi fi-rr-info mr-1"></i>Preencha os demais dados fiscais na aba "Clientes" posteriormente.</p>
                 </div>
               ) : (
                 <select className="input-field" value={cardClientId} onChange={e => setCardClientId(e.target.value ? Number(e.target.value) : '')}>
                   <option value="">Nenhum cliente associado</option>
                   {clients.map(c => (
                     <option key={c.id} value={c.id}>{c.name} {c.document ? `(${c.document})` : ''}</option>
                   ))}
                 </select>
               )}


             <div className="w-full">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade</label>
                <select className="input-field" value={cardPriority} onChange={e => setCardPriority(e.target.value as Priority)}>
                   <option value="LOW">Baixa</option>
                   <option value="MEDIUM">Média</option>
                   <option value="HIGH">Alta</option>
                </select>
             </div>

             {/* Checklists Section */}
             {editingCard && (
               <div className="border border-surface-600 rounded-lg p-3 bg-surface-800/50 mt-4 space-y-4">
                 <h3 className="text-sm font-semibold text-primary-400">To-Do Lists (Checklists)</h3>
                 
                 {cardChecklists.map(checklist => {
                    const progress = checklist.items.length === 0 ? 0 : Math.round((checklist.items.filter(i => i.isCompleted).length / checklist.items.length) * 100);
                    return (
                      <div key={checklist.id} className="bg-surface-900 border border-surface-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-white">{checklist.title}</h4>
                          <button type="button" onClick={() => handleDeleteChecklist(checklist.id)} className="text-slate-500 hover:text-red-400">
                            <i className="fi fi-rr-trash"></i>
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-xs text-slate-400 w-8">{progress}%</span>
                           <div className="h-1.5 w-full bg-surface-700 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${progress}%` }}></div>
                           </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          {checklist.items.map(item => (
                            <div key={item.id} className="flex items-center gap-2 group">
                              <input 
                                type="checkbox" 
                                checked={item.isCompleted} 
                                onChange={(e) => handleToggleChecklistItem(checklist.id, item.id, e.target.checked)}
                                className="w-4 h-4 rounded border-surface-600 text-primary-500 focus:ring-primary-500"
                              />
                              <span className={`text-sm flex-1 ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                {item.text} {item.isMandatory && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded ml-1">Obrigatório</span>}
                              </span>
                              <button type="button" onClick={() => handleDeleteChecklistItem(checklist.id, item.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity">
                                <i className="fi fi-rr-cross-small"></i>
                              </button>
                            </div>
                          ))}
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const target = e.target as HTMLFormElement;
                          const input = target.elements.namedItem('text') as HTMLInputElement;
                          const checkbox = target.elements.namedItem('isMandatory') as HTMLInputElement;
                          handleAddChecklistItem(checklist.id, input.value, checkbox.checked);
                          input.value = '';
                          checkbox.checked = false;
                        }} className="flex gap-2 items-center mt-2 border-t border-surface-700 pt-2">
                          <input type="text" name="text" placeholder="Adicionar item..." className="input-field text-sm !py-1.5 flex-1" required />
                          <label className="flex items-center gap-1 text-xs text-slate-400 cursor-pointer">
                            <input type="checkbox" name="isMandatory" className="rounded bg-surface-900 border-surface-600 w-3 h-3 text-primary-500" />
                            Obrigatório
                          </label>
                          <Button type="submit" variant="primary" className="!py-1.5 !px-3 text-xs">Add</Button>
                        </form>
                      </div>
                    );
                 })}

                 <div className="flex gap-2">
                   <input type="text" placeholder="Nova Checklist..." value={newChecklistTitle} onChange={e => setNewChecklistTitle(e.target.value)} className="input-field text-sm" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklist(); } }} />
                   <Button type="button" variant="ghost" onClick={handleAddChecklist}>Add</Button>
                 </div>
               </div>
             )}
             <div className="flex justify-between items-center pt-4 border-t border-surface-700">
               {editingCard ? (
                  <Button type="button" variant="danger" onClick={handleDeleteCard}>Deletar</Button>
               ) : <div/>}
               <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsCardModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
               </div>
             </div>
          </form>
       </Modal>

       {/* Edit Board Modal */}
       <Modal isOpen={isEditBoardModalOpen} onClose={() => setIsEditBoardModalOpen(false)} title="Editar Quadro">
          <form onSubmit={handleUpdateBoard} className="space-y-4">
             <Input label="Título do quadro" value={editBoardTitle} onChange={e => setEditBoardTitle(e.target.value)} required autoFocus/>
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cor do Quadro</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditBoardColor(c)}
                      className={`w-8 h-8 rounded-full ${c} ${editBoardColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900' : 'opacity-70 hover:opacity-100'} transition-all`}
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
                      onClick={() => setEditBoardIcon(i)}
                      className={`h-10 rounded flex items-center justify-center text-xl transition-all ${editBoardIcon === i ? 'bg-surface-700 text-white shadow-glow' : 'text-slate-400 hover:text-slate-200 hover:bg-surface-800'}`}
                    >
                      <i className={`fi ${i}`}></i>
                    </button>
                  ))}
                </div>
             </div>
             <div className="flex justify-end gap-2 pt-4 border-t border-surface-700 mt-4">
               <Button type="button" variant="ghost" onClick={() => setIsEditBoardModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Salvar</Button>
             </div>
          </form>
       </Modal>
       {/* Completed Cards Overlay */}
       {isShowDoneOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
              <div className="p-5 border-b border-surface-600 flex justify-between items-center bg-surface-900/30 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <i className="fi fi-rr-check-circle text-green-500"></i> Cartões Concluídos
                </h2>
                <button onClick={() => setIsShowDoneOpen(false)} className="text-slate-400 hover:text-white p-1 rounded hover:bg-surface-700 transition-colors">
                  <i className="fi fi-rr-cross"></i>
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {currentBoard.columns.flatMap(col => col.cards.filter(c => c.isDone)).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <i className="fi fi-rr-box-open text-4xl mb-3 opacity-50 block"></i>
                    Nenhum cartão concluído encontrado neste quadro.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentBoard.columns.flatMap(col => col.cards.filter(c => c.isDone).map(c => ({...c, columnName: col.title}))).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(card => (
                      <div key={card.id} className="card-surface p-4 border border-surface-600 hover:border-surface-500 transition-colors cursor-pointer group" onClick={() => { setIsShowDoneOpen(false); openEditCardModal(card as any); }}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white line-through opacity-70 group-hover:opacity-100 transition-opacity">{card.title}</h3>
                          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">CONCLUÍDO</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 truncate">{card.description || 'Sem descrição'}</p>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span>Da coluna: {card.columnName}</span>
                          <span>{new Date(card.updatedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
       )}

       {/* Share Board Modal */}
       <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Compartilhar Quadro">
          <form onSubmit={handleShareBoard} className="space-y-4">
             <div className="flex gap-2">
               <div className="flex-1">
                 <Input 
                   label="Código de Compartilhamento do Usuário" 
                   value={shareCodeInput} 
                   onChange={e => setShareCodeInput(e.target.value)} 
                   placeholder="Ex: cm2x9a..." 
                   required 
                 />
               </div>
               <div className="pt-7">
                 <Button type="submit" isLoading={isSharing}>Adicionar</Button>
               </div>
             </div>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-700">
             <h3 className="text-sm font-medium text-slate-300 mb-4">Pessoas com acesso</h3>
             <div className="space-y-2">
                <div className="flex justify-between items-center bg-surface-900/50 p-3 rounded-lg border border-surface-700">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center font-bold">
                        {currentBoard.user?.name?.charAt(0).toUpperCase() || 'V'}
                      </div>
                      <div>
                         <p className="text-sm font-medium text-white">{currentBoard.user?.name || 'Você'}</p>
                         <p className="text-xs text-slate-400">{currentBoard.user?.email || ''}</p>
                      </div>
                   </div>
                   <span className="text-xs font-semibold text-primary-500 bg-primary-500/10 px-2 py-1 rounded">Proprietário</span>
                </div>

                {(currentBoard.sharedWith || []).map(share => (
                  <div key={share.userId} className="flex justify-between items-center bg-surface-800 p-3 rounded-lg border border-surface-600">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-600 text-slate-300 flex items-center justify-center font-bold">
                          {share.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <p className="text-sm font-medium text-white">{share.user.name}</p>
                           <p className="text-xs text-slate-400">{share.user.email}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleRemoveShare(share.userId)}
                       className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-surface-700 transition-colors"
                       title="Remover acesso"
                     >
                       <i className="fi fi-rr-cross-small text-lg"></i>
                     </button>
                  </div>
                ))}
                
                {(currentBoard.sharedWith || []).length === 0 && (
                   <div className="text-sm text-slate-500 text-center py-4">
                      Este quadro não está compartilhado com ninguém ainda.
                   </div>
                )}
             </div>
          </div>
       </Modal>
    </div>
  );
};

export default BoardPage;
