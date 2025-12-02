import './TaskCard.css'
import iconoTrashCan from '../../assets/trash-can.svg'

const TaskCard = ({ title, task, handleDelete, isDragging, onTaskClick }) => {
  return (
    <article
      className={`taskCard ${isDragging ? 'dragging' : ''}`}
      onClick={() => onTaskClick && onTaskClick(task)}
    >
      <p className='taskText'>{title}</p>
      {handleDelete && (
        <div className='taskDelete'>
          <img
            src={iconoTrashCan}
            alt='Eliminar'
            className='iconoDelete'
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
          />
        </div>
      )}
    </article>
  )
}

export default TaskCard