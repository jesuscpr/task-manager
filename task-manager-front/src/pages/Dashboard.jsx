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
import { GET_PROJECTS, GET_TASKS } from '../lib/graphql/queries'
import { CREATE_PROJECT, CREATE_TASK, UPDATE_TASK, DELETE_TASK } from '../lib/graphql/mutations'
import { useAuthStore } from '../store/authStore'
import Footer from '../components/layout/Footer'
import TaskColumn from '../components/task/TaskColumn'
import TaskCard from '../components/task/TaskCard'
import ConfirmModal from '../components/common/ConfirmModal'
import TaskDetailModal from '../components/task/TaskDetailModal'
import settingsIcon from '../assets/settings.svg'
import profileIcon from '../assets/profile.svg'
import '../App.css'

function Dashboard() {
  const { user, signOut } = useAuthStore()
  const [sideSlide, setSideSlide] = useState(true)
  const [activeProject, setActiveProject] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [newProjectText, setNewProjectText] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)

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

  const projects = projectsData?.projects || []
  const tasks = tasksData?.tasks || []

  // Seleccionar primer proyecto al cargar
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      setActiveProject(projects[0].id)
    }
  }, [projects, activeProject])

  const handleCloseModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsModalOpen(false)
      setIsClosing(false)
    }, 300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newProjectText.trim()) {
      await createProject({
        variables: {
          name: newProjectText,
          description: '',
        },
      })
      setNewProjectText('')
      handleCloseModal()
    }
  }

  const handleProjectChange = (id) => {
    setActiveProject(id)
  }

  const handleAddTask = async (newTask, status) => {
    const normalizedStatus = status.toUpperCase().replace('INPROCESS', 'IN_PROGRESS')
    
    await createTask({
      variables: {
        projectId: activeProject,
        title: newTask,
        status: normalizedStatus,
        priority: 'MEDIUM',
      },
    })
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
    await updateTask({
      variables: {
        id: taskId,
        ...updates,
      },
    })
  }

  const handleDeleteFromDetail = (taskId) => {
    setIsTaskDetailOpen(false)
    setSelectedTask(null)
    handleDelete(taskId)
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
    return <div>Cargando proyectos...</div>
  }

  return (
    <>
      <header>
        <a><span className='home'>TM</span></a>
        <nav id="header">
          <h1 className='banner'>{currentProject?.name || 'Selecciona un proyecto'}</h1>
        </nav>
      </header>
      <div id='content'>
        <aside id="sidebar" style={{width: sideSlide ? "11%" : "3%"}}>
          <div id='projects'>
            <div className={sideSlide ? "projectButtons" : "justShow"}>
              <button
                onClick={() => setIsModalOpen(true)}
                className='newProjectBtn'
                hidden={!sideSlide}
              >
                New Project
              </button>
              <button onClick={handleSlide} className='hideShowBtn'>
                {sideSlide ? "hide" : "show"}
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
                  >
                    {sideSlide ? project.name : getInitials(project.name)}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className={`${sideSlide ? 'profileShort' : 'profile'}`}>
            <img src={profileIcon} className='profileIcon' />
            <img
              src={settingsIcon}
              className='settingsIcon'
              onClick={signOut}
              title="Cerrar sesión"
            />
          </div>

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
                <h3 className='modal-title'>Añadir nuevo proyecto</h3>

                <div className='form-container'>
                  <label className='form-label'>Nombre del proyecto</label>
                  <textarea
                    value={newProjectText}
                    onChange={(e) => setNewProjectText(e.target.value)}
                    placeholder='Escribe el nombre del proyecto aquí...'
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
                      disabled={!newProjectText.trim()}
                    >
                      Añadir Proyecto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
        <main id="manager">
          {tasksLoading ? (
            <div>Cargando tareas...</div>
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
              />
              <TaskColumn
                title={"In Process"}
                tasks={tasks}
                status={"inprocess"}
                handleDelete={handleDelete}
                handleAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
              />
              <TaskColumn
                title={"Done"}
                tasks={tasks}
                status={"done"}
                handleDelete={handleDelete}
                handleAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
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
      />
      
      <Footer />
    </>
  )
}

export default Dashboard