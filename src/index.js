import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';
import { buildSystemPrompt, buildUserPrompt, callLLM } from './ai/respond.js';

const app = express();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function isCrisis(t) {
  const x = t.toLowerCase();
  return ['suicid', 'me quiero morir', 'quitarme la vida', 'lastimarme'].some(k => x.includes(k));
}
function crisisMessage() {
  return [
    'Siento que estés pasando por un momento difícil 💛',
    'Si estás en peligro inmediato, marca *911*.',
    'Línea de la Vida: *800-911-2000*.',
    'Si deseas, puedo conectarte con alguien de nuestro equipo.'
  ].join('\n');
}

app.post('/webhooks/whatsapp', async (req, res) => {
  const from = req.body.From;
  const body = String(req.body.Body || '').trim();

  let reply;
  try {
    // 1) Guardrail local
    if (isCrisis(body)) {
      reply = crisisMessage();
    } else {
      // 2) Llamada a GPT-4o mini
      const system = buildSystemPrompt();
      const user   = buildUserPrompt(body);
      const aiText = await callLLM([
        { role: "system", content: system },
        { role: "user", content: user }
      ]);

      // 3) Procesar etiqueta
      const tag = (aiText.match(/^\[(INFO|LEAD|HUMANO|CRISIS)\]/i)?.[1] || "INFO").toUpperCase();
      const clean = aiText.replace(/^\[(INFO|LEAD|HUMANO|CRISIS)\]\s*/i, "").trim();

      if (tag === "CRISIS") {
        reply = crisisMessage();
      } else if (tag === "LEAD") {
        // TODO: guardar en Mongo/Sheets
        reply = clean + "\n\nHe tomado nota para contactarte pronto 💬";
      } else if (tag === "HUMANO") {
        reply = clean + "\n\nTe conecto con alguien del equipo 👤";
        // TODO: notificación a un número interno
      } else {
        reply = clean; // INFO
      }
    }

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: from,
      body: reply
    });
    res.sendStatus(200);
  } catch (e) {
    console.error("Webhook error:", e);
    res.sendStatus(200);
  }
});

const port = process.env.PORT || 3000;
app.get('/', (_req, res) => res.send('Bot con GPT-4o mini listo 🚀'));
app.listen(port, () => console.log(`Server on :${port}`));
