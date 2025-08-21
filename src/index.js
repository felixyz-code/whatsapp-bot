import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';

const app = express();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Twilio manda x-www-form-urlencoded por default
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Healthcheck
app.get('/', (_req, res) => res.send('WhatsApp Bot running'));

// Webhook mínimo: responde siempre algo
app.post('/webhooks/whatsapp', async (req, res) => {
  try {
    const from = req.body.From;               // "whatsapp:+52..."
    const body = String(req.body.Body || '').trim();

    // Lógica mínima
    let reply = `👋 Hola, recibí: "${body}". Escribe "menu" para opciones.`;
    if (body.toLowerCase() === 'menu') {
      reply = [
        'Menú:',
        '1) Tamizajes',
        '2) Terapeuta',
        '3) Acompañamiento',
        '4) Voluntariado'
      ].join('\n');
    }

    // Responder vía Twilio
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: from,
      body: reply
    });

    // Importante: 200 OK para que Twilio no reintente
    res.sendStatus(200);
  } catch (e) {
    console.error('Error webhook:', e);
    res.sendStatus(200); // igual respondemos 200 para evitar reintentos
  }
});

// Render asigna el puerto
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server on :${port}`));
