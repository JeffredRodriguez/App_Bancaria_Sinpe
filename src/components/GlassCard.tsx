import { MotiView } from "moti";
import { PropsWithChildren, useMemo } from "react";
import { StyleSheet, View, StyleProp, ViewStyle } from "react-native";

import { Theme, useTheme } from "@/theme/ThemeProvider";

export type GlassCardProps = PropsWithChildren<{
  intensity?: number;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

const GlassCard = ({
  children,
  intensity = 30,
  padding = 20,
  style,
  contentStyle,
}: GlassCardProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const glowOpacity = Math.min(intensity / 100, 0.45);
  return (
    <MotiView
      style={[styles.wrapper, { shadowOpacity: glowOpacity, elevation: 6 + glowOpacity * 8 }, style]}
      from={{ opacity: 0, translateY: 18, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "timing", duration: 320 }}
    >
      <View style={styles.card}>
        <View
          pointerEvents="none"
          style={[styles.veil, { opacity: Math.min(0.3, 0.12 + intensity / 240) }]}
        />
        <View style={[styles.content, { padding }, contentStyle]}>{children}</View>
      </View>
    </MotiView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      borderRadius: theme.radii.xl,
      overflow: "hidden",
      borderWidth: theme.components.card.borderWidth,
      borderColor: theme.components.card.border,
      backgroundColor: theme.components.card.background,
      shadowColor: theme.components.card.shadowColor,
      shadowOffset: { width: 0, height: 24 },
      shadowRadius: 36,
    },
    card: {
      borderRadius: theme.radii.xl,
      overflow: "hidden",
      backgroundColor: theme.components.card.background,
    },
    veil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.components.card.overlay,
    },
    content: {
      borderRadius: theme.radii.lg,
    },
  });

export default GlassCard;
