import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'

const DraggableTaskCard = ({ task, onTaskClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    // Oculta la tarjeta original mientras se muestra el DragOverlay
    opacity: isDragging ? 0 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        title={task.title}
        task={task}
        isDragging={false}
        onTaskClick={onTaskClick}
      />
    </div>
  )
}

export default DraggableTaskCard
