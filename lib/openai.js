import { requireEnv } from "./env.js";

export async function generateBusinessReply({ message, context = "" }) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.AI_MODEL || "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            "You are a helpful Facebook business assistant.",
            "Reply in Bangla or Banglish when the customer uses Bangla/Banglish.",
            "Do not invent prices, stock, delivery promises, payment confirmation, or policies.",
            "If unsure, ask one short clarifying question or say an admin will follow up."
          ].join(" ")
        },
        {
          role: "user",
          content: `Business context:\n${context || "No extra context yet."}\n\nCustomer message:\n${message}`
        }
      ]
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || `OpenAI request failed: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  return data.output_text || "Dhonnobad. Admin apnake shortly reply korbe.";
}
