import { useState, useEffect } from 'react'
import './TaskDetailModal.css'

const TaskDetailModal = ({ 
  isOpen, 
  onClose, 
  task,
  onUpdate,
  onDelete
}) => {
  const [isClosing, setIsClosing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
  })

  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
      })
    }
  }, [task])

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
      setIsEditing(false)
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null
  if (!task) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setIsEditing(false)
    }, 300)
  }

  const handleSave = () => {
    onUpdate(task.id, editedTask)
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(task.id)
    handleClose()
  }

  const statusMap = {
    'TODO': 'Por hacer',
    'IN_PROGRESS': 'En proceso',
    'DONE': 'Completado'
  }

  const priorityMap = {
    'LOW': 'Baja',
    'MEDIUM': 'Media',
    'HIGH': 'Alta',
    'URGENT': 'Urgente'
  }

  const priorityColors = {
    'LOW': '#95a5a6',
    'MEDIUM': '#3498db',
    'HIGH': '#f39c12',
    'URGENT': '#e74c3c'
  }

  return (
    <div
      className={`task-detail-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`task-detail-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className='task-detail-close' onClick={handleClose}>
          &times;
        </button>

        <div className='task-detail-header'>
          {isEditing ? (
            <input
              type="text"
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className='task-detail-title-input'
              autoFocus
            />
          ) : (
            <h2 className='task-detail-title'>{task.title}</h2>
          )}
        </div>

        <div className='task-detail-body'>
          {/* Estado */}
          <div className='task-detail-section'>
            <label className='task-detail-label'>Estado</label>
            {isEditing ? (
              <select
                value={editedTask.status}
                onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
                className='task-detail-select'
              >
                <option value="TODO">Por hacer</option>
                <option value="IN_PROGRESS">En proceso</option>
                <option value="DONE">Completado</option>
              </select>
            ) : (
              <div className='task-detail-badge status'>
                {statusMap[task.status]}
              </div>
            )}
          </div>

          {/* Prioridad */}
          <div className='task-detail-section'>
            <label className='task-detail-label'>Prioridad</label>
            {isEditing ? (
              <select
                value={editedTask.priority}
                onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                className='task-detail-select'
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            ) : (
              <div 
                className='task-detail-badge priority'
                style={{ backgroundColor: priorityColors[task.priority] }}
              >
                {priorityMap[task.priority]}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className='task-detail-section full-width'>
            <label className='task-detail-label'>Descripción</label>
            {isEditing ? (
              <textarea
                value={editedTask.description}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className='task-detail-textarea'
                rows='5'
                placeholder='Añade una descripción...'
              />
            ) : (
              <p className='task-detail-text'>
                {task.description || 'Sin descripción'}
              </p>
            )}
          </div>

          {/* Asignados */}
          {task.assigned_to && task.assigned_to.length > 0 && (
            <div className='task-detail-section full-width'>
              <label className='task-detail-label'>Asignado a</label>
              <div className='task-detail-assignees'>
                {task.assigned_to.map((user) => (
                  <div key={user.id} className='task-detail-assignee'>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className='assignee-avatar' />
                    ) : (
                      <div className='assignee-avatar-placeholder'>
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className='task-detail-section full-width'>
              <label className='task-detail-label'>Etiquetas</label>
              <div className='task-detail-labels'>
                {task.labels.map((label) => (
                  <span 
                    key={label.id} 
                    className='task-detail-label-badge'
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className='task-detail-section'>
            <label className='task-detail-label'>Creado</label>
            <p className='task-detail-text'>
              {new Date(task.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {task.creator && (
            <div className='task-detail-section'>
              <label className='task-detail-label'>Creado por</label>
              <p className='task-detail-text'>{task.creator.username}</p>
            </div>
          )}
        </div>

        <div className='task-detail-footer'>
          <button
            onClick={handleDelete}
            className='task-detail-btn-delete'
          >
            Eliminar
          </button>
          
          <div className='task-detail-footer-right'>
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className='task-detail-btn-cancel'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className='task-detail-btn-save'
                >
                  Guardar
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className='task-detail-btn-edit'
              >
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailModal