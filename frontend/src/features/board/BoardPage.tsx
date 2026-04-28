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
import { 
  SortableContext, 
  horizontalListSortingStrategy, 
  arrayMove,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { api } from '../../services/api';
import { useBoardStore } from '../../store/boardStore';
import type { Board, Column, Card, Priority } from '../../types';
import BoardColumn from './components/BoardColumn';
import TaskCard from './components/TaskCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const BoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBoard, setCurrentBoard } = useBoardStore();

  const [isLoading, setIsLoading] = useState(true);
  
  // Dnd state
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  // Modals state
  const [isColModalOpen, setIsColModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [colTitle, setColTitle] = useState('');
  
  // Card form state
  const [selectedColId, setSelectedColId] = useState<number | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardTitle, setCardTitle] = useState('');
  const [cardDesc, setCardDesc] = useState('');
  const [cardPriority, setCardPriority] = useState<Priority>('MEDIUM');

  useEffect(() => {
    fetchBoard();
  }, [id]);

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
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (card: Card) => {
     setEditingCard(card);
     setCardTitle(card.title);
     setCardDesc(card.description || '');
     setCardPriority(card.priority);
     setIsCardModalOpen(true);
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
      if (editingCard) {
         const { data } = await api.patch(`/cards/${editingCard.id}`, {
            title: cardTitle,
            description: cardDesc,
            priority: cardPriority
         });
         
         const newCols = currentBoard.columns.map(col => ({
             ...col,
             cards: col.cards.map(c => c.id === editingCard.id ? data : c)
         }));
         setCurrentBoard({ ...currentBoard, columns: newCols });
      } else if (selectedColId) {
         const { data } = await api.post(`/columns/${selectedColId}/cards`, {
            title: cardTitle,
            description: cardDesc,
            priority: cardPriority
         });

         const newCols = currentBoard.columns.map(col => {
             if (col.id === selectedColId) {
                 return { ...col, cards: [...col.cards, data] };
             }
             return col;
         });
         setCurrentBoard({ ...currentBoard, columns: newCols });
      }
      setIsCardModalOpen(false);
    } catch (e) {
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

  if (isLoading) return <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;
  if (!currentBoard) return <div className="p-8 text-center text-red-400">Board not found</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 md:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <h1 className="text-2xl font-bold text-white break-words w-full sm:w-auto">{currentBoard.title}</h1>
        <Button onClick={() => setIsColModalOpen(true)} className="w-full sm:w-auto">Adicionar Coluna</Button>
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
              {currentBoard.columns.map((col) => (
                <BoardColumn 
                  key={col.id} 
                  column={col} 
                  cards={col.cards}
                  onAddCard={openAddCardModal}
                  onCardClick={openEditCardModal}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}
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
             <div className="w-full">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Prioridade</label>
                <select className="input-field" value={cardPriority} onChange={e => setCardPriority(e.target.value as Priority)}>
                   <option value="LOW">Baixa</option>
                   <option value="MEDIUM">Média</option>
                   <option value="HIGH">Alta</option>
                </select>
             </div>
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
    </div>
  );
};

export default BoardPage;
