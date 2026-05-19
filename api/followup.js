module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { aspect, question, userResponse } = req.body;

  if (!userResponse || userResponse.trim().length < 5) {
    return res.status(400).json({ error: "Respuesta muy corta" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Configuración incompleta" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Sos un coach de desarrollo personal que hace preguntas poderosas de reflexión.

Ámbito: "${aspect}"
Pregunta que recibió: "${question}"
Lo que respondió: "${userResponse}"

Generá una única pregunta de seguimiento que:
- Profundice algo específico que el usuario expresó
- Use tuteo (vos) y sea cálida
- Sea breve (máximo 25 palabras)
- Invite a seguir mirando hacia adentro

Respondé solo con la pregunta, sin comillas ni explicaciones.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Error en la API de Claude");
    }

    const data = await response.json();
    const followupQuestion = data.content[0].text.trim();

    return res.status(200).json({ question: followupQuestion });
  } catch {
    return res.status(500).json({ error: "No pudimos generar la pregunta. Intentá de nuevo." });
  }
};
