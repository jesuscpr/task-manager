import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import './ProfileModal.css'
import { useQuery } from '@apollo/client'
import { GET_ME } from '../../lib/graphql/queries'

const ProfileModal = ({ isOpen, onClose, onUpdate }) => {
  const { user } = useAuthStore()
  const [isClosing, setIsClosing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
  })

  const { data: userData, loading: userDataLoading } = useQuery(GET_ME)

  const user_data = userData?.me || {}

  useEffect(() => {
    if (!userDataLoading && user_data) {
      setFormData({
        username: user_data.username || '',
        full_name: user_data.full_name || '',
        bio: user_data.bio || '',
        avatar_url: user_data.avatar_url || '',
      })
    }
  }, [user_data, userDataLoading])

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
      setIsEditing(false)
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null
  if (!user) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setIsEditing(false)
    }, 300)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onUpdate(formData)
    setIsEditing(false)
  }

  const getInitials = (name) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || 'U'
    const words = name.trim().split(' ')
    if (words.length === 1) {
      return name.slice(0, 2).toUpperCase()
    }
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return (
    <div
      className={`profile-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`profile-modal-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className='profile-modal-close' onClick={handleClose}>
          &times;
        </button>

        <div className='profile-modal-header'>
          <div className='profile-avatar-section'>
            {formData.avatar_url ? (
              <img 
                src={formData.avatar_url} 
                alt={formData.username || 'Avatar'} 
                className='profile-avatar-large'
              />
            ) : (
              <div className='profile-avatar-large-placeholder'>
                {getInitials(formData.full_name || formData.username)}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className='profile-modal-form'>
          <div className='profile-modal-body'>
            {/* Email (no editable) */}
            <div className='profile-field full-width'>
              <label className='profile-label'>
                Email
              </label>
              <input
                type='email'
                value={user.email}
                disabled
                className='profile-input disabled'
              />
            </div>

            {/* Username */}
            <div className='profile-field'>
              <label className='profile-label' htmlFor='username'>
                Nombre de usuario
              </label>
              <input
                type='text'
                id='username'
                name='username'
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                className={`profile-input ${!isEditing ? 'disabled' : ''}`}
                placeholder={formData.username}
              />
            </div>

            {/* Full Name */}
            <div className='profile-field'>
              <label className='profile-label' htmlFor='full_name'>
                Nombre completo
              </label>
              <input
                type='text'
                id='full_name'
                name='full_name'
                value={formData.full_name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`profile-input ${!isEditing ? 'disabled' : ''}`}
                placeholder={formData.full_name}
              />
            </div>

            {/* Avatar URL */}
            <div className='profile-field full-width'>
              <label className='profile-label' htmlFor='avatar_url'>
                URL del avatar
              </label>
              <input
                type='url'
                id='avatar_url'
                name='avatar_url'
                value={formData.avatar_url}
                onChange={handleChange}
                disabled={!isEditing}
                className={`profile-input ${!isEditing ? 'disabled' : ''}`}
                placeholder={formData.avatar_url}
              />
            </div>

            {/* Bio */}
            <div className='profile-field full-width'>
              <label className='profile-label' htmlFor='bio'>
                Biografía
              </label>
              <textarea
                id='bio'
                name='bio'
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                className={`profile-textarea ${!isEditing ? 'disabled' : ''}`}
                rows='4'
                placeholder={formData.bio}
              />
            </div>

            {/* Info adicional */}
            <div className='profile-info-section'>
              <div className='profile-info-item'>
                <span className='info-label'>Miembro desde</span>
                <span className='info-value'>
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className='profile-modal-footer'>
            <button
              type='button'
              onClick={handleClose}
              className='profile-btn-close'
            >
              Cerrar
            </button>
            
            <div className='profile-footer-right'>
              {isEditing ? (
                <>
                  <button
                    type='button'
                    onClick={() => {
                      setIsEditing(false)
                      // Resetear formulario
                      setFormData({
                        username: user_data.username || '',
                        full_name: user_data.full_name || '',
                        bio: user_data.bio || '',
                        avatar_url: user_data.avatar_url || '',
                      })
                    }}
                    className='profile-btn-cancel'
                  >
                    Cancelar
                  </button>
                  <button
                    type='submit'
                    className='profile-btn-save'
                  >
                    Guardar Cambios
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  onClick={() => setIsEditing(true)}
                  className='profile-btn-edit'
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileModal