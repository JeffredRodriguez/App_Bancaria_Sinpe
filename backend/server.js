require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dialogflow = require('@google-cloud/dialogflow');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Dialogflow
const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    client_email: process.env.DIALOGFLOW_CLIENT_EMAIL,
    private_key: process.env.DIALOGFLOW_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Davivienda Backend is running' });
});

// Endpoint principal de chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, languageCode = 'es' } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: 'Se requieren los campos: message y sessionId',
      });
    }

    // Crear sesión de Dialogflow
    const sessionPath = sessionClient.projectAgentSessionPath(
      projectId,
      sessionId
    );

    // Preparar request para Dialogflow
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: languageCode,
        },
      },
    };

    // Enviar mensaje a Dialogflow
    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult;

    // Preparar respuesta
    const chatResponse = {
      reply: result.fulfillmentText || 'Lo siento, no entendí tu pregunta.',
      intent: result.intent ? result.intent.displayName : null,
      confidence: result.intentDetectionConfidence || 0,
      parameters: result.parameters,
      allRequiredParamsPresent: result.allRequiredParamsPresent,
    };

    res.json(chatResponse);
  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      error: 'Error procesando el mensaje',
      details: error.message,
    });
  }
});

// Endpoint para generar un nuevo session ID
app.get('/api/session/new', (req, res) => {
  const sessionId = uuidv4();
  res.json({ sessionId });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});
