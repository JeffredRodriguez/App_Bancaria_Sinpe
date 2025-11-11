import { MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  BarCodeScannerModule,
  BarCodeScannerProps,
  BarCodeScannerResult,
  PermissionResponse,
} from "expo-barcode-scanner";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeModulesProxy } from "expo-modules-core";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { palette } from "@/theme/colors";

type ScannerModule = {
  BarCodeScanner: ComponentType<BarCodeScannerProps>;
  getPermissionsAsync?: () => Promise<PermissionResponse>;
  requestPermissionsAsync: () => Promise<PermissionResponse>;
};

const QrScannerScreen = () => {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<null | boolean>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const barCodeScannerModuleRef = useRef<ScannerModule | null>(null);
  const [scannerModule, setScannerModule] = useState<ScannerModule | null>(null);
  const hasNativeScanner = Boolean(
    (NativeModulesProxy as Record<string, unknown>)?.ExpoBarCodeScanner,
  );

  const loadScannerModule = useCallback(async () => {
    if (!hasNativeScanner) {
      throw new Error("native-module-missing");
    }
    if (barCodeScannerModuleRef.current) {
      return barCodeScannerModuleRef.current;
    }

    const module = await import("expo-barcode-scanner");
    const resolved: ScannerModule = {
      BarCodeScanner: module.BarCodeScanner,
      getPermissionsAsync: module.getPermissionsAsync,
      requestPermissionsAsync: module.requestPermissionsAsync,
    };
    barCodeScannerModuleRef.current = resolved;
    setScannerModule(resolved);
    return resolved;
  }, [hasNativeScanner]);

  useEffect(() => {
    let isMounted = true;
    if (!hasNativeScanner) {
      setHasPermission(false);
      setScannerError(
        "Este build de Expo Go no incluye el lector. Usa 'npm run start:classic' o un dev build personalizado."
      );
      return () => {
        isMounted = false;
      };
    }
    loadScannerModule()
      .then(async (module) => {
        const initial = module.getPermissionsAsync
          ? await module.getPermissionsAsync()
          : await module.requestPermissionsAsync();

        if (!isMounted) {
          return;
        }

        if (initial?.status === "granted" || initial?.granted) {
          setHasPermission(true);
          return;
        }

        setHasPermission(false);
        if (initial?.canAskAgain === false) {
          setScannerError(
            "No tenemos permiso de cámara. Actívalo desde Ajustes para usar el escáner.",
          );
          return;
        }

        const requested = await module.requestPermissionsAsync();
        if (!isMounted) {
          return;
        }

        const granted = Boolean(requested?.status === "granted" || requested?.granted);
        setHasPermission(granted);
        if (!granted) {
          setScannerError("Necesitas conceder acceso a la cámara para escanear códigos.");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setHasPermission(false);
        setScannerError(
          "El escáner no está disponible en Expo Go. Usa un build personalizado o 'npm run start:classic'."
        );
      });
    return () => {
      isMounted = false;
    };
  }, [hasNativeScanner, loadScannerModule]);

  const parsed = useMemo(() => parsePayload(scannedData), [scannedData]);

  const handleBarCodeScanned = ({ data }: BarCodeScannerResult) => {
    setScannedData(data);
  };

  const handleUseData = () => {
    if (!parsed) return;
    router.push({
      pathname: "/(app)/transfer",
      params: {
        contactName: parsed.name || "",
        phone: parsed.phone || "",
        amount: parsed.amount || "",
        note: parsed.note || "",
      },
    });
  };

  const scanningBlocked = hasPermission === false;
  const ScannerComponent: ComponentType<BarCodeScannerProps> | null = hasNativeScanner
    ? scannerModule?.BarCodeScanner ?? null
    : null;

  const requestScannerPermission = useCallback(async () => {
    setScannerError(null);
    if (!hasNativeScanner) {
      setScannerError(
        "Este build de Expo Go no incluye el lector. Usa 'npm run start:classic' o un dev build personalizado."
      );
      return;
    }
    setRequestingPermission(true);
    try {
      const module = await loadScannerModule();
      const result = await module.requestPermissionsAsync();
      const granted = Boolean(result?.status === "granted" || result?.granted);
      setHasPermission(granted);
      if (!granted) {
        setScannerError(
          result?.canAskAgain === false
            ? "La cámara está bloqueada. Activa el permiso desde Ajustes para usar el escáner."
            : "Permite el acceso a la cámara para continuar.",
        );
      }
    } catch (err) {
      setHasPermission(false);
      setScannerError("No se pudo solicitar el permiso de cámara. Intenta nuevamente.");
    } finally {
      setRequestingPermission(false);
    }
  }, [hasNativeScanner, loadScannerModule]);

  return (
    <FuturisticBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          style={styles.container}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 480 }}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              style={styles.backButton}
              onPress={() => router.push("/(app)/home")}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={26}
                color={palette.textPrimary}
              />
            </Pressable>
            <Text style={styles.title}>Escanear código QR</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() =>
                router.push({
                  pathname: "/(app)/notifications",
                  params: {
                    from: "/(app)/scan",
                  },
                })
              }
              accessibilityLabel="Ver notificaciones"
              style={styles.profileShortcut}
            />
          </View>

          <Text style={styles.subtitle}>
            Escanea códigos QR para rellenar automáticamente los datos de una
            transferencia SINPE Móvil.
          </Text>

          <View style={styles.scannerWrapper}>
            {hasPermission === null ? (
              <View style={styles.permissionState}>
                <ActivityIndicator color={palette.accentCyan} size="large" />
                <Text style={styles.permissionText}>
                  Solicitando permisos de la cámara…
                </Text>
              </View>
            ) : scanningBlocked || !ScannerComponent ? (
              <View style={styles.permissionState}>
                <MaterialCommunityIcons
                  name="lock-alert"
                  size={48}
                  color={palette.danger}
                />
                <Text style={styles.permissionText}>
                  {scannerError ??
                    "No tenemos acceso a la cámara. Activa el permiso desde los ajustes del dispositivo."}
                </Text>
                {scannerError ? null : (
                  <Text style={styles.permissionHint}>
                    {Platform.OS === "ios"
                      ? "Ajustes > Expo Go > Cámara"
                      : "Ajustes > Aplicaciones > Expo Go > Permisos"}
                  </Text>
                )}
                <PrimaryButton
                  label={requestingPermission ? "Solicitando…" : "Permitir cámara"}
                  onPress={requestScannerPermission}
                  disabled={requestingPermission}
                  style={styles.permissionButton}
                />
              </View>
            ) : (
              <View style={styles.cameraViewport}>
                <ScannerComponent
                  onBarCodeScanned={
                    scannedData ? undefined : handleBarCodeScanned
                  }
                  style={StyleSheet.absoluteFillObject}
                />
                <MotiView
                  pointerEvents="none"
                  style={styles.overlay}
                  from={{ opacity: 0.4 }}
                  animate={{ opacity: 0.15 }}
                  transition={{ loop: true, type: "timing", duration: 2200 }}
                >
                  <MotiView
                    style={styles.reticle}
                    from={{ scale: 0.92, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ loop: true, type: "timing", duration: 1600 }}
                  />
                </MotiView>
              </View>
            )}
          </View>

          <GlassCard>
            <View style={styles.hints}>
              <View style={styles.hintRow}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={22}
                  color={palette.accentCyan}
                />
                <Text style={styles.hintText}>
                  Aceptamos códigos en formato JSON o enlaces sinpe:// con los
                  campos nombre, teléfono, monto y nota.
                </Text>
              </View>
              <View style={styles.hintRow}>
                <MaterialCommunityIcons
                  name="refresh"
                  size={22}
                  color={palette.accentPurple}
                />
                <Text style={styles.hintText}>
                  Si necesitas volver a escanear, pulsa "Escanear de nuevo".
                </Text>
              </View>
            </View>
          </GlassCard>

          {scannedData ? (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 260 }}
            >
              <GlassCard>
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>Datos detectados</Text>
                  <ResultRow label="Nombre" value={parsed?.name || "—"} />
                  <ResultRow label="Teléfono" value={parsed?.phone || "—"} />
                  <ResultRow label="Monto" value={parsed?.amount || "—"} />
                  <ResultRow label="Nota" value={parsed?.note || "—"} />
                  <ResultRow label="Contenido" value={parsed?.raw || "—"} />
                  <PrimaryButton
                    label="Usar datos en transferencia"
                    onPress={handleUseData}
                    disabled={!parsed?.phone}
                  />
                  <PrimaryButton
                    label="Escanear de nuevo"
                    onPress={() => setScannedData(null)}
                    style={styles.secondaryButton}
                  />
                </View>
              </GlassCard>
            </MotiView>
          ) : null}
        </MotiView>
      </ScrollView>
    </FuturisticBackground>
  );
};

const ResultRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={styles.resultValue}>{value}</Text>
  </View>
);

const parsePayload = (
  rawValue: string | null,
): {
  name?: string;
  phone?: string;
  amount?: string;
  note?: string;
  raw: string;
} | null => {
  if (!rawValue) {
    return null;
  }

  const trimmed = rawValue.trim();

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object") {
      return {
        name: getString(parsed.name),
        phone: getString(parsed.phone),
        amount: getString(parsed.amount),
        note: getString(parsed.note),
        raw: trimmed,
      };
    }
  } catch {
    // Continue with other strategies
  }

  if (trimmed.startsWith("sinpe://")) {
    try {
      const url = new URL(trimmed);
      const params = url.searchParams;
      return {
        name: params.get("name") || undefined,
        phone: params.get("phone") || params.get("tel") || undefined,
        amount: params.get("amount") || params.get("amt") || undefined,
        note: params.get("note") || undefined,
        raw: trimmed,
      };
    } catch {
      // ignore parsing errors
    }
  }

  const segments = trimmed.split(/[,|\n]/).map((segment) => segment.trim());
  if (segments.length >= 2) {
    return {
      name: segments[0] || undefined,
      phone: segments[1] || undefined,
      amount: segments[2] || undefined,
      note: segments.slice(3).join(" ") || undefined,
      raw: trimmed,
    };
  }

  return {
    raw: trimmed,
  };
};

const getString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 120,
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
  subtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  scannerWrapper: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(4, 12, 26, 0.9)",
    height: 320,
  },
  cameraViewport: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  reticle: {
    width: 200,
    height: 200,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  permissionState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  permissionButton: {
    alignSelf: "stretch",
  },
  permissionText: {
    color: palette.textPrimary,
    textAlign: "center",
    fontSize: 14,
  },
  permissionHint: {
    color: palette.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  hints: {
    gap: 16,
    padding: 18,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  hintText: {
    color: palette.textSecondary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  resultCard: {
    gap: 12,
    padding: 22,
  },
  resultTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  resultLabel: {
    color: palette.textMuted,
    fontSize: 13,
    width: 100,
  },
  resultValue: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#1B2C49",
  },
});

export default QrScannerScreen;
