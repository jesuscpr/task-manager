import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import Footer from '../components/layout/Footer'
import TaskColumn from '../components/task/TaskColumn'
import TaskCard from '../components/task/TaskCard'
import ConfirmModal from '../components/common/ConfirmModal'
import TaskDetailModal from '../components/task/TaskDetailModal'
import { ProfileIcon, SettingsIcon, ArrowRightIcon, ArrowLeftIcon } from '../components/icons'
import '../App.css'

const guestUser = {
  id: 'guest-user',
  username: 'Invitado',
  email: '',
  avatar_url: '',
}

const createInitialProject = () => ({
  id: 'playground-project-1',
  name: 'Proyecto Demo',
  description: 'Espacio de pruebas: aquí nada se guarda en base de datos.',
  created_at: new Date().toISOString(),
})

const initialTasks = [
  {
    id: 'playground-task-1',
    project_id: 'playground-project-1',
    title: 'Explora el tablero',
    description: 'Arrastra esta tarea entre columnas para probar el flujo.',
    status: 'TODO',
    priority: 'MEDIUM',
    due_date: null,
    labels: [],
    assigned_to: [guestUser],
    creator: guestUser,
    created_at: new Date().toISOString(),
  },
]

function GuestProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose}>
          &times;
        </button>
        <div className="profile-modal-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large-placeholder">I</div>
          </div>
        </div>
        <div className="profile-modal-form">
          <div className="profile-modal-body">
            <div className="profile-field full-width">
              <label className="profile-label">Nombre</label>
              <input type="text" value="Invitado" disabled className="profile-input disabled" />
            </div>
            <div className="profile-info-section">
              <div className="profile-info-item">
                <span className="info-label">Modo</span>
                <span className="info-value">Playground sin persistencia</span>
              </div>
            </div>
          </div>
          <div className="profile-modal-footer">
            <button type="button" onClick={onClose} className="profile-btn-close">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlaygroundProjectDetailModal({ isOpen, onClose, project, onDeleteProject }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!isOpen || !project) return null

  const handleDelete = () => {
    onDeleteProject(project.id)
    setConfirmDelete(false)
    onClose()
  }

  return (
    <div className="project-detail-overlay" onClick={onClose}>
      <div className="project-detail-content" onClick={(e) => e.stopPropagation()}>
        <button className="project-detail-close" onClick={onClose}>
          &times;
        </button>
        <div className="project-detail-header">
          <h2 className="project-detail-title">{project.name}</h2>
        </div>
        <div className="project-detail-body">
          <div className="project-detail-section full-width">
            <label className="project-detail-label">Descripción</label>
            <p className="project-detail-text">{project.description || 'Sin descripción'}</p>
          </div>
        </div>
        <div className="project-detail-footer">
          <button onClick={() => setConfirmDelete(true)} className="project-detail-btn-delete">
            Eliminar Proyecto
          </button>
        </div>

        <ConfirmModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          title="¿Eliminar proyecto?"
          message="En playground esto solo borra el estado actual de la sesión."
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDangerous={true}
        />
      </div>
    </div>
  )
}

