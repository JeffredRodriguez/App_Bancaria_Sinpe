import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { Theme, useTheme } from "@/theme/ThemeProvider";
import { formatCurrency } from "@/utils/currency";

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

const ConfirmTransferScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = theme.palette;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const params = useLocalSearchParams<{
    contactName?: string;
    phone?: string;
    amount?: string;
    note?: string;
  }>();
  const { sendTransfer } = useBankStore();

  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNumber = useMemo(
    () => Number(params.amount || 0),
    [params.amount],
  );

  useEffect(() => {
    if (!params.contactName || !params.phone || !params.amount) {
      router.replace("/(app)/transfer");
    }
  }, [params.contactName, params.phone, params.amount, router]);

  const handleConfirm = () => {
    if (!params.contactName || !params.phone) {
      return;
    }
    setProcessing(true);
    setError(null);
    setTimeout(() => {
      try {
        sendTransfer({
          contactName: params.contactName || "Contacto",
          phone: params.phone || "",
          amount: amountNumber,
          note: params.note || undefined,
        });
        setCompleted(true);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo completar la transferencia.",
        );
      } finally {
        setProcessing(false);
      }
    }, 600);
  };

  const handleFinish = () => {
    router.replace("/(app)/home");
  };

  const handleViewHistory = () => {
    router.replace("/(app)/history");
  };

  const summaryItems = useMemo(
    () => [
      {
        label: "Destinatario",
        value: params.contactName,
        icon: "account-circle-outline",
      },
      { label: "Número telefónico", value: params.phone, icon: "cellphone" },
      {
        label: "Nota",
        value: params.note || "Sin detalles",
        icon: "note-text-outline",
      },
    ],
    [params.contactName, params.phone, params.note],
  );

  const successGradient = useMemo(
    () =>
      [
        withOpacity(palette.primary, 0.85),
        withOpacity(palette.primaryAlt, 0.45),
      ] as const,
    [palette.primary, palette.primaryAlt],
  );

  return (
    <FuturisticBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          style={styles.container}
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 480 }}
        >
          <View style={styles.header}>
              <Pressable
                onPress={() => router.push("/(app)/home")}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                style={styles.backButton}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={palette.textPrimary}
                />
              </Pressable>
            <Text style={styles.headerTitle}>Confirmar envío</Text>
            <View style={styles.headerSpacer} />
          </View>

          {!completed ? (
            <>
              <Text style={styles.title}>Confirma la transferencia</Text>
              <Text style={styles.subtitle}>
                Revisa los datos antes de enviar.
              </Text>
              <GlassCard
                intensity={45}
                padding={24}
                style={styles.amountCard}
                contentStyle={styles.amountContent}
              >
                <Text style={styles.amountLabel}>Monto a enviar</Text>
                <Text style={styles.amountValue}>
                  {formatCurrency(amountNumber)}
                </Text>
              </GlassCard>

              <GlassCard>
                <View style={styles.summary}>
                  {summaryItems.map((item) => (
                    <View key={item.label} style={styles.summaryRow}>
                      <View style={styles.summaryIcon}>
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={palette.textPrimary}
                        />
                      </View>
                      <View style={styles.summaryCopy}>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={styles.summaryValue}>{item.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </GlassCard>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <PrimaryButton
                label="Confirmar y enviar"
                onPress={handleConfirm}
                loading={processing}
              />
              <Text style={styles.helper}>
                Antes de confirmar, asegúrate de que los datos sean correctos.
              </Text>
            </>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 12, mass: 0.8 }}
              style={styles.successState}
            >
              <LinearGradient colors={successGradient} style={styles.successBadge}>
                <MaterialCommunityIcons
                  name="check"
                  size={42}
                  color={palette.textPrimary}
                />
              </LinearGradient>
              <Text style={styles.successTitle}>Transferencia completada</Text>
              <Text style={styles.successCopy}>
                Enviamos {formatCurrency(amountNumber)} a {params.contactName}.
                Puedes ver el registro en tu historial local.
              </Text>
              <View style={styles.successActions}>
                <PrimaryButton
                  label="Volver al inicio"
                  onPress={handleFinish}
                  style={styles.successButton}
                />
                <PrimaryButton
                  label="Ver historial"
                  onPress={handleViewHistory}
                  variant="ghost"
                  style={styles.successButton}
                />
              </View>
            </MotiView>
          )}
        </MotiView>
      </ScrollView>
    </FuturisticBackground>
  );
};

const createStyles = (theme: Theme) => {
  const { palette } = theme;
  return StyleSheet.create({
    scroll: {
      paddingBottom: 120,
    },
    container: {
      paddingTop: 64,
      paddingHorizontal: 24,
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
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    headerTitle: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    title: {
      color: palette.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    subtitle: {
      color: palette.textSecondary,
      fontSize: 15,
    },
    amountCard: {
      borderRadius: 32,
    },
    amountContent: {
      gap: 10,
    },
    amountLabel: {
      color: palette.textMuted,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    amountValue: {
      color: palette.textPrimary,
      fontSize: 36,
      fontWeight: "800",
    },
    summary: {
      gap: 16,
      padding: 20,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: 16,
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      alignItems: "center",
      justifyContent: "center",
    },
    summaryCopy: {
      flex: 1,
    },
    summaryLabel: {
      color: palette.textMuted,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    summaryValue: {
      color: palette.textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    error: {
      color: palette.danger,
      textAlign: "center",
    },
    helper: {
      color: palette.textMuted,
      textAlign: "center",
      fontSize: 12,
    },
    successState: {
      alignItems: "center",
      gap: 24,
      marginTop: 80,
    },
    successBadge: {
      width: 96,
      height: 96,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: withOpacity(palette.primaryAlt, 0.35),
    },
    successTitle: {
      color: palette.textPrimary,
      fontSize: 26,
      fontWeight: "800",
      textAlign: "center",
    },
    successCopy: {
      color: palette.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    successActions: {
      width: "100%",
      gap: 12,
    },
    successButton: {
      width: "100%",
    },
  });
};

export default ConfirmTransferScreen;
