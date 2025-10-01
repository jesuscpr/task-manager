import './TaskCard.css'
import iconoTrashCan from '../assets/trash-can.svg'

const TaskCard = ({ title, handleDelete, index, setActiveCard }) => {
  return (
    <article
      className='taskCard'
      draggable
      onDragStart={() => setActiveCard(index)}
      onDragEnd={() => setActiveCard(null)}
    >
      <p className='taskText'>{title}</p>
      <div className='taskDelete'>
        <img
          src={iconoTrashCan}
          alt='Eliminar'
          className='iconoDelete'
          onClick={() => handleDelete(index)}
        />
      </div>
    </article>
  )
}

export default TaskCard
