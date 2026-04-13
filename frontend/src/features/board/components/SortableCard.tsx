import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskCard from './TaskCard';
import type { Card } from '../../../types';

interface SortableCardProps {
  card: Card;
  onClick: (card: Card) => void;
}

const SortableCard = ({ card, onClick }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card-${card.id}`,
    data: {
      type: 'Card',
      card,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <TaskCard
      card={card}
      onClick={onClick}
      style={style}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      isDragging={isDragging}
    />
  );
};

export default SortableCard;
