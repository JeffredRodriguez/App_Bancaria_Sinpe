# 🤖 Integración de Soporte con Dialogflow

## ✅ ¿Qué se implementó?

### 1. **Backend Seguro** (✅ COMPLETADO)
- ✅ Servidor Express en `backend/server.js`
- ✅ Endpoint POST `/api/chat` para comunicarse con Dialogflow
- ✅ Credenciales protegidas en `backend/.env`
- ✅ `.gitignore` configurado para no subir secretos
- ✅ Servidor corriendo en `http://localhost:3000`

### 2. **Servicio de Cliente** (✅ COMPLETADO)
- ✅ `src/services/dialogflowService.ts` - Comunica app con backend
- ✅ Manejo de errores y timeouts
- ✅ Respuestas rápidas predefinidas

### 3. **Componentes UI** (✅ COMPLETADO)
- ✅ `ChatBubble.tsx` - Burbujas de mensajes con animaciones
- ✅ `ChatInput.tsx` - Input de mensaje con botón de enviar
- ✅ `TypingIndicator.tsx` - Indicador de "escribiendo..."

### 4. **Store de Estado** (✅ COMPLETADO)
- ✅ `src/store/useChatStore.ts` - Zustand store para mensajes

### 5. **Pantalla de Chat** (✅ COMPLETADO)
- ✅ `src/screens/SupportChatScreen.tsx` - UI completa del chat
- ✅ Ruta en `app/(app)/support.tsx`
- ✅ Botón flotante en `AccountBalanceScreen` para acceder

---

## 🚀 Cómo Usar

### Iniciar el Backend (IMPORTANTE)
```bash
# Terminal 1 - Backend
cd backend
npm start
```

Deberías ver:
```
🚀 Backend corriendo en puerto 3000
📡 Health check: http://localhost:3000/health
💬 Chat endpoint: http://localhost:3000/api/chat
```

### Iniciar la App
```bash
# Terminal 2 - App React Native
npx expo start
```

### Probar el Chat
1. Abre la app en tu dispositivo/emulador
2. En la pantalla principal (Home), verás un **botón flotante rojo** en la esquina inferior derecha con un ícono de chat
3. Presiona el botón para abrir el chat de soporte
4. Escribe un mensaje (ejemplo: "¿Cómo hago una transferencia?")
5. El bot responderá usando Dialogflow

---

## 📝 Configurar Dialogflow

### 1. Entrenar Intents en Dialogflow

