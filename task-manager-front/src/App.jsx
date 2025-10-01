import { useState, useEffect } from 'react'
import Footer from './components/Footer'
import './App.css'

import TaskColumn from './components/TaskColumn'

import settingsIcon from './assets/settings.svg'
import profileIcon from './assets/profile.svg'

const initialTasks = [
  {id: 1, project: 1, task: "Hacer estructura de la página", status: "done"},
  {id: 2, project: 1, task: "Conseguir hacer el drag and drop", status: "done"},
  {id: 3, project: 1, task: "Estilar la página (arreglar animaciones sidebar también)", status: "todo"},
  {id: 4, project: 1, task: "Mejorar side bar", status: "inprocess"},
  {id: 5, project: 1, task: "Añadir símbolo y modal para añadir tasks", status: "done"},
  {id: 6, project: 1, task: "Implementar backend", status: "todo"},
  {id: 7, project: 1, task: "Implementar bases de datos", status: "todo"},
  {id: 8, project: 1, task: "Hacer que cuando hay muchas tareas de una columna el scroll sea en la columna y no en la página", status: "todo"},
  {id: 9, project: 2, task: "Hacer estructura de PFinance", status: "todo"}
]

const initialProjects = [
  {id: 1, name: "Task Manager"},
  {id: 2, name: "PFinance"}
]

function App() {
  const [sideSlide, setSideSlide] = useState(true)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState(initialProjects)
  const [activeCard, setActiveCard] = useState(null)
  const [activeProject, setActiveProject] = useState(1)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [newProjectText, setNewProjectText] = useState('')

  useEffect(() => {
    setTasks(initialTasks.filter(task => task.project === 1))
  }, [])

  const handleProjectChange = (id) => {
    setTasks(initialTasks.filter(task => task.project === id))
    setActiveProject(id)
  }

  const handleAddTask = (newTask, status) => {
    const newTaskObj = {
      id: tasks.length > 0 ? Math.max(...tasks.map(task => task.id)) + 1 : 1,
      task: newTask,
      status: status
    }
    setTasks([...tasks, newTaskObj])
  }

  const handleSlide = () => {
    setSideSlide(!sideSlide)
  }

  const handleDelete = (taskIndex) => {
    const newTasks = tasks.filter((task, index) => index !== taskIndex)
    setTasks(newTasks)
  }

  const onDrop = (status, position) => {
    if (activeCard == null) return;

    const taskToMove = tasks[activeCard];
    
    // Crear nuevo array sin la tarea a mover
    const updatedTasks = tasks.filter((_, index) => index !== activeCard);
    
    // Encontrar las tasks del status destino (después de remover la tarea)
    const statusTasks = updatedTasks.filter(t => t.status === status);
    
    // Calcular la posición global donde insertar
    let globalPosition;
    if (position === 0) {
      // Insertar al inicio del status
      const firstStatusTask = updatedTasks.find(t => t.status === status);
      globalPosition = firstStatusTask ? updatedTasks.indexOf(firstStatusTask) : updatedTasks.length;
    } else if (position >= statusTasks.length) {
      // Insertar al final del status
      const lastStatusTaskIndex = updatedTasks.map((t, i) => t.status === status ? i : -1)
        .filter(i => i !== -1)
        .pop();
      globalPosition = lastStatusTaskIndex !== undefined ? lastStatusTaskIndex + 1 : updatedTasks.length;
    } else {
      // Insertar entre tasks del mismo status
      globalPosition = updatedTasks.indexOf(statusTasks[position]);
    }
    
    // Insertar la tarea con el nuevo status
    updatedTasks.splice(globalPosition, 0, {
      ...taskToMove,
      status: status
    });

    setTasks(updatedTasks);
  }

  return (
    <>
    <header>
      <a><span className='home'>TM</span></a>
      <nav id="header">
        <h1 className='banner'>{projects.find(project => project.id === activeProject).name}</h1>
      </nav>
    </header>
    <div id='content'>
      <aside id="sidebar" style={{width: sideSlide ? "11%" : "3%"}}>
        <div id='projects'>
          <div
            className={sideSlide ? "projectButtons" : "justShow"}
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className='newProjectBtn'
              hidden={sideSlide ? false : true}
            >
              New Project
            </button>
            <button
              onClick={handleSlide}
              className='hideShowBtn'
            >
              {sideSlide ? "hide" : "show"}
            </button>
          </div>
          <ul>
            {projects.map((project, index) => {
              const getInitials = (name) => {
                const words = name.trim().split(' ');
                if (words.length === 1) {
                  return name.slice(0, 2).toUpperCase();
                }
                return (words[0][0] + words[1][0]).toUpperCase();
              };

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
          <img src={profileIcon}  className='profileIcon' />
          <img src={settingsIcon} className='settingsIcon' />
        </div>
      </aside>
      <main id="manager">
        <TaskColumn
          title={"To Do"}
          tasks={tasks}
          status={"todo"}
          handleDelete={handleDelete}
          setActiveCard={setActiveCard}
          onDrop={onDrop}
          handleAddTask={handleAddTask}
        />
        <TaskColumn
          title={"In Process"}
          tasks={tasks}
          status={"inprocess"}
          handleDelete={handleDelete}
          setActiveCard={setActiveCard}
          onDrop={onDrop}
          handleAddTask={handleAddTask}
        />
        <TaskColumn
          title={"Done"}
          tasks={tasks}
          status={"done"}
          handleDelete={handleDelete}
          setActiveCard={setActiveCard}
          onDrop={onDrop}
          handleAddTask={handleAddTask}
        />
      </main>
    </div>
    <Footer />
    </>
  )
}

export default App
