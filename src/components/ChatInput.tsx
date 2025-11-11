import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '../theme/ThemeProvider';

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Escribe tu mensaje...',
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
        ]}
      >
        <View style={styles.inputContainer}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                { color: theme.palette.textPrimary },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor={theme.palette.textSecondary}
              multiline
              maxLength={500}
              editable={!disabled}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>

          <MotiView
            animate={{
              scale: message.trim() ? 1 : 0.9,
              opacity: message.trim() ? 1 : 0.5,
            }}
            transition={{ type: 'timing', duration: 200 }}
          >
            <TouchableOpacity
              onPress={handleSend}
              disabled={!message.trim() || disabled}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.palette.primary, theme.palette.primary + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.sendButton,
                  (!message.trim() || disabled) && styles.sendButtonDisabled,
                ]}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color="white"
                />
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 2 : 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
