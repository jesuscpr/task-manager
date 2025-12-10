import { useState, useEffect } from 'react'
import './TaskDetailModal.css'

const TaskDetailModal = ({ 
  isOpen, 
  onClose, 
  task,
  onUpdate,
  onDelete,
  availableLabels = [],
  availableUsers = []
}) => {
  const [isClosing, setIsClosing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    selectedLabels: [],
    selectedUsers: [],
  })

  useEffect(() => {
    if (task) {
      // Formatear fecha para input datetime-local
      let formattedDate = ''
      if (task.due_date) {
        const date = new Date(task.due_date)
        // Formato: YYYY-MM-DDTHH:mm
        formattedDate = date.toISOString().slice(0, 16)
      }

      setEditedTask({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        due_date: formattedDate,
        selectedLabels: task.labels?.map(l => l.id) || [],
        selectedUsers: task.assigned_to?.map(u => u.id) || [],
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
    onUpdate(task.id, {
      title: editedTask.title,
      description: editedTask.description,
      status: editedTask.status,
      priority: editedTask.priority,
      due_date: editedTask.due_date || null,
      labelIds: editedTask.selectedLabels,
      userIds: editedTask.selectedUsers,
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    onDelete(task.id)
    handleClose()
  }

  const toggleLabel = (labelId) => {
    setEditedTask(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.includes(labelId)
        ? prev.selectedLabels.filter(id => id !== labelId)
        : [...prev.selectedLabels, labelId]
    }))
  }

  const toggleUser = (userId) => {
    setEditedTask(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }))
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
    'LOW': '#14b451',
    'MEDIUM': '#3498db',
    'HIGH': '#f39c12',
    'URGENT': '#e74c3c'
  }

  const selectedLabelsData = availableLabels.filter(l => editedTask.selectedLabels.includes(l.id))
  const selectedUsersData = availableUsers.filter(u => editedTask.selectedUsers.includes(u.id))

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
            <div className='task-detail-section'>
              <label className='task-detail-label'>Título</label>
              <input
                type="text"
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className='task-detail-title-input'
                autoFocus
              />
            </div>
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
                style={{
                  borderLeft: `4px solid ${priorityColors[editedTask.priority]}`
                }}
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

          {/* Fecha de vencimiento */}
          <div className='task-detail-section full-width'>
            <label className='task-detail-label'>Fecha de vencimiento</label>
            {isEditing ? (
              <input
                type='datetime-local'
                value={editedTask.due_date}
                onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                className='task-detail-input'
              />
            ) : (
              <div className='task-detail-date'>
                {task.due_date ? (
                  <>
                    📅 {new Date(task.due_date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </>
                ) : (
                  <p className='task-detail-text-empty'>Sin fecha de vencimiento</p>
                )}
              </div>
            )}
          </div>

          {/* Etiquetas */}
          {availableLabels.length > 0 && (
            <div className='task-detail-section full-width'>
              <label className='task-detail-label'>Etiquetas</label>
              {isEditing ? (
                <div className='task-detail-labels-edit'>
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      type='button'
                      onClick={() => toggleLabel(label.id)}
                      className={`label-chip ${editedTask.selectedLabels.includes(label.id) ? 'selected' : ''}`}
                      style={{
                        backgroundColor: editedTask.selectedLabels.includes(label.id) ? label.color : 'transparent',
                        borderColor: label.color,
                        color: editedTask.selectedLabels.includes(label.id) ? 'white' : label.color
                      }}
                    >
                      {editedTask.selectedLabels.includes(label.id) && '✓ '}
                      {label.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='task-detail-labels'>
                  {task.labels && task.labels.length > 0 ? (
                    task.labels.map((label) => (
                      <span 
                        key={label.id} 
                        className='task-detail-label-badge'
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    ))
                  ) : (
                    <p className='task-detail-text-empty'>Sin etiquetas</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Asignados */}
          {availableUsers.length > 0 && (
            <div className='task-detail-section full-width'>
              <label className='task-detail-label'>Asignado a</label>
              {isEditing ? (
                <div className='task-detail-users-edit'>
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      type='button'
                      onClick={() => toggleUser(user.id)}
                      className={`user-chip ${editedTask.selectedUsers.includes(user.id) ? 'selected' : ''}`}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className='user-avatar-small' />
                      ) : (
                        <div className='user-avatar-placeholder-small'>
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{user.username}</span>
                      {editedTask.selectedUsers.includes(user.id) && <span className='check-mark'>✓</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='task-detail-assignees'>
                  {task.assigned_to && task.assigned_to.length > 0 ? (
                    task.assigned_to.map((user) => (
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
                    ))
                  ) : (
                    <p className='task-detail-text-empty'>Sin asignar</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Creado por */}
          {task.creator && (
            <div className='task-detail-section'>
              <label className='task-detail-label'>Creado por</label>
              <p className='task-detail-text'>{task.creator.username}</p>
            </div>
          )}

          {/* Fecha de creación */}
          <div className='task-detail-section'>
            <label className='task-detail-label'>Fecha de creación</label>
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