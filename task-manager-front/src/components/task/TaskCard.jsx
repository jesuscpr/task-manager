import './TaskCard.css'

const priorityColors = {
    'LOW': '#14b451',
    'MEDIUM': '#3498db',
    'HIGH': '#f39c12',
    'URGENT': '#e74c3c'
  }

const TaskCard = ({ title, task, isDragging, onTaskClick }) => {
  return (
    <article
      className={`taskCard ${isDragging ? 'dragging' : ''}`}
      onClick={() => onTaskClick && onTaskClick(task)}
      style={{ border: `2px solid ${priorityColors[task.priority]}` }}
    >
      <p className='taskText'>{title}</p>
      
      {task.assigned_to[0]?.username && (
        <p className='taskAssigned'>{task.assigned_to[0]?.username}</p>
      )}
    </article>
  )
}

export default TaskCard