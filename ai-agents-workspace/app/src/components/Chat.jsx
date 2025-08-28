import React, { useState } from "react";
import { sendPrompt } from "../services/api";

function Chat({ systemPrompt, userPrompt, setUserPrompt }) {
  const [messages, setMessages] = useState([]);

  const handleSend = async () => {
    const reply = await sendPrompt(systemPrompt, userPrompt);
    setMessages([...messages, { role: "user", content: userPrompt }, { role: "agent", content: reply }]);
    setUserPrompt("");
  };

  return (
    <div>
      <div style={{ minHeight: 200, border: "1px solid #ddd", padding: 10, marginBottom: 10 }}>
        {messages.map((m, i) => (
          <p key={i}><b>{m.role}:</b> {m.content}</p>
        ))}
      </div>

      <input
        type="text"
        value={userPrompt}
        onChange={(e) => setUserPrompt(e.target.value)}
        placeholder="Digite sua mensagem..."
        style={{ width: "80%", marginRight: 10 }}
      />
      <button onClick={handleSend}>Enviar</button>
    </div>
  );
}

export default Chat;
