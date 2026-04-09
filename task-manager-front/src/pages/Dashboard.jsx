import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { GET_PROJECTS, GET_TASKS, GET_LABELS, GET_PROJECT_MEMBERS, GET_ME } from '../lib/graphql/queries'
import { CREATE_PROJECT, CREATE_TASK, UPDATE_TASK, DELETE_TASK, ADD_LABEL_TO_TASK, ASSIGN_TASK, REMOVE_LABEL_FROM_TASK, UNASSIGN_TASK, UPDATE_PROFILE } from '../lib/graphql/mutations'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/layout/Footer'
import TaskColumn from '../components/task/TaskColumn'
import TaskCard from '../components/task/TaskCard'
import ConfirmModal from '../components/common/ConfirmModal'
import TaskErrorModal from '../components/common/TaskErrorModal'
import TaskDetailModal from '../components/task/TaskDetailModal'
import ProfileModal from '../components/profile/ProfileModal'
import ProjectDetailModal from '../components/project/ProjectDetailModal'
import CreateProjectModal from '../components/project/CreateProjectModal'
import { ProfileIcon, LogoutIcon, SettingsIcon, ArrowRightIcon, ArrowLeftIcon } from '../components/icons'
import '../App.css'

function Dashboard() {
  const { user, signOut } = useAuthStore()
  const [sideSlide, setSideSlide] = useState(true)
  const [activeProject, setActiveProject] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false)
  const [overColumnId, setOverColumnId] = useState(null)
  const [optimisticTasks, setOptimisticTasks] = useState([])
  const [optimisticDeletedTaskIds, setOptimisticDeletedTaskIds] = useState([])
  const [taskErrorModal, setTaskErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onRetry: null,
  })

  // Configurar sensores para el drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Queries
  const { data: projectsData, loading: projectsLoading } = useQuery(GET_PROJECTS)
  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(
    GET_TASKS,
    {
      variables: { projectId: activeProject },
      skip: !activeProject,
    }
  )
  const { data: labelsData } = useQuery(GET_LABELS, {
    variables: { projectId: null, scope: "GLOBAL" },
    skip: !activeProject,
  })
  const { data: membersData } = useQuery(GET_PROJECT_MEMBERS, {
    variables: { projectId: activeProject },
    skip: !activeProject,
  })

  // Mutations
  const [createProject] = useMutation(CREATE_PROJECT, {
    refetchQueries: [{ query: GET_PROJECTS }],
  })

  const [createTask] = useMutation(CREATE_TASK)

  const [updateTask] = useMutation(UPDATE_TASK, {
    onCompleted: () => refetchTasks(),
  })

  const [deleteTask] = useMutation(DELETE_TASK)

  const [addLabelToTask] = useMutation(ADD_LABEL_TO_TASK)
  const [assignTask] = useMutation(ASSIGN_TASK)

  const [removeLabelsFromTask] = useMutation(REMOVE_LABEL_FROM_TASK)
  const [unassignTask] = useMutation(UNASSIGN_TASK)

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    refetchQueries: [{ query: GET_ME }],
  })

  const projects = projectsData?.projects || []
  const tasks = tasksData?.tasks || []
  const labels = labelsData?.labels || []
  const members = membersData?.projectMembers?.map(m => m.user) || []
  const allTasks = useMemo(() => {
    const merged = [...optimisticTasks, ...tasks]
      .filter((task) => !optimisticDeletedTaskIds.includes(task.id))
    return merged.filter((task, index, arr) => index === arr.findIndex((t) => t.id === task.id))
  }, [optimisticTasks, tasks, optimisticDeletedTaskIds])

  const extractErrorMessage = (error) => {
    const graphQLErrorMessage = error?.graphQLErrors?.[0]?.message
    const networkErrorMessage = error?.networkError?.message
    const fallbackMessage = error?.message || 'Error desconocido'
    return graphQLErrorMessage || networkErrorMessage || fallbackMessage
  }

  const openTaskErrorModal = ({ title, message, onRetry = null }) => {
    setTaskErrorModal({
      isOpen: true,
      title,
      message,
      onRetry,
    })
  }

  const closeTaskErrorModal = () => {
    setTaskErrorModal({
      isOpen: false,
      title: '',
      message: '',
      onRetry: null,
    })
  }

  // Cargar el proyecto activo del local storage
  useEffect(() => {
    if (projects.length > 0) {
      // Intentar recuperar el proyecto guardado del localStorage
      const savedProjectId = localStorage.getItem('activeProjectId')
      
      if (savedProjectId) {
        // Verificar que el proyecto guardado todavía existe
        const projectExists = projects.some(p => p.id === savedProjectId)
        
        if (projectExists) {
          setActiveProject(savedProjectId)
        } else {
          // Si no existe, usar el primero y actualizar localStorage
          setActiveProject(null)
          localStorage.removeItem('activeProjectId')
        }
      }
    }
  }, [projects, activeProject])

  const handleProjectCreated = (project) => {
    // Establecer el nuevo proyecto como activo
    setActiveProject(project.id)
    // Recargar pantalla para que aparezca el nuevo proyecto
    window.location.reload()
  }

  const handleProjectChange = (id) => {
    setActiveProject(id)
    localStorage.setItem('activeProjectId', id)
    setOptimisticTasks([])
    setOptimisticDeletedTaskIds([])
    closeTaskErrorModal()
  }

  const handleProjectDeleted = () => {
    setActiveProject(null)
    setOptimisticTasks([])
    setOptimisticDeletedTaskIds([])
    closeTaskErrorModal()
    // Recargar proyectos
    window.location.reload()
  }

  const handleAddTask = async (taskData) => {
    const tempTaskId = `temp-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimisticTask = {
      id: tempTaskId,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status,
      priority: taskData.priority,
      due_date: taskData.due_date || null,
      labels: labels.filter((label) => taskData.labelIds?.includes(label.id)),
      assigned_to: members.filter((member) => taskData.userIds?.includes(member.id)),
    }

    closeTaskErrorModal()
    setOptimisticTasks((prev) => [optimisticTask, ...prev])

    try {
      const { data } = await createTask({
        variables: {
          projectId: activeProject,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          due_date: taskData.due_date || null,
        },
      })

      // Si se creó la tarea y hay labels o usuarios seleccionados, asignarlos
      if (data?.createTask?.id) {
        const taskId = data.createTask.id
        const createdTask = {
          ...optimisticTask,
          id: taskId,
        }
        
        // Asignar labels
        if (taskData.labelIds && taskData.labelIds.length > 0) {
          for (const labelId of taskData.labelIds) {
            await addLabelToTask({ variables: { taskId, labelId } })
          }
        }
        
        // Asignar usuarios
        if (taskData.userIds && taskData.userIds.length > 0) {
          for (const userId of taskData.userIds) {
            await assignTask({ variables: { taskId, userId } })
          }
        }

        setOptimisticTasks((prev) => prev.map((task) => task.id === tempTaskId ? createdTask : task))
        // Refrescar tareas después de todas las asignaciones
        await refetchTasks()
        setOptimisticTasks((prev) => prev.filter((task) => task.id !== taskId))
      } else {
        setOptimisticTasks((prev) => prev.filter((task) => task.id !== tempTaskId))
        openTaskErrorModal({
          title: 'No se pudo crear la tarea',
          message: 'Intenta de nuevo en unos segundos.',
          onRetry: () => handleAddTask(taskData),
        })
      }
    } catch (error) {
      setOptimisticTasks((prev) => prev.filter((task) => task.id !== tempTaskId))
      openTaskErrorModal({
        title: 'No se pudo crear la tarea',
        message: extractErrorMessage(error),
        onRetry: () => handleAddTask(taskData),
      })
      console.error('Error al crear tarea:', error)
    }
  }

  const handleSlide = () => {
    setSideSlide(!sideSlide)
  }

  const handleDelete = async (taskId) => {
    setTaskToDelete(taskId)
    setIsConfirmDeleteOpen(true)
  }

  const performDeleteTask = async (taskId) => {
    closeTaskErrorModal()
    setOptimisticDeletedTaskIds((prev) => [...prev, taskId])

    try {
      await deleteTask({
        variables: { id: taskId },
      })
      await refetchTasks()
    } catch (error) {
      setOptimisticDeletedTaskIds((prev) => prev.filter((id) => id !== taskId))
      openTaskErrorModal({
        title: 'No se pudo eliminar la tarea',
        message: extractErrorMessage(error),
        onRetry: () => performDeleteTask(taskId),
      })
      console.error('Error al eliminar tarea:', error)
    } finally {
      setOptimisticDeletedTaskIds((prev) => prev.filter((id) => id !== taskId))
    }
  }

  const confirmDelete = async () => {
    if (taskToDelete) {
      const deletingTaskId = taskToDelete
      setTaskToDelete(null)
      await performDeleteTask(deletingTaskId)
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const handleUpdateTask = async (taskId, updates) => {
    try {
      // Actualizar campos básicos de la tarea
      await updateTask({
        variables: {
          id: taskId,
          title: updates.title,
          description: updates.description,
          status: updates.status,
          priority: updates.priority,
          due_date: updates.due_date || null,
        },
      })

      // Si hay cambios en labels
      if (updates.labelIds) {
        const currentTask = tasks.find(t => t.id === taskId)
        const currentLabelIds = currentTask?.labels?.map(l => l.id) || []
        
        // Añadir nuevos labels
        const labelsToAdd = updates.labelIds.filter(id => !currentLabelIds.includes(id))
        for (const labelId of labelsToAdd) {
          await addLabelToTask({ variables: { taskId, labelId } })
        }
        
        // Remover labels que ya no están
        const labelsToRemove = currentLabelIds.filter(id => !updates.labelIds.includes(id))
        for (const labelId of labelsToRemove) {
          await removeLabelsFromTask({ variables: { taskId, labelId } })
        }
      }

      // Si hay cambios en usuarios asignados
      if (updates.userIds) {
        const currentTask = tasks.find(t => t.id === taskId)
        const currentUserIds = currentTask?.assigned_to?.map(u => u.id) || []
        
        // Añadir nuevos usuarios
        const usersToAdd = updates.userIds.filter(id => !currentUserIds.includes(id))
        for (const userId of usersToAdd) {
          await assignTask({ variables: { taskId, userId } })
        }
        
        // Remover usuarios que ya no están
        const usersToRemove = currentUserIds.filter(id => !updates.userIds.includes(id))
        for (const userId of usersToRemove) {
          await unassignTask({ variables: { taskId, userId } })
        }
      }

      // Refrescar las tareas
      await refetchTasks()
    } catch (error) {
      console.error('Error al actualizar tarea:', error)
    }
  }

  const handleDeleteFromDetail = (taskId) => {
    setIsTaskDetailOpen(false)
    setSelectedTask(null)
    handleDelete(taskId)
  }

  const handleUpdateProfile = async (profileData) => {
    try {
      await updateProfile({
        variables: profileData,
      })
    } catch (error) {
      console.error('Error al actualizar perfil:', error)
    }
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const resolveColumnIdFromOver = (overId) => {
    if (overId === 'todo' || overId === 'inprocess' || overId === 'done') {
      return overId
    }

    const overTask = allTasks.find(t => t.id === overId)
    if (!overTask) return null

    if (overTask.status === 'TODO') return 'todo'
    if (overTask.status === 'IN_PROGRESS') return 'inprocess'
    if (overTask.status === 'DONE') return 'done'
    return null
  }

  const handleDragOver = (event) => {
    const overId = event.over?.id
    if (!overId) {
      setOverColumnId(null)
      return
    }

    setOverColumnId(resolveColumnIdFromOver(overId))
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)
    setOverColumnId(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeTask = allTasks.find(t => t.id === activeId)
    if (!activeTask) return

    // Determinar el status destino
    let destStatus = activeTask.status
    
    // Si se soltó sobre una columna
    if (overId === 'todo') {
      destStatus = 'TODO'
    } else if (overId === 'inprocess') {
      destStatus = 'IN_PROGRESS'
    } else if (overId === 'done') {
      destStatus = 'DONE'
    } else {
      // Si se soltó sobre otra tarea, usar su status
      const overTask = allTasks.find(t => t.id === overId)
      if (overTask) {
        destStatus = overTask.status
      }
    }

    // Si cambió de status, actualizar
    if (activeTask.status !== destStatus) {
      const previousStatus = activeTask.status
      const optimisticMovedTask = { ...activeTask, status: destStatus }

      // Actualizar UI de forma optimista para mejorar la animación entre columnas
      setOptimisticTasks((prev) => {
        const withoutCurrent = prev.filter((task) => task.id !== activeTask.id)
        return [optimisticMovedTask, ...withoutCurrent]
      })

      try {
        await updateTask({
          variables: {
            id: activeId,
            status: destStatus,
          },
        })
        await refetchTasks()
        setOptimisticTasks((prev) => prev.filter((task) => task.id !== activeTask.id))
      } catch (error) {
        console.error('Error al mover tarea:', error)
        // Rollback visual si falla la actualización en el servidor
        setOptimisticTasks((prev) => {
          const withoutCurrent = prev.filter((task) => task.id !== activeTask.id)
          return [{ ...activeTask, status: previousStatus }, ...withoutCurrent]
        })
        refetchTasks()
      }
    }
  }

  const currentProject = projects.find(p => p.id === activeProject)
  const activeTask = allTasks.find(t => t.id === activeId)

  if (projectsLoading) {
    return <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '1.5rem',
            color: '#667eea'
          }}>
            Cargando proyectos...
          </div>
  }

  return (
    <>
      <header>
        <nav id="header">
          <h1 className='banner'>
            {currentProject?.name || 'Selecciona un proyecto'}
            {activeProject && (
              <SettingsIcon
                onClick={() => setIsProjectDetailOpen(true)}
                className='project-details-settings'
                role="button"
                aria-label="Configuración del proyecto"
              />
            )}
          </h1>
        </nav>
      </header>
      <div id='content'>
        <aside id="sidebar" className={sideSlide ? 'expanded' : 'collapsed'}>
          <div id='projects'>
            <div className="projectButtons">
              <button onClick={handleSlide} className='hideShowBtn'>
                {sideSlide ? <ArrowLeftIcon className='arrowSlide' /> : <ArrowRightIcon className='arrowSlide' />}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className='newProjectBtn'
              >
                {sideSlide ? "+ Add Project" : "+"}
              </button>
            </div>
            <ul>
              {projects.map((project) => {
                const getInitials = (name) => {
                  const words = name.trim().split(' ')
                  if (words.length === 1) {
                    return name.slice(0, 2).toUpperCase()
                  }
                  return (words[0][0] + words[1][0]).toUpperCase()
                }

                return (
                  <li
                    key={project.id}
                    className={`project ${activeProject === project.id ? "selected" : ""}`}
                    onClick={() => handleProjectChange(project.id)}
                    title={project.name}
                  >
                    {sideSlide ? project.name : getInitials(project.name)}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className={`${sideSlide ? 'profileShort' : 'profile'}`}>
            <ProfileIcon
              className='profileIcon'
              role="button"
              aria-label="Perfil"
              onClick={() => setIsProfileModalOpen(true)}
            />
            <LogoutIcon
              className='logoutIcon'
              role="button"
              aria-label="Cerrar sesión"
              onClick={signOut}
              title="Cerrar sesión"
            />
          </div>
        </aside>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />

        <main id="manager">
          {!activeProject ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '80vh',
              fontSize: '1.5rem',
              color: '#667eea'
            }}>
              Selecciona o crea un proyecto
            </div>
          ) : tasksLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '80vh',
              fontSize: '1.5rem',
              color: '#667eea'
            }}>
              Cargando tareas...
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <TaskColumn
                title={"To Do"}
                tasks={allTasks}
                status={"todo"}
                isDropTarget={overColumnId === 'todo'}
                handleDelete={handleDelete}
                handleAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                availableLabels={labels}
                availableUsers={members}
              />
              <TaskColumn
                title={"In Process"}
                tasks={allTasks}
                status={"inprocess"}
                isDropTarget={overColumnId === 'inprocess'}
                handleDelete={handleDelete}
                handleAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                availableLabels={labels}
                availableUsers={members}
              />
              <TaskColumn
                title={"Done"}
                tasks={allTasks}
                status={"done"}
                isDropTarget={overColumnId === 'done'}
                handleDelete={handleDelete}
                handleAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                availableLabels={labels}
                availableUsers={members}
              />
              
              <DragOverlay>
                {activeTask ? (
                  <TaskCard
                    title={activeTask.title}
                    task={activeTask}
                    isDragging={true}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </main>
      </div>
      
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar tarea?"
        message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta tarea?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
      />

      <TaskErrorModal
        isOpen={taskErrorModal.isOpen}
        onClose={closeTaskErrorModal}
        onRetry={taskErrorModal.onRetry}
        title={taskErrorModal.title}
        message={taskErrorModal.message}
      />

      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteFromDetail}
        availableLabels={labels}
        availableUsers={members}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={handleUpdateProfile}
      />

      <ProjectDetailModal
        isOpen={isProjectDetailOpen}
        onClose={() => setIsProjectDetailOpen(false)}
        projectId={activeProject}
        onProjectDeleted={handleProjectDeleted}
      />
      
      <Footer />
    </>
  )
}

export default Dashboard