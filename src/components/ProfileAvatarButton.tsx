import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useBankStore } from "@/store/useBankStore";
import { Theme, useTheme } from "@/theme/ThemeProvider";

type ProfileAvatarButtonProps = {
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  initials?: string;
};

const ProfileAvatarButton = ({
  onPress,
  size = 52,
  style,
  accessibilityLabel = "Abrir notificaciones",
}: ProfileAvatarButtonProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const gradients = useMemo(
    () => ({
      outer: [
        theme.components.button.primaryGradient[0],
        theme.components.button.primaryGradient[1],
        theme.palette.softPink,
      ] as const,
      inner: [theme.palette.surface, theme.palette.elevatedSurface] as const,
      gloss: [theme.components.button.primaryGlow, "transparent"] as const,
    }),
    [theme],
  );
  const { notifications } = useBankStore();
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  const showBadge = unreadCount > 0;

  const radius = size / 2;
  const ringThickness = Math.max(2, size * 0.12);
  const innerDiameter = Math.max(size - ringThickness * 2, size * 0.5);
  const innerRadius = innerDiameter / 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: radius,
          aspectRatio: 1,
          shadowRadius: size * 0.45,
          shadowOffset: { width: 0, height: size * 0.28 },
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
        style,
      ]}
    >
      {showBadge ? (
        <View
          pointerEvents="none"
          style={[
            styles.badge,
            {
              minWidth: Math.max(18, size * 0.34),
              height: Math.max(18, size * 0.34),
              borderRadius: Math.max(9, size * 0.17),
              top: Math.max(-4, -size * 0.1),
              right: Math.max(-2, -size * 0.08),
              paddingHorizontal: Math.max(4, size * 0.08),
            },
          ]}
        >
          <Text style={styles.badgeLabel}>{badgeLabel}</Text>
        </View>
      ) : null}
      <LinearGradient
        colors={gradients.outer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radius, padding: ringThickness }]}
      >
        <LinearGradient
          colors={gradients.inner}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[
            styles.innerGradient,
            {
              width: innerDiameter,
              height: innerDiameter,
              borderRadius: innerRadius,
            },
          ]}
        >
          <LinearGradient
            colors={gradients.gloss}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 0.9 }}
            style={[styles.gloss, { borderRadius: innerRadius }]}
          />
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={Math.round(innerDiameter * 0.56)}
              color={theme.components.icon.primary}
            />
          </View>
        </LinearGradient>
      </LinearGradient>
    </Pressable>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.components.button.primaryGlow,
      elevation: 8,
      backgroundColor: "transparent",
      position: "relative",
    },
    gradient: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    innerGradient: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.palette.border,
      overflow: "hidden",
    },
    gloss: {
      ...StyleSheet.absoluteFillObject,
    },
    initials: {
      color: theme.palette.textPrimary,
      fontWeight: "800",
      letterSpacing: 1,
    },
    iconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      zIndex: 2,
      backgroundColor: theme.palette.textPrimary,
      borderWidth: 1,
      borderColor: theme.palette.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.components.card.shadowColor,
      shadowOpacity: 0.3,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
    },
    badgeLabel: {
      color: theme.palette.primary,
      fontSize: 11,
      fontWeight: "700",
    },
  });

export default ProfileAvatarButton;
