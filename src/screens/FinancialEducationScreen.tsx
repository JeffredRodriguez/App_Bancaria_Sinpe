import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";

import FinancialLearningSection, {
  LearningModule,
} from "@/components/FinancialLearningSection";
import FinancialTrivia, {
  TriviaSummary,
} from "@/components/FinancialTrivia";
import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import PrimaryButton from "@/components/PrimaryButton";
import { palette } from "@/theme/colors";

const FinancialEducationScreen = () => {
  const router = useRouter();
  const [viewState, setViewState] = useState<"catalog" | "quiz" | "result">(
    "catalog"
  );
  const [pendingModule, setPendingModule] = useState<LearningModule | null>(
    null
  );
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [summary, setSummary] = useState<TriviaSummary | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedModuleId = pendingModule?.id ?? activeModule?.id;

  const handleModuleSelect = (module: LearningModule) => {
    setPendingModule(module);
    setShowConfirm(true);
  };

  const closeModal = () => {
    setShowConfirm(false);
    setPendingModule(null);
  };

  const launchModule = () => {
    if (!pendingModule) {
      return;
    }
    setShowConfirm(false);
    setIsLoading(true);
    setSummary(null);
    setTimeout(() => {
      setActiveModule(pendingModule);
      setViewState("quiz");
      setIsLoading(false);
    }, 900);
  };

  const handleAbort = () => {
    setViewState("catalog");
    setActiveModule(null);
    setSummary(null);
  };

  const handleComplete = (result: TriviaSummary) => {
    setSummary(result);
    setActiveModule(result.module);
    setViewState("result");
  };

  const handleReplay = () => {
    if (!summary) {
      return;
    }
    setPendingModule(summary.module);
    setIsLoading(true);
    setTimeout(() => {
      setSummary(null);
      setActiveModule(summary.module);
      setViewState("quiz");
      setIsLoading(false);
    }, 900);
  };

  const handleBackToCatalog = () => {
    setSummary(null);
    setActiveModule(null);
    setPendingModule(null);
    setViewState("catalog");
  };

  const confirmModuleQuestionCount = pendingModule?.trivia.length ?? 0;

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
                style={styles.backButton}
                onPress={() => router.replace("/(app)/profile")}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={22}
                  color={palette.textPrimary}
                />
              </Pressable>
              <Text style={styles.title}>Educación financiera</Text>
              <View style={styles.headerSpacer} />
            </View>

            <GlassCard intensity={42}>
              <View style={styles.hero}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroLabel}>Laboratorio express</Text>
                  <Text style={styles.heroTitle}>
                    {viewState === "catalog"
                      ? "Escoge tu cápsula y practica"
                      : viewState === "quiz"
                      ? `Dominando: ${activeModule?.title ?? ""}`
                      : "Repasa tu rendimiento"}
                  </Text>
                  <Text style={styles.heroDescription}>
                    {viewState === "catalog"
                      ? "Selecciona el tema que quieres dominar y desbloquea trivias rápidas con feedback inmediato."
                      : viewState === "quiz"
                      ? "Responde con agilidad, cada pregunta refuerza un hábito financiero clave."
                      : "Analiza fortalezas y oportunidades para tu próximo circuito educativo."}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={viewState === "result" ? "trophy-variant" : "school-outline"}
                  size={46}
                  color={palette.primary}
                />
              </View>
            </GlassCard>

            {viewState === "catalog" ? (
              <GlassCard intensity={48}>
                <FinancialLearningSection
                  onModuleSelect={handleModuleSelect}
                  selectedModuleId={selectedModuleId}
                />
              </GlassCard>
            ) : null}

            {viewState === "quiz" && activeModule ? (
              <GlassCard intensity={52}>
                <FinancialTrivia
                  module={activeModule}
                  onComplete={handleComplete}
                  onAbort={handleAbort}
                />
              </GlassCard>
            ) : null}

            {viewState === "result" && summary ? (
              <GlassCard intensity={52}>
                <View style={styles.resultsWrapper}>
                  <View style={styles.resultsHeader}>
                    <View style={styles.resultsTitleBlock}>
                      <Text style={styles.resultsTitle}>Resultados</Text>
                      <Text style={styles.resultsSubtitle}>
                        {summary.module.title}
                      </Text>
                    </View>
                    <View style={styles.resultsScorePill}>
                      <MaterialCommunityIcons
                        name="star-circle"
                        size={22}
                        color={palette.primary}
                      />
                      <Text style={styles.resultsScoreLabel}>
                        {summary.totalCorrect}/{summary.totalQuestions} ·
                        {` ${Math.round(summary.accuracy * 100)}%`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.breakdownList}>
                    {summary.breakdown.map((item) => (
                      <View key={item.skill} style={styles.breakdownRow}>
                        <View style={styles.breakdownSkill}>
                          <MaterialCommunityIcons
                            name="target"
                            size={18}
                            color={palette.primary}
                          />
                          <Text style={styles.breakdownSkillLabel}>
                            {skillLabel(item.skill)}
                          </Text>
                        </View>
                        <Text style={styles.breakdownScore}>
                          {item.correct}/{item.total}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.insightsBlock}>
                    <View style={styles.insightRow}>
                      <View style={styles.insightIcon}>
                        <MaterialCommunityIcons
                          name="shield-check"
                          size={18}
                          color={palette.success}
                        />
                      </View>
                      <Text style={styles.insightCopy}>
                        Fortalezas: {formatSkillList(summary.strengths)}
                      </Text>
                    </View>
                    <View style={styles.insightRow}>
                      <View style={styles.insightIconWarning}>
                        <MaterialCommunityIcons
                          name="lightning-bolt-outline"
                          size={18}
                          color={palette.warning}
                        />
                      </View>
                      <Text style={styles.insightCopy}>
                        Oportunidades: {formatSkillList(summary.weaknesses, true)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.recommendations}>
                    <Text style={styles.recommendationsTitle}>Recomendado para ti</Text>
                    {summary.recommendedVideos.map((video) => (
                      <View key={video.url} style={styles.recommendationCard}>
                        <View style={styles.recommendationIcon}>
                          <MaterialCommunityIcons
                            name="play-circle"
                            size={22}
                            color={palette.primary}
                          />
                        </View>
                        <View style={styles.recommendationCopy}>
                          <Text style={styles.recommendationTitle}>{video.title}</Text>
                          <Text style={styles.recommendationMeta}>{video.duration}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.resultsActions}>
                    <PrimaryButton
                      label="Intentar otro tema"
                      onPress={handleBackToCatalog}
                    />
                    <PrimaryButton
                      label="Repetir este módulo"
                      variant="ghost"
                      onPress={handleReplay}
                    />
                  </View>
                </View>
              </GlassCard>
            ) : null}
          </MotiView>
        </ScrollView>

        <Modal transparent visible={showConfirm} animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>¿Listo para jugar?</Text>
              <Text style={styles.modalCopy}>
                {pendingModule?.title} · {pendingModule?.minutes} min · {confirmModuleQuestionCount} preguntas.
                Confirma para abrir la trivia.
              </Text>
              <View style={styles.modalActions}>
                <PrimaryButton
                  label="Cancelar"
                  variant="ghost"
                  onPress={closeModal}
                  compact
                />
                <PrimaryButton
                  label="Vamos"
                  onPress={launchModule}
                  compact
                />
              </View>
            </View>
          </View>
        </Modal>

        {isLoading ? (
          <View style={styles.loadingBackdrop}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={styles.loadingTitle}>Preparando la trivia...</Text>
              <Text style={styles.loadingCopy}>
                Generando retos interactivos y calibrando tus preguntas.
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </FuturisticBackground>
  );
};

const skillLabel = (skill: string) => {
  const mapping: Record<string, string> = {
    "budget-allocation": "Distribución 50/30/20",
    "budget-priorities": "Prioridades del presupuesto",
    "budget-optimization": "Ajustes inteligentes",
    "compound-basics": "Conceptos base",
    "compound-time": "Horizonte temporal",
    "compound-contribution": "Aportes adicionales",
    "compound-risk": "Gestión de riesgo",
    "compound-discipline": "Disciplina de inversión",
    "compound-inflation": "Inflación y rendimiento",
    "emergency-purpose": "Objetivo del fondo",
    "emergency-target": "Meta de ahorro",
    "emergency-location": "Dónde guardarlo",
    "emergency-habits": "Hábitos de aporte",
  };
  return mapping[skill] ?? skill;
};

const formatSkillList = (skills: string[], isWeakness = false) => {
  if (skills.length === 0) {
    return isWeakness
      ? "sin debilidades notables en este circuito"
      : "dominio total en las habilidades evaluadas";
  }
  const mapped = skills.map((skill) => skillLabel(skill));
  if (mapped.length === 1) {
    return mapped[0];
  }
  const last = mapped[mapped.length - 1];
  const rest = mapped.slice(0, -1).join(", ");
  return `${rest} y ${last}`;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 220,
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
  headerSpacer: {
    width: 40,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  heroDescription: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  resultsWrapper: {
    gap: 20,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsTitleBlock: {
    gap: 4,
  },
  resultsTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  resultsSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  resultsScorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(240, 68, 44, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(240, 68, 44, 0.35)",
  },
  resultsScoreLabel: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  breakdownList: {
    gap: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(24, 16, 20, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  breakdownSkill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  breakdownSkillLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  breakdownScore: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  recommendations: {
    gap: 12,
  },
  insightsBlock: {
    gap: 10,
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(24, 16, 20, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(46, 214, 123, 0.18)",
  },
  insightIconWarning: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 182, 72, 0.18)",
  },
  insightCopy: {
    flex: 1,
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  recommendationsTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(24, 16, 20, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  recommendationIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(240, 68, 44, 0.16)",
  },
  recommendationCopy: {
    flex: 1,
    gap: 4,
  },
  recommendationTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  recommendationMeta: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  resultsActions: {
    gap: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(6, 7, 10, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(24, 16, 20, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 16,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  modalCopy: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  loadingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 7, 10, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    backgroundColor: "rgba(24, 16, 20, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 12,
    alignItems: "center",
  },
  loadingTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  loadingCopy: {
    color: palette.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default FinancialEducationScreen;
