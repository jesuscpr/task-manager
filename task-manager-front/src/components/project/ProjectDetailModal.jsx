import { useState, useEffect } from 'react'
import { useQuery, useLazyQuery, useMutation } from '@apollo/client'
import { GET_PROJECT, SEARCH_USERS } from '../../lib/graphql/queries'
import { UPDATE_PROJECT, DELETE_PROJECT, ADD_PROJECT_MEMBER, REMOVE_PROJECT_MEMBER, UPDATE_PROJECT_MEMBER_ROLE } from '../../lib/graphql/mutations'
import { useAuthStore } from '../../store/authStore'
import ConfirmModal from '../common/ConfirmModal'
import './ProjectDetailModal.css'

const ProjectDetailModal = ({ isOpen, onClose, projectId, onProjectDeleted }) => {
  const { user } = useAuthStore()
  const [isClosing, setIsClosing] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState(null)

  // Queries
  const { data: projectData, loading, refetch } = useQuery(GET_PROJECT, {
    variables: { id: projectId },
    skip: !projectId,
  })

  const [searchUsers, { data: searchData }] = useLazyQuery(SEARCH_USERS)

  useEffect(() => {
    if (searchData?.searchUsers) {
      setSearchResults(searchData.searchUsers)
    }
  }, [searchData])

  // Mutations
  const [updateProject] = useMutation(UPDATE_PROJECT, {
    onCompleted: () => refetch(),
  })

  const [deleteProject] = useMutation(DELETE_PROJECT)

  const [addMember] = useMutation(ADD_PROJECT_MEMBER, {
    onCompleted: () => {
      refetch()
      setSearchEmail('')
      setSearchResults([])
    },
  })

  const [removeMember] = useMutation(REMOVE_PROJECT_MEMBER, {
    onCompleted: () => refetch(),
  })

  const [updateMemberRole] = useMutation(UPDATE_PROJECT_MEMBER_ROLE, {
    onCompleted: () => refetch(),
  })

  const project = projectData?.project

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
      })
    }
  }, [project])

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false)
      setIsEditing(false)
      setSearchEmail('')
      setSearchResults([])
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null
  if (loading || !project) return null

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

  const handleSave = async () => {
    await updateProject({
      variables: {
        id: projectId,
        name: formData.name,
        description: formData.description,
      },
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await deleteProject({
      variables: { id: projectId },
    })
    onProjectDeleted()
    handleClose()
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

  const handleAddMember = async (userId) => {
    await addMember({
      variables: {
        projectId,
        userId,
        role: selectedRole,
      },
    })
  }

  const handleRemoveMember = async () => {
    if (memberToRemove) {
      await removeMember({
        variables: {
          projectId,
          userId: memberToRemove,
        },
      })
      setMemberToRemove(null)
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    await updateMemberRole({
      variables: {
        projectId,
        userId,
        role: newRole,
      },
    })
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

  // Verificar si el usuario actual es admin
  const currentUserMember = project.members?.find(m => m.user.id === user.id)
  const isAdmin = currentUserMember?.role === 'ADMIN' || project.owner.id === user.id
  const isOwner = project.owner.id === user.id

  // Filtrar usuarios que ya son miembros
  const memberIds = project.members?.map(m => m.user.id) || []
  const filteredResults = searchResults.filter(u => !memberIds.includes(u.id))

  return (
    <div
      className={`project-detail-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`project-detail-content ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className='project-detail-close' onClick={handleClose}>
          &times;
        </button>

        <div className='project-detail-header'>
          {isEditing ? (
            <div className='project-detail-section full-width'>
              <label className='project-detail-label-title'>Título</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className='project-detail-title-input'
                autoFocus
              />
            </div>
          ) : (
            <h2 className='project-detail-title'>{project.name}</h2>
          )}
        </div>

        <div className='project-detail-body'>
          {/* Descripción */}
          <div className='project-detail-section full-width'>
            <label className='project-detail-label'>Descripción</label>
            {isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className='project-detail-textarea'
                rows='4'
                placeholder='Añade una descripción del proyecto...'
              />
            ) : (
              <p className='project-detail-text'>
                {project.description || 'Sin descripción'}
              </p>
            )}
          </div>

          {/* Propietario */}
          <div className='project-detail-section'>
            <label className='project-detail-label'>Propietario</label>
            <div className='project-owner'>
              {project.owner.avatar_url ? (
                <img src={project.owner.avatar_url} alt={project.owner.username} className='owner-avatar' />
              ) : (
                <div className='owner-avatar-placeholder'>
                  {project.owner.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{project.owner.username}</span>
            </div>
          </div>

          {/* Fecha de creación */}
          <div className='project-detail-section'>
            <label className='project-detail-label'>Creado</label>
            <p className='project-detail-text'>
              {new Date(project.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Añadir miembros (solo admins) */}
          {isAdmin && (
            <div className='project-detail-section full-width'>
              <label className='project-detail-label'>Añadir miembro</label>
              <div className='add-member-section'>
                <input
                  type='email'
                  value={searchEmail}
                  onChange={handleSearchUsers}
                  placeholder='Buscar por email...'
                  className='project-detail-input'
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className='project-detail-select'
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
                        onClick={() => handleAddMember(result.id)}
                        className='add-member-btn'
                      >
                        Añadir
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lista de miembros */}
          <div className='project-detail-section full-width'>
            <label className='project-detail-label'>
              Miembros ({project.members?.length || 0})
            </label>
            <div className='members-list'>
              {project.members?.map((member) => (
                <div key={member.id} className='member-item'>
                  <div className='member-info'>
                    {member.user.avatar_url ? (
                      <img src={member.user.avatar_url} alt={member.user.username} className='member-avatar' />
                    ) : (
                      <div className='member-avatar-placeholder'>
                        {member.user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className='member-details'>
                      <div className='member-name'>
                        {member.user.username}
                        {member.user.id === project.owner.id && (
                          <span className='owner-badge'>Propietario</span>
                        )}
                      </div>
                      <div className='member-email'>{member.user.email}</div>
                    </div>
                  </div>
                  <div className='member-actions'>
                    {isAdmin && member.user.id !== project.owner.id ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.user.id, e.target.value)}
                          className='member-role-select'
                          style={{ borderLeft: `4px solid ${roleColors[member.role]}` }}
                        >
                          <option value='VIEWER'>Visualizador</option>
                          <option value='MEMBER'>Miembro</option>
                          <option value='ADMIN'>Administrador</option>
                        </select>
                        <button
                          onClick={() => {
                            setMemberToRemove(member.user.id)
                            setIsConfirmDeleteOpen(true)
                          }}
                          className='remove-member-btn'
                          title='Eliminar miembro'
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span 
                        className='member-role-badge'
                        style={{ backgroundColor: roleColors[member.role] }}
                      >
                        {roleMap[member.role]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='project-detail-footer'>
          {isOwner && (
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className='project-detail-btn-delete'
            >
              Eliminar Proyecto
            </button>
          )}
          
          <div className='project-detail-footer-right'>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setFormData({
                      name: project.name || '',
                      description: project.description || '',
                    })
                  }}
                  className='project-detail-btn-cancel'
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className='project-detail-btn-save'
                >
                  Guardar
                </button>
              </>
            ) : (
              <>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className='project-detail-btn-edit'
                  >
                    Editar
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <ConfirmModal
          isOpen={isConfirmDeleteOpen && !memberToRemove}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title="¿Eliminar proyecto?"
          message="Esta acción eliminará el proyecto y todas sus tareas. Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDangerous={true}
        />

        <ConfirmModal
          isOpen={isConfirmDeleteOpen && memberToRemove}
          onClose={() => {
            setIsConfirmDeleteOpen(false)
            setMemberToRemove(null)
          }}
          onConfirm={handleRemoveMember}
          title="¿Eliminar miembro?"
          message="¿Estás seguro de que quieres eliminar este miembro del proyecto?"
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDangerous={true}
        />
      </div>
    </div>
  )
}

export default ProjectDetailModal