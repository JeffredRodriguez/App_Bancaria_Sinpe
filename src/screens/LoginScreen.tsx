import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import NeonSelectField from "@/components/NeonSelectField";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { Theme, useTheme } from "@/theme/ThemeProvider";
import { formatPhoneNumber, sanitizePhoneInput, PHONE_REQUIRED_LENGTH } from "@/utils/phone";

const bankLogo = require("../../assets/bancocostarica.png");

type IdFormatConfig = {
  sanitize: (input: string) => string;
  format: (raw: string) => string;
  requiredLength: number;
};

const sanitizeDigits = (value: string) => value.replace(/\D/g, "");

const sanitizeAlphanumericUpper = (value: string) =>
  value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();

const formatSegments = (raw: string, segments: number[]) => {
  let cursor = 0;
  const parts: string[] = [];
  for (const segment of segments) {
    if (cursor >= raw.length) {
      break;
    }
    const slice = raw.slice(cursor, cursor + segment);
    parts.push(slice);
    cursor += slice.length;
  }
  if (cursor < raw.length) {
    parts.push(raw.slice(cursor));
  }
  return parts.join("-");
};

const ID_FORMAT_CONFIG: Record<string, IdFormatConfig> = {
  "cedula-persona": {
    sanitize: (input) => sanitizeDigits(input).slice(0, 9),
    format: (raw) => formatSegments(raw, [1, 4, 4]),
    requiredLength: 9,
  },
  "cedula-juridica": {
    sanitize: (input) => sanitizeDigits(input).slice(0, 10),
    format: (raw) => formatSegments(raw, [1, 3, 6]),
    requiredLength: 10,
  },
  pasaporte: {
    sanitize: (input) => sanitizeAlphanumericUpper(input).slice(0, 9),
    format: (raw) => raw,
    requiredLength: 9,
  },
  dimex: {
    sanitize: (input) => sanitizeDigits(input).slice(0, 12),
    format: (raw) => raw,
    requiredLength: 12,
  },
  didi: {
    sanitize: (input) => sanitizeAlphanumericUpper(input).slice(0, 10),
    format: (raw) => formatSegments(raw, [2, 4, 4]),
    requiredLength: 10,
  },
};

const sanitizeIdInput = (type: string, value: string) => {
  const config = ID_FORMAT_CONFIG[type];
  return config ? config.sanitize(value) : value.replace(/\s+/g, "");
};

const formatIdValue = (type: string, raw: string) => {
  const config = ID_FORMAT_CONFIG[type];
  return config ? config.format(raw) : raw;
};

const getIdRequiredLength = (type: string) =>
  ID_FORMAT_CONFIG[type]?.requiredLength ?? 1;

const ID_TYPE_OPTIONS = [
  {
    value: "cedula-persona",
    label: "Cédula de identidad",
    description: "Ciudadanía nacional",
    placeholder: "1-1234-5678",
  },
  {
    value: "cedula-juridica",
    label: "Cédula jurídica",
    description: "Empresas y organizaciones",
    placeholder: "3-101-123456",
  },
  {
    value: "pasaporte",
    label: "Pasaporte",
    description: "Documentos internacionales",
    placeholder: "AA1234567",
  },
  {
    value: "dimex",
    label: "DIMEX",
    description: "Documento para extranjeros residentes",
    placeholder: "123456789012",
  },
  {
    value: "didi",
    label: "DIDI",
    description: "Documento de identidad digital",
    placeholder: "CR-DIDI-1234",
  },
] as const;

const resolveIdTypeValueFromLabel = (label: string) =>
  ID_TYPE_OPTIONS.find((option) => option.label === label)?.value;

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

const LoginScreen = () => {
  const { theme } = useTheme();
  const palette = theme.palette;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const {
    login,
    isAuthenticated,
    user,
    biometricRegistered,
    biometricLastSync,
    biometricAttempts,
    simulateBiometricValidation,
    registerBiometrics,
  } = useBankStore();
  const [idRaw, setIdRaw] = useState("");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idType, setIdType] = useState<string>(() => {
    const found = ID_TYPE_OPTIONS.find(
      (option) => option.label === user.idType,
    );
    return found?.value ?? ID_TYPE_OPTIONS[0].value;
  });

  const [biometricHint, setBiometricHint] = useState<string | null>(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const formattedId = useMemo(
    () => formatIdValue(idType, idRaw),
    [idType, idRaw],
  );
  const formattedPhone = useMemo(
    () => formatPhoneNumber(phoneRaw),
    [phoneRaw],
  );
  const idRequiredLength = useMemo(
    () => getIdRequiredLength(idType),
    [idType],
  );
  const normalizedError = useMemo(() => {
    if (!error) {
      return null;
    }
    return error.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }, [error]);
  const idErrorMessage = normalizedError && !normalizedError.includes("telefono")
    ? error ?? undefined
    : undefined;
  const phoneErrorMessage = normalizedError?.includes("telefono")
    ? error ?? undefined
    : undefined;

  useEffect(() => {
    const match = ID_TYPE_OPTIONS.find(
      (option) => option.label === user.idType,
    );
    if (match) {
      setIdType(match.value);
    }
  }, [user.idType]);

  const biometricHistory = useMemo(
    () => biometricAttempts.slice(0, 3),
    [biometricAttempts],
  );

  const biometricStatusLabel = biometricRegistered ? "Activo" : "Pendiente";
  const biometricStatusStyle = biometricRegistered
    ? styles.biometricStatusActive
    : styles.biometricStatusPending;
  const biometricSubtitle = biometricRegistered && biometricLastSync
    ? `Última sincronización ${new Date(biometricLastSync).toLocaleTimeString("es-CR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Registra datos biométricos simulados en este dispositivo.";

  const selectedIdType = useMemo(
    () =>
      ID_TYPE_OPTIONS.find((option) => option.value === idType) ??
      ID_TYPE_OPTIONS[0],
    [idType],
  );

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(app)/home");
    }
  }, [isAuthenticated, router]);

  const welcomeMessage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const idKeyboardType = useMemo(
    () => (idType === "pasaporte" || idType === "didi" ? "default" : "numbers-and-punctuation"),
    [idType],
  );

  const handleIdTypeChange = (nextValue: string) => {
    setIdType(nextValue);
    setIdRaw("");
    setError(null);
  };

  const handleIdChange = (text: string) => {
    setError(null);
    setIdRaw(sanitizeIdInput(idType, text));
  };

  const handlePhoneChange = (text: string) => {
    setError(null);
    setPhoneRaw(sanitizePhoneInput(text));
  };

  const handleSubmit = () => {
    setError(null);
    setBiometricHint(null);
    if (!idRaw || idRaw.length < idRequiredLength) {
      setError(`Ingresa un ${selectedIdType.label.toLowerCase()} válido.`);
      return;
    }
    if (!phoneRaw || phoneRaw.length < PHONE_REQUIRED_LENGTH) {
      setError("Ingresa un número de teléfono válido.");
      return;
    }
    const displayId = formatIdValue(idType, idRaw);
    const displayPhone = formatPhoneNumber(phoneRaw);
    setLoading(true);
    setTimeout(() => {
      const success = login({
        id: displayId,
        phone: displayPhone,
        idType: selectedIdType.label,
      });
      setLoading(false);
      if (!success) {
        setError("No pudimos validar tus datos, intenta de nuevo.");
        return;
      }
      router.replace("/(app)/home");
    }, 600);
  };

  const handleProvisionBiometrics = () => {
    if (biometricLoading) {
      return;
    }
    setError(null);
    registerBiometrics({ displayName: "FaceGraph Sensor v2" });
    setBiometricHint("Biometría de demostración registrada en tu dispositivo.");
  };

  const handleBiometricLogin = async () => {
    if (!biometricRegistered || biometricLoading) {
      return;
    }
    setError(null);
    setBiometricHint(null);
    setBiometricLoading(true);
    try {
      const { success, deviceName } = await simulateBiometricValidation({ expectedMatch: true });
      if (!success) {
        setError("No pudimos validar tu biometría. Usa tus datos o intenta de nuevo.");
        setBiometricHint(`Intento biométrico fallido con ${deviceName}.`);
        return;
      }
      const resolvedType = resolveIdTypeValueFromLabel(user.idType) ?? idType;
      if (resolvedType !== idType) {
        setIdType(resolvedType);
      }
      const sanitizedId = sanitizeIdInput(resolvedType, user.id);
      const sanitizedPhone = sanitizePhoneInput(user.phone);
      setIdRaw(sanitizedId);
      setPhoneRaw(sanitizedPhone);
      setBiometricHint(`Biometría validada en ${deviceName}. Ingresando...`);
      const loggedIn = login({
        id: formatIdValue(resolvedType, sanitizedId),
        phone: formatPhoneNumber(sanitizedPhone),
        idType: user.idType,
      });
      if (loggedIn) {
        router.replace("/(app)/home");
      }
    } catch (err) {
      setError("Ocurrió un error con la validación biométrica.");
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <FuturisticBackground>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          style={styles.container}
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
        >
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.header}
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
            <Text style={styles.greeting}>{welcomeMessage}</Text>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              Gestiona tu SINPE Móvil con una experiencia nueva y segura.
            </Text>
          </MotiView>

          <View style={styles.form}>
            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 600, delay: 150 }}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>Datos de acceso</Text>
              <NeonSelectField
                label="Tipo de identificación"
                value={idType}
                onValueChange={handleIdTypeChange}
                options={ID_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  description: option.description,
                }))}
                placeholder="Selecciona un documento"
                helpText="Selecciona el documento con el que deseas iniciar sesión."
                icon={
                  <MaterialCommunityIcons
                    name="card-account-details"
                    size={20}
                    color={palette.accentCyan}
                  />
                }
              />
              <NeonTextField
                label="Número de identificación"
                placeholder={selectedIdType.placeholder}
                value={formattedId}
                autoCapitalize="characters"
                onChangeText={handleIdChange}
                keyboardType={idKeyboardType}
                icon={
                  <MaterialCommunityIcons
                    name="card-account-details-outline"
                    size={20}
                    color={palette.accentCyan}
                  />
                }
                errorMessage={idErrorMessage}
              />
              <NeonTextField
                label="Número telefónico"
                placeholder={user.phone}
                value={formattedPhone}
                keyboardType="phone-pad"
                onChangeText={handlePhoneChange}
                allowOnlyNumeric
                icon={
                  <MaterialCommunityIcons
                    name="cellphone"
                    size={20}
                    color={palette.accentCyan}
                  />
                }
                errorMessage={phoneErrorMessage}
              />
              <PrimaryButton
                label="Ingresar"
                onPress={handleSubmit}
                loading={loading}
              />
              <View style={styles.biometricSection}>
                <View style={styles.biometricHeader}>
                  <View style={styles.biometricIcon}>
                    <MaterialCommunityIcons
                      name="fingerprint"
                      size={22}
                      color={palette.textPrimary}
                    />
                  </View>
                  <View style={styles.biometricCopy}>
                    <Text style={styles.biometricTitle}>Biometría simulada</Text>
                    <Text style={styles.biometricSubtitle}>{biometricSubtitle}</Text>
                  </View>
                  <View style={[styles.biometricStatus, biometricStatusStyle]}>
                    <Text style={styles.biometricStatusText}>{biometricStatusLabel}</Text>
                  </View>
                </View>
                {biometricHistory.length > 0 ? (
                  <View style={styles.biometricHistory}>
                    {biometricHistory.map((attempt) => {
                      const timeLabel = new Date(attempt.timestamp).toLocaleTimeString("es-CR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const resultLabel =
                        attempt.result === "success"
                          ? "Coincidencia"
                          : attempt.result === "mismatch"
                          ? "No coincide"
                          : "Tiempo agotado";
                      const resultColor =
                        attempt.result === "success"
                          ? palette.success
                          : attempt.result === "mismatch"
                          ? palette.warning
                          : palette.textMuted;
                      return (
                        <View key={attempt.id} style={styles.biometricRow}>
                          <View style={styles.biometricRowCopy}>
                            <Text style={styles.biometricRowTitle}>{attempt.label}</Text>
                            <Text style={styles.biometricRowSubtitle}>{`${timeLabel} · ${attempt.device}`}</Text>
                          </View>
                          <Text style={[styles.biometricResult, { color: resultColor }]}>
                            {resultLabel}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
                {biometricHint ? (
                  <Text style={styles.biometricHint}>{biometricHint}</Text>
                ) : null}
                <View style={styles.biometricActions}>
                  {biometricRegistered ? (
                    <PrimaryButton
                      label={biometricLoading ? "Validando..." : "Ingresar con biometría"}
                      onPress={handleBiometricLogin}
                      loading={biometricLoading}
                      disabled={biometricLoading}
                    />
                  ) : (
                    <Pressable
                      onPress={handleProvisionBiometrics}
                      style={styles.biometricSecondary}
                      accessibilityRole="button"
                      disabled={biometricLoading}
                    >
                      <MaterialCommunityIcons
                        name="account-check-outline"
                        size={18}
                        color={palette.accentCyan}
                      />
                      <Text style={styles.biometricSecondaryLabel}>Registrar biometría demo</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <Text style={styles.helper}>
                Davivienda 
              </Text>
            </MotiView>
          </View>
        </MotiView>
      </ScrollView>
    </FuturisticBackground>
  );
};

const createStyles = (theme: Theme) => {
  const { palette, components } = theme;
  const cardTokens = components.card;
  return StyleSheet.create({
    scroll: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 48,
      gap: 40,
    },
    header: {
      gap: 16,
      alignItems: "flex-start",
    },
    logoBadge: {
      padding: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    logoImage: {
      width: 56,
      height: 56,
    },
    greeting: {
      fontSize: 16,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: palette.textMuted,
      fontWeight: "600",
    },
    title: {
      fontSize: 20,
      color: palette.textPrimary,
      fontWeight: "800",
    },
    subtitle: {
      fontSize: 15,
      color: palette.textSecondary,
      lineHeight: 22,
    },
    form: {
      flex: 1,
    },
    card: {
      borderRadius: 28,
      padding: 24,
      backgroundColor: cardTokens.background,
      borderWidth: cardTokens.borderWidth,
      borderColor: cardTokens.border,
      gap: 20,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    biometricSection: {
      borderTopWidth: 1,
      borderColor: withOpacity(palette.textPrimary, 0.06),
      paddingTop: 18,
      gap: 16,
    },
    biometricHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    biometricIcon: {
      width: 40,
      height: 40,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: withOpacity(palette.accentCyan, 0.12),
    },
    biometricCopy: {
      flex: 1,
      gap: 4,
    },
    biometricTitle: {
      color: palette.textPrimary,
      fontWeight: "700",
    },
    biometricSubtitle: {
      color: palette.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    biometricStatus: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    biometricStatusActive: {
      backgroundColor: withOpacity(palette.success, 0.2),
    },
    biometricStatusPending: {
      backgroundColor: withOpacity(palette.warning, 0.2),
    },
    biometricStatusText: {
      color: palette.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },
    biometricHistory: {
      gap: 12,
    },
    biometricRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    biometricRowCopy: {
      flex: 1,
      gap: 4,
    },
    biometricRowTitle: {
      color: palette.textPrimary,
      fontWeight: "600",
    },
    biometricRowSubtitle: {
      color: palette.textMuted,
      fontSize: 12,
    },
    biometricResult: {
      fontWeight: "700",
      fontSize: 12,
    },
    biometricHint: {
      color: palette.textSecondary,
      fontSize: 12,
      lineHeight: 18,
    },
    biometricActions: {
      gap: 12,
    },
    biometricSecondary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: withOpacity(palette.accentCyan, 0.4),
      backgroundColor: withOpacity(palette.accentCyan, 0.12),
    },
    biometricSecondaryLabel: {
      color: palette.accentCyan,
      fontWeight: "600",
    },
    helper: {
      fontSize: 12,
      color: palette.textMuted,
      textAlign: "center",
    },
  });
};

export default LoginScreen;
