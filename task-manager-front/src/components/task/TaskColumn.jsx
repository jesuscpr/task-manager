import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import './TaskColumn.css'
import SortableTaskCard from './SortableTaskCard'
import AddTaskModal from './AddTaskModal'
import iconoAdd from '../../assets/add.svg'

const TaskColumn = ({ title, tasks, status, handleDelete, handleAddTask, onTaskClick, availableLabels, availableUsers }) => {
  // Normalizar status para comparar
  const normalizedStatus = status.toUpperCase().replace('INPROCESS', 'IN_PROGRESS')
  const statusTasks = tasks.filter(t => t.status === normalizedStatus)
  
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Configurar droppable
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  const handleSubmit = (formData) => {
    handleAddTask(formData)
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
              Arrastra tareas aquí o crea una nueva
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

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        columnTitle={title}
        defaultStatus={normalizedStatus}
        availableLabels={availableLabels}
        availableUsers={availableUsers}
      />
    </section>
  )
}

export default TaskColumn