import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'

const SortableTaskCard = ({ task, handleDelete, onTaskClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        title={task.title}
        task={task}
        handleDelete={handleDelete}
        isDragging={isDragging}
        onTaskClick={onTaskClick}
      />
    </div>
  )
}

export default SortableTaskCard