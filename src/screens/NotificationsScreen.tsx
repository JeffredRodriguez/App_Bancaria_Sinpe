import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import {
  useBankStore,
  NotificationItem,
  NotificationCategory,
} from "@/store/useBankStore";
import { palette } from "@/theme/colors";

const CATEGORY_META: Record<NotificationCategory, { icon: string; color: string }> = {
  transfer: {
    icon: "arrow-up-right",
    color: "#FF3B6B",
  },
  recharge: {
    icon: "cellphone",
    color: "#00F0FF",
  },
  security: {
    icon: "shield-check",
    color: "#FACC15",
  },
  general: {
    icon: "information",
    color: "#7A2BFF",
  },
};

const NotificationsScreen = () => {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const originRoute = useMemo(() => {
    if (typeof from !== "string" || from.length === 0) {
      return null;
    }
    try {
      return decodeURIComponent(from);
    } catch (error) {
      console.warn("No se pudo decodificar la ruta de origen", error);
      return from;
    }
  }, [from]);
  const {
    notifications,
    toggleNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useBankStore();

  const unreadCount = useMemo(
    () => notifications.filter((item: NotificationItem) => !item.read).length,
    [notifications],
  );

  const latestTimestamp = notifications[0]?.timestamp;

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};
    notifications.forEach((item: NotificationItem) => {
      const key = new Date(item.timestamp).toDateString();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([key, items]) => ({
        label: new Date(key).toLocaleDateString("es-CR", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        items: items.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      }));
  }, [notifications]);

  const handleToggleRead = (item: NotificationItem) => {
    toggleNotificationRead(item.id);
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllNotificationsRead();
    }
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString("es-CR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatRelative = (timestamp?: string) => {
    if (!timestamp) {
      return "Sin registros";
    }
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.round(diff / (1000 * 60));
    if (minutes < 1) {
      return "Hace instantes";
    }
    if (minutes < 60) {
      return `Hace ${minutes} min`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `Hace ${hours} h`;
    }
    const days = Math.round(hours / 24);
    return `Hace ${days} d`;
  };

  return (
    <FuturisticBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                if (originRoute) {
                  router.replace(originRoute);
                } else {
                  router.back();
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={palette.textPrimary}
                accessibilityLabel="Volver"
              />
            </Pressable>
            <Text style={styles.title}>Centro de notificaciones</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() => {
                if (originRoute) {
                  router.replace(originRoute);
                } else {
                  router.back();
                }
              }}
              accessibilityLabel="Cerrar notificaciones"
              style={styles.profileShortcut}
            />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 480 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <View>
                  <Text style={styles.summaryLabel}>Pendientes</Text>
                  <Text style={styles.summaryValue}>{unreadCount}</Text>
                  <Text style={styles.summaryHint}>
                    {formatRelative(latestTimestamp)}
                  </Text>
                </View>
                <PrimaryButton
                  label="Marcar todo leído"
                  onPress={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  style={styles.primaryAction}
                />
                <Pressable
                  onPress={handleClearAll}
                  style={styles.secondaryAction}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name="delete"
                    size={20}
                    color={palette.textSecondary}
                  />
                  <Text style={styles.secondaryLabel}>Limpiar todo</Text>
                </Pressable>
              </View>
            </GlassCard>
          </MotiView>

          {notifications.length === 0 ? (
            <GlassCard>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={42}
                  color={palette.accentCyan}
                />
                <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                <Text style={styles.emptyCopy}>
                  Cuando tengas movimientos importantes los verás aquí.
                </Text>
              </View>
            </GlassCard>
          ) : (
            groupedNotifications.map((group) => (
              <MotiView
                key={group.label}
                from={{ opacity: 0, translateY: 32 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 360 }}
              >
                <GlassCard>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{group.label}</Text>
                  </View>
                  {group.items.map((item) => {
                    const meta = CATEGORY_META[item.category];
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => handleToggleRead(item)}
                        style={styles.notificationRow}
                        accessibilityRole="button"
                        accessibilityState={{ selected: item.read }}
                      >
                        <View
                          style={[
                            styles.iconBadge,
                            { backgroundColor: `${meta.color}22` },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={meta.icon as any}
                            size={22}
                            color={meta.color}
                          />
                        </View>
                        <View style={styles.notificationCopy}>
                          <View style={styles.notificationTitleRow}>
                            <Text style={styles.notificationTitle}>{item.title}</Text>
                            {!item.read ? <View style={styles.unreadDot} /> : null}
                          </View>
                          <Text style={styles.notificationMessage}>{item.message}</Text>
                        </View>
                        <View style={styles.notificationMeta}>
                          <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
                          <Text style={styles.notificationHint}>
                            {item.read ? "Leída" : "Pendiente"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </GlassCard>
              </MotiView>
            ))
          )}
        </View>
      </ScrollView>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 160,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 40,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  profileShortcut: {
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  summaryCard: {
    gap: 16,
    padding: 20,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  summaryHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  primaryAction: {
    width: "100%",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryLabel: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
  emptyState: {
    padding: 28,
    alignItems: "center",
    gap: 16,
  },
  emptyTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyCopy: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  groupHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  groupLabel: {
    color: palette.textMuted,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationCopy: {
    flex: 1,
    marginHorizontal: 16,
    gap: 6,
  },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  notificationMessage: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  notificationMeta: {
    alignItems: "flex-end",
    gap: 6,
    minWidth: 72,
  },
  notificationTime: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  notificationHint: {
    color: palette.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.accentCyan,
  },
});

export default NotificationsScreen;
