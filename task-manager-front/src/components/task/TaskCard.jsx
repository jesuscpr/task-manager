import './TaskCard.css'

const TaskCard = ({ title, task, isDragging, onTaskClick }) => {
  return (
    <article
      className={`taskCard ${isDragging ? 'dragging' : ''}`}
      onClick={() => onTaskClick && onTaskClick(task)}
    >
      <p className='taskText'>{title}</p>
    </article>
  )
}

export default TaskCard