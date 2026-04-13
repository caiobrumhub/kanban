import type { Card, Priority } from '../../../types';

interface TaskCardProps {
  card: Card;
  onClick: (card: Card) => void;
  style?: React.CSSProperties;
  attributes?: any;
  listeners?: any;
  setNodeRef?: (node: HTMLElement | null) => void;
  isDragging?: boolean;
}

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    HIGH: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  const labels = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
};

const TaskCard = ({ 
  card, 
  onClick,
  style,
  attributes,
  listeners,
  setNodeRef,
  isDragging
}: TaskCardProps) => {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-surface p-3 cursor-grab hover:shadow-glow hover:border-primary-500/50 
        transition-colors mb-3 group relative
        ${isDragging ? 'opacity-50 !shadow-2xl z-50 ring-2 ring-primary-500' : ''}`}
      onClick={() => onClick(card)}
      {...attributes}
      {...listeners}
    >
      {/* Labels row */}
      {card.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.labels.map(l => (
            <span 
              key={l.id} 
              className="text-[10px] px-2 py-0.5 rounded font-medium text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <h4 className="text-sm font-medium text-white mb-1.5 leading-snug">{card.title}</h4>
      
      {card.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
          {card.description}
        </p>
      )}

      <div className="flex justify-between items-end mt-2">
        <PriorityBadge priority={card.priority} />
      </div>
    </div>
  );
};

export default TaskCard;