Ve a [Dialogflow Console](https://dialogflow.cloud.google.com/) y crea estos intents:

#### Intent: `TransferHelp`
**Training Phrases:**
- ¿Cómo hago una transferencia?
- Quiero enviar dinero
- ¿Cómo transferir a otro usuario?
- Ayuda con transferencias

**Response:**
```
Para hacer una transferencia:
1. Presiona "Enviar dinero ahora" en la pantalla principal
2. Ingresa el número de teléfono del destinatario
3. Escribe el monto a transferir
4. Confirma la operación
¿Necesitas ayuda con algo más?
```

#### Intent: `EnvelopeHelp`
**Training Phrases:**
- ¿Qué son los sobres inteligentes?
- Cómo usar sobres
- Ayuda con sobres
- Explica sobres

**Response:**
```
Los sobres inteligentes te permiten organizar tu dinero en categorías.

Por ejemplo:
• Renta: $500
• Ahorros: $200
• Emergencias: $100

Para crear uno, ve a "Sobres inteligentes" en la pantalla principal.
¿Quieres saber más?
```

#### Intent: `RechargeHelp`
**Training Phrases:**
- Cómo recargar saldo
- Ayuda con recargas
- Recargar celular
- Poner saldo

**Response:**
```
Para recargar tu celular:
1. Ve al menú y selecciona "Recargas"
2. Ingresa el número de teléfono
3. Elige el monto (₡1000, ₡2000, ₡5000, etc.)
4. Confirma la recarga
¡Listo! La recarga es instantánea 🚀
```

#### Intent: `Balance`
**Training Phrases:**
- ¿Cuál es mi saldo?
- Ver mi balance
- Cuánto dinero tengo
- Mi saldo actual

**Response:**
```
Para ver tu saldo detallado:
• Ve a la pantalla principal
• Tu balance aparece en la tarjeta grande al inicio
• También puedes ver el desglose de sobres y movimientos recientes

¿Necesitas ayuda con algo más?
```

#### Intent: `HumanAgent`
**Training Phrases:**
- Hablar con un agente
- Quiero hablar con una persona
- Ayuda humana
- Contactar soporte

**Response:**
```
Entiendo, te comunicaré con un agente humano.

Mientras tanto, puedes contactarnos por:
📧 Email: soporte@davivienda.com
📞 Teléfono: 2-DAVIVIENDA (2-328-4843)
⏰ Horario: Lunes a viernes, 8am-6pm

Un agente te atenderá pronto. ¿Hay algo más en lo que pueda ayudarte ahora?
```

### 2. Configurar Default Fallback

En Dialogflow, configura el **Default Fallback Intent** con esta respuesta:

```
Lo siento, no estoy seguro de cómo ayudarte con eso.

Puedo ayudarte con:
• Transferencias
• Sobres inteligentes
• Recargas de celular
• Consultar tu saldo
• Contactar a un agente humano

¿Con cuál te gustaría ayuda?
```

---

## 🔧 Desarrollo

### Modificar el Backend
Edita `backend/server.js` y el servidor se reiniciará automáticamente si usas:
```bash
npm run dev  # Con nodemon para hot reload
```

### Modificar la UI del Chat
Los componentes están en:
- `src/components/ChatBubble.tsx`
- `src/components/ChatInput.tsx`
- `src/screens/SupportChatScreen.tsx`

### Cambiar URL del Backend en Producción
En `src/services/dialogflowService.ts`, línea 4:
```typescript
const BACKEND_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://tu-backend-production.com'; // 👈 Cambiar aquí
```

---

## 🌐 Desplegar a Producción

### Opción 1: Railway (RECOMENDADO - GRATIS)
1. Ve a [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Conecta tu repositorio
4. Railway detectará automáticamente el backend
5. Agrega las variables de entorno en el dashboard:
   - `DIALOGFLOW_PROJECT_ID`
   - `DIALOGFLOW_CLIENT_EMAIL`
   - `DIALOGFLOW_PRIVATE_KEY`
6. Deploy automático ✅
7. Railway te dará una URL (ej: `https://tu-app.up.railway.app`)

### Opción 2: Render (GRATIS)
1. Ve a [render.com](https://render.com)
2. "New" → "Web Service"
3. Conecta tu repo
4. Configuración:
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
5. Agrega variables de entorno
6. Deploy ✅

### Opción 3: Heroku
```bash
cd backend
heroku create davivienda-backend
heroku config:set DIALOGFLOW_PROJECT_ID=xxx
heroku config:set DIALOGFLOW_CLIENT_EMAIL=xxx
heroku config:set DIALOGFLOW_PRIVATE_KEY="xxx"
git subtree push --prefix backend heroku main
```

---

## 🐛 Troubleshooting

### Error: "No se pudo conectar con el servidor"
✅ **Solución:** El backend no está corriendo. Inicia con `cd backend && npm start`

### Error: "Cannot find module '@google-cloud/dialogflow'"
✅ **Solución:**
```bash
cd backend
npm install
```

### Error: "Invalid credentials"
✅ **Solución:** Verifica que las credenciales en `backend/.env` sean correctas

### El chat no responde nada
✅ **Solución:** Verifica que hayas entrenado intents en Dialogflow Console

### Error al compilar: "expo-blur not found"
✅ **Solución:**
```bash
npx expo install expo-blur
```

---

## 📚 Próximos Pasos (Opcional)

### 1. Persistencia de Mensajes
Guardar chat en AsyncStorage:
```typescript
// En useChatStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Agregar persistencia
persist: {
  name: 'chat-storage',
  storage: AsyncStorage,
}
```

### 2. Notificaciones Push
Avisar al usuario cuando el bot responde si está fuera de la app.

### 3. Análisis
Integrar Google Analytics para ver qué preguntas son más comunes.

### 4. Rich Messages
Agregar botones, carruseles e imágenes desde Dialogflow.

---

## ✅ Checklist Final

- [x] Backend creado y funcionando
- [x] Credenciales protegidas en .env
- [x] Servicio de Dialogflow implementado
- [x] UI de chat completada
- [x] Botón flotante en Home
- [x] Documentación completa
- [ ] Intents entrenados en Dialogflow (TU TURNO)
- [ ] Backend desplegado en producción (CUANDO QUIERAS)

---

## 🎉 ¡Todo Listo!

Tu app ahora tiene un chatbot de soporte inteligente con Dialogflow.

**Para probarlo:**
1. `cd backend && npm start`
2. `npx expo start` (en otra terminal)
3. Abre la app y presiona el botón flotante
4. Chatea con el bot 🤖

¿Dudas? Pregúntame!
