import { useState, useEffect } from 'react'
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
import TaskDetailModal from '../components/task/TaskDetailModal'
import ProfileModal from '../components/profile/ProfileModal'
import ProjectDetailModal from '../components/project/ProjectDetailModal'
import CreateProjectModal from '../components/project/CreateProjectModal'
import logoutIcon from '../assets/logout.svg'
import profileIcon from '../assets/profile.svg'
import arrowRight from '../assets/arrow-right.svg'
import arrowLeft from '../assets/arrow-left.svg'
import settingsIcon from '../assets/settings.svg'
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

  const [createTask] = useMutation(CREATE_TASK, {
    onCompleted: () => refetchTasks(),
  })

  const [updateTask] = useMutation(UPDATE_TASK, {
    onCompleted: () => refetchTasks(),
  })

  const [deleteTask] = useMutation(DELETE_TASK, {
    onCompleted: () => refetchTasks(),
  })

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

  // Seleccionar primer proyecto al cargar
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      setActiveProject(projects[0].id)
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
  }

  const handleProjectDeleted = () => {
    setActiveProject(null)
    // Recargar proyectos
    window.location.reload()
  }

  const handleAddTask = async (taskData) => {
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
        // Refrescar tareas después de todas las asignaciones
        await refetchTasks()
      }
    } catch (error) {
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

  const confirmDelete = async () => {
    if (taskToDelete) {
      await deleteTask({
        variables: { id: taskToDelete },
      })
      setTaskToDelete(null)
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

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeTask = tasks.find(t => t.id === activeId)
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
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        destStatus = overTask.status
      }
    }

    // Si cambió de status, actualizar
    if (activeTask.status !== destStatus) {
      try {
        await updateTask({
          variables: {
            id: activeId,
            status: destStatus,
          },
        })
      } catch (error) {
        console.error('Error al mover tarea:', error)
        refetchTasks()
      }
    }
  }

  const currentProject = projects.find(p => p.id === activeProject)
  const activeTask = tasks.find(t => t.id === activeId)

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
              <img
                src={settingsIcon}
                onClick={() => setIsProjectDetailOpen(true)}
                className='project-details-settings'
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
                {sideSlide ? <img src={arrowLeft} className='arrowSlide'/> : <img src={arrowRight} className='arrowSlide'/>}
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
            <img
              src={profileIcon}
              className='profileIcon'
              alt="Perfil"
              onClick={() => setIsProfileModalOpen(true)}
            />
            <img
              src={logoutIcon}
              className='logoutIcon'
              onClick={signOut}
              title="Cerrar sesión"
              alt="Configuración"
            />
          </div>
        </aside>

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />

        <main id="manager">
          {tasksLoading ? (
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
              onDragEnd={handleDragEnd}
            >
              <TaskColumn
                title={"To Do"}
                tasks={tasks}
                status={"todo"}
                handleDelete={handleDelete}
                handleAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                availableLabels={labels}
                availableUsers={members}
              />
              <TaskColumn
                title={"In Process"}
                tasks={tasks}
                status={"inprocess"}
                handleDelete={handleDelete}
                handleAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
                availableLabels={labels}
                availableUsers={members}
              />
              <TaskColumn
                title={"Done"}
                tasks={tasks}
                status={"done"}
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