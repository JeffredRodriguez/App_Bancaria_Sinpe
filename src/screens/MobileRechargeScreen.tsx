import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { RechargeRecord, useBankStore } from "@/store/useBankStore";
import { palette, themes } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
import { formatAmountDisplay, parseAmountToNumber, sanitizeAmountInput } from "@/utils/amount";
import { formatPhoneNumber, sanitizePhoneInput, PHONE_REQUIRED_LENGTH } from "@/utils/phone";

const OPERATORS = [
  {
    id: "kolbi",
    label: "Kolbi",
    accent: "#00ff1eff",
    logo: require("../../assets/logo_kolbi.png"),
  },
  {
    id: "claro",
    label: "Claro",
    accent: "#ff132eff",
    logo: require("../../assets/logo_claro.png"),
  },
  {
    id: "liberty",
    label: "Liberty",
    accent: "#3da1ffff",
    logo: require("../../assets/logo_liberty.png"),
  },
] as const;

const cardTokens = themes.pionero.components.card;
const bankLogo = require("../../assets/bancocostarica.png");

const MobileRechargeScreen = () => {
  const router = useRouter();
  const { balance, makeRecharge } = useBankStore();

  const [operator, setOperator] =
    useState<(typeof OPERATORS)[number]["id"]>("claro");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successRecord, setSuccessRecord] = useState<RechargeRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const formattedPhone = useMemo(() => formatPhoneNumber(phoneRaw), [phoneRaw]);
  const formattedAmount = useMemo(() => formatAmountDisplay(amountRaw), [amountRaw]);

  const handlePhoneChange = (value: string) => {
    setError(null);
    setPhoneRaw(sanitizePhoneInput(value));
  };

  const handleAmountChange = (value: string) => {
    setError(null);
    setAmountRaw(sanitizeAmountInput(value));
  };

  const handleSubmit = () => {
    setError(null);
    setSuccessRecord(null);
    const parsedAmount = parseAmountToNumber(amountRaw);
    if (!phoneRaw || phoneRaw.length < PHONE_REQUIRED_LENGTH) {
      setError("Ingresa un número válido.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser mayor a cero.");
      return;
    }
    if (parsedAmount > balance) {
      setError("Saldo insuficiente para completar la recarga.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        const displayPhone = formattedPhone || phoneRaw;
        const record = makeRecharge({
          provider: operator,
          phone: displayPhone,
          amount: parsedAmount,
        });
        setSuccessRecord(record);
        setModalVisible(true);
        setPhoneRaw("");
        setAmountRaw("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo ejecutar la recarga.",
        );
      } finally {
        setLoading(false);
      }
    }, 600);
  };

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
            transition={{ type: "timing", duration: 480 }}
          >
          <View style={styles.header}>
            <Pressable 
              onPress={() => router.push("/(app)/home")}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <View style={styles.logoBadge}>
                <Image
                  source={bankLogo}
                  style={styles.logoImage}
                  resizeMode="contain"
                  accessible
                  accessibilityLabel="Logo Banco de Costa Rica"
                />
              </View>
            </Pressable>
            <Text style={styles.title}>Recarga móvil</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() =>
                router.push({
                  pathname: "/(app)/notifications",
                  params: {
                    from: "/(app)/mobile-recharge",
                  },
                })
              }
              accessibilityLabel="Ver notificaciones"
              style={styles.profileShortcut}
            />
          </View>

          <GlassCard>
            <View style={styles.operatorSection}>
              <Text style={styles.sectionTitle}>Selecciona tu operador</Text>
              <View style={styles.operatorRow}>
                {OPERATORS.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setOperator(item.id)}
                    style={styles.operatorButton}
                  >
                    {(state: PressableStateCallbackType) => (
                      <MotiView
                        animate={{
                          scale: state.pressed ? 0.94 : 1,
                          borderColor:
                            operator === item.id
                              ? `${item.accent}`
                              : cardTokens.border,
                          shadowOpacity: operator === item.id ? 0.45 : 0,
                          backgroundColor:
                            operator === item.id
                              ? "rgba(255,255,255,0.12)"
                              : cardTokens.background,
                        }}
                        transition={{ type: "timing", duration: 160 }}
                        style={[
                          styles.operatorCard,
                          { shadowColor: item.accent },
                        ]}
                      >
                        <View
                          style={[
                            styles.operatorIconWrapper,
                            {
                              borderColor:
                                operator === item.id
                                  ? `${item.accent}55`
                                  : cardTokens.border,
                              backgroundColor:
                                operator === item.id
                                  ? "rgba(255,255,255,0.08)"
                                  : cardTokens.overlay,
                            },
                          ]}
                        >
                          <Image
                            source={item.logo}
                            style={styles.operatorLogo}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={styles.operatorLabel}>{item.label}</Text>
                      </MotiView>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </GlassCard>

          <MotiView
            style={styles.form}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 120 }}
          >
            <NeonTextField
              label="Número a recargar"
              placeholder="0000-0000"
              value={formattedPhone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              allowOnlyNumeric
              icon={
                <MaterialCommunityIcons
                  name="cellphone"
                  size={20}
                  color={palette.accentCyan}
                />
              }
            />
            <NeonTextField
              label="Monto"
              placeholder="₡5,000"
              value={formattedAmount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              allowOnlyNumeric
              icon={
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={20}
                  color={palette.accentCyan}
                />
              }
              helpText={`Saldo disponible: ${formatCurrency(balance)}`}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label="Realizar recarga"
              onPress={handleSubmit}
              loading={loading}
            />
          </MotiView>
          </MotiView>
        </ScrollView>
      </View>
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={38}
                color={palette.accentCyan}
              />
              <Text style={styles.modalTitle}>Recarga completada</Text>
              <Text style={styles.modalSubtitle}>
                Tu saldo se acreditó correctamente.
              </Text>
            </View>
            {successRecord ? (
              <View style={styles.modalDetails}>
                <DetailRow
                  label="Operador"
                  value={
                    OPERATORS.find((item) => item.id === successRecord.provider)?.label ??
                    successRecord.provider
                  }
                />
                <DetailRow label="Número" value={successRecord.phone} />
                <DetailRow
                  label="Monto"
                  value={formatCurrency(successRecord.amount)}
                />
                <DetailRow
                  label="Fecha"
                  value={new Date(successRecord.createdAt).toLocaleString()}
                />
              </View>
            ) : null}
            <PrimaryButton
              label="Entendido"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </FuturisticBackground>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    paddingBottom: 260,
  },
  container: {
    paddingTop: 32,
    paddingHorizontal: 20,
    gap: 32,
  },
  header: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    borderRadius: 26,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
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
  profileShortcut: {
    shadowOpacity: 0.25,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  operatorSection: {
    gap: 16,
    padding: 20,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  operatorRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  operatorButton: {
    flexBasis: "31%",
    maxWidth: 100,
    flexGrow: 0,
  },
  operatorCard: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
    backgroundColor: cardTokens.background,
    borderColor: cardTokens.border,
    shadowColor: cardTokens.shadowColor,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
  },
  operatorIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: cardTokens.border,
  },
  operatorLabel: {
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.15,
    textAlign: "center",
  },
  operatorLogo: {
    width: 24,
    height: 24,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 8, 16, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 26,
    padding: 24,
    gap: 20,
    backgroundColor: cardTokens.background,
    borderWidth: cardTokens.borderWidth,
    borderColor: cardTokens.border,
    shadowColor: cardTokens.shadowColor,
  },
  modalHeader: {
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  modalDetails: {
    gap: 12,
    borderRadius: 18,
    padding: 16,
    backgroundColor: cardTokens.overlay,
    borderWidth: cardTokens.borderWidth,
    borderColor: cardTokens.border,
  },
  modalButton: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  form: {
    gap: 18,
  },
  error: {
    color: palette.danger,
    textAlign: "center",
  },
});

export default MobileRechargeScreen;
