import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import MarqueeText from "@/components/MarqueeText";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import { useBankStore, TransferRecord, RechargeRecord } from "@/store/useBankStore";
import { palette, themes } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
const bankLogo = require("../../assets/bancocostarica.png");

const FILTERS = [
  { id: "all", label: "Todo", icon: "history" },
  { id: "transfer", label: "Transferencias", icon: "swap-horizontal" },
  { id: "recharge", label: "Recargas", icon: "flash" },
] as const;

const TRANSFER_OUT_ACCENT = "#FF3B6B";
const TRANSFER_IN_ACCENT = "#2BD9A6";

type HistoryFilter = (typeof FILTERS)[number]["id"];

const DATE_FILTERS = [
  { id: "all", label: "Todo", icon: "infinity" },
  { id: "day", label: "Hoy", icon: "calendar-today" },
  { id: "month", label: "Este mes", icon: "calendar-month" },
  { id: "range", label: "Rango", icon: "calendar-range" },
] as const;

const cardTokens = themes.pionero.components.card;

type DateFilterId = (typeof DATE_FILTERS)[number]["id"];
type DateKey = string;
type DateRange = { start: DateKey | null; end: DateKey | null };

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

const formatDisplayDate = (date: Date, includeYear = true) =>
  date.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: includeYear ? "numeric" : undefined,
  });

type TimelineItem = {
  id: string;
  type: HistoryFilter;
  title: string;
  subtitle: string;
  amount: number;
  timestamp: string;
  icon: string;
  accent: string;
  direction?: "inbound" | "outbound";
};

type GroupedTimeline = {
  dayLabel: string;
  items: TimelineItem[];
};

type CalendarDay = {
  key: DateKey;
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
};

type CalendarWeek = CalendarDay[];

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

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

type RangePickerModalProps = {
  visible: boolean;
  initialRange: DateRange | { start: null; end: null };
  onCancel: () => void;
  onApply: (range: { start: DateKey; end: DateKey }) => void;
};

const RangePickerModal = ({ visible, initialRange, onCancel, onApply }: RangePickerModalProps) => {
  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const base = initialRange.start ? parseDateKey(initialRange.start) : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [draftRange, setDraftRange] = useState<DateRange>(initialRange);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const base = initialRange.start ? parseDateKey(initialRange.start) : new Date();
    setAnchorMonth(new Date(base.getFullYear(), base.getMonth(), 1));
    setDraftRange(initialRange);
    setYearPickerVisible(false);
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

  const handleNavigate = (direction: number) => {
    setYearPickerVisible(false);
    setAnchorMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const handleSelectDay = (dayKey: DateKey, disabled: boolean) => {
    if (disabled) {
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
    setAnchorMonth((prev) => new Date(year, prev.getMonth(), 1));
    setYearPickerVisible(false);
  };

  const selectionSummary = useMemo(() => {
    if (draftRange.start && draftRange.end) {
      const startLabel = formatDisplayDate(parseDateKey(draftRange.start));
      const endLabel = formatDisplayDate(parseDateKey(draftRange.end));
      return `${startLabel} — ${endLabel}`;
    }
    if (draftRange.start) {
      return `${formatDisplayDate(parseDateKey(draftRange.start))} · selecciona fecha de salida`;
    }
    return "Selecciona fechas de entrada y salida";
  }, [draftRange]);

  const todayEnd = useMemo(() => endOfDay(new Date()).getTime(), []);
  const canApply = Boolean(draftRange.start && draftRange.end);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.rangeModalBackdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} accessibilityRole="button" />
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 260 }}
          style={styles.rangeModalCard}
        >
          <View style={styles.rangeModalHeader}>
            <Text style={styles.rangeModalTitle}>Filtrar por rango</Text>
            <Text style={styles.rangeModalSubtitle}>{selectionSummary}</Text>
          </View>

          <View style={styles.rangeModalNav}>
            <Pressable
              onPress={() => handleNavigate(-1)}
              accessibilityRole="button"
              style={styles.rangeNavButton}
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
              <Text style={styles.rangeModalNavLabel}>{monthLabel}</Text>
              <MaterialCommunityIcons
                name={yearPickerVisible ? "chevron-up" : "chevron-down"}
                size={18}
                color={palette.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => handleNavigate(1)}
              accessibilityRole="button"
              style={styles.rangeNavButton}
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

          <View style={styles.calendarMonthsRow}>
            <View style={styles.calendarMonth}>
              <View style={styles.calendarWeekRow}>
                {WEEKDAY_LABELS.map((day) => (
                  <Text key={day} style={styles.calendarWeekday}>
                    {day}
                  </Text>
                ))}
              </View>
              {monthMatrix.map((week) => (
                <View key={week[0].key} style={styles.calendarWeekRow}>
                  {week.map((day) => {
                    const isDisabled = day.date.getTime() > todayEnd;
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
                    const dayStyles: StyleProp<ViewStyle>[] = [styles.calendarDay];
                    const labelStyles: StyleProp<TextStyle>[] = [styles.calendarDayLabel];
                    if (!day.inCurrentMonth) {
                      dayStyles.push(styles.calendarDayOutside);
                      labelStyles.push(styles.calendarDayOutsideLabel);
                    }
                    if (isBetween) {
                      dayStyles.push(styles.calendarDayInRange);
                    }
                    if (isSelectedStart || isSelectedEnd) {
                      dayStyles.push(styles.calendarDaySelected);
                      labelStyles.push(styles.calendarDayLabelSelected);
                    }
                    if (day.isToday) {
                      dayStyles.push(styles.calendarDayToday);
                    }
                    if (isDisabled) {
                      dayStyles.push(styles.calendarDayDisabled);
                      labelStyles.push(styles.calendarDayDisabledLabel);
                    }

                    return (
                      <Pressable
                        key={day.key}
                        onPress={() => handleSelectDay(day.key, isDisabled)}
                        style={dayStyles as StyleProp<ViewStyle>}
                        disabled={isDisabled}
                        accessibilityRole="button"
                        accessibilityLabel={`Seleccionar ${formatDisplayDate(day.date)}`}
                      >
                        <Text style={labelStyles as StyleProp<TextStyle>}>{day.date.getDate()}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.rangeModalActions}>
            <Pressable
              onPress={() => setDraftRange({ start: null, end: null })}
              accessibilityRole="button"
            >
              <Text style={styles.rangeModalActionText}>Limpiar</Text>
            </Pressable>
            <Pressable onPress={onCancel} accessibilityRole="button">
              <Text style={styles.rangeModalActionText}>Cancelar</Text>
            </Pressable>
            <PrimaryButton
              label="Aplicar"
              variant="ghost"
              onPress={() => {
                if (draftRange.start && draftRange.end) {
                  onApply({ start: draftRange.start, end: draftRange.end });
                }
              }}
              disabled={!canApply}
              style={styles.rangeModalApplyButton}
            />
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};


const HistoryScreen = () => {
  const router = useRouter();
  const { transfers, recharges } = useBankStore();
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterId>("all");
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null });
  const [rangePickerVisible, setRangePickerVisible] = useState(false);
  const [previousDateFilter, setPreviousDateFilter] = useState<DateFilterId>("all");
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const timeline = useMemo(() => {
    const transferItems: TimelineItem[] = transfers.map((record: TransferRecord) => {
      const direction = record.direction ?? "outbound";
      const isInbound = direction === "inbound";
      const contactLabel = record.contactName || record.phone;

      return {
        id: record.id,
        type: "transfer",
        title: isInbound ? `Recibo de ${contactLabel}` : `Envío a ${contactLabel}`,
        subtitle: record.phone,
        amount: isInbound ? record.amount : -record.amount,
        timestamp: record.createdAt,
        icon: isInbound ? "arrow-up-right" : "arrow-down-right",
        accent: isInbound ? TRANSFER_IN_ACCENT : TRANSFER_OUT_ACCENT,
        direction,
      };
    });

    const rechargeItems: TimelineItem[] = recharges.map((record: RechargeRecord) => ({
      id: record.id,
      type: "recharge",
      title: `Recarga ${record.provider}`,
      subtitle: record.phone,
      amount: -record.amount,
      timestamp: record.createdAt,
      icon: "cellphone",
      accent: "#00F0FF",
    }));

    return [...transferItems, ...rechargeItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [transfers, recharges]);

  const activeRange = useMemo(() => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    if (dateFilter === "day") {
      const today = startOfDay(now);
      start = today;
      end = endOfDay(now);
    } else if (dateFilter === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (dateFilter === "range" && customRange.start && customRange.end) {
      const rangeStart = startOfDay(parseDateKey(customRange.start));
      const rangeEnd = endOfDay(parseDateKey(customRange.end));
      start = rangeStart;
      end = rangeEnd;
    }

    if (start && end) {
      return { start, end };
    }

    return null;
  }, [dateFilter, customRange]);

  const filteredTimeline = useMemo(() => {
    let items = timeline;
    if (filter !== "all") {
      items = items.filter((item: TimelineItem) => item.type === filter);
    }
    if (activeRange) {
      const startTime = activeRange.start.getTime();
      const endTime = activeRange.end.getTime();
      items = items.filter((item: TimelineItem) => {
        const timestamp = new Date(item.timestamp).getTime();
        return timestamp >= startTime && timestamp <= endTime;
      });
    }
    return items;
  }, [timeline, filter, activeRange]);

  const rangeSummary = useMemo(() => {
    if (dateFilter === "all" || !activeRange) {
      return "Todos los movimientos";
    }
    if (dateFilter === "day") {
      return `Hoy · ${formatDisplayDate(activeRange.start)}`;
    }
    if (dateFilter === "month") {
      const monthLabel = activeRange.start.toLocaleDateString("es-CR", {
        month: "long",
        year: "numeric",
      });
      return `Mes actual · ${monthLabel}`;
    }
    if (dateFilter === "range") {
      if (customRange.start && customRange.end) {
        const startLabel = formatDisplayDate(parseDateKey(customRange.start));
        const endLabel = formatDisplayDate(parseDateKey(customRange.end));
        return `${startLabel} — ${endLabel}`;
      }
      return "Selecciona un rango personalizado";
    }
    return "Todos los movimientos";
  }, [dateFilter, activeRange, customRange]);

  const activeFilterLabel = useMemo(() => {
    const active = FILTERS.find((item) => item.id === filter);
    return active ? active.label : "Todo";
  }, [filter]);

  const filtersApplied = filter !== "all" || dateFilter !== "all";
  const filterSummary = filtersApplied
    ? `${activeFilterLabel} · ${rangeSummary}`
    : "Todos los movimientos";
  const filterToggleLabel = filtersExpanded ? "Ocultar filtros" : "Mostrar filtros";

  const handleRangeApply = (range: { start: DateKey; end: DateKey }) => {
    setCustomRange(range);
    setDateFilter("range");
    setRangePickerVisible(false);
  };

  const handleRangeCancel = () => {
    setRangePickerVisible(false);
    if (dateFilter === "range" && (!customRange.start || !customRange.end)) {
      setDateFilter(previousDateFilter);
    }
  };

  const handleClearFilters = () => {
    setFilter("all");
    setDateFilter("all");
    setCustomRange({ start: null, end: null });
    setPreviousDateFilter("all");
    setRangePickerVisible(false);
  };

  const groupedTimeline = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    filteredTimeline.forEach((item: TimelineItem) => {
      const dateKey = new Date(item.timestamp).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map((entry): GroupedTimeline => {
        const [key, items] = entry;
        const label = new Date(key).toLocaleDateString("es-CR", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return { dayLabel: label, items };
      });
  }, [filteredTimeline]);

  const totalTransfers = useMemo(
    () => transfers.reduce((acc, record) => acc + record.amount, 0),
    [transfers],
  );
  const totalRecharges = useMemo(
    () => recharges.reduce((acc, record) => acc + record.amount, 0),
    [recharges],
  );
  const operationsCount = transfers.length + recharges.length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTotalOutflow = useMemo(
    () =>
      timeline
        .filter((item) => {
          const date = new Date(item.timestamp);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        })
        .reduce((acc, item) => acc + Math.abs(item.amount), 0),
    [timeline, currentMonth, currentYear],
  );

  const openTransferDetail = (id: string) => {
    const record = transfers.find((transfer) => transfer.id === id);
    if (!record) {
      return;
    }
    setSelectedTransfer(record);
    setDetailVisible(true);
  };

  const closeTransferDetail = () => {
    setDetailVisible(false);
    setSelectedTransfer(null);
  };

  const renderTimelineContent = (item: TimelineItem) => (
    <>
      <View
        style={[styles.iconBadge, { backgroundColor: `${item.accent}33` }]}
      >
        <MaterialCommunityIcons
          name={item.icon as any}
          size={22}
          color={item.accent}
        />
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineTitle}>{item.title}</Text>
        <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
        {item.type === "transfer" ? (
          <Text style={[styles.detailPrompt, { color: item.accent }]}>Ver detalle</Text>
        ) : null}
      </View>
      <View style={styles.timelineMeta}>
        <Text style={[styles.timelineAmount, { color: item.accent }]}>
          {formatCurrency(item.amount)}
        </Text>
        <Text style={styles.timelineTime}>
          {new Date(item.timestamp).toLocaleTimeString("es-CR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </>
  );

  const isDetailInbound = selectedTransfer?.direction === "inbound";
  const detailAccent = isDetailInbound ? TRANSFER_IN_ACCENT : TRANSFER_OUT_ACCENT;
  const detailAmountLabel = isDetailInbound ? "Monto recibido" : "Monto enviado";
  const detailAmountValue = selectedTransfer
    ? formatCurrency(isDetailInbound ? selectedTransfer.amount : -selectedTransfer.amount)
    : "";

  return (
    <FuturisticBackground>
      <View style={styles.screen}>
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
                <View style={styles.logoBadge}>
                  <Image
                    source={bankLogo}
                    style={styles.logoImage}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel="Logo Banco de Costa Rica"
                  />
                </View>
              </Pressable>
              <Text style={styles.title}>Historial</Text>
              <ProfileAvatarButton
                size={40}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/notifications",
                    params: {
                      from: "/(app)/history",
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
                  <View>
                    <Text style={styles.summaryLabel}>Total transferido</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalTransfers)}</Text>
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Total recargado</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalRecharges)}</Text>
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Movimientos en el mes</Text>
                    <Text style={styles.summaryValue}>
                      {operationsCount > 0 ? operationsCount : "0"}
                    </Text>
                    <Text style={styles.summaryHint}>
                      Salieron {formatCurrency(monthTotalOutflow)} este mes.
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </MotiView>

            <View style={styles.filterSection}>
              <Pressable
                onPress={() => setFiltersExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={filterToggleLabel}
                style={({ pressed }) => [
                  styles.filterToggleButton,
                  pressed && styles.filterToggleButtonPressed,
                ]}
              >
                <View style={styles.filterToggleIconWrapper}>
                  <MaterialCommunityIcons
                    name="filter-variant"
                    size={22}
                    color={palette.accentCyan}
                  />
                </View>
                <View style={styles.filterToggleCopy}>
                  <Text style={styles.filterToggleTitle}>Filtros</Text>
                  <Text style={styles.filterToggleSubtitle} numberOfLines={1}>
                    {filterSummary}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={filtersExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={palette.textSecondary}
                />
              </Pressable>

              {filtersExpanded ? (
                <MotiView
                  from={{ opacity: 0, translateY: -8 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: -8 }}
                  transition={{ type: "timing", duration: 180 }}
                >
                  <GlassCard padding={24}>
                    <View style={styles.filterCard}>
                      <View style={styles.filterCardHeader}>
                        <View style={styles.filterCardCopy}>
                          <Text style={styles.filterCardTitle}>Filtra tus movimientos</Text>
                          <MarqueeText
                            text={filterSummary}
                            textStyle={styles.filterCardSubtitle}
                            containerStyle={styles.filterCardSubtitleMarquee}
                            speedFactor={36}
                            gap={20}
                            delay={540}
                            isActive={filtersApplied}
                          />
                        </View>
                        {filtersApplied ? (
                          <Pressable
                            onPress={handleClearFilters}
                            accessibilityRole="button"
                            accessibilityLabel="Restablecer filtros"
                            style={({ pressed }) => [
                              styles.resetFiltersButton,
                              pressed && styles.resetFiltersButtonPressed,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="backup-restore"
                              size={18}
                              color={palette.accentCyan}
                            />
                            <Text style={styles.resetFiltersLabel}>Restablecer</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      <View style={styles.filterCardSection}>
                        <Text style={styles.filterSectionLabel}>Tipo de operación</Text>
                        <View style={styles.iconRow}>
                          {FILTERS.map((item) => {
                            const isActive = item.id === filter;
                            return (
                              <Pressable
                                key={item.id}
                                onPress={() => setFilter(item.id)}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                                style={({ pressed }) => [
                                  styles.iconFilterButton,
                                  isActive && styles.iconFilterButtonActive,
                                  !isActive && pressed && styles.iconFilterButtonPressed,
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name={item.icon as any}
                                  size={20}
                                  color={isActive ? palette.textPrimary : palette.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.iconFilterLabel,
                                    isActive && styles.iconFilterLabelActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      <View style={styles.filterCardSection}>
                        <Text style={styles.filterSectionLabel}>Fecha</Text>
                        <View style={styles.iconRow}>
                          {DATE_FILTERS.map((item) => {
                            const isActive = item.id === dateFilter;
                            return (
                              <Pressable
                                key={item.id}
                                onPress={() => {
                                  if (item.id === "range") {
                                    setPreviousDateFilter(dateFilter);
                                    setDateFilter("range");
                                    setRangePickerVisible(true);
                                    return;
                                  }
                                  setDateFilter(item.id);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                                style={({ pressed }) => [
                                  styles.iconFilterButton,
                                  isActive && styles.iconFilterButtonActive,
                                  !isActive && pressed && styles.iconFilterButtonPressed,
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name={item.icon as any}
                                  size={20}
                                  color={isActive ? palette.textPrimary : palette.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.iconFilterLabel,
                                    isActive && styles.iconFilterLabelActive,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                </MotiView>
              ) : null}
            </View>

            {groupedTimeline.length === 0 ? (
              <GlassCard>
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={42}
                    color={palette.textPrimary}
                  />
                  <Text style={styles.emptyTitle}>Sin movimientos registrados</Text>
                  <Text style={styles.emptyCopy}>
                    Realiza una transferencia o recarga para ver el resumen aquí.
                  </Text>
                </View>
              </GlassCard>
            ) : (
            groupedTimeline.map((group) => (
              <MotiView
                key={group.dayLabel}
                from={{ opacity: 0, translateY: 24 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 360 }}
              >
                <GlassCard>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{group.dayLabel}</Text>
                  </View>
                  {group.items.map((item) =>
                    item.type === "transfer" ? (
                      <Pressable
                        key={item.id}
                        onPress={() => openTransferDetail(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver detalle de ${item.title}`}
                        style={({ pressed }) => [
                          styles.timelineRow,
                          pressed && styles.timelineRowPressed,
                        ]}
                      >
                        {renderTimelineContent(item)}
                      </Pressable>
                    ) : (
                      <View key={item.id} style={styles.timelineRow}>
                        {renderTimelineContent(item)}
                      </View>
                    )
                  )}
                </GlassCard>
              </MotiView>
            ))
          )}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={closeTransferDetail}
      >
        <View style={styles.detailModalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closeTransferDetail}
            accessibilityRole="button"
            accessibilityLabel="Cerrar detalle de transferencia"
          />
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 240 }}
            style={styles.detailModalCard}
          >
            {selectedTransfer ? (
              <>
                <View style={styles.detailHeader}>
                  <View
                    style={[styles.detailBadge, { backgroundColor: `${detailAccent}1F` }]}
                  >
                    <MaterialCommunityIcons
                      name={isDetailInbound ? "arrow-up-right" : "arrow-down-right"}
                      size={24}
                      color={detailAccent}
                    />
                  </View>
                  <View style={styles.detailHeaderCopy}>
                    <Text style={styles.detailTitle}>Detalle de transferencia</Text>
                    <Text style={styles.detailSubtitle}>
                      {`${isDetailInbound ? "Recibido de" : "Envío a"} ${
                        selectedTransfer.contactName || selectedTransfer.phone
                      }`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={closeTransferDetail}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar"
                    style={styles.detailCloseIcon}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={22}
                      color={palette.textSecondary}
                    />
                  </Pressable>
                </View>

                <View
                  style={[
                    styles.detailAmountPill,
                    {
                      borderColor: `${detailAccent}40`,
                      backgroundColor: `${detailAccent}1A`,
                    },
                  ]}
                >
                  <Text style={styles.detailAmountLabel}>{detailAmountLabel}</Text>
                  <Text style={[styles.detailAmountValue, { color: detailAccent }]}>
                    {detailAmountValue}
                  </Text>
                </View>

                <View style={styles.detailRows}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {isDetailInbound ? "Remitente" : "Destinatario"}
                    </Text>
                    <Text style={styles.detailValue}>
                      {selectedTransfer.contactName || "Sin alias"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Número SINPE</Text>
                    <Text style={styles.detailValue}>{selectedTransfer.phone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha y hora</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedTransfer.createdAt).toLocaleString("es-CR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nota</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransfer.note ?? "Sin nota"}
                    </Text>
                  </View>
                </View>

                <PrimaryButton
                  label="Cerrar"
                  onPress={closeTransferDetail}
                  style={styles.detailCloseButton}
                />
              </>
            ) : null}
          </MotiView>
        </View>
      </Modal>

      <RangePickerModal
        visible={rangePickerVisible}
        initialRange={customRange}
        onCancel={handleRangeCancel}
        onApply={handleRangeApply}
      />
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
    borderRadius: 26,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  logoBadge: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  profileShortcut: {
    shadowOpacity: 0.28,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 18,
    columnGap: 18,
    padding: 20,
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  summaryHint: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  filterCard: {
    gap: 20,
  },
  filterCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  filterCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  filterCardTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  filterCardSubtitleMarquee: {
    marginTop: 2,
    minHeight: 18,
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
    width: "100%",
  },
  filterCardSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  resetFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    backgroundColor: "rgba(0, 240, 255, 0.1)",
  },
  resetFiltersButtonPressed: {
    backgroundColor: "rgba(0, 240, 255, 0.18)",
  },
  resetFiltersLabel: {
    color: palette.accentCyan,
    fontSize: 12,
    fontWeight: "600",
  },
  filterCardSection: {
    gap: 12,
  },
  filterSectionLabel: {
    color: palette.textMuted,
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1,
  },
  iconRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  iconFilterButton: {
    width: 68,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: cardTokens.border,
    backgroundColor: cardTokens.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  iconFilterButtonActive: {
    borderColor: "rgba(0, 240, 255, 0.6)",
    backgroundColor: "rgba(0, 240, 255, 0.22)",
    shadowColor: palette.accentCyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  iconFilterButtonPressed: {
    backgroundColor: cardTokens.overlay,
  },
  iconFilterLabel: {
    color: palette.textSecondary,
    fontSize: 11,
    textAlign: "center",
  },
  iconFilterLabelActive: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  filterSection: {
    gap: 14,
  },
  filterToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: cardTokens.border,
    backgroundColor: cardTokens.background,
  },
  filterToggleButtonPressed: {
    backgroundColor: "rgba(0, 240, 255, 0.18)",
  },
  filterToggleIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 240, 255, 0.15)",
  },
  filterToggleCopy: {
    flex: 1,
    gap: 2,
  },
  filterToggleTitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  filterToggleSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  emptyState: {
    padding: 28,
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
  groupHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  groupLabel: {
    color: palette.textMuted,
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: 1,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineCopy: {
    flex: 1,
    marginHorizontal: 14,
    gap: 4,
  },
  timelineTitle: {
    color: palette.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  timelineSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  detailPrompt: {
    color: palette.accentCyan,
    fontSize: 12,
    fontWeight: "600",
  },
  timelineMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  timelineAmount: {
    fontWeight: "700",
    fontSize: 15,
  },
  timelineTime: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  timelineRowPressed: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
  },
  detailModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 14, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  detailModalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 28,
    padding: 24,
    gap: 20,
    backgroundColor: "rgba(8, 14, 28, 0.94)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  detailBadge: {
    width: 48,
    height: 48,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  detailTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  detailSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  detailCloseIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  detailAmountPill: {
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 6,
  },
  detailAmountLabel: {
    color: palette.textMuted,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  detailAmountValue: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: "800",
  },
  detailRows: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  detailLabel: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  detailValue: {
    color: palette.textPrimary,
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  detailCloseButton: {
    marginTop: 4,
  },
  rangeModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 10, 22, 0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  rangeModalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: "rgba(10, 18, 34, 0.95)",
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  rangeModalHeader: {
    gap: 4,
  },
  rangeModalTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  rangeModalSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  rangeModalNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rangeModalNavLabel: {
    flex: 1,
    textAlign: "center",
    color: palette.textPrimary,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  monthSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rangeNavButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  calendarMonthsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  calendarMonth: {
    flex: 0,
    width: "100%",
    maxWidth: 260,
    gap: 6,
  },
  calendarMonthLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
    textTransform: "capitalize",
    fontSize: 14,
  },
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: "center",
    color: palette.textSecondary,
    fontSize: 10,
    fontWeight: "600",
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 22, 38, 0.6)",
  },
  calendarDayLabel: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  calendarDayOutside: {
    backgroundColor: "rgba(13, 22, 38, 0.3)",
  },
  calendarDayOutsideLabel: {
    color: "rgba(255,255,255,0.35)",
  },
  calendarDaySelected: {
    backgroundColor: "rgba(0, 240, 255, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.8)",
  },
  calendarDayInRange: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
  },
  calendarDayLabelSelected: {
    color: palette.textPrimary,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  calendarDayDisabled: {
    opacity: 0.35,
  },
  calendarDayDisabledLabel: {
    color: "rgba(255,255,255,0.25)",
  },
  yearPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "rgba(12, 20, 36, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  yearOption: {
    minWidth: 56,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  yearOptionActive: {
    backgroundColor: "rgba(0, 240, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.6)",
  },
  yearOptionLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  yearOptionLabelActive: {
    color: palette.textPrimary,
    fontWeight: "700",
  },
  rangeModalActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rangeModalActionText: {
    color: palette.textSecondary,
    fontWeight: "600",
  },
  rangeModalApplyButton: {
    flex: 1,
  },
});

export default HistoryScreen;
