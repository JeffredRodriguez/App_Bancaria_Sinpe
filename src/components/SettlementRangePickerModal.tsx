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
import { palette } from "@/theme/colors";
import { DateKey, parseDateKey, toDateKey } from "./SingleDatePickerModal";

type SettlementRange = { start: DateKey | null; end: DateKey | null };

type SettlementRangePickerModalProps = {
  visible: boolean;
  initialRange: SettlementRange;
  onCancel: () => void;
  onApply: (range: { start: DateKey; end: DateKey }) => void;
  title?: string;
  applyLabel?: string;
};

type Mode = "month" | "range";
type CalendarDay = {
  key: DateKey;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
};
type CalendarWeek = CalendarDay[];

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

const monthLabelFormatter = new Intl.DateTimeFormat("es-CR", {
  month: "long",
  year: "numeric",
});

const rangeLabelFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

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

const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
};

const isFullMonthRange = (range: SettlementRange) => {
  if (!range.start || !range.end) {
    return false;
  }
  const startDate = parseDateKey(range.start);
  const endDate = parseDateKey(range.end);
  const monthBounds = getMonthBounds(startDate);
  return (
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    range.start === monthBounds.startKey &&
    range.end === monthBounds.endKey
  );
};

const SettlementRangePickerModal = ({
  visible,
  initialRange,
  onCancel,
  onApply,
  title = "Selecciona un periodo",
  applyLabel = "Aplicar",
}: SettlementRangePickerModalProps) => {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const base = initialRange.start ? parseDateKey(initialRange.start) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [draftRange, setDraftRange] = useState<SettlementRange>(initialRange);
  const [mode, setMode] = useState<Mode>(() => (isFullMonthRange(initialRange) ? "month" : "range"));
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const base = initialRange.start ? parseDateKey(initialRange.start) : new Date();
    const anchor = new Date(base.getFullYear(), base.getMonth(), 1);
    setAnchorMonth(anchor);
    setYearPickerVisible(false);
    if (initialRange.start && initialRange.end) {
      const nextMode = isFullMonthRange(initialRange) ? "month" : "range";
      setMode(nextMode);
      if (nextMode === "month") {
        const bounds = getMonthBounds(anchor);
        setDraftRange({ start: bounds.startKey, end: bounds.endKey });
      } else {
        setDraftRange(initialRange);
      }
    } else {
      setMode("range");
      setDraftRange({ start: null, end: null });
    }
  }, [visible, initialRange]);

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

  const todayEnd = useMemo(() => new Date().setHours(23, 59, 59, 999), []);
  const canApply = Boolean(draftRange.start && draftRange.end);

  const selectionSummary = useMemo(() => {
    if (draftRange.start && draftRange.end) {
      if (isFullMonthRange(draftRange)) {
        return `Mes completo · ${monthLabelFormatter.format(parseDateKey(draftRange.start))}`;
      }
      const startLabel = rangeLabelFormatter.format(parseDateKey(draftRange.start));
      const endLabel = rangeLabelFormatter.format(parseDateKey(draftRange.end));
      return `${startLabel} — ${endLabel}`;
    }
    if (draftRange.start) {
      return `${rangeLabelFormatter.format(parseDateKey(draftRange.start))} · selecciona fecha final`;
    }
    return "Selecciona un periodo";
  }, [draftRange]);

  const applyMonthMode = (base: Date) => {
    const bounds = getMonthBounds(base);
    setDraftRange({ start: bounds.startKey, end: bounds.endKey });
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    if (nextMode === "month") {
      applyMonthMode(anchorMonth);
    }
  };

  const handleNavigate = (direction: number) => {
    setYearPickerVisible(false);
    setAnchorMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
      if (mode === "month") {
        applyMonthMode(next);
      }
      return next;
    });
  };

  const handleSelectDay = (dayKey: DateKey, disabled: boolean) => {
    if (disabled) {
      return;
    }
    const date = parseDateKey(dayKey);
    if (mode === "month") {
      applyMonthMode(date);
      setAnchorMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      return;
    }
    if (!draftRange.start || (draftRange.start && draftRange.end)) {
      setDraftRange({ start: dayKey, end: null });
      return;
    }
    if (dayKey < draftRange.start) {
      setDraftRange({ start: dayKey, end: null });
      return;
    }
    setDraftRange({ start: draftRange.start, end: dayKey });
  };

  const handleYearSelect = (year: number) => {
    const next = new Date(year, anchorMonth.getMonth(), 1);
    setAnchorMonth(next);
    setYearPickerVisible(false);
    if (mode === "month") {
      applyMonthMode(next);
    }
  };

  const handleApply = () => {
    if (!draftRange.start || !draftRange.end) {
      return;
    }
    onApply({ start: draftRange.start, end: draftRange.end });
  };

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

          <View style={styles.modeToggle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seleccionar mes completo"
              onPress={() => handleModeChange("month")}
              style={[styles.modeChip, mode === "month" && styles.modeChipActive]}
            >
              <Text style={[styles.modeChipLabel, mode === "month" && styles.modeChipLabelActive]}>
                Mes completo
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seleccionar rango personalizado"
              onPress={() => handleModeChange("range")}
              style={[styles.modeChip, mode === "range" && styles.modeChipActive]}
            >
              <Text style={[styles.modeChipLabel, mode === "range" && styles.modeChipLabelActive]}>
                Rango personalizado
              </Text>
            </Pressable>
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
                  const isDisabled = dayTime > todayEnd;
                  const isSelectedStart = draftRange.start === day.key;
                  const isSelectedEnd = draftRange.end === day.key;
                  const hasRange = draftRange.start && draftRange.end;
                  const isBetween = Boolean(
                    hasRange &&
                      draftRange.start &&
                      draftRange.end &&
                      day.key > draftRange.start &&
                      day.key < draftRange.end,
                  );
                  const dayStyles: StyleProp<ViewStyle>[] = [styles.dayCell];
                  const labelStyles: StyleProp<TextStyle>[] = [styles.dayLabel];

                  if (!day.inCurrentMonth) {
                    dayStyles.push(styles.dayOutside);
                    labelStyles.push(styles.dayOutsideLabel);
                  }
                  if (isBetween) {
                    dayStyles.push(styles.dayInRange);
                  }
                  if (isSelectedStart || isSelectedEnd) {
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
                      accessibilityLabel={`Seleccionar ${rangeLabelFormatter.format(day.date)}`}
                    >
                      <Text style={labelStyles as StyleProp<TextStyle>}>{day.date.getDate()}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                setDraftRange({ start: null, end: null });
                setMode("range");
              }}
              accessibilityRole="button"
            >
              <Text style={styles.actionText}>Limpiar</Text>
            </Pressable>
            <Pressable onPress={onCancel} accessibilityRole="button">
              <Text style={styles.actionText}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label={applyLabel}
              variant="ghost"
              onPress={handleApply}
              disabled={!canApply}
              style={styles.applyButton}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(1, 4, 12, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 28,
    backgroundColor: "rgba(5, 12, 24, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.09)",
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
  modeToggle: {
    flexDirection: "row",
    gap: 10,
  },
  modeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
  },
  modeChipActive: {
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 240, 255, 0.14)",
  },
  modeChipLabel: {
    color: palette.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  modeChipLabelActive: {
    color: palette.textPrimary,
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
    backgroundColor: "rgba(255, 255, 255, 0.06)",
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
    backgroundColor: "rgba(255, 255, 255, 0.06)",
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
    textTransform: "uppercase",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
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
  dayInRange: {
    backgroundColor: "rgba(0, 240, 255, 0.1)",
  },
  daySelected: {
    backgroundColor: "rgba(0, 240, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.45)",
  },
  dayLabelSelected: {
    color: palette.textPrimary,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: "rgba(114, 89, 255, 0.6)",
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
    backgroundColor: "rgba(8, 12, 24, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  yearOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  yearOptionActive: {
    backgroundColor: "rgba(0, 240, 255, 0.14)",
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
  applyButton: {
    minWidth: 120,
  },
});

export type { SettlementRange };
export default SettlementRangePickerModal;
