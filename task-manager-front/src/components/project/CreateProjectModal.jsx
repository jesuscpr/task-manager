import { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client'
import { CREATE_PROJECT, ADD_PROJECT_MEMBER } from '../../lib/graphql/mutations'
import { SEARCH_USERS } from '../../lib/graphql/queries'
import './CreateProjectModal.css'

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [isClosing, setIsClosing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [selectedRole, setSelectedRole] = useState('MEMBER')

  // Mutations
  const [createProject, { loading: creatingProject }] = useMutation(CREATE_PROJECT)
  const [addMember] = useMutation(ADD_PROJECT_MEMBER)

  // Query
  const [searchUsers, { data: searchData }] = useLazyQuery(SEARCH_USERS)

  useEffect(() => {
    if (searchData?.searchUsers) {
      setSearchResults(searchData.searchUsers)
    }
  }, [searchData])

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
      // Reset form cuando se cierra
      setFormData({
        name: '',
        description: '',
      })
      setSearchEmail('')
      setSearchResults([])
      setSelectedMembers([])
      setSelectedRole('MEMBER')
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearchUsers = async (e) => {
    const email = e.target.value
    setSearchEmail(email)
    
    if (email.length >= 3) {
      await searchUsers({ variables: { query: email } })
    } else {
      setSearchResults([])
    }
  }

  const handleAddMemberToList = (user) => {
    if (!selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(prev => [...prev, { ...user, role: selectedRole }])
      setSearchEmail('')
      setSearchResults([])
    }
  }

  const handleRemoveMemberFromList = (userId) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId))
  }

  const handleChangeMemberRole = (userId, newRole) => {
    setSelectedMembers(prev => 
      prev.map(m => m.id === userId ? { ...m, role: newRole } : m)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.name.trim()) {
      try {
        // Crear el proyecto
        const { data } = await createProject({
          variables: {
            name: formData.name,
            description: formData.description,
          },
        })

        const projectId = data.createProject.id

        // Añadir los miembros seleccionados
        for (const member of selectedMembers) {
          await addMember({
            variables: {
              projectId,
              userId: member.id,
              role: member.role,
            },
          })
        }

        // Notificar que se creó el proyecto
        if (onProjectCreated) {
          onProjectCreated(data.createProject)
        }

        handleClose()
      } catch (error) {
        console.error('Error creating project:', error)
      }
    }
  }

  const roleMap = {
    'ADMIN': 'Administrador',
    'MEMBER': 'Miembro',
    'VIEWER': 'Visualizador'
  }

  const roleColors = {
    'ADMIN': '#e74c3c',
    'MEMBER': '#3498db',
    'VIEWER': '#95a5a6'
  }

  // Filtrar usuarios que ya están seleccionados
  const memberIds = selectedMembers.map(m => m.id)
  const filteredResults = searchResults.filter(u => !memberIds.includes(u.id))

  return (
    <div
      className={`create-project-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`create-project-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className='create-project-close' onClick={handleClose}>
          &times;
        </button>
        
        <div className='create-project-header'>
          <h3 className='create-project-title'>Crear Nuevo Proyecto</h3>
        </div>

        <form onSubmit={handleSubmit} className='create-project-form'>
          <div className='create-project-body'>
            {/* Nombre */}
            <div className='create-project-field full-width'>
              <label className='create-project-label' htmlFor='name'>
                Nombre del Proyecto <span className='required'>*</span>
              </label>
              <input
                type='text'
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Escribe el nombre del proyecto...'
                className='create-project-input'
                autoFocus
                required
              />
            </div>

            {/* Descripción */}
            <div className='create-project-field full-width'>
              <label className='create-project-label' htmlFor='description'>
                Descripción (opcional)
              </label>
              <textarea
                id='description'
                name='description'
                value={formData.description}
                onChange={handleChange}
                placeholder='Añade una descripción del proyecto...'
                className='create-project-textarea'
                rows='4'
              />
            </div>

            {/* Añadir miembros */}
            <div className='create-project-field full-width'>
              <label className='create-project-label'>
                Añadir miembros (opcional)
              </label>
              <div className='add-member-section'>
                <input
                  type='email'
                  value={searchEmail}
                  onChange={handleSearchUsers}
                  placeholder='Buscar por email...'
                  className='create-project-input'
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className='create-project-select'
                >
                  <option value='VIEWER'>Visualizador</option>
                  <option value='MEMBER'>Miembro</option>
                  <option value='ADMIN'>Administrador</option>
                </select>
              </div>

              {/* Resultados de búsqueda */}
              {filteredResults.length > 0 && (
                <div className='search-results'>
                  {filteredResults.map((result) => (
                    <div key={result.id} className='search-result-item'>
                      <div className='search-user-info'>
                        {result.avatar_url ? (
                          <img src={result.avatar_url} alt={result.username} className='search-avatar' />
                        ) : (
                          <div className='search-avatar-placeholder'>
                            {result.email?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className='search-user-details'>
                          <div className='search-username'>{result.username || result.email}</div>
                          <div className='search-email'>{result.email}</div>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => handleAddMemberToList(result)}
                        className='add-member-btn'
                      >
                        Añadir
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Miembros seleccionados */}
              {selectedMembers.length > 0 && (
                <div className='selected-members-section'>
                  <div className='selected-members-label'>
                    Miembros seleccionados ({selectedMembers.length})
                  </div>
                  <div className='selected-members-list'>
                    {selectedMembers.map((member) => (
                      <div key={member.id} className='selected-member-item'>
                        <div className='selected-member-info'>
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt={member.username} className='selected-member-avatar' />
                          ) : (
                            <div className='selected-member-avatar-placeholder'>
                              {member.username?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className='selected-member-details'>
                            <div className='selected-member-name'>{member.username || member.email}</div>
                            <div className='selected-member-email'>{member.email}</div>
                          </div>
                        </div>
                        <div className='selected-member-actions'>
                          <select
                            value={member.role}
                            onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                            className='member-role-select'
                            style={{ border: `2px solid ${roleColors[member.role]}` }}
                          >
                            <option value='VIEWER'>Visualizador</option>
                            <option value='MEMBER'>Miembro</option>
                            <option value='ADMIN'>Administrador</option>
                          </select>
                          <button
                            type='button'
                            onClick={() => handleRemoveMemberFromList(member.id)}
                            className='remove-member-btn'
                            title='Eliminar'
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='create-project-footer'>
            <button
              type='button'
              onClick={handleClose}
              className='create-project-btn-cancel'
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='create-project-btn-submit'
              disabled={!formData.name.trim() || creatingProject}
            >
              {creatingProject ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectModal