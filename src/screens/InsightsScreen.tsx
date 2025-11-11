import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useBankStore, TransferRecord, RechargeRecord } from "@/store/useBankStore";
import { useGoalsStore } from "@/store/useGoalsStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const MOCK_ACTIONS = [
  {
    id: "auto-topup",
    title: "Activa recargas automáticas",
    description: "Recarga tu línea cuando llegue a ₡2,000 para evitar sorpresas.",
    icon: "cellphone-check",
    accent: "#00F0FF",
  },
  {
    id: "goal-roundups",
    title: "Activa redondeos para metas",
    description: "Envía el vuelto de cada transferencia a tu meta de emergencia.",
    icon: "target-variant",
    accent: "#4ADE80",
  },
  {
    id: "alerts-threshold",
    title: "Alerta por presupuesto",
    description: "Recibe una notificación cuando superes ₡150,000 en el mes.",
    icon: "bell-alert",
    accent: "#FACC15",
  },
];

const InsightsScreen = () => {
  const router = useRouter();
  const { transfers, recharges } = useBankStore();
  const { goals } = useGoalsStore();

  const totalTransfers = useMemo(
    () => transfers.reduce((acc, item: TransferRecord) => acc + item.amount, 0),
    [transfers],
  );
  const totalRecharges = useMemo(
    () => recharges.reduce((acc, item: RechargeRecord) => acc + item.amount, 0),
    [recharges],
  );
  const combinedOutflow = totalTransfers + totalRecharges;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthTransfers = useMemo(
    () =>
      transfers.filter((item: TransferRecord) => {
        const date = new Date(item.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }),
    [transfers, currentMonth, currentYear],
  );

  const monthRecharges = useMemo(
    () =>
      recharges.filter((item: RechargeRecord) => {
        const date = new Date(item.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }),
    [recharges, currentMonth, currentYear],
  );

  const monthTotal = useMemo(
    () =>
      monthTransfers.reduce((acc, item) => acc + item.amount, 0) +
      monthRecharges.reduce((acc, item) => acc + item.amount, 0),
    [monthTransfers, monthRecharges],
  );

  const averageTransfer = transfers.length ? totalTransfers / transfers.length : 0;
  const averageRecharge = recharges.length ? totalRecharges / recharges.length : 0;

  const topRecipients = useMemo(() => {
    const result = new Map<string, { amount: number; phone: string }>();
    transfers.forEach((item: TransferRecord) => {
      const key = item.contactName || item.phone;
      const entry = result.get(key) || { amount: 0, phone: item.phone };
      entry.amount += item.amount;
      result.set(key, entry);
    });
    return Array.from(result.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [transfers]);

  const rechargeBreakdown = useMemo(() => {
    const result = new Map<string, number>();
    recharges.forEach((item: RechargeRecord) => {
      const key = item.provider;
      const entry = result.get(key) || 0;
      result.set(key, entry + item.amount);
    });
    return Array.from(result.entries())
      .map(([provider, amount]) => ({ provider, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [recharges]);

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active"),
    [goals],
  );

  const goalsProgress = useMemo(() => {
    if (activeGoals.length === 0) {
      return 0;
    }
    const ratio =
      activeGoals.reduce((acc, goal) => acc + goal.currentAmount / goal.targetAmount, 0) /
      activeGoals.length;
    return Math.round(ratio * 100);
  }, [activeGoals]);

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
              onPress={() => router.push("/(app)/home")}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={26}
                color={palette.textPrimary}
              />
            </Pressable>
            <Text style={styles.title}>Insights financieros</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() =>
                router.push({
                  pathname: "/(app)/notifications",
                  params: {
                    from: "/(app)/insights",
                  },
                })
              }
              accessibilityLabel="Ver notificaciones"
              style={styles.profileShortcut}
            />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 460 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Salida acumulada</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(combinedOutflow)}</Text>
                  <Text style={styles.summaryHint}>Incluye transferencias y recargas.</Text>
                </View>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Promedio envío</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(averageTransfer || 0)}</Text>
                  <Text style={styles.summaryHint}>
                    {transfers.length} transferencias registradas.
                  </Text>
                </View>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Mes en curso</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(monthTotal)}</Text>
                  <Text style={styles.summaryHint}>Gasto en Octubre.</Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 80 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Destinatarios frecuentes</Text>
                <Text style={styles.sectionHint}>
                  Prioriza contactos para accesos rápidos.
                </Text>
              </View>
              {topRecipients.length === 0 ? (
                <Text style={styles.emptyCopy}>Aún no hay envíos registrados.</Text>
              ) : (
                topRecipients.map((item) => (
                  <View key={item.name} style={styles.rowItem}>
                    <View style={styles.rowIcon}>
                      <MaterialCommunityIcons
                        name="account"
                        size={22}
                        color={palette.textPrimary}
                      />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{item.name}</Text>
                      <Text style={styles.rowSubtitle}>{item.phone}</Text>
                    </View>
                    <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))
              )}
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 120 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Metas activas</Text>
                <Text style={styles.sectionHint}>
                  Avanza {goalsProgress}% en promedio.
                </Text>
              </View>
              {activeGoals.length === 0 ? (
                <Text style={styles.emptyCopy}>
                  Crea una meta para comenzar a visualizar tu progreso.
                </Text>
              ) : (
                activeGoals.slice(0, 3).map((goal) => {
                  const percent = goal.targetAmount
                    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                    : 0;
                  return (
                    <View key={goal.id} style={styles.goalRow}>
                      <View
                        style={[styles.goalIndicator, { backgroundColor: `${goal.color}33` }]}
                      >
                        <View
                          style={[styles.goalIndicatorFill, { width: `${percent}%`, backgroundColor: goal.color }]}
                        />
                      </View>
                      <View style={styles.goalCopy}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <Text style={styles.goalSubtitle}>
                          {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                        </Text>
                      </View>
                      <Text style={styles.goalPercent}>{percent}%</Text>
                    </View>
                  );
                })
              )}
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 160 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Servicios recargados</Text>
                <Text style={styles.sectionHint}>Controla los montos por operador.</Text>
              </View>
              {rechargeBreakdown.length === 0 ? (
                <Text style={styles.emptyCopy}>No hay recargas registradas.</Text>
              ) : (
                rechargeBreakdown.map((item) => (
                  <View key={item.provider} style={styles.rowItem}>
                    <View style={styles.rowIconAlt}>
                      <MaterialCommunityIcons
                        name="flash"
                        size={20}
                        color={palette.accentCyan}
                      />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{item.provider}</Text>
                      <Text style={styles.rowSubtitle}>Recargas totales</Text>
                    </View>
                    <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))
              )}
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 200 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Acciones sugeridas</Text>
                <Text style={styles.sectionHint}>
                  Configuraciones rápidas para automatizar tu flujo.
                </Text>
              </View>
              {MOCK_ACTIONS.map((action) => (
                <Pressable
                  key={action.id}
                  style={styles.actionRow}
                  accessibilityRole="button"
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${action.accent}33` }]}
                  >
                    <MaterialCommunityIcons
                      name={action.icon as any}
                      size={22}
                      color={action.accent}
                    />
                  </View>
                  <View style={styles.actionCopy}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={palette.textSecondary}
                  />
                </Pressable>
              ))}
              <PrimaryButton
                label="Crear automatización"
                onPress={() => router.push("/(app)/automations")}
                style={styles.actionButton}
              />
            </GlassCard>
          </MotiView>
        </View>
      </ScrollView>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 180,
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
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    padding: 24,
  },
  summaryColumn: {
    minWidth: "48%",
    gap: 6,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  summaryHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  sectionHeader: {
    gap: 6,
    paddingHorizontal: 6,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionHint: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  emptyCopy: {
    color: palette.textSecondary,
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconAlt: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(0,240,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    marginLeft: 12,
  },
  rowTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  rowAmount: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  goalIndicator: {
    flex: 1,
    height: 10,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  goalIndicatorFill: {
    height: "100%",
    borderRadius: 8,
  },
  goalCopy: {
    flex: 2,
    gap: 2,
  },
  goalTitle: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  goalSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  goalPercent: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  actionDescription: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  actionButton: {
    marginTop: 18,
  },
});

export default InsightsScreen;
