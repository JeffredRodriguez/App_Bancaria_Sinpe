import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { Theme, useTheme } from "@/theme/ThemeProvider";
import { formatCurrency } from "@/utils/currency";
import {
  Envelope,
  RechargeRecord,
  TransferRecord,
  useBankStore,
} from "@/store/useBankStore";
import { useChatStore } from "@/store/useChatStore";

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string;
  icon: string;
  color: string;
};

const withOpacity = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    if (hex.length === 6) {
      const value = Number.parseInt(hex, 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  const rgbaMatch = color.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbaMatch) {
    const parts = rgbaMatch[1].split(",").map((part) => part.trim());
    const [r = "0", g = "0", b = "0"] = parts;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

const bankLogo = require("../../assets/bancocostarica.png");

const AccountBalanceScreen = () => {
  const router = useRouter();
  const { theme, themeName } = useTheme();
  const palette = theme.palette;
  const usesBrightVariant = themeName === "pionero" || themeName === "aurora";
  const styles = useMemo(() => createStyles(theme, usesBrightVariant), [theme, usesBrightVariant]);
  const { user, balance, transfers, recharges, envelopes, automations } =
    useBankStore();

  const envelopeById = useMemo(() => {
    const map: Record<string, Envelope> = {};
    envelopes.forEach((item: Envelope) => {
      map[item.id] = item;
    });
    return map;
  }, [envelopes]);

  const totalEnvelopeBalance = useMemo(
    () =>
      envelopes.reduce((accumulator: number, item: Envelope) => {
        return accumulator + item.balance;
      }, 0),
    [envelopes],
  );

  const availableBalance = useMemo(
    () => balance - totalEnvelopeBalance,
    [balance, totalEnvelopeBalance],
  );

  const activeAutomations = useMemo(
    () => automations.filter((rule) => rule.active).length,
    [automations],
  );

  const topEnvelopes = useMemo(() => {
    return [...envelopes]
      .sort((a: Envelope, b: Envelope) => b.balance - a.balance)
      .slice(0, 3);
  }, [envelopes]);

  const supportAssistantEnabled = useChatStore(
    (state) => state.supportAssistantEnabled,
  );

  const timeline = useMemo<ActivityItem[]>(() => {
    const transfersMapped = transfers.map((item: TransferRecord) => {
      const isInbound = item.direction === "inbound";
      const contactLabel = item.contactName || item.phone;
      const linkedEnvelope = item.linkedEnvelopeId
        ? envelopeById[item.linkedEnvelopeId]
        : undefined;
      const detailParts = [item.phone];
      if (item.note) {
        detailParts.push(item.note);
      }
      if (linkedEnvelope) {
        detailParts.push(`Automatizado a ${linkedEnvelope.name}`);
      }
      return {
        id: item.id,
        title: isInbound
          ? `Transferencia de ${contactLabel}`
          : `Transferencia a ${contactLabel}`,
        subtitle: detailParts.filter(Boolean).join(" • "),
        amount: isInbound ? item.amount : -item.amount,
        timestamp: item.createdAt,
        icon: isInbound ? "arrow-down-left" : "arrow-up-right",
        color: isInbound ? palette.success : palette.danger,
      };
    });
    const rechargesMapped = recharges.map((item: RechargeRecord) => ({
      id: item.id,
      title: `Recarga ${item.provider}`,
      subtitle: item.phone,
      amount: -item.amount,
      timestamp: item.createdAt,
      icon: "cellphone",
      color: palette.danger,
    }));

    return [...transfersMapped, ...rechargesMapped].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [transfers, recharges, envelopeById, palette]);

  return (
    <FuturisticBackground>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <MotiView
            style={styles.container}
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 520 }}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.logoBadge}>
                  <Image
                    source={bankLogo}
                    style={styles.logoImage}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel="Logo Banco de Costa Rica"
                  />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={styles.caption}>Banco Costa Rica</Text>
                  <Text style={styles.title}>Hola, {user.name.split(" ")[0]}</Text>
                </View>
              </View>
              <ProfileAvatarButton
                size={40}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/notifications",
                    params: {
                      from: "/(app)/home",
                    },
                  })
                }
                accessibilityLabel="Ver notificaciones"
              />
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 18, scale: 0.95 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              transition={{ type: "timing", duration: 480 }}
            >
              <View style={styles.balanceCard}>
                <View style={styles.balanceVeil} />
                <Text style={styles.balanceLabel}>Saldo disponible</Text>
                <Text style={styles.balanceValue}>{formatCurrency(availableBalance)}</Text>
                <Text style={styles.balanceHint}>
                  Actualizado hace 1 min{totalEnvelopeBalance > 0 ? ` · ${formatCurrency(totalEnvelopeBalance)} en sobres` : ''}
                </Text>
                <View style={styles.balanceActions}>
                  <PrimaryButton
                    label="Enviar dinero ahora"
                    onPress={() => router.push("/(app)/transfer")}
                  />
                </View>
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 420, delay: 60 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyTitleRow}>
                    <Text style={styles.sectionTitle}>Actividad reciente</Text>
                    <MaterialCommunityIcons
                      name="clock-time-eight-outline"
                      size={20}
                      color={usesBrightVariant ? "#FFFFFF" : palette.textSecondary}
                    />
                  </View>
                  <Pressable
                    onPress={() => router.push("/(app)/history")}
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyLink}>Ver todo</Text>
                  </Pressable>
                </View>
                {timeline.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons
                      name="tray"
                      size={42}
                      color={usesBrightVariant ? "#FFFFFF" : palette.accentCyan}
                    />
                    <Text style={styles.emptyTitle}>Sin movimientos aún</Text>
                    <Text style={styles.emptyCopy}>
                      Envía dinero o realiza una recarga para ver el detalle aquí.
                    </Text>
                  </View>
                ) : (
                  timeline.slice(0, 6).map((item: ActivityItem) => (
                    <View key={item.id} style={styles.historyItem}>
                      <View style={styles.historyIconWrapper}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={usesBrightVariant ? "#FFFFFF" : item.color}
                        />
                      </View>
                      <View style={styles.historyCopy}>
                        <Text style={styles.historyTitle}>{item.title}</Text>
                        <Text style={styles.historySubtitle}>{item.subtitle}</Text>
                      </View>
                      <Text
                        style={[styles.historyAmount, { color: item.color }]}
                      >
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 420, delay: 120 }}
            >
              <View style={styles.sectionCard}>
                <View style={styles.envelopeHeader}>
                  <View style={styles.envelopeHeaderCopy}>
                    <Text style={styles.sectionTitle}>Sobres inteligentes</Text>
                    <Text style={styles.envelopeHint}>
                      {envelopes.length === 0
                        ? "Organiza tus ingresos en sobres para visualizar objetivos claros."
                        : `Tienes ${envelopes.length} ${
                            envelopes.length === 1 ? "sobre" : "sobres"
                          } con ${formatCurrency(totalEnvelopeBalance)} reservados de ${formatCurrency(balance)} totales.`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push("/(app)/envelopes")}
                    accessibilityRole="button"
                  >
                    <Text style={styles.historyLink}>Administrar</Text>
                  </Pressable>
                </View>

                {envelopes.length === 0 ? (
                  <View style={styles.envelopeEmpty}>
                    <MaterialCommunityIcons
                      name="wallet-plus"
                      size={44}
                      color={palette.accentCyan}
                    />
                    <Text style={styles.envelopeEmptyTitle}>Sin sobres aún</Text>
                    <Text style={styles.envelopeEmptyCopy}>
                      Crea tu primer sobre para separar dinero en categorías como
                      renta, ahorros o emergencias.
                    </Text>
                    <PrimaryButton
                      label="Crear un sobre"
                      onPress={() => router.push("/(app)/envelopes")}
                    />
                  </View>
                ) : (
                  <>
                    <View style={styles.envelopeList}>
                      {topEnvelopes.map((envelope: Envelope) => {
                        const progress =
                          envelope.targetAmount && envelope.targetAmount > 0
                            ? Math.min(envelope.balance / envelope.targetAmount, 1)
                            : null;
                        return (
                          <Pressable
                            key={envelope.id}
                            style={styles.envelopeRow}
                            onPress={() => router.push("/(app)/envelopes")}
                            accessibilityRole="button"
                          >
                            <View
                              style={[
                                styles.envelopeMarker,
                                {
                                  backgroundColor: `${envelope.color}19`,
                                  borderColor: `${envelope.color}55`,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.envelopeDot,
                                  { backgroundColor: envelope.color },
                                ]}
                              />
                            </View>
                            <View style={styles.envelopeInfo}>
                              <Text style={styles.envelopeName}>{envelope.name}</Text>
                              <Text style={styles.envelopeMeta}>
                                {formatCurrency(envelope.balance)}
                                {envelope.targetAmount
                                  ? ` · ${Math.min(
                                      100,
                                      Math.round(
                                        (envelope.balance / envelope.targetAmount) * 100,
                                      ),
                                    )}% meta`
                                  : ""}
                              </Text>
                              {progress !== null ? (
                                <View style={styles.envelopeProgress}>
                                  <View
                                    style={[
                                      styles.envelopeProgressFill,
                                      {
                                        width: `${Math.max(4, Math.round(progress * 100))}%`,
                                        backgroundColor: envelope.color,
                                      },
                                    ]}
                                  />
                                </View>
                              ) : null}
                            </View>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={18}
                              color={palette.textSecondary}
                            />
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.envelopeFooter}>
                      <View style={styles.envelopeStat}>
                        <MaterialCommunityIcons
                          name="shield-sync"
                          size={18}
                          color={palette.accentCyan}
                        />
                        <Text style={styles.envelopeStatLabel}>
                          {activeAutomations === 0
                            ? "Sin automatizaciones activas"
                            : `${activeAutomations} ${
                                activeAutomations === 1
                                  ? "automatización activa"
                                  : "automatizaciones activas"
                              }`}
                        </Text>
                      </View>
                      <View style={styles.envelopeStat}>
                        <MaterialCommunityIcons
                          name="wallet"
                          size={18}
                          color={palette.success}
                        />
                        <Text style={styles.envelopeStatLabel}>
                          {formatCurrency(totalEnvelopeBalance)} apartados
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </MotiView>
          </MotiView>
        </ScrollView>

        {supportAssistantEnabled && (
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 800, damping: 15 }}
            style={styles.fabContainer}
          >
            <Pressable
              onPress={() => router.push("/(app)/support")}
              style={({ pressed }) => [
                styles.fab,
                pressed && styles.fabPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Abrir chat de soporte"
            >
              <MaterialCommunityIcons
                name="chat-question"
                size={24}
                color="white"
              />
            </Pressable>
          </MotiView>
        )}
      </View>
    </FuturisticBackground>
  );
};

const createStyles = (theme: Theme, usesBrightVariant: boolean) => {
  const { palette } = theme;
  const cardTokens = theme.components.card;
  return StyleSheet.create({
    screen: {
      flex: 1,
      position: "relative",
    },
    scroll: {
      paddingBottom: 220,
    },
    container: {
      paddingTop: 68,
      paddingHorizontal: 24,
      gap: 28,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      flex: 1,
    },
    headerCopy: {
      flex: 1,
      gap: 4,
    },
    logoBadge: {
      padding: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    logoImage: {
      width: 48,
      height: 48,
    },
    caption: {
      color: palette.textMuted,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      fontSize: 12,
    },
    title: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    balanceCard: {
      borderRadius: theme.radii.xl,
      padding: 28,
      overflow: "hidden",
      gap: 22,
      backgroundColor: cardTokens.background,
      borderWidth: cardTokens.borderWidth,
      borderColor: cardTokens.border,
      shadowColor: cardTokens.shadowColor,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.32,
      shadowRadius: 30,
      position: "relative",
    },
    balanceVeil: {
      position: "absolute",
      top: -60,
      right: -60,
      bottom: -60,
      left: -60,
      borderRadius: 360,
      backgroundColor: withOpacity(palette.textPrimary, 0.12),
    },
    balanceLabel: {
      color: palette.textMuted,
      fontSize: 14,
      letterSpacing: 0.8,
    },
    balanceValue: {
      color: palette.textPrimary,
      fontSize: 44,
      fontWeight: "800",
    },
    balanceHint: {
      color: palette.textSecondary,
      fontSize: 14,
    },
    balanceActions: {
      gap: 14,
    },
    sectionCard: {
      borderRadius: theme.radii.xl,
      padding: 24,
      backgroundColor: cardTokens.background,
      borderWidth: cardTokens.borderWidth,
      borderColor: cardTokens.border,
    },
    historyHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    historyTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    historyLink: {
      color: usesBrightVariant ? "#FFFFFF" : palette.accentCyan,
      fontSize: 14,
      fontWeight: "600",
      textDecorationLine: usesBrightVariant ? "underline" : "none",
      textDecorationColor: usesBrightVariant ? "#FFFFFF" : palette.accentCyan,
    },
    emptyState: {
      paddingVertical: 32,
      alignItems: "center",
      gap: 12,
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
      lineHeight: 20,
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      borderTopWidth: 1,
      borderColor: withOpacity(palette.textPrimary, 0.06),
    },
    historyIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 16,
      backgroundColor: withOpacity(palette.accentPurple, 0.18),
      alignItems: "center",
      justifyContent: "center",
    },
    historyCopy: {
      flex: 1,
      marginHorizontal: 12,
    },
    historyTitle: {
      color: palette.textPrimary,
      fontWeight: "600",
    },
    historySubtitle: {
      color: palette.textSecondary,
      fontSize: 13,
    },
    historyAmount: {
      fontWeight: "700",
    },
    envelopeHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      paddingBottom: 12,
    },
    envelopeHeaderCopy: {
      flex: 1,
      gap: 6,
    },
    envelopeHint: {
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    envelopeEmpty: {
      alignItems: "center",
      gap: 14,
      paddingVertical: 24,
    },
    envelopeEmptyTitle: {
      color: palette.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    envelopeEmptyCopy: {
      color: palette.textSecondary,
      textAlign: "center",
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: 16,
    },
    envelopeList: {
      gap: 12,
    },
    envelopeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    },
    envelopeMarker: {
      width: 46,
      height: 46,
      borderRadius: 18,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      borderColor: withOpacity(palette.textPrimary, 0.12),
      backgroundColor: withOpacity(palette.textPrimary, 0.04),
    },
    envelopeDot: {
      width: 18,
      height: 18,
      borderRadius: 8,
    },
    envelopeInfo: {
      flex: 1,
      gap: 4,
    },
    envelopeName: {
      color: palette.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    envelopeMeta: {
      color: palette.textSecondary,
      fontSize: 13,
    },
    envelopeProgress: {
      height: 6,
      borderRadius: 4,
      backgroundColor: withOpacity(palette.textPrimary, 0.08),
      overflow: "hidden",
    },
    envelopeProgressFill: {
      height: "100%",
      borderRadius: 4,
    },
    envelopeFooter: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 16,
    },
    envelopeStat: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: withOpacity(palette.textPrimary, 0.08),
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    envelopeStatLabel: {
      color: palette.textPrimary,
      fontSize: 12,
      fontWeight: "600",
    },
    fabContainer: {
      position: "absolute",
      bottom: Platform.OS === "ios" ? 173 : 153,
      right: 20,
      zIndex: 999,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: palette.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: palette.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    fabPressed: {
      transform: [{ scale: 0.95 }],
      shadowOpacity: 0.2,
    },
  });
};

export default AccountBalanceScreen;
