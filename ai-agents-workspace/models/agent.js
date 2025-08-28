// models/agent.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runAgent(systemPrompt, userPrompt, context = "") {
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
      ...(context ? [{ role: "assistant", content: context }] : [])
    ]
  });
  return completion.choices[0].message.content;
}
