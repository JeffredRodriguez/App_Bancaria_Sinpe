import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
};

type ChatState = {
  messages: ChatMessage[];
  sessionId: string | null;
  isTyping: boolean;
  error: string | null;
  supportAssistantEnabled: boolean;
  addMessage: (message: ChatMessage) => void;
  setTyping: (isTyping: boolean) => void;
  setError: (error: string | null) => void;
  setSessionId: (sessionId: string) => void;
  clearMessages: () => void;
  toggleSupportAssistant: (enabled: boolean) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessionId: null,
  isTyping: false,
  error: null,
  supportAssistantEnabled: true,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setTyping: (isTyping) => set({ isTyping }),
  setError: (error) => set({ error }),
  setSessionId: (sessionId) => set({ sessionId }),
  clearMessages: () => set({ messages: [] }),
  toggleSupportAssistant: (enabled) => set({ supportAssistantEnabled: enabled }),
}));
