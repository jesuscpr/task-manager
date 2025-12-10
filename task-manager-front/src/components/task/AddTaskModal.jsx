import { useState, useEffect } from 'react'
import './AddTaskModal.css'

const AddTaskModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  columnTitle,
  defaultStatus,
  availableLabels = [],
  availableUsers = []
}) => {
  const [isClosing, setIsClosing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: defaultStatus || 'TODO',
    priority: 'MEDIUM',
    due_date: '',
    selectedLabels: [],
    selectedUsers: [],
  })

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
      // Reset form cuando se cierra
      setFormData({
        title: '',
        description: '',
        status: defaultStatus || 'TODO',
        priority: 'MEDIUM',
        due_date: '',
        selectedLabels: [],
        selectedUsers: [],
      })
    } else {
      // Actualizar status cuando se abre
      setFormData(prev => ({
        ...prev,
        status: defaultStatus || 'TODO'
      }))
    }
  }, [isOpen, defaultStatus])

  if (!isOpen && !isClosing) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.title.trim()) {
      onSubmit({
        ...formData,
        labelIds: formData.selectedLabels,
        userIds: formData.selectedUsers,
      })
      handleClose()
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const toggleLabel = (labelId) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.includes(labelId)
        ? prev.selectedLabels.filter(id => id !== labelId)
        : [...prev.selectedLabels, labelId]
    }))
  }

  const toggleUser = (userId) => {
    setFormData(prev => ({
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

  const selectedLabelsData = availableLabels.filter(l => formData.selectedLabels.includes(l.id))
  const selectedUsersData = availableUsers.filter(u => formData.selectedUsers.includes(u.id))

  return (
    <div
      className={`add-task-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`add-task-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className='add-task-close' onClick={handleClose}>
          &times;
        </button>
        
        <div className='add-task-header'>
          <h3 className='add-task-title'>Nueva tarea en "{columnTitle}"</h3>
        </div>

        <form onSubmit={handleSubmit} className='add-task-form'>
          <div className='add-task-body'>
            {/* Título */}
            <div className='add-task-field full-width'>
              <label className='add-task-label' htmlFor='title'>
                Título <span className='required'>*</span>
              </label>
              <input
                type='text'
                id='title'
                name='title'
                value={formData.title}
                onChange={handleChange}
                placeholder='Ej: Implementar sistema de login'
                className='add-task-input'
                autoFocus
                required
              />
            </div>

            {/* Descripción */}
            <div className='add-task-field full-width'>
              <label className='add-task-label' htmlFor='description'>
                Descripción
              </label>
              <textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={handleChange}
                placeholder='Añade una descripción detallada de la tarea...'
                className='add-task-textarea'
                rows='4'
              />
            </div>

            {/* Estado y Prioridad en la misma fila */}
            <div className='add-task-row'>
              {/* Estado */}
              <div className='add-task-field'>
                <label className='add-task-label' htmlFor='status'>
                  Estado
                </label>
                <select
                  id='status'
                  name='status'
                  value={formData.status}
                  onChange={handleChange}
                  className='add-task-select'
                >
                  <option value="TODO">Por hacer</option>
                  <option value="IN_PROGRESS">En proceso</option>
                  <option value="DONE">Completado</option>
                </select>
              </div>

              {/* Prioridad */}
              <div className='add-task-field'>
                <label className='add-task-label' htmlFor='priority'>
                  Prioridad
                </label>
                <select
                  id='priority'
                  name='priority'
                  value={formData.priority}
                  onChange={handleChange}
                  className='add-task-select'
                  style={{
                    border: `2px solid ${priorityColors[formData.priority]}`
                  }}
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            {/* Fecha de vencimiento */}
            <div className='add-task-field full-width'>
              <label className='add-task-label' htmlFor='due_date'>
                Fecha de vencimiento
              </label>
              <input
                type='datetime-local'
                id='due_date'
                name='due_date'
                value={formData.due_date}
                onChange={handleChange}
                className='add-task-input'
              />
            </div>

            {/* Etiquetas */}
            {availableLabels.length > 0 && (
              <div className='add-task-field full-width'>
                <label className='add-task-label'>
                  Etiquetas
                </label>
                <div className='labels-grid'>
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      type='button'
                      onClick={() => toggleLabel(label.id)}
                      className={`label-chip ${formData.selectedLabels.includes(label.id) ? 'selected' : ''}`}
                      style={{
                        backgroundColor: formData.selectedLabels.includes(label.id) ? label.color : 'transparent',
                        borderColor: label.color,
                        color: formData.selectedLabels.includes(label.id) ? 'white' : label.color
                      }}
                    >
                      {formData.selectedLabels.includes(label.id) && '✓ '}
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Asignar a */}
            {availableUsers.length > 0 && (
              <div className='add-task-field full-width'>
                <label className='add-task-label'>
                  Asignar a
                </label>
                <div className='users-grid'>
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      type='button'
                      onClick={() => toggleUser(user.id)}
                      className={`user-chip ${formData.selectedUsers.includes(user.id) ? 'selected' : ''}`}
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className='user-avatar-small' />
                      ) : (
                        <div className='user-avatar-placeholder-small'>
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{user.username}</span>
                      {formData.selectedUsers.includes(user.id) && <span className='check-mark'>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='add-task-footer'>
            <button
              type='button'
              onClick={handleClose}
              className='add-task-btn-cancel'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='add-task-btn-submit'
              disabled={!formData.title.trim()}
            >
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTaskModal