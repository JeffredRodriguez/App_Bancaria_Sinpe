import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../theme/ThemeProvider';

export const TypingIndicator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: 16 }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      >
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <MotiView
              key={index}
              from={{ opacity: 0.3, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'timing',
                duration: 600,
                delay: index * 200,
                loop: true,
              }}
              style={[
                styles.dot,
                { backgroundColor: theme.palette.primary },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
