module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const body = req.body || {};
    const { aspect, question, userResponse } = body;

    if (!userResponse || String(userResponse).trim().length < 5) {
      return res.status(400).json({ error: "Respuesta muy corta" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta la variable GEMINI_API_KEY en Vercel" });
    }

    const prompt = `Sos un coach de desarrollo personal que hace preguntas poderosas de reflexión.

Ámbito: "${aspect}"
Pregunta que recibió: "${question}"
Lo que respondió: "${userResponse}"

Generá una única pregunta de seguimiento que:
- Profundice algo específico que el usuario expresó
- Use tuteo (vos) y sea cálida
- Sea breve (máximo 25 palabras)
- Invite a seguir mirando hacia adentro

Respondé solo con la pregunta, sin comillas ni explicaciones.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200 },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(500).json({
        error: `Error de Gemini: ${data?.error?.message || geminiRes.status}`,
      });
    }

    const followupQuestion = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!followupQuestion) {
      return res.status(500).json({ error: "Gemini no devolvió una pregunta. Intentá de nuevo." });
    }

    return res.status(200).json({ question: followupQuestion });

  } catch (err) {
    return res.status(500).json({ error: `Error interno: ${err.message}` });
  }
};
