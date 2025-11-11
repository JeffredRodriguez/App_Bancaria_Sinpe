import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Crypto from 'expo-crypto';

import FuturisticBackground from '../components/FuturisticBackground';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInput } from '../components/ChatInput';
import { TypingIndicator } from '../components/TypingIndicator';
import { useTheme } from '../theme/ThemeProvider';
import { useChatStore } from '../store/useChatStore';
import {
  sendMessageToDialogflow,
  generateSessionId,
  getQuickReplies,
} from '../services/dialogflowService';

export const SupportChatScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const {
    messages,
    sessionId,
    isTyping,
    error,
    addMessage,
    setTyping,
    setError,
    setSessionId,
  } = useChatStore();

  useEffect(() => {
    if (!sessionId) {
      const newSessionId = generateSessionId(`user-${Date.now()}`);
      setSessionId(newSessionId);
    }
  }, [sessionId, setSessionId]);

  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        id: Crypto.randomUUID(),
        text: '¡Hola! Soy tu asistente virtual de Banco Costa Rica. ¿En qué puedo ayudarte hoy?',
        sender: 'bot',
        timestamp: new Date(),
      });
    }
  }, [messages.length, addMessage]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(app)/home');
  };

  const handleSendMessage = async (text: string) => {
    if (!sessionId) {
      return;
    }

    setShowQuickReplies(false);
    setError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    addMessage({
      id: Crypto.randomUUID(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    });

    setTyping(true);

    try {
      const response = await sendMessageToDialogflow(trimmed, sessionId);

      addMessage({
        id: Crypto.randomUUID(),
        text: response.reply,
        sender: 'bot',
        timestamp: new Date(),
        intent: response.intent,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);

      addMessage({
        id: Crypto.randomUUID(),
        text: 'Lo siento, ha ocurrido un error. Por favor, intenta nuevamente.',
        sender: 'bot',
        timestamp: new Date(),
      });
    } finally {
      setTyping(false);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <FuturisticBackground />
      </View>

      <SafeAreaView
        style={[styles.safeArea, { paddingTop: insets.top + 8 }]}
        edges={['bottom']}
      >
        <StatusBar style="light" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[theme.palette.primary, theme.palette.primaryAlt]}
                style={styles.avatar}
              >
                <Ionicons name="chatbubbles" size={20} color="white" />
              </LinearGradient>
              <View style={[styles.onlineIndicator, { backgroundColor: theme.palette.success }]} />
            </View>

            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: theme.palette.textPrimary }]}>
                Soporte Banco Costa Rica
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.palette.textSecondary }]}>
                Asistente Virtual • En línea
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => Alert.alert('Opciones', 'Próximamente...')}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: theme.palette.danger + '20' }]}>
            <Ionicons name="warning" size={16} color={theme.palette.danger} />
            <Text style={[styles.errorText, { color: theme.palette.danger }]}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={16} color={theme.palette.danger} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.chatBody}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item.text}
                sender={item.sender}
                timestamp={item.timestamp}
                intent={item.intent}
              />
            )}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isTyping ? <TypingIndicator /> : <View style={styles.listFooterSpacer} />}
          />
        </View>

        {showQuickReplies && messages.length <= 1 && (
          <View style={styles.quickRepliesContainer}>
            <Text style={[styles.quickRepliesTitle, { color: theme.palette.textSecondary }]}>
              Sugerencias:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickReplies}
            >
              {getQuickReplies().map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickReply(reply)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
                    style={[
                      styles.quickReplyButton,
                      { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    ]}
                  >
                    <Text style={[styles.quickReplyText, { color: theme.palette.textPrimary }]}>
                      {reply}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ChatInput
          onSend={handleSendMessage}
          disabled={isTyping}
          placeholder="Escribe tu consulta..."
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
  },
  chatBody: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  quickRepliesContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  quickRepliesTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  quickReplies: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickReplyText: {
    fontSize: 14,
  },
  listFooterSpacer: {
    height: 12,
  },
});
