export async function sendPrompt(systemPrompt, userPrompt) {
    const res = await fetch("http://localhost:3001/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, userPrompt })
    });
    const data = await res.json();
    return data.reply;
  }
  