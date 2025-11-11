import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo, useRef } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Share,
  Alert,
  Platform,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";

const bankLogo = require("../../assets/bancocostarica.png");

const ProfileQrScreen = () => {
  const router = useRouter();
  const { user } = useBankStore();

  const qrValue = useMemo(() => {
    return JSON.stringify({
      type: "SINPE",
      owner: user.name,
      phone: user.phone,
      idType: user.idType,
      id: user.id,
    });
  }, [user.id, user.idType, user.name, user.phone]);

  const svgRef = useRef<any>(null);

  const handleShare = async () => {
    try {
      if (svgRef.current && typeof svgRef.current.toDataURL === "function") {
        // get base64 from svg
        const base64: string = await new Promise((resolve, reject) => {
          try {
            svgRef.current.toDataURL((data: string) => resolve(data));
          } catch (e) {
            reject(e);
          }
        });
        const dataUrl = `data:image/png;base64,${base64}`;

        if (Platform.OS === "web") {
          const globalRef = globalThis as any;
          const navigatorRef = globalRef?.navigator as (Navigator & {
            share?: (data?: Record<string, unknown>) => Promise<void>;
            canShare?: (data?: Record<string, unknown>) => boolean;
          });
          const filename = `sinpe-qr-${Date.now()}.png`;
          try {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i += 1) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "image/png" });

            let handled = false;

            if (navigatorRef?.share) {
              let file: File | undefined;
              try {
                file = new File([blob], filename, { type: "image/png" });
              } catch (fileError) {
                console.warn("No se pudo crear el archivo para compartir", fileError);
              }

              const shareData: Record<string, unknown> = {
                title: "Mi código SINPE",
                text: "Escanéalo para enviarme dinero vía SINPE Móvil.",
              };

              if (file && navigatorRef.canShare?.({ files: [file] })) {
                shareData.files = [file];
              } else {
                shareData.url = dataUrl;
              }

              try {
                await navigatorRef.share(shareData);
                handled = true;
              } catch (shareError) {
                console.warn("Compartir en web fue cancelado o falló", shareError);
              }
            }

            if (!handled) {
              const opener = globalRef?.open;
              if (typeof opener === "function") {
                try {
                  const popup = opener(dataUrl, "_blank", "noopener,noreferrer");
                  if (popup && typeof popup.focus === "function") {
                    popup.focus();
                  }
                  handled = true;
                } catch (popupError) {
                  console.warn("No se pudo abrir la imagen en una pestaña nueva", popupError);
                }
              }
            }

            if (!handled) {
              const doc = globalRef?.document as any;
              if (doc?.createElement) {
                const downloadUrl = URL.createObjectURL(blob);
                const anchor = doc.createElement("a");
                anchor.href = downloadUrl;
                anchor.download = filename;
                doc.body?.appendChild(anchor);
                anchor.click();
                anchor.remove?.();
                URL.revokeObjectURL(downloadUrl);
                handled = true;
              }
            }

            return;
          } catch (webError) {
            console.warn("No se pudo preparar el QR para compartir en web", webError);
            const opener = (globalThis as any)?.open;
            if (typeof opener === "function") {
              try {
                const popup = opener(dataUrl, "_blank", "noopener,noreferrer");
                popup?.focus?.();
              } catch (popupError) {
                console.warn("No se pudo abrir la imagen en una pestaña nueva", popupError);
              }
            }
            return;
          }
        }

        // Prefer saving to a temporary file if expo-file-system is available.
        // Use casts to `any` to avoid depending on specific TS types in different expo-file-system versions.
        const fsAny: any = FileSystem as any;
        if (
          fsAny &&
          typeof fsAny.writeAsStringAsync === "function" &&
          typeof fsAny.cacheDirectory === "string"
        ) {
          const filename = `sinpe-qr-${Date.now()}.png`;
          const fileUri = `${fsAny.cacheDirectory}${filename}`;

          // write base64 to temp file (use 'base64' encoding string for compatibility)
          await fsAny.writeAsStringAsync(fileUri, base64, {
            encoding: "base64",
          });

          // On Android the Share API may require the 'file://' prefix, expo FileSystem cacheDirectory includes it
          await Share.share(
            {
              title: "Mi código SINPE",
              message: "Comparte mi código SINPE para recibir pagos",
              url: fileUri,
            },
            { dialogTitle: "Compartir código SINPE" },
          );

          // cleanup
          try {
            await fsAny.deleteAsync(fileUri, { idempotent: true });
          } catch (e) {
            // ignore cleanup errors
          }
        } else {
          // Fallback: share as data URL (some platforms/apps accept this)
          await Share.share({
            title: "Mi código SINPE",
            message: "Comparte mi código SINPE para recibir pagos",
            url: dataUrl,
          });
        }
      } else {
        // Fallback: share text
        await Share.share({
          title: "Mi código SINPE",
          message: `Comparte mi código SINPE: ${qrValue}`,
        });
      }
    } catch (err) {
      console.warn(err);
      Alert.alert(
        "Error",
        "No se pudo abrir la interfaz de compartir. Prueba en un dispositivo físico o revisa que 'expo-file-system' esté instalado.",
      );
    }
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
            transition={{ type: "timing", duration: 520 }}
          >
            <View style={styles.header}>
              <Pressable
                style={styles.headerButton}
                onPress={() => router.replace("/(app)/profile")}
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
              <Text style={styles.title}>Código QR de tu cuenta</Text>
              <View style={styles.headerSpacer} />
            </View>

            <GlassCard>
              <View style={styles.qrCard}>
                <Text style={styles.qrTitle}>Recibe pagos al instante</Text>
                <Text style={styles.qrSubtitle}>
                  Comparte este código para que tus contactos te envíen dinero
                  vía SINPE Móvil sin escribir tu número.
                </Text>
                <View style={styles.qrFrame}>
                  <View style={styles.qrGlow} />
                  <QRCode
                    getRef={(c) => (svgRef.current = c)}
                    value={qrValue}
                    size={228}
                    color="#020617"
                    backgroundColor="#ffffff"
                    logo={bankLogo}
                    logoSize={60}
                    logoBackgroundColor="rgba(255,255,255,0.96)"
                    logoBorderRadius={18}
                    ecl="H"
                  />
                </View>
              </View>
            </GlassCard>

            <GlassCard>
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={palette.accentCyan}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailLabel}>Titular</Text>
                    <Text style={styles.detailValue}>{user.name}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialCommunityIcons
                      name="cellphone"
                      size={20}
                      color={palette.accentCyan}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailLabel}>Número SINPE</Text>
                    <Text style={styles.detailValue}>{user.phone}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <MaterialCommunityIcons
                      name="card-account-details"
                      size={20}
                      color={palette.accentCyan}
                    />
                  </View>
                  <View style={styles.detailCopy}>
                    <Text style={styles.detailLabel}>Documento</Text>
                    <Text style={styles.detailValue}>
                      {user.idType} · {user.id}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            <View style={styles.actions}>
              <PrimaryButton label="Compartir" onPress={handleShare} />
              <View style={styles.infoBanner}>
                <Image source={bankLogo} style={styles.bannerLogo} />
                <Text style={styles.bannerCopy}>
                  Tu código es único y se genera localmente. Si actualizas tus
                  datos, vuelve a esta pantalla para regenerarlo.
                </Text>
              </View>
            </View>
          </MotiView>
        </ScrollView>
      </View>
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    paddingBottom: 260,
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 40,
    gap: 26,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  qrCard: {
    padding: 26,
    gap: 18,
    alignItems: "center",
  },
  qrTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  qrSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  qrFrame: {
    width: 260,
    height: 260,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  qrGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    bottom: -60,
    left: -60,
    backgroundColor: "rgba(99, 247, 176, 0.08)",
  },
  detailsCard: {
    padding: 24,
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9, 22, 40, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  detailCopy: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  detailValue: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    gap: 18,
    paddingBottom: 80,
  },
  infoBanner: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    backgroundColor: "rgba(12, 22, 44, 0.7)",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  bannerLogo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    resizeMode: "contain",
  },
  bannerCopy: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});

export default ProfileQrScreen;
