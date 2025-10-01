import { Fragment, useState } from 'react'
import './TaskColumn.css'
import DropArea from './DropArea'
import TaskCard from './TaskCard'

import iconoAdd from '../assets/add.svg'

const TaskColumn = ({ title, tasks, status, handleDelete, setActiveCard, onDrop, handleAddTask }) => {
  const statusTasks = tasks.filter(t => t.status === status)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')

  const handleCloseModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsModalOpen(false)
      setIsClosing(false)
    }, 300) // Duración de la animación
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
      
      <DropArea onDrop={() => onDrop(status, 0)} big={statusTasks.length === 0}/>
      {statusTasks.map((task, statusIndex) => {
        const globalIndex = tasks.findIndex(t => t.id === task.id)
        const isLast = statusIndex === statusTasks.length - 1

        return (
          <Fragment key={task.id}>
            <TaskCard
              title={task.task}
              handleDelete={handleDelete}
              index={globalIndex}
              setActiveCard={setActiveCard}
            />
            <DropArea onDrop={() => onDrop(status, statusIndex + 1)} big={isLast} />
          </Fragment>
        )
      })}

      {/* Modal */}
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