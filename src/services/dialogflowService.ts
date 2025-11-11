import axios from 'axios';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Configuración del backend
// IMPORTANTE: Cambia la IP según tu red local
const getBackendURL = () => {
  if (!__DEV__) {
    return 'https://tu-backend-production.com'; // Cambiar en producción
  }
  
  // Para desarrollo
  if (Platform.OS === 'android') {
    // Para dispositivo físico: usa tu IP local
    // Para emulador: usa 10.0.2.2
    return 'http://192.168.100.7:3000';
  }
  
  // Para iOS y web
  return 'http://localhost:3000';
};

const BACKEND_URL = getBackendURL();

// Función para generar UUID compatible con React Native
const generateUUID = () => {
  return Crypto.randomUUID();
};

type DialogflowMessage = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
};

type DialogflowResponse = {
  reply: string;
  intent?: string;
  confidence?: number;
};

/**
 * Enviar mensaje al backend que se comunica con Dialogflow
 * El backend maneja las credenciales de forma segura
 */
export const sendMessageToDialogflow = async (
  message: string,
  sessionId: string,
): Promise<DialogflowResponse> => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/chat`,
      {
        message,
        sessionId,
        languageCode: 'es',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      },
    );

    return {
      reply: response.data.reply || 'Lo siento, no pude procesar tu mensaje.',
      intent: response.data.intent,
      confidence: response.data.confidence,
    };
  } catch (error) {
    console.error('Error enviando mensaje a Dialogflow:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
      }
      if (error.response?.status === 500) {
        throw new Error('Error en el servidor. Intenta nuevamente.');
      }
    }
    
    throw new Error('No se pudo conectar con el servicio de soporte');
  }
};

/**
 * Generar un ID de sesión único para el usuario
 */
export const generateSessionId = (userId: string): string => {
  return `${userId}-${generateUUID()}`;
};

/**
 * Obtener respuestas rápidas predefinidas
 */
export const getQuickReplies = (): string[] => {
  return [
    '¿Cómo hago una transferencia?',
    '¿Qué son los sobres inteligentes?',
    '¿Cómo realizar una recarga?',
    '¿Cómo gestionar mis cobros?',
  ];
};

export type { DialogflowMessage, DialogflowResponse };