function PlaygroundCreateProjectModal({ isOpen, onClose, onCreateProject }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onCreateProject({
      id: `playground-project-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      created_at: new Date().toISOString(),
    })
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <div className="create-project-overlay" onClick={onClose}>
      <div className="create-project-content" onClick={(e) => e.stopPropagation()}>
        <button className="create-project-close" onClick={onClose}>
          &times;
        </button>
        <div className="create-project-header">
          <h3 className="create-project-title">Crear Proyecto de Prueba</h3>
        </div>
        <form onSubmit={handleSubmit} className="create-project-form">
          <div className="create-project-body">
            <div className="create-project-field full-width">
              <label className="create-project-label" htmlFor="playground-name">
                Nombre del Proyecto <span className="required">*</span>
              </label>
              <input
                id="playground-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="create-project-input"
                required
                autoFocus
              />
            </div>
            <div className="create-project-field full-width">
              <label className="create-project-label" htmlFor="playground-description">
                Descripción
              </label>
              <textarea
                id="playground-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="create-project-textarea"
                rows="4"
              />
            </div>
          </div>
          <div className="create-project-footer">
            <button type="button" onClick={onClose} className="create-project-btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="create-project-btn-submit" disabled={!name.trim()}>
              Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Playground() {
  const [projects, setProjects] = useState([createInitialProject()])
  const [tasks, setTasks] = useState(initialTasks)
  const [activeProject, setActiveProject] = useState('playground-project-1')
  const [sideSlide, setSideSlide] = useState(true)
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [overColumnId, setOverColumnId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const projectTasks = useMemo(
    () => tasks.filter((task) => task.project_id === activeProject),
    [tasks, activeProject]
  )

  const currentProject = projects.find((p) => p.id === activeProject)
  const activeTask = projectTasks.find((task) => task.id === activeId)

  const handleCreateProject = (project) => {
    setProjects((prev) => [...prev, project])
    setActiveProject(project.id)
  }

  const handleDeleteProject = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId))
    setTasks((prev) => prev.filter((task) => task.project_id !== projectId))
    setActiveProject((prev) => {
      if (prev !== projectId) return prev
      const remaining = projects.filter((project) => project.id !== projectId)
      return remaining[0]?.id || null
    })
  }

  const handleAddTask = (taskData) => {
    if (!activeProject) return
    const newTask = {
      id: `playground-task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      project_id: activeProject,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status,
      priority: taskData.priority,
      due_date: taskData.due_date || null,
      labels: [],
      assigned_to: [guestUser],
      creator: guestUser,
      created_at: new Date().toISOString(),
    }
    setTasks((prev) => [newTask, ...prev])
  }

  const handleDeleteTask = (taskId) => {
    setTaskToDelete(taskId)
    setIsConfirmDeleteOpen(true)
  }

  const confirmDeleteTask = () => {
    if (!taskToDelete) return
    setTasks((prev) => prev.filter((task) => task.id !== taskToDelete))
    setTaskToDelete(null)
    setIsConfirmDeleteOpen(false)
  }

  const handleUpdateTask = (taskId, updates) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              title: updates.title,
              description: updates.description,
              status: updates.status,
              priority: updates.priority,
              due_date: updates.due_date || null,
              labels: [],
              assigned_to: [guestUser],
            }
          : task
      )
    )
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const resolveColumnIdFromOver = (overId) => {
    if (overId === 'todo' || overId === 'inprocess' || overId === 'done') return overId

    const overTask = projectTasks.find((task) => task.id === overId)
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

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    setOverColumnId(null)
    if (!over) return

    const draggedTaskId = active.id
    const overId = over.id
    const draggedTask = projectTasks.find((task) => task.id === draggedTaskId)
    if (!draggedTask) return

    let destinationStatus = draggedTask.status
    if (overId === 'todo') destinationStatus = 'TODO'
    else if (overId === 'inprocess') destinationStatus = 'IN_PROGRESS'
    else if (overId === 'done') destinationStatus = 'DONE'
    else {
      const overTask = projectTasks.find((task) => task.id === overId)
      if (overTask) destinationStatus = overTask.status
    }

    if (destinationStatus !== draggedTask.status) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === draggedTaskId ? { ...task, status: destinationStatus } : task
        )
      )
    }
  }

  const getInitials = (name) => {
    const words = name.trim().split(' ')
    if (words.length === 1) return name.slice(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return (
    <>
      <header>
        <nav id="header">
          <h1 className="banner">
            {currentProject?.name || 'Sin proyecto'}
            {activeProject && (
              <SettingsIcon
                onClick={() => setIsProjectDetailOpen(true)}
                className="project-details-settings"
                role="button"
                aria-label="Ajustes del proyecto"
              />
            )}
          </h1>
        </nav>
      </header>

      <div id="content">
        <aside id="sidebar" className={sideSlide ? 'expanded' : 'collapsed'}>
          <div id="projects">
            <div className="projectButtons">
              <button onClick={() => setSideSlide((prev) => !prev)} className="hideShowBtn">
                {sideSlide ? (
                  <ArrowLeftIcon className="arrowSlide" />
                ) : (
                  <ArrowRightIcon className="arrowSlide" />
                )}
              </button>
              <button onClick={() => setIsCreateProjectOpen(true)} className="newProjectBtn">
                {sideSlide ? '+ Add Project' : '+'}
              </button>
            </div>
            <ul>
              {projects.map((project) => (
                <li
                  key={project.id}
                  className={`project ${activeProject === project.id ? 'selected' : ''}`}
                  onClick={() => setActiveProject(project.id)}
                  title={project.name}
                >
                  {sideSlide ? project.name : getInitials(project.name)}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${sideSlide ? 'profileShort' : 'profile'}`}>
            <ProfileIcon
              className="profileIcon"
              role="button"
              aria-label="Perfil"
              onClick={() => setIsProfileOpen(true)}
              title="Ver perfil"
            />
          </div>
        </aside>

        <main id="manager">
          {!activeProject ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '80vh',
                fontSize: '1.5rem',
                color: '#667eea',
              }}
            >
              Crea un proyecto de prueba para empezar
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
                title="To Do"
                tasks={projectTasks}
                status="todo"
                isDropTarget={overColumnId === 'todo'}
                handleDelete={handleDeleteTask}
                handleAddTask={handleAddTask}
                onTaskClick={(task) => {
                  setSelectedTask(task)
                  setIsTaskDetailOpen(true)
                }}
                availableLabels={[]}
                availableUsers={[]}
              />
              <TaskColumn
                title="In Process"
                tasks={projectTasks}
                status="inprocess"
                isDropTarget={overColumnId === 'inprocess'}
                handleDelete={handleDeleteTask}
                handleAddTask={handleAddTask}
                onTaskClick={(task) => {
                  setSelectedTask(task)
                  setIsTaskDetailOpen(true)
                }}
                availableLabels={[]}
                availableUsers={[]}
              />
              <TaskColumn
                title="Done"
                tasks={projectTasks}
                status="done"
                isDropTarget={overColumnId === 'done'}
                handleDelete={handleDeleteTask}
                handleAddTask={handleAddTask}
                onTaskClick={(task) => {
                  setSelectedTask(task)
                  setIsTaskDetailOpen(true)
                }}
                availableLabels={[]}
                availableUsers={[]}
              />

              <DragOverlay>
                {activeTask ? (
                  <TaskCard title={activeTask.title} task={activeTask} isDragging={true} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </main>
      </div>

      <PlaygroundCreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <PlaygroundProjectDetailModal
        isOpen={isProjectDetailOpen}
        onClose={() => setIsProjectDetailOpen(false)}
        project={currentProject}
        onDeleteProject={handleDeleteProject}
      />

      <GuestProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        onUpdate={handleUpdateTask}
        onDelete={(taskId) => {
          setIsTaskDetailOpen(false)
          setSelectedTask(null)
          handleDeleteTask(taskId)
        }}
        availableLabels={[]}
        availableUsers={[]}
        disableTaskQuery={true}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDeleteTask}
        title="¿Eliminar tarea?"
        message="En playground esta acción solo afecta el estado actual."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
      />

      <Footer />
    </>
  )
}

export default Playground
