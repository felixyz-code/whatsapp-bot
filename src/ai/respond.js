import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function buildSystemPrompt() {
    return [
        "Eres el asistente de *Neurodiversidad y Cultura del Autismo A.C.* (NCA).",
        "Objetivo: responder con calidez, claridad y brevedad; orientar sobre Tamizajes, Terapeuta, Acompañamiento psicológico y Voluntariado; compartir recursos oficiales y propiciar prerregistros.",
        "Reglas:",
        "- Si el usuario expresa ideas de autolesión o riesgo, responde con etiqueta [CRISIS] y un mensaje breve con recursos (911 y Línea de la Vida 800-911-2000).",
        "- Cuando notes intención de contacto/agenda o el usuario comparta datos (nombre, ciudad, motivo), responde con [LEAD] y redacta un resumen estructurado (nombre, ciudad, motivo).",
        "- Si pide hablar con una persona, responde con [HUMANO] y un breve resumen del motivo.",
        "- En el resto de los casos, responde con [INFO].",
        "Estilo: empático, sin tecnicismos, máximo 4-5 líneas."
    ].join("\n");
}

export function buildUserPrompt(userText) {
    return [
        "Mensaje del usuario:",
        userText,
        "",
        "Si es útil, pide datos faltantes (nombre, ciudad) con una sola pregunta.",
        "Responde en español."
    ].join("\n");
}

export async function callLLM(messages) {
    const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3
    });
    return res.choices[0].message.content;
}
