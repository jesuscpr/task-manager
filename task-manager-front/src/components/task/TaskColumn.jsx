import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import './TaskColumn.css'
import SortableTaskCard from './SortableTaskCard'
import iconoAdd from '../../assets/add.svg'

const TaskColumn = ({ title, tasks, status, handleDelete, handleAddTask, onTaskClick }) => {
  // Normalizar status para comparar
  const normalizedStatus = status.toUpperCase().replace('INPROCESS', 'IN_PROGRESS')
  const statusTasks = tasks.filter(t => t.status === normalizedStatus)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')

  // Configurar droppable
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const handleCloseModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsModalOpen(false)
      setIsClosing(false)
    }, 300)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newTaskText.trim()) {
      handleAddTask(newTaskText, status)
      setNewTaskText('')
      handleCloseModal()
    }
  }

  return (
    <section className='taskColumn'>
      <div className='titleContainer'>
        <h2 className='title'>{title}</h2>
        <img 
          src={iconoAdd} 
          alt='Añadir' 
          className='iconoAdd'
          onClick={() => setIsModalOpen(true)}
        />
      </div>
      
      <div
        ref={setNodeRef}
        className={`taskList ${isOver ? 'draggingOver' : ''}`}
      >
        <SortableContext
          items={statusTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {statusTasks.length === 0 ? (
            <div className="emptyColumn">
              Arrastra tareas aquí
            </div>
          ) : (
            statusTasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                handleDelete={() => handleDelete(task.id)}
                onTaskClick={onTaskClick}
              />
            ))
          )}
        </SortableContext>
      </div>

      {isModalOpen && (
        <div 
          className={`modal-overlay ${isClosing ? 'closing' : ''}`}
          onClick={handleCloseModal}
        >
          <div 
            className={`modal-content ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className='modal-close' onClick={handleCloseModal}>
              &times;
            </button>
            <h3 className='modal-title'>Añadir nueva tarea a {title}</h3>
            
            <div className='form-container'>
              <label className='form-label'>Descripción de la tarea</label>
              <textarea
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder='Escribe la tarea aquí...'
                className='form-textarea'
                rows='4'
                autoFocus
              />
              
              <div className='modal-buttons'>
                <button 
                  type='button'
                  onClick={handleCloseModal}
                  className='btn-cancel'
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSubmit}
                  className='btn-submit'
                  disabled={!newTaskText.trim()}
                >
                  Añadir Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default TaskColumn