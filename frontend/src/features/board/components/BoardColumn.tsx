import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SortableCard from './SortableCard';
import type { Column, Card } from '../../../types';

interface BoardColumnProps {
  column: Column;
  cards: Card[];
  onAddCard: (colId: number) => void;
  onCardClick: (card: Card) => void;
  onDeleteColumn: (colId: number) => void;
}

const BoardColumn = ({ column, cards, onAddCard, onCardClick, onDeleteColumn }: BoardColumnProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: 'Column',
      column,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-800/80 backdrop-blur-sm rounded-xl w-72 flex flex-col flex-shrink-0 border border-surface-600/50 
        ${isDragging ? 'opacity-50 ring-2 ring-primary-500' : ''}`}
    >
      {/* Column Header */}
      <div 
        {...attributes}
        {...listeners}
        className="p-3 flex items-center justify-between border-b border-surface-700 cursor-grab"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">{column.title}</h3>
          <span className="bg-surface-700 text-slate-300 text-xs py-0.5 px-2 rounded-full font-medium">
            {cards.length}
          </span>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onDeleteColumn(column.id); }}
          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-surface-700 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      {/* Cards List */}
      <div className="p-3 flex-1 overflow-y-auto min-h-[100px] flex flex-col custom-scrollbar">
        <SortableContext 
          items={cards.map(c => `card-${c.id}`)} 
          strategy={verticalListSortingStrategy}
        >
          {cards.map(card => (
            <SortableCard 
              key={card.id} 
              card={card} 
              onClick={onCardClick} 
            />
          ))}
        </SortableContext>
      </div>

      {/* Add Card Button */}
      <div className="p-3 pt-0 mt-auto">
        <button
          onClick={() => onAddCard(column.id)}
          className="flex items-center gap-2 w-full p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-700 transition-colors group"
        >
          <div className="w-6 h-6 rounded bg-surface-700 group-hover:bg-surface-600 flex items-center justify-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span className="text-sm font-medium">Adicionar cartão</span>
        </button>
      </div>
    </div>
  );
};

export default BoardColumn;
