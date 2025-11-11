import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

type ChatBubbleProps = {
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  intent?: string;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  sender,
  timestamp,
  intent,
}) => {
  const { theme } = useTheme();
  const isUser = sender === 'user';

  const bubbleColors: [string, string] = isUser
    ? [theme.palette.primary, theme.palette.primary + 'CC']
    : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300 }}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.botContainer,
      ]}
    >
      <LinearGradient
        colors={bubbleColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.botBubble,
          {
            borderColor: isUser
              ? theme.palette.primary + '40'
              : 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      >
        <Text
          style={[
            styles.message,
            { color: theme.palette.textPrimary },
          ]}
        >
          {message}
        </Text>
        
        <View style={styles.footer}>
          <Text style={[styles.time, { color: theme.palette.textSecondary }]}>
            {formatTime(timestamp)}
          </Text>
          
          {!isUser && intent && __DEV__ && (
            <Text style={[styles.intent, { color: theme.palette.primary }]}>
              {intent}
            </Text>
          )}
        </View>
      </LinearGradient>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  botContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  botBubble: {
    borderTopLeftRadius: 4,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  time: {
    fontSize: 11,
    opacity: 0.7,
  },
  intent: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.6,
  },
});
