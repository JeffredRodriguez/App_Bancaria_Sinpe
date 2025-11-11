import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import PrimaryButton from "./PrimaryButton";
import { Theme, useTheme } from "@/theme/ThemeProvider";

type DateKey = string;

type CalendarDay = {
  key: DateKey;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
};

type CalendarWeek = CalendarDay[];

type SingleDatePickerModalProps = {
  visible: boolean;
  initialDate: DateKey | null;
  onCancel: () => void;
  onConfirm: (value: DateKey) => void;
  title?: string;
  confirmLabel?: string;
  maxDate?: Date | null;
  minDate?: Date | null;
};

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

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
      const num = Number.parseInt(hex, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
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

const toDateKey = (date: Date): DateKey => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (key: DateKey) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const buildMonthMatrix = (anchor: Date, todayKey: DateKey): CalendarWeek[] => {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  const startTime = gridStart.getTime();

  const weeks: CalendarWeek[] = [];
  for (let week = 0; week < 6; week += 1) {
    const days: CalendarDay[] = [];
    for (let day = 0; day < 7; day += 1) {
      const current = new Date(startTime + (week * 7 + day) * MS_IN_DAY);
      const key = toDateKey(current);
      days.push({
        key,
        date: current,
        inCurrentMonth: current.getMonth() === anchor.getMonth(),
        isToday: key === todayKey,
      });
    }
    weeks.push(days);
  }
  return weeks;
};

const SingleDatePickerModal = ({
  visible,
  initialDate,
  onCancel,
  onConfirm,
  title = "Selecciona una fecha",
  confirmLabel = "Guardar",
  maxDate = null,
  minDate = null,
}: SingleDatePickerModalProps) => {
  const { theme } = useTheme();
  const palette = theme.palette;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const base = initialDate ? parseDateKey(initialDate) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [draftDate, setDraftDate] = useState<DateKey | null>(initialDate);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const base = initialDate ? parseDateKey(initialDate) : new Date();
    setAnchorMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setDraftDate(initialDate);
    setYearPickerVisible(false);
  }, [visible, initialDate]);

  const monthMatrix = useMemo(
    () => buildMonthMatrix(anchorMonth, todayKey),
    [anchorMonth, todayKey],
  );

  const monthLabel = useMemo(
    () =>
      anchorMonth.toLocaleDateString("es-CR", {
        month: "long",
        year: "numeric",
      }),
    [anchorMonth],
  );

  const yearOptions = useMemo(() => {
    const currentYear = anchorMonth.getFullYear();
    const startYear = currentYear - 3;
    return Array.from({ length: 7 }, (_, index) => startYear + index);
  }, [anchorMonth]);

  const selectionSummary = useMemo(() => {
    if (!draftDate) {
      return "Selecciona una fecha de inicio";
    }
    return parseDateKey(draftDate).toLocaleDateString("es-CR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [draftDate]);

  const maxTime = useMemo(() => (maxDate ? endOfDay(maxDate).getTime() : null), [maxDate]);
  const minTime = useMemo(() => (minDate ? startOfDay(minDate).getTime() : null), [minDate]);

  const handleNavigate = (direction: number) => {
    setYearPickerVisible(false);
    setAnchorMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleSelectDay = (dayKey: DateKey, disabled: boolean) => {
    if (disabled) {
      return;
    }
    setDraftDate(dayKey);
  };

  const handleYearSelect = (year: number) => {
    setAnchorMonth((prev) => new Date(year, prev.getMonth(), 1));
    setYearPickerVisible(false);
  };

  const canConfirm = Boolean(draftDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} accessibilityRole="button" />
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 260 }}
          style={styles.card}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{selectionSummary}</Text>
          </View>

          <View style={styles.nav}>
            <Pressable
              onPress={() => handleNavigate(-1)}
              accessibilityRole="button"
              style={styles.navButton}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={palette.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => setYearPickerVisible((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel="Seleccionar año"
              style={styles.monthSelector}
            >
              <Text style={styles.navLabel}>{monthLabel}</Text>
              <MaterialCommunityIcons
                name={yearPickerVisible ? "chevron-up" : "chevron-down"}
                size={18}
                color={palette.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => handleNavigate(1)}
              accessibilityRole="button"
              style={styles.navButton}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={palette.textSecondary}
              />
            </Pressable>
          </View>

          {yearPickerVisible ? (
            <View style={styles.yearPicker}>
              {yearOptions.map((year) => {
                const isActive = year === anchorMonth.getFullYear();
                return (
                  <Pressable
                    key={year}
                    onPress={() => handleYearSelect(year)}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar año ${year}`}
                    style={[styles.yearOption, isActive && styles.yearOptionActive]}
                  >
                    <Text
                      style={[styles.yearOptionLabel, isActive && styles.yearOptionLabelActive]}
                    >
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.calendar}>
            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((day) => (
                <Text key={day} style={styles.weekdayLabel}>
                  {day}
                </Text>
              ))}
            </View>
            {monthMatrix.map((week) => (
              <View key={week[0].key} style={styles.weekRow}>
                {week.map((day) => {
                  const dayTime = day.date.getTime();
                  const isDisabled = Boolean(
                    (maxTime !== null && dayTime > maxTime) ||
                      (minTime !== null && dayTime < minTime),
                  );
                  const isSelected = draftDate === day.key;
                  const dayStyles: StyleProp<ViewStyle>[] = [styles.dayCell];
                  const labelStyles: StyleProp<TextStyle>[] = [styles.dayLabel];

                  if (!day.inCurrentMonth) {
                    dayStyles.push(styles.dayOutside);
                    labelStyles.push(styles.dayOutsideLabel);
                  }
                  if (isSelected) {
                    dayStyles.push(styles.daySelected);
                    labelStyles.push(styles.dayLabelSelected);
                  }
                  if (day.isToday) {
                    dayStyles.push(styles.dayToday);
                  }
                  if (isDisabled) {
                    dayStyles.push(styles.dayDisabled);
                    labelStyles.push(styles.dayDisabledLabel);
                  }

                  return (
                    <Pressable
                      key={day.key}
                      onPress={() => handleSelectDay(day.key, isDisabled)}
                      style={dayStyles as StyleProp<ViewStyle>}
                      disabled={isDisabled}
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar ${parseDateKey(day.key).toLocaleDateString("es-CR")}`}
                    >
                      <Text style={labelStyles as StyleProp<TextStyle>}>{day.date.getDate()}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={() => setDraftDate(null)} accessibilityRole="button">
              <Text style={styles.actionText}>Limpiar</Text>
            </Pressable>
            <Pressable onPress={onCancel} accessibilityRole="button">
              <Text style={styles.actionText}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label={confirmLabel}
              variant="ghost"
              onPress={() => {
                if (draftDate) {
                  onConfirm(draftDate);
                }
              }}
              disabled={!canConfirm}
              style={styles.confirmButton}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme) => {
  const { palette, components } = theme;
  const inputTokens = components.input;
  const accentCyan = palette.accentCyan;
  const accentPurple = palette.accentPurple;
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: withOpacity(palette.overlay, 0.82),
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 18,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      borderRadius: 28,
      backgroundColor: palette.elevatedSurface,
      borderWidth: 1,
      borderColor: palette.border,
      paddingVertical: 22,
      paddingHorizontal: 24,
      gap: 22,
    },
    header: {
      gap: 6,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: palette.textPrimary,
      letterSpacing: 0.2,
    },
    subtitle: {
      fontSize: 13,
      color: palette.textSecondary,
    },
    nav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    navButton: {
      width: 42,
      height: 42,
      borderRadius: 18,
      backgroundColor: inputTokens.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    monthSelector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 18,
      backgroundColor: inputTokens.iconBackground,
    },
    navLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: palette.textPrimary,
      textTransform: "capitalize",
    },
    calendar: {
      gap: 8,
    },
    weekRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    weekdayLabel: {
      flex: 1,
      textAlign: "center",
      fontSize: 13,
      fontWeight: "600",
      color: palette.textMuted,
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: withOpacity(palette.textPrimary, 0.05),
    },
    dayLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    dayOutside: {
      opacity: 0.4,
    },
    dayOutsideLabel: {
      color: palette.textSecondary,
    },
    daySelected: {
      backgroundColor: withOpacity(accentCyan, 0.18),
      borderWidth: 1,
      borderColor: withOpacity(accentCyan, 0.45),
    },
    dayLabelSelected: {
      color: palette.textPrimary,
    },
    dayToday: {
      borderWidth: 1,
      borderColor: withOpacity(accentPurple, 0.6),
    },
    dayDisabled: {
      opacity: 0.3,
    },
    dayDisabledLabel: {
      color: palette.textMuted,
    },
    yearPicker: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      padding: 12,
      borderRadius: 18,
      backgroundColor: withOpacity(palette.overlay, 0.9),
      borderWidth: 1,
      borderColor: palette.border,
    },
    yearOption: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: withOpacity(palette.textPrimary, 0.05),
    },
    yearOptionActive: {
      backgroundColor: withOpacity(accentCyan, 0.14),
    },
    yearOptionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: palette.textSecondary,
    },
    yearOptionLabelActive: {
      color: palette.textPrimary,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 16,
    },
    actionText: {
      fontSize: 14,
      fontWeight: "600",
      color: palette.textSecondary,
    },
    confirmButton: {
      minWidth: 120,
    },
  });
};

export { parseDateKey, toDateKey };
export type { DateKey };
export default SingleDatePickerModal;
