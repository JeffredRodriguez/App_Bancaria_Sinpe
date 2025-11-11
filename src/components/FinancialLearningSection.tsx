import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, PanResponder } from "react-native";

import { Theme, useTheme } from "@/theme/ThemeProvider";


export type TriviaQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  skill: string;
};

export type VideoSuggestion = {
  skill: string;
  title: string;
  duration: string;
  url: string;
};

export type LearningModule = {
  id: string;
  title: string;
  caption: string;
  icon: string;
  minutes: number;
  trivia: TriviaQuestion[];
  videoSuggestions: VideoSuggestion[];
};

export const SECONDS_PER_QUESTION = 30;

export const learningModules: LearningModule[] = [
  {
    id: "budget",
    title: "Presupuesto 50/30/20",
    caption: "Divide tus ingresos en necesidades, deseos y ahorro.",
    icon: "chart-donut",
    minutes: 2,
    trivia: [
      {
        question:
          "Si tus ingresos son CRC 600 000 mensuales, ¿cuánto destinas a deseos según la regla 50/30/20?",
        options: ["CRC 180 000", "CRC 300 000", "CRC 120 000"],
        correctIndex: 0,
        explanation:
          "El 30% corresponde a deseos: 0.30 x 600 000 = 180 000.",
        skill: "budget-allocation",
      },
      {
        question: "¿Qué gasto debería ir en el 50% de necesidades?",
        options: ["Suscripciones de streaming", "Renta", "Caprichos espontáneos"],
        correctIndex: 1,
        explanation:
          "Las necesidades cubren vivienda, alimentación básica y servicios esenciales como la renta.",
        skill: "budget-priorities",
      },
      {
        question:
          "Recibes un aguinaldo de CRC 150 000. ¿Qué destino respeta la regla 50/30/20?",
        options: [
          "Gastarlo todo en regalos",
          "Apartar CRC 30 000 para ahorro y CRC 45 000 para deseos",
          "Invertirlo completo en entretenimiento",
        ],
        correctIndex: 1,
        explanation:
          "El 20% va al ahorro (30 000) y el 30% a deseos (45 000); el resto refuerza necesidades o ahorro extra.",
        skill: "budget-optimization",
      },
      {
        question:
          "Si tus gastos de deseos superan el 30% durante dos meses, ¿qué ajuste se recomienda?",
        options: [
          "Ignorarlo, seguro se acomoda",
          "Revisar el presupuesto y recortar para reforzar el ahorro",
          "Aumentar el límite de la tarjeta de crédito",
        ],
        correctIndex: 1,
        explanation:
          "Revisar categorías y mover parte al ahorro evita que los deseos crezcan sin control.",
        skill: "budget-optimization",
      },
    ],
    videoSuggestions: [
      {
        skill: "budget-allocation",
        title: "Videos: Domina la regla 50/30/20 en 10 minutos",
        duration: "7 min",
        url: "/videos/presupuesto/regla-503020",
      },
      {
        skill: "budget-priorities",
        title: "Videos: Diferencia deseos vs necesidades sin confundirte",
        duration: "6 min",
        url: "/videos/presupuesto/deseos-vs-necesidades",
      },
      {
        skill: "budget-optimization",
        title: "Videos: Ajustes rápidos cuando tu 30% se dispara",
        duration: "5 min",
        url: "/videos/presupuesto/ajustes-rapidos",
      },
    ],
  },
  {
    id: "compound",
    title: "Interés compuesto",
    caption: "Un aporte mensual pequeño crece exponencialmente.",
    icon: "trending-up",
    minutes: 3,
    trivia: [
      {
        question:
          "Si reinviertes los intereses de un ahorro, ¿qué sucede con tu capital?",
        options: [
          "Crece de forma acelerada",
          "Se mantiene igual",
          "Se reduce poco a poco",
        ],
        correctIndex: 0,
        explanation:
          "El interés compuesto hace que los intereses generen nuevos intereses, acelerando el crecimiento del capital.",
        skill: "compound-basics",
      },
      {
        question: "¿Qué factor potencia más el interés compuesto?",
        options: [
          "Retirar el dinero cada mes",
          "Aumentar el tiempo de inversión",
          "Cambiar de banco constantemente",
        ],
        correctIndex: 1,
        explanation:
          "Mientras más tiempo inviertas, más ciclos de capitalización se acumulan y mayor es el efecto.",
        skill: "compound-time",
      },
      {
        question:
          "¿Qué acción impulsa más tus ganancias en el largo plazo?",
        options: [
          "Hacer aportes adicionales periódicos",
          "Detener los aportes cuando suben las tasas",
          "Invertir solo cuando hay bonificaciones",
        ],
        correctIndex: 0,
        explanation:
          "Los aportes extra aumentan la base que genera nuevos intereses.",
        skill: "compound-contribution",
      },
      {
        question:
          "¿Cómo afecta la volatilidad a una inversión con interés compuesto?",
        options: [
          "La protege completamente",
          "Puede reducir el capital si retiras en pérdidas",
          "No tiene ningún impacto",
        ],
        correctIndex: 1,
        explanation:
          "La volatilidad puede afectar si retiras en el momento equivocado; mantener la estrategia ayuda a suavizarla.",
        skill: "compound-risk",
      },
      {
        question:
          "Para aprovechar el interés compuesto, ¿qué hábito es clave?",
        options: [
          "Aportar con disciplina incluso en montos pequeños",
          "Esperar a tener grandes sumas para invertir",
          "Cambiar de estrategia cada mes",
        ],
        correctIndex: 0,
        explanation:
          "La disciplina da consistencia y permite que cada periodo capitalice.",
        skill: "compound-discipline",
      },
      {
        question:
          "¿Por qué considerar la inflación al proyectar ganancias compuestas?",
        options: [
          "Porque reduce el poder adquisitivo real",
          "Porque aumenta la tasa nominal",
          "Porque elimina los impuestos",
        ],
        correctIndex: 0,
        explanation:
          "La inflación puede erosionar las ganancias reales; proyectar en términos reales evita sorpresas.",
        skill: "compound-inflation",
      },
    ],
    videoSuggestions: [
      {
        skill: "compound-basics",
        title: "Videos: Interés compuesto explicado con animaciones",
        duration: "8 min",
        url: "/videos/interes-compuesto/basicos",
      },
      {
        skill: "compound-contribution",
        title: "Videos: Cómo aprovechar aportes extra en tus inversiones",
        duration: "6 min",
        url: "/videos/interes-compuesto/aportes-extra",
      },
      {
        skill: "compound-discipline",
        title: "Videos: Rutinas mensuales para invertir sin olvidar",
        duration: "7 min",
        url: "/videos/interes-compuesto/rutinas-disciplinadas",
      },
    ],
  },
  {
    id: "emergency",
    title: "Fondo de emergencia",
    caption: "Resguarda 3-6 meses de gastos para imprevistos.",
    icon: "shield-home",
    minutes: 2,
    trivia: [
      {
        question: "¿Cuál es el objetivo del fondo de emergencia?",
        options: [
          "Gastar en vacaciones",
          "Cubrir gastos inesperados sin endeudarte",
          "Invertir en criptomonedas",
        ],
        correctIndex: 1,
        explanation:
          "El fondo protege tus finanzas ante imprevistos sin recurrir a deuda costosa.",
        skill: "emergency-purpose",
      },
      {
        question:
          "Si tus gastos mensuales son CRC 350 000, ¿cuánto deberías acumular para un fondo de 4 meses?",
        options: ["CRC 1 050 000", "CRC 700 000", "CRC 1 400 000"],
        correctIndex: 2,
        explanation:
          "Multiplica los gastos mensuales por los meses objetivo: 350 000 x 4 = 1 400 000.",
        skill: "emergency-target",
      },
      {
        question: "¿Dónde guardar el fondo de emergencia?",
        options: [
          "En una cuenta separada y líquida",
          "En una inversión de alto riesgo",
          "En efectivo debajo del colchón",
        ],
        correctIndex: 0,
        explanation:
          "Debe estar disponible y seguro; una cuenta líquida separada facilita su uso.",
        skill: "emergency-location",
      },
      {
        question: "¿Qué hábito ayuda a mantener el fondo de emergencia vivo?",
        options: [
          "Aportar una cantidad fija cada mes",
          "Usarlo para compras impulsivas",
          "Olvidarse de reponerlo si se usa",
        ],
        correctIndex: 0,
        explanation:
          "Aportar de forma constante y reponerlo tras usarlo lo mantiene listo para el próximo imprevisto.",
        skill: "emergency-habits",
      },
    ],
    videoSuggestions: [
      {
        skill: "emergency-purpose",
        title: "Videos: ¿Por qué el fondo de emergencia te salva del estrés?",
        duration: "5 min",
        url: "/videos/fondo-emergencia/por-que-importa",
      },
      {
        skill: "emergency-location",
        title: "Videos: Dónde guardar tu fondo y ganar intereses",
        duration: "6 min",
        url: "/videos/fondo-emergencia/donde-guardarlo",
      },
      {
        skill: "emergency-habits",
        title: "Videos: Micro aportes mensuales para tu fondo",
        duration: "4 min",
        url: "/videos/fondo-emergencia/micro-aportes",
      },
    ],
  },
];

type FinancialLearningSectionProps = {
  onModuleSelect?: (module: LearningModule) => void;
  selectedModuleId?: string;
};

const FinancialLearningSection = ({
  onModuleSelect,
  selectedModuleId,
}: FinancialLearningSectionProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? learningModules.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      prev === learningModules.length - 1 ? 0 : prev + 1
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 50) {
            handlePrevious();
          } else if (gestureState.dx < -50) {
            handleNext();
          }
        },
      }),
    []
  );

  const currentModule = learningModules[currentIndex];
  const isActive = currentModule?.id === selectedModuleId;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>Laboratorio financiero</Text>
      <View style={styles.badge}>
        <MaterialCommunityIcons
          name="flash"
          size={14}
          color={theme.palette.textPrimary}
        />
        <Text style={styles.badgeLabel}>Selecciona un reto</Text>
      </View>
      <Text style={styles.subtitle}>
        Elige una cápsula para desbloquear su trivia guiada y dominarla en
        minutos.
      </Text>

      <View style={styles.carouselContainer}>
        <Pressable
          style={styles.arrowButton}
          onPress={handlePrevious}
          accessibilityRole="button"
          accessibilityLabel="Módulo anterior"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={26}
            color={theme.palette.textPrimary}
          />
        </Pressable>

        <View style={styles.cardWrapper} {...panResponder.panHandlers}>
          <Pressable
            style={styles.lessonPressable}
            onPress={() => onModuleSelect?.(currentModule)}
            disabled={!onModuleSelect}
            accessibilityRole={onModuleSelect ? "button" : undefined}
            accessibilityState={{ selected: isActive }}
          >
            <MotiView
              key={currentModule.id}
              style={[styles.lessonCard, isActive && styles.lessonCardActive]}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "timing",
                duration: 300,
              }}
            >
              <View style={styles.iconPill}>
                <MaterialCommunityIcons
                  name={currentModule.icon as any}
                  size={22}
                  color={theme.palette.textPrimary}
                />
              </View>
              <Text style={styles.lessonTitle}>{currentModule.title}</Text>
              <Text style={styles.lessonCaption}>{currentModule.caption}</Text>
              <View style={styles.lessonFooter}>
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={18}
                  color={theme.palette.textMuted}
                />
                <Text style={styles.lessonMeta}>
                  {currentModule.minutes} min · {currentModule.trivia.length} preguntas
                </Text>
              </View>
              {isActive ? (
                <View style={styles.lessonSelectedBadge}>
                  <MaterialCommunityIcons
                    name="star-four-points"
                    size={16}
                    color={theme.palette.primary}
                  />
                  <Text style={styles.lessonSelectedLabel}>Preparado</Text>
                </View>
              ) : null}
            </MotiView>
          </Pressable>
        </View>

        <Pressable
          style={styles.arrowButton}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel="Siguiente módulo"
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={26}
            color={theme.palette.textPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.dotsContainer}>
        {learningModules.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      gap: 18,
    },
    sectionTitle: {
      color: theme.palette.textPrimary,
      fontSize: 18,
      fontWeight: "700",
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "rgba(240, 68, 44, 0.18)",
      borderWidth: 1,
      borderColor: "rgba(240, 68, 44, 0.35)",
      alignSelf: "flex-start",
    },
    badgeLabel: {
      color: theme.palette.textPrimary,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    subtitle: {
      color: theme.palette.textSecondary,
      fontSize: 13,
      lineHeight: 19,
    },
    carouselContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginTop: 8,
    },
    arrowButton: {
      width: 40,
      height: 40,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.06)",
    },
    cardWrapper: {
      flex: 1,
    },
    lessonPressable: {
      flex: 1,
      borderRadius: 22,
    },
    lessonCard: {
      padding: 26,
      borderRadius: 22,
      backgroundColor: "rgba(24, 14, 18, 0.76)",
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.08)",
      gap: 16,
      minHeight: 260,
    },
    lessonCardActive: {
      borderColor: "rgba(240, 68, 44, 0.6)",
      backgroundColor: "rgba(24, 14, 18, 0.9)",
    },
    iconPill: {
      width: 38,
      height: 38,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 240, 238, 0.14)",
    },
    lessonTitle: {
      color: theme.palette.textPrimary,
      fontSize: 16,
      fontWeight: "700",
    },
    lessonCaption: {
      color: theme.palette.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    lessonFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 2,
    },
    lessonMeta: {
      color: theme.palette.textMuted,
      fontSize: 12,
      fontWeight: "600",
    },
    lessonSelectedBadge: {
      marginTop: 10,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: "rgba(240, 68, 44, 0.18)",
      borderWidth: 1,
      borderColor: "rgba(240, 68, 44, 0.35)",
    },
    lessonSelectedLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      color: theme.palette.primary,
      textTransform: "uppercase",
    },
    dotsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    dotActive: {
      backgroundColor: theme.palette.primary,
      width: 24,
    },
  });

export default FinancialLearningSection;
