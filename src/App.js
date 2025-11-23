import React, { createContext, useReducer, useContext, useState } from "react";
import './App.css'; 

// Criação do Contexto para gerenciar o estado global das tarefas.
const TaskContext = createContext();

const initialState = {
  tasks: [],
  filter: "all",
  sort: "priority", // Ordenação fixada por prioridade
};

// Função Reducer para manipular as ações de estado.
function taskReducer(state, action) {
  switch (action.type) {
    case "ADD_TASK":
      const { text, priority } = action.payload;
      return {
        ...state,
        tasks: [
          ...state.tasks,
          { id: Date.now(), text, completed: false, priority: priority || "Média" },
        ],
      };

    case "TOGGLE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        ),
      };

    case "DELETE_TASK": 
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };

    case "SET_FILTER":
      return { ...state, filter: action.payload };

    // A ação SET_SORT não será mais usada na interface, mas a mantemos
    // se precisar ser usada internamente no futuro.
    case "SET_SORT":
      return { ...state, sort: action.payload }; 

    default:
      return state;
  }
}

function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

const useTasks = () => useContext(TaskContext);

// --- AUXILIARES E CONSTANTES ---

// Mapeamento de prioridades para classes CSS de cores.
const PRIORITY_COLORS = {
  Alta: 'danger',
  Média: 'warning',
  Baixa: 'success',
};

// Lógica de ordenação: Ordena tarefas por prioridade (Alta -> Baixa).
const sortTasks = (tasks, criteria) => {
  const priorityOrder = { Alta: 3, Média: 2, Baixa: 1 };

  return [...tasks].sort((a, b) => {
    if (criteria === "priority") {
      return priorityOrder[b.priority] - priorityOrder[a.priority]; 
    }
    return 0;
  });
};


// --- COMPONENTE TAREFA ---

function Tarefa({ task }) {
  const { dispatch } = useTasks();

  const handleToggle = () => {
    dispatch({ type: "TOGGLE_TASK", payload: task.id });
  };
  
  const handleDelete = () => {
     dispatch({ type: "DELETE_TASK", payload: task.id });
  };


  return (
    <li className={`task-card ${task.completed ? 'completed' : ''} priority-${PRIORITY_COLORS[task.priority]}`}>
      <div className="task-content">
        <label className="task-label">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            className="task-checkbox"
          />
          <span className="task-text">{task.text}</span>
        </label>
      </div>

      <div className="task-actions">
        <div className={`priority-tag ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </div>
        
        <button className="delete-button" title="Deletar Tarefa" onClick={handleDelete}>
          <span className="icon-trash" aria-label="lixeira"></span>
        </button>
      </div>
    </li>
  );
}


// --- COMPONENTE LISTA DE TAREFAS ---

function ListaDeTarefas() {
  const { state } = useTasks();

  // Aplica a lógica de filtragem, agora apenas por status.
  const filtered = state.tasks.filter((task) => {
    if (state.filter === "completed") return task.completed;
    if (state.filter === "pending") return !task.completed;
    
    // Retorna todas se state.filter for "all" (ou qualquer outro valor não reconhecido)
    return true; 
  });

  // Aplica a ordenação fixa por prioridade.
  const sortedTasks = sortTasks(filtered, state.sort);

  return (
    <ul className="task-list">
      {sortedTasks.map((task) => (
        <Tarefa key={task.id} task={task} />
      ))}
      {sortedTasks.length === 0 && (
        <p className="no-tasks">
          Nenhuma tarefa {
            state.filter === 'completed' ? 'concluída' : 
            state.filter === 'pending' ? 'pendente' : 
            'encontrada'
          }.
        </p>
      )}
    </ul>
  );
}


// --- COMPONENTE PRINCIPAL DE CONTEÚDO ---

function AppContent() {
  const { state, dispatch } = useTasks();
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Média"); 

  const { filter } = state; 

  const handleAddTask = (e) => {
    e.preventDefault(); 
    if (text.trim() !== "") {
      dispatch({ type: "ADD_TASK", payload: { text: text.trim(), priority } });
      setText("");
      setPriority("Média"); 
    }
  };

  const statusFilters = ['all', 'pending', 'completed'];

  return (
    <div className="task-manager-container">
      <div className="header-section">
        <h1 className="main-title">Gerenciador de Tarefas</h1>
        <p className="subtitle">Organize suas tarefas de forma simples e eficiente.</p>
      </div>

      {/* Seção Adicionar Tarefa */}
      <div className="add-task-section card">
        <form onSubmit={handleAddTask}>
          <input
            type="text"
            placeholder="Digite o nome da nova tarefa..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="task-input"
          />

          <div className="controls-row">
             {/* Campo de Prioridade */}
            <select 
                value={priority} 
                onChange={(e) => setPriority(e.target.value)}
                className="priority-select"
            >
                <option value="Alta">Prioridade: Alta</option>
                <option value="Média">Prioridade: Média</option>
                <option value="Baixa">Prioridade: Baixa</option>
            </select>
            
            <button type="submit" className="add-button" disabled={text.trim() === ""}>
              + Adicionar
            </button>
          </div>
        </form>
      </div>
      
      {/* Seção Filtro, agora sem Ordenação e sem filtro de prioridade */}
      <div className="filter-sort-section card">
        
        {/* FILTRO POR STATUS (Único filtro) */}
        <div className="filter-group">
          <p className="group-title">
            <span className="icon-filter" aria-label="filtro"></span> Visualizar tarefas:
          </p>
          <div className="button-group">
            {statusFilters.map((f) => (
              <button
                key={f}
                onClick={() => dispatch({ type: "SET_FILTER", payload: f })}
                className={`button-pill ${filter === f ? 'active' : ''}`}
              >
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
              </button>
            ))}
          </div>
        </div>
        
        {/* As seções de filtro de prioridade e ordenação foram removidas daqui. */}

      </div>
      
      <ListaDeTarefas />
    </div>
  );
}

// --- APP PRINCIPAL ---

export default function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}
