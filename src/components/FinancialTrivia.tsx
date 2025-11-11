import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import PrimaryButton from "@/components/PrimaryButton";
import {
  LearningModule,
  SECONDS_PER_QUESTION,
  TriviaQuestion,
  VideoSuggestion,
} from "@/components/FinancialLearningSection";
import { Theme, useTheme } from "@/theme/ThemeProvider";

export type TriviaSummary = {
  module: LearningModule;
  totalCorrect: number;
  totalQuestions: number;
  accuracy: number;
  breakdown: Array<{
    skill: string;
    correct: number;
    total: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendedVideos: VideoSuggestion[];
};

type FinancialTriviaProps = {
  module: LearningModule;
  onComplete: (summary: TriviaSummary) => void;
  onAbort: () => void;
};

type AnswerRecord = {
  selectedIndex: number;
  correct: boolean;
  skill: string;
};

const FinancialTrivia = ({ module, onComplete, onAbort }: FinancialTriviaProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const questions = module.trivia;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});

  if (questions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons
          name="gesture-tap"
          size={32}
          color={theme.palette.textMuted}
        />
        <Text style={styles.emptyTitle}>Sin trivia disponible</Text>
        <Text style={styles.emptyCopy}>
          Este módulo aún no tiene preguntas activas. Vuelve pronto para continuar aprendiendo.
        </Text>
        <PrimaryButton
          label="Volver al laboratorio"
          variant="ghost"
          onPress={onAbort}
          compact
        />
      </View>
    );
  }

  const activeQuestion = questions[questionIndex];
  const isLastQuestion = questionIndex === questions.length - 1;
  const activeAnswer = answers[questionIndex];

  const estimatedDuration = Math.ceil(
    (questions.length * SECONDS_PER_QUESTION) / 60
  );

  const handleOptionPress = (index: number) => {
    if (showFeedback || !activeQuestion) {
      return;
    }
    const isCorrect = index === activeQuestion.correctIndex;
    setSelectedOption(index);
    setShowFeedback(true);
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        selectedIndex: index,
        correct: isCorrect,
        skill: activeQuestion.skill,
      },
    }));
  };

  const handleNext = () => {
    if (!activeQuestion) {
      return;
    }
    if (isLastQuestion) {
      onComplete(buildSummary());
      return;
    }
    setQuestionIndex((prev) => prev + 1);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  const buildSummary = (): TriviaSummary => {
    const breakdownMap = new Map<string, { correct: number; total: number }>();

    questions.forEach((question, idx) => {
      const record = answers[idx];
      const skill = question.skill;
      const entry = breakdownMap.get(skill) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (record?.correct) {
        entry.correct += 1;
      }
      breakdownMap.set(skill, entry);
    });

    const breakdown = Array.from(breakdownMap.entries()).map(([skill, value]) => ({
      skill,
      correct: value.correct,
      total: value.total,
    }));

    const totalCorrect = breakdown.reduce((sum, item) => sum + item.correct, 0);
    const totalQuestions = questions.length;
    const accuracy = totalQuestions === 0 ? 0 : totalCorrect / totalQuestions;

    const weaknesses = breakdown
      .filter((item) => item.total > 0 && item.correct / item.total < 0.7)
      .map((item) => item.skill);

    const strengths = breakdown
      .filter((item) => item.total > 0 && item.correct === item.total)
      .map((item) => item.skill);

    let recommendedVideos = module.videoSuggestions.filter((video) =>
      weaknesses.includes(video.skill)
    );

    if (recommendedVideos.length === 0 && module.videoSuggestions.length > 0) {
      recommendedVideos = module.videoSuggestions.slice(0, 1);
    }

    return {
      module,
      totalCorrect,
      totalQuestions,
      accuracy,
      breakdown,
      strengths,
      weaknesses,
      recommendedVideos,
    };
  };

  const renderOptionIcon = (isAnswer: boolean, isSelected: boolean) => {
    if (!showFeedback) {
      return (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={theme.palette.textMuted}
        />
      );
    }

    if (isAnswer) {
      return (
        <MaterialCommunityIcons
          name="check-circle"
          size={22}
          color="#2ED573"
        />
      );
    }

    if (isSelected) {
      return (
        <MaterialCommunityIcons
          name="close-circle"
          size={22}
          color={theme.palette.danger}
        />
      );
    }

    return (
      <MaterialCommunityIcons
        name="circle-outline"
        size={20}
        color={theme.palette.textMuted}
      />
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.quizHeader}>
        <View>
          <Text style={styles.quizModuleLabel}>{module.title}</Text>
          <Text style={styles.quizMeta}>
            {module.minutes} min estimados · {questions.length} preguntas · ~
            {estimatedDuration} min reales
          </Text>
        </View>
        <Text style={styles.progressLabel}>
          {questionIndex + 1}/{questions.length}
        </Text>
      </View>

      <MotiView
        key={activeQuestion.question}
        style={styles.card}
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280 }}
      >
        <Text style={styles.questionText}>{activeQuestion.question}</Text>

        <View style={styles.optionsList}>
          {activeQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isAnswer = index === activeQuestion.correctIndex;
            const showHighlight = showFeedback && (isSelected || isAnswer);

            const backgroundColor = showHighlight
              ? isAnswer
                ? "rgba(44, 187, 120, 0.2)"
                : "rgba(240, 68, 44, 0.2)"
              : "rgba(20, 20, 24, 0.45)";

            const borderColor = showHighlight
              ? isAnswer
                ? "rgba(46, 213, 115, 0.85)"
                : "rgba(240, 68, 44, 0.7)"
              : "rgba(255,255,255,0.12)";

            return (
              <Pressable
                key={option}
                style={[styles.optionButton, { backgroundColor, borderColor }]}
                onPress={() => handleOptionPress(index)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.optionLabel}>{option}</Text>
                {renderOptionIcon(isAnswer, isSelected)}
              </Pressable>
            );
          })}
        </View>

        {showFeedback && activeAnswer ? (
          <View style={styles.feedbackBox}>
            <View style={styles.feedbackHeader}>
              <MaterialCommunityIcons
                name={activeAnswer.correct ? "party-popper" : "lightbulb-on-outline"}
                size={22}
                color={activeAnswer.correct ? "#2ED573" : theme.palette.warning}
              />
              <Text style={styles.feedbackTitle}>
                {activeAnswer.correct ? "¡Exacto!" : "Dato clave"}
              </Text>
            </View>
            <Text style={styles.feedbackCopy}>{activeQuestion.explanation}</Text>
            <PrimaryButton
              label={isLastQuestion ? "Ver resultados" : "Siguiente pregunta"}
              onPress={handleNext}
              style={styles.primaryAction}
              compact
            />
            <PrimaryButton
              label="Salir del módulo"
              variant="ghost"
              onPress={onAbort}
              compact
            />
          </View>
        ) : (
          <Text style={styles.helperCopy}>
            Toca una respuesta para desbloquear el consejo experto.
          </Text>
        )}
      </MotiView>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      gap: 18,
    },
    quizHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    quizModuleLabel: {
      color: theme.palette.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    quizMeta: {
      color: theme.palette.textSecondary,
      fontSize: 13,
      marginTop: 4,
    },
    progressLabel: {
      color: theme.palette.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },
    card: {
      gap: 18,
      borderRadius: 24,
      padding: 20,
      backgroundColor: theme.components.card.background,
      borderWidth: theme.components.card.borderWidth,
      borderColor: theme.components.card.border,
    },
    questionText: {
      color: theme.palette.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      lineHeight: 26,
    },
    optionsList: {
      gap: 12,
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 18,
      borderWidth: 1,
      gap: 14,
    },
    optionLabel: {
      flex: 1,
      color: theme.palette.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },
    feedbackBox: {
      gap: 14,
      padding: 16,
      borderRadius: 18,
      backgroundColor: "rgba(26, 18, 22, 0.92)",
      borderWidth: 1,
      borderColor: "rgba(255, 240, 238, 0.1)",
    },
    feedbackHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    feedbackTitle: {
      color: theme.palette.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    feedbackCopy: {
      color: theme.palette.textSecondary,
      fontSize: 13,
      lineHeight: 20,
    },
    helperCopy: {
      color: theme.palette.textMuted,
      fontSize: 13,
      textAlign: "center",
    },
    primaryAction: {
      alignSelf: "flex-start",
    },
    emptyState: {
      alignItems: "center",
      gap: 16,
    },
    emptyTitle: {
      color: theme.palette.textPrimary,
      fontSize: 17,
      fontWeight: "700",
    },
    emptyCopy: {
      color: theme.palette.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      textAlign: "center",
    },
  });

export default FinancialTrivia;
