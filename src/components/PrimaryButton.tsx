import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { ReactNode, useMemo } from "react";
import {
  Pressable,
  PressableStateCallbackType,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { Theme, useTheme } from "@/theme/ThemeProvider";

export type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessoryRight?: ReactNode;
  variant?: "solid" | "ghost";
  compact?: boolean;
};

const PrimaryButton = ({
  label,
  onPress,
  disabled,
  loading,
  style,
  accessoryRight,
  variant = "solid",
  compact = false,
}: PrimaryButtonProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const gradientColors =
    variant === "ghost"
      ? theme.components.button.ghostGradient
      : theme.components.button.primaryGradient;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, style]}
    >
      {(state: PressableStateCallbackType) => (
        <MotiView
          animate={{
            scale: state.pressed ? 0.98 : 1,
            opacity: disabled ? 0.6 : 1,
          }}
          transition={{ type: "timing", duration: 160 }}
          style={styles.motiWrapper}
        >
          <MotiView
            pointerEvents="none"
            style={styles.glow}
            from={{ opacity: 0.35, scale: 0.92 }}
            animate={{
              opacity: state.pressed ? 0.45 : 0.65,
              scale: state.pressed ? 0.96 : 1.08,
            }}
            transition={{ type: "timing", duration: 320 }}
          />
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              compact ? styles.gradientCompact : styles.gradient,
              variant === "ghost" && styles.gradientGhost,
              disabled ? styles.gradientDisabled : null,
            ]}
          >
            {variant === "solid" ? (
              <MotiView
                pointerEvents="none"
                style={styles.highlight}
                from={{ translateX: -40, opacity: 0.15 }}
                animate={{
                  translateX: state.pressed ? 10 : 40,
                  opacity: state.pressed ? 0.25 : 0.35,
                }}
                transition={{ type: "timing", duration: 520 }}
              />
            ) : null}
            <Text
              style={[
                compact ? styles.labelCompact : styles.label,
                variant === "ghost" && styles.labelGhost,
                disabled && variant === "ghost" && styles.labelGhostDisabled,
              ]}
            >
              {loading ? "Procesando…" : label}
            </Text>
            {accessoryRight}
          </LinearGradient>
        </MotiView>
      )}
    </Pressable>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      borderRadius: theme.radii.full,
      overflow: "hidden",
    },
    motiWrapper: {
      borderRadius: theme.radii.full,
      position: "relative",
    },
    gradient: {
      borderRadius: theme.radii.full,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 12,
    },
    gradientCompact: {
      borderRadius: theme.radii.full,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    gradientGhost: {
      backgroundColor: "rgba(0,0,0,0)",
    },
    gradientDisabled: {
      opacity: 0.85,
    },
    glow: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: theme.radii.full,
      backgroundColor: theme.components.button.primaryGlow,
    },
    highlight: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: "40%",
      backgroundColor: theme.components.button.primaryHighlight,
      borderTopLeftRadius: theme.radii.full,
      borderBottomLeftRadius: theme.radii.full,
    },
    label: {
      color: theme.components.button.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    labelCompact: {
      color: theme.components.button.textPrimary,
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.1,
    },
    labelGhost: {
      color: theme.components.button.textGhost,
    },
    labelGhostDisabled: {
      color: theme.components.button.textGhostDisabled,
    },
  });

export default PrimaryButton;
