# Backend de Soporte con Dialogflow

Backend Node.js/Express para la integración de Dialogflow en la app Davivienda.

## 🚀 Instalación

```bash
cd backend
npm install
```

## 📝 Configuración

Crea un archivo `.env` en la carpeta `backend` con las siguientes variables:

```env
DIALOGFLOW_PROJECT_ID=tu-project-id
DIALOGFLOW_CLIENT_EMAIL=tu-service-account@tu-project.iam.gserviceaccount.com
DIALOGFLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
PORT=3000
```

> ⚠️ **IMPORTANTE**: El archivo `.env` ya está configurado en `.gitignore` y NO debe subirse a Git.

## 🏃 Ejecutar el Servidor

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor correrá en `http://localhost:3000`

## 📡 Endpoints

### Health Check
```
GET /health
```
Verifica que el servidor esté funcionando.

**Respuesta:**
```json
{
  "status": "ok",
  "message": "Davivienda Backend is running"
}
```

### Chat con Dialogflow
```
POST /api/chat
```

**Body:**
```json
{
  "message": "¿Cómo hago una transferencia?",
  "sessionId": "user-123-uuid",
  "languageCode": "es"
}
```

**Respuesta:**
```json
{
  "reply": "Para hacer una transferencia...",
  "intent": "TransferHelp",
  "confidence": 0.95,
  "parameters": {},
  "allRequiredParamsPresent": true
}
```

### Nuevo Session ID
```
GET /api/session/new
```

**Respuesta:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 🛠️ Estructura

```
backend/
├── server.js          # Servidor principal
├── package.json       # Dependencias
├── .env              # Variables de entorno (NO SUBIR A GIT)
├── .gitignore        # Archivos ignorados
└── README.md         # Esta documentación
```

## 🔒 Seguridad

- Las credenciales de Dialogflow están **solo en el backend**
- La app móvil **nunca** tiene acceso directo a las credenciales
- El `.env` está protegido por `.gitignore`
- En producción, usa variables de entorno del servicio de hosting

## 🌐 Despliegue

### Heroku
```bash
heroku create davivienda-backend
heroku config:set DIALOGFLOW_PROJECT_ID=xxx
heroku config:set DIALOGFLOW_CLIENT_EMAIL=xxx
heroku config:set DIALOGFLOW_PRIVATE_KEY="xxx"
git push heroku main
```

### Railway
1. Conecta tu repositorio
2. Agrega las variables de entorno en el dashboard
3. Deploy automático

### Render
1. Conecta tu repositorio
2. Agrega las variables de entorno
3. Build Command: `npm install`
4. Start Command: `npm start`

## 📚 Documentación

- [Dialogflow ES Docs](https://cloud.google.com/dialogflow/es/docs)
- [Express.js](https://expressjs.com/)
- [Google Cloud Auth](https://cloud.google.com/docs/authentication)

## 🐛 Troubleshooting

### Error: Cannot find module '@google-cloud/dialogflow'
```bash
npm install
```

### Error: Invalid credentials
Verifica que las variables en `.env` sean correctas y que la private key esté entre comillas.

### Puerto ya en uso
Cambia el `PORT` en `.env` o termina el proceso:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```
