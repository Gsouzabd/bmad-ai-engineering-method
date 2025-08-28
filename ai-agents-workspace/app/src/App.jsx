import React, { useState } from "react";
import Chat from "./components/Chat";

function App() {
  const [systemPrompt, setSystemPrompt] = useState("Você é um agente criado pelo usuário.");
  const [userPrompt, setUserPrompt] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Agents Workspace</h1>

      <textarea
        placeholder="System Prompt"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        style={{ width: "100%", height: 80, marginBottom: 10 }}
      />

      <Chat systemPrompt={systemPrompt} userPrompt={userPrompt} setUserPrompt={setUserPrompt} />
    </div>
  );
}

export default App;
