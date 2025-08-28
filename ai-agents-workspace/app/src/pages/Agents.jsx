import React, { useState } from "react";
import Chat from "../components/Chat";

function Agents() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");

  // Criar novo agente
  const handleCreateAgent = () => {
    const newAgent = {
      id: Date.now(),
      name: newAgentName,
      systemPrompt: newAgentPrompt
    };
    setAgents([...agents, newAgent]);
    setNewAgentName("");
    setNewAgentPrompt("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Gerenciador de Agentes</h1>

      {/* Formulário de criação */}
      <div style={{ marginBottom: 20, borderBottom: "1px solid #ddd", paddingBottom: 20 }}>
        <h2>Criar Novo Agente</h2>
        <input
          type="text"
          placeholder="Nome do agente"
          value={newAgentName}
          onChange={(e) => setNewAgentName(e.target.value)}
          style={{ width: "50%", marginBottom: 10 }}
        />
        <br />
        <textarea
          placeholder="Prompt do agente"
          value={newAgentPrompt}
          onChange={(e) => setNewAgentPrompt(e.target.value)}
          style={{ width: "100%", height: 80, marginBottom: 10 }}
        />
        <br />
        <button onClick={handleCreateAgent}>Criar Agente</button>
      </div>

      {/* Lista de agentes criados */}
      <div style={{ marginBottom: 20 }}>
        <h2>Agentes Criados</h2>
        {agents.length === 0 && <p>Nenhum agente criado ainda.</p>}
        <ul>
          {agents.map((agent) => (
            <li key={agent.id} style={{ marginBottom: 5 }}>
              <button onClick={() => setSelectedAgent(agent)}>
                {agent.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Área de chat com agente selecionado */}
      {selectedAgent && (
        <div>
          <h2>Conversando com: {selectedAgent.name}</h2>
          <Chat
            systemPrompt={selectedAgent.systemPrompt}
            userPrompt=""
            setUserPrompt={() => {}}
          />
        </div>
      )}
    </div>
  );
}

export default Agents;
