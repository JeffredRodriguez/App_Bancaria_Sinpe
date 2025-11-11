import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useGoalsStore, Goal } from "@/store/useGoalsStore";
import { palette } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";

const CONTRIBUTION_PRESETS = [5000, 10000, 20000];

type GoalFormState = {
  id?: string;
  title: string;
  targetAmount: string;
  deadline?: string;
};

const emptyForm: GoalFormState = {
  title: "",
  targetAmount: "",
  deadline: undefined,
};

const GoalsScreen = () => {
  const router = useRouter();
  const {
    goals,
    addGoal,
    updateGoal,
    recordContribution,
    markGoalCompleted,
    deleteGoal,
  } = useGoalsStore();

  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<GoalFormState>({ ...emptyForm });
  const [error, setError] = useState<string | null>(null);

  const activeGoals = useMemo(
    () => goals.filter((goal: Goal) => goal.status === "active"),
    [goals],
  );
  const completedGoals = useMemo(
    () => goals.filter((goal: Goal) => goal.status === "completed"),
    [goals],
  );

  const totalTarget = useMemo(
    () => goals.reduce((acc, goal) => acc + goal.targetAmount, 0),
    [goals],
  );
  const totalSaved = useMemo(
    () => goals.reduce((acc, goal) => acc + goal.currentAmount, 0),
    [goals],
  );

  const progressPercent = totalTarget
    ? Math.min(100, Math.round((totalSaved / totalTarget) * 100))
    : 0;

  const openCreate = () => {
    setFormState({ ...emptyForm });
    setError(null);
    setShowForm(true);
  };

  const openEdit = (goal: Goal) => {
    setFormState({
      id: goal.id,
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline?.split("T")[0],
    });
    setError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormState({ ...emptyForm });
    setError(null);
  };

  const handleSave = () => {
    if (!formState.title.trim()) {
      setError("Agrega un nombre a la meta.");
      return;
    }
    const parsedTarget = Number(formState.targetAmount.replace(/,/g, "."));
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setError("Define un monto objetivo válido.");
      return;
    }
    if (formState.id) {
      updateGoal(formState.id, {
        title: formState.title,
        targetAmount: parsedTarget,
        deadline: formState.deadline
          ? new Date(formState.deadline).toISOString()
          : undefined,
      });
    } else {
      addGoal({
        title: formState.title,
        targetAmount: parsedTarget,
        deadline: formState.deadline
          ? new Date(formState.deadline).toISOString()
          : undefined,
      });
    }
    closeForm();
  };

  const handleContribution = (goal: Goal, amount: number) => {
    recordContribution(goal.id, amount);
  };

  const handleMarkCompleted = (goal: Goal) => {
    markGoalCompleted(goal.id);
  };

  const handleDelete = (goal: Goal) => {
    deleteGoal(goal.id);
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
              <MaterialCommunityIcons
                name="arrow-left"
                size={26}
                color={palette.textPrimary}
              />
            </Pressable>
            <Text style={styles.title}>Metas de ahorro</Text>
            <ProfileAvatarButton
              size={40}
              onPress={() =>
                router.push({
                  pathname: "/(app)/notifications",
                  params: {
                    from: "/(app)/goals",
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
            transition={{ type: "timing", duration: 480 }}
          >
            <GlassCard>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Progreso global</Text>
                <Text style={styles.summaryValue}>{progressPercent}%</Text>
                <View style={styles.summaryProgress}>
                  <View
                    style={[
                      styles.summaryProgressFill,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryCaption}>Ahorrado</Text>
                  <Text style={styles.summaryCaption}>{formatCurrency(totalSaved)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryCaption}>Objetivo total</Text>
                  <Text style={styles.summaryCaption}>{formatCurrency(totalTarget)}</Text>
                </View>
                <PrimaryButton
                  label="Crear nueva meta"
                  onPress={openCreate}
                  style={styles.summaryButton}
                />
              </View>
            </GlassCard>
          </MotiView>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Metas activas</Text>
            <Text style={styles.sectionHint}>
              Administra tus objetivos para alcanzar tus planes.
            </Text>
          </View>

          {activeGoals.length === 0 ? (
            <GlassCard>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="target"
                  size={42}
                  color={palette.accentCyan}
                />
                <Text style={styles.emptyTitle}>Sin metas activas</Text>
                <Text style={styles.emptyCopy}>
                  Crea la primera meta y comienza a ver tu progreso.
                </Text>
                <PrimaryButton label="Crear meta" onPress={openCreate} />
              </View>
            </GlassCard>
          ) : (
            activeGoals.map((goal: Goal) => {
              const ratio = goal.targetAmount
                ? Math.min(1, goal.currentAmount / goal.targetAmount)
                : 0;
              const percent = Math.round(ratio * 100);

              return (
                <MotiView
                  key={goal.id}
                  from={{ opacity: 0, translateY: 24 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: "timing", duration: 380 }}
                >
                  <GlassCard>
                    <View style={styles.goalCard}>
                      <View style={styles.goalHeader}>
                        <View
                          style={[styles.goalBadge, { backgroundColor: goal.color }]}
                        />
                        <View style={styles.goalTitleWrapper}>
                          <Text style={styles.goalTitle}>{goal.title}</Text>
                          {goal.deadline ? (
                            <Text style={styles.goalDeadline}>
                              Meta para {new Date(goal.deadline).toLocaleDateString("es-CR")}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable
                          onPress={() => openEdit(goal)}
                          accessibilityRole="button"
                          style={styles.iconButton}
                        >
                          <MaterialCommunityIcons
                            name="pencil"
                            size={20}
                            color={palette.textSecondary}
                          />
                        </Pressable>
                      </View>

                      <View style={styles.progressRow}>
                        <Text style={styles.goalAmount}>{formatCurrency(goal.currentAmount)}</Text>
                        <Text style={styles.goalTarget}>
                          de {formatCurrency(goal.targetAmount)} ({percent}%)
                        </Text>
                      </View>

                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${percent}%`, backgroundColor: goal.color },
                          ]}
                        />
                      </View>

                      <View style={styles.presetRow}>
                        {CONTRIBUTION_PRESETS.map((amount) => (
                          <Pressable
                            key={amount}
                            onPress={() => handleContribution(goal, amount)}
                            style={styles.presetChip}
                            accessibilityRole="button"
                          >
                            <Text style={styles.presetLabel}>+{formatCurrency(amount)}</Text>
                          </Pressable>
                        ))}
                      </View>

                      <View style={styles.cardActions}>
                        <PrimaryButton
                          label="Registrar aporte"
                          onPress={() => handleContribution(goal, 5000)}
                          style={styles.cardButton}
                        />
                        <Pressable
                          onPress={() => handleMarkCompleted(goal)}
                          style={styles.secondaryAction}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name="check-circle"
                            size={22}
                            color={palette.accentCyan}
                          />
                          <Text style={styles.secondaryLabel}>Marcar completada</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDelete(goal)}
                          style={styles.secondaryAction}
                          accessibilityRole="button"
                        >
                          <MaterialCommunityIcons
                            name="trash-can"
                            size={22}
                            color={palette.danger}
                          />
                          <Text style={[styles.secondaryLabel, { color: palette.danger }]}>Eliminar</Text>
                        </Pressable>
                      </View>
                    </View>
                  </GlassCard>
                </MotiView>
              );
            })
          )}

          {completedGoals.length > 0 ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Metas completadas</Text>
              <Text style={styles.sectionHint}>
                Celebra tus logros y vuelve a invertir en nuevos proyectos.
              </Text>
            </View>
          ) : null}

          {completedGoals.map((goal: Goal) => (
            <GlassCard key={goal.id}>
              <View style={styles.completedCard}>
                <MaterialCommunityIcons
                  name="trophy"
                  size={26}
                  color={palette.accentCyan}
                />
                <View style={styles.completedCopy}>
                  <Text style={styles.completedTitle}>{goal.title}</Text>
                  <Text style={styles.completedSubtitle}>
                    Alcanzaste {formatCurrency(goal.targetAmount)}.
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(goal)}
                  accessibilityRole="button"
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color={palette.textSecondary}
                  />
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      <GoalFormModal
        visible={showForm}
        onClose={closeForm}
        onSubmit={handleSave}
        formState={formState}
        setFormState={setFormState}
        error={error}
      />
    </FuturisticBackground>
  );
};

type GoalFormModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formState: GoalFormState;
  setFormState: Dispatch<SetStateAction<GoalFormState>>;
  error: string | null;
};

const GoalFormModal = ({
  visible,
  onClose,
  onSubmit,
  formState,
  setFormState,
  error,
}: GoalFormModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 220 }}
          style={styles.modalCard}
        >
          <Text style={styles.modalTitle}>
            {formState.id ? "Editar meta" : "Crear nueva meta"}
          </Text>
          <NeonTextField
            label="Nombre"
            placeholder="Ej. Fondo de emergencia"
            value={formState.title}
            onChangeText={(text) => setFormState({ ...formState, title: text })}
            icon={
              <MaterialCommunityIcons
                name="target"
                size={20}
                color={palette.accentCyan}
              />
            }
          />
          <NeonTextField
            label="Monto objetivo"
            placeholder="₡100,000"
            value={formState.targetAmount}
            onChangeText={(text) => setFormState({ ...formState, targetAmount: text })}
            keyboardType="decimal-pad"
            allowOnlyNumeric
            icon={
              <MaterialCommunityIcons
                name="cash"
                size={20}
                color={palette.accentCyan}
              />
            }
          />
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Fecha meta (opcional)</Text>
            <TextInput
              placeholder="YYYY-MM-DD"
              placeholderTextColor={palette.textMuted}
              style={styles.dateInput}
              value={formState.deadline}
              onChangeText={(text) => setFormState({ ...formState, deadline: text })}
            />
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.modalSecondaryButton}>
              <Text style={styles.modalSecondaryLabel}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label={formState.id ? "Guardar cambios" : "Crear meta"}
              onPress={onSubmit}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
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
    gap: 14,
    padding: 20,
  },
  summaryLabel: {
    color: palette.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 12,
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 32,
    fontWeight: "800",
  },
  summaryProgress: {
    height: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  summaryProgressFill: {
    height: "100%",
    backgroundColor: palette.accentCyan,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCaption: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  summaryButton: {
    marginTop: 8,
  },
  sectionHeader: {
    gap: 6,
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
  emptyState: {
    padding: 24,
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
  goalCard: {
    gap: 16,
    padding: 20,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  goalBadge: {
    width: 10,
    height: 48,
    borderRadius: 6,
  },
  goalTitleWrapper: {
    flex: 1,
    gap: 4,
  },
  goalTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  goalDeadline: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalAmount: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  goalTarget: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  progressBar: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  presetRow: {
    flexDirection: "row",
    gap: 10,
  },
  presetChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "rgba(12, 20, 40, 0.45)",
  },
  presetLabel: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  cardActions: {
    gap: 12,
  },
  cardButton: {
    width: "100%",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryLabel: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
  },
  completedCopy: {
    flex: 1,
    gap: 4,
  },
  completedTitle: {
    color: palette.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  completedSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 17, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "rgba(10, 18, 32, 0.92)",
    padding: 24,
    gap: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  dateField: {
    gap: 6,
  },
  dateLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  dateInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: palette.textPrimary,
    backgroundColor: "rgba(7, 17, 31, 0.7)",
  },
  errorText: {
    color: palette.danger,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  modalSecondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modalSecondaryLabel: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
});

export default GoalsScreen;
