import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useAutomationStore, Automation, AutomationDraft } from "@/store/useAutomationStore";
import { useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";

const TEMPLATES: AutomationDraft[] = [
  {
    title: "Redondeo para metas",
    description: "Lleva el vuelto a tu meta de emergencia.",
    type: "roundup",
    active: true,
    config: {
      notes: "Simulación: redondeo a ₡500 más cercano.",
      targetLabel: "Fondo emergencia",
    },
  },
  {
    title: "Alerta de presupuesto",
    description: "Recibe un aviso al superar ₡150,000 en el mes.",
    type: "budget-alert",
    active: true,
    config: {
      threshold: 150000,
      notes: "Notificación informativa previa al fin de mes.",
    },
  },
  {
    title: "Transferencia programada",
    description: "Envía ₡25,000 cada quincena a tu ahorro.",
    type: "scheduled-transfer",
    active: false,
    config: {
      amount: 25000,
      schedule: "Quincenal",
      targetLabel: "Ahorro vacaciones",
    },
  },
];

const AutomationsScreen = () => {
  const router = useRouter();
  const { automations, addAutomation, toggleAutomation, updateAutomation, removeAutomation } =
    useAutomationStore();
  const { addNotification } = useBankStore();

  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const activeCount = useMemo(
    () => automations.filter((item: Automation) => item.active).length,
    [automations],
  );

  const handleToggle = (automation: Automation) => {
    const nextState = !automation.active;
    toggleAutomation(automation.id);
    addNotification({
      title: nextState ? "Automatización activada" : "Automatización pausada",
      message: `${automation.title}`,
      category: "general",
    });
  };

  const handleAddFromTemplate = (draft: AutomationDraft) => {
    const automation = addAutomation(draft);
    addNotification({
      title: "Automatización creada",
      message: `${automation.title} quedó disponible en tu panel.`,
      category: "general",
    });
  };

  const handleOpenDetail = (automation: Automation) => {
    setSelectedAutomation(automation);
    setNotesValue(automation.config.notes ?? "");
  };

  const handleSaveDetail = () => {
    if (!selectedAutomation) {
      return;
    }
    updateAutomation(selectedAutomation.id, {
      config: {
        ...selectedAutomation.config,
        notes: notesValue.trim(),
      },
    });
    addNotification({
      title: "Automatización actualizada",
      message: `${selectedAutomation.title} se actualizó correctamente.`,
      category: "general",
    });
    setSelectedAutomation(null);
  };

  const handleRemove = () => {
    if (!selectedAutomation) {
      return;
    }
    const title = selectedAutomation.title;
    removeAutomation(selectedAutomation.id);
    addNotification({
      title: "Automatización eliminada",
      message: `${title} salió del panel de automatizaciones.`,
      category: "general",
    });
    setSelectedAutomation(null);
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
              onPress={() => router.push("/(app)/home")}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <MaterialCommunityIcons name="arrow-left" size={26} color={palette.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Automatizaciones</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() =>
                router.push({
                  pathname: "/(app)/notifications",
                  params: {
                    from: "/(app)/automations",
                  },
                })
              }
              accessibilityLabel="Ver notificaciones"
              style={styles.profileShortcut}
            />
          </View>

          <MotiView
            from={{ opacity: 0, translateY: 22 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Activas</Text>
                  <Text style={styles.summaryValue}>{activeCount}</Text>
                  <Text style={styles.summaryHint}>
                    Usa automatizaciones para reducir movimientos manuales.
                  </Text>
                </View>
                <View style={styles.summaryColumn}>
                  <Text style={styles.summaryLabel}>Total configuradas</Text>
                  <Text style={styles.summaryValue}>{automations.length}</Text>
                  <Text style={styles.summaryHint}>Puedes crear plantillas ilimitadas.</Text>
                </View>
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 26 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 60 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Accesos rápidos</Text>
                <Text style={styles.sectionHint}>Crea una automatización preconfigurada.</Text>
              </View>
              <View style={styles.templatesContainer}>
                {TEMPLATES.map((template) => (
                  <Pressable
                    key={template.title}
                    style={styles.templateButton}
                    onPress={() => handleAddFromTemplate(template)}
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons
                      name="lightning-bolt"
                      size={18}
                      color={palette.accentCyan}
                    />
                    <Text style={styles.templateLabel}>{template.title}</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420, delay: 110 }}
          >
            <GlassCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Panel de automatizaciones</Text>
                <Text style={styles.sectionHint}>
                  Activa, ajusta notas o elimina las configuraciones que ya no necesitas.
                </Text>
              </View>
              {automations.length === 0 ? (
                <Text style={styles.emptyCopy}>
                  Añade una automatización para verla aquí.
                </Text>
              ) : (
                automations.map((automation: Automation) => {
                  const createdAt = new Date(automation.createdAt);
                  const formattedDate = createdAt.toLocaleDateString("es-CR", {
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <View key={automation.id} style={styles.automationRow}>
                      <Pressable
                        style={styles.automationMain}
                        onPress={() => handleOpenDetail(automation)}
                        accessibilityRole="button"
                      >
                        <View style={styles.iconBubble}>
                          <MaterialCommunityIcons
                            name={automation.active ? "rocket-launch" : "rocket-launch-outline"}
                            size={20}
                            color={palette.textPrimary}
                          />
                        </View>
                        <View style={styles.automationContent}>
                          <Text style={styles.automationTitle}>{automation.title}</Text>
                          <Text style={styles.automationDescription}>{automation.description}</Text>
                          <Text style={styles.automationMeta}>Config. {formattedDate}</Text>
                        </View>
                      </Pressable>
                      <Switch
                        value={automation.active}
                        onValueChange={() => handleToggle(automation)}
                        trackColor={{ false: "rgba(255,255,255,0.2)", true: palette.accentCyan }}
                        thumbColor={automation.active ? palette.surface : palette.textMuted}
                        ios_backgroundColor="rgba(255,255,255,0.2)"
                      />
                    </View>
                  );
                })
              )}
            </GlassCard>
          </MotiView>
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(selectedAutomation)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAutomation(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAutomation?.title}</Text>
              <Pressable
                onPress={() => setSelectedAutomation(null)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={palette.textSecondary}
                />
              </Pressable>
            </View>
            <Text style={styles.modalCopy}>{selectedAutomation?.description}</Text>
            <NeonTextField
              label="Notas internas"
              value={notesValue}
              onChangeText={setNotesValue}
              placeholder="Ej: recordar confirmar saldo antes de ejecutar"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={handleRemove}
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={palette.danger}
                />
                <Text style={styles.secondaryLabel}>Eliminar</Text>
              </Pressable>
              <PrimaryButton
                label="Guardar cambios"
                onPress={handleSaveDetail}
                style={styles.modalPrimary}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 24,
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
    paddingBottom: 14,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  templatesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  templateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  templateLabel: {
    color: palette.accentCyan,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyCopy: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    color: palette.textSecondary,
    fontSize: 14,
  },
  automationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 16,
  },
  automationMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  automationContent: {
    flex: 1,
    gap: 6,
  },
  automationTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  automationDescription: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  automationMeta: {
    color: palette.textMuted,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    padding: 24,
    gap: 18,
    backgroundColor: "rgba(7, 17, 31, 0.9)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  modalCopy: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(250, 82, 82, 0.08)",
  },
  secondaryLabel: {
    color: palette.danger,
    fontSize: 14,
    fontWeight: "600",
  },
  modalPrimary: {
    flex: 1,
  },
});

export default AutomationsScreen;
