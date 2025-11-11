import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Share, Platform, Linking } from "react-native";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { EncodingType, StorageAccessFramework, getContentUriAsync } from "expo-file-system/legacy";
import MarqueeText from "@/components/MarqueeText";

import FuturisticBackground from "@/components/FuturisticBackground";
import GlassCard from "@/components/GlassCard";
import NeonTextField from "@/components/NeonTextField";
import PrimaryButton from "@/components/PrimaryButton";
import ProfileAvatarButton from "@/components/ProfileAvatarButton";
import SingleDatePickerModal, { DateKey, parseDateKey, toDateKey } from "@/components/SingleDatePickerModal";
import SettlementRangePickerModal from "../components/SettlementRangePickerModal";
import { RechargeRecord, TransferRecord, useBankStore } from "@/store/useBankStore";
import { palette } from "@/theme/colors";
import { useTheme } from "@/theme/ThemeProvider";
import { formatCurrency } from "@/utils/currency";
import { formatAmountDisplay, parseAmountToNumber, sanitizeAmountInput } from "@/utils/amount";
import { createId } from "@/utils/id";

const bankLogo = require("../../assets/bancocostarica.png");

type RecurringFrequency = "weekly" | "biweekly" | "monthly";

type SplitResult = {
  id: string;
  label: string;
  total: number;
  participants: Array<{ id: string; name: string; amount: number }>;
  remainderReceivers: number;
  createdAt: string;
};

type RecurringChargeView = {
  id: string;
  label: string;
  amount: number;
  frequency: RecurringFrequency;
  startDate: string;
  nextRuns: string[];
  createdAt: string;
};

const FREQUENCY_OPTIONS: Array<{ id: RecurringFrequency; label: string; description: string; icon: string }> = [
  { id: "weekly", label: "Semanal", description: "Cada 7 días", icon: "calendar-week" },
  { id: "biweekly", label: "Quincenal", description: "Cada 14 días", icon: "calendar-range" },
  { id: "monthly", label: "Mensual", description: "Cada mes", icon: "calendar-month" },
];

const monthFormatter = new Intl.DateTimeFormat("es-CR", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("es-CR", { day: "numeric", month: "short" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const fullDateFormatter = new Intl.DateTimeFormat("es-CR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type DateRangeKeys = { start: DateKey | null; end: DateKey | null };
type SummaryEntry = { name: string; amount: number };
type SettlementSummary = {
  inboundTotal: number;
  inboundCount: number;
  outboundTotal: number;
  outboundCount: number;
  rechargeTotal: number;
  rechargeCount: number;
  netFlow: number;
  topInbound: SummaryEntry[];
  topOutbound: SummaryEntry[];
};

const EMPTY_SETTLEMENT_SUMMARY: SettlementSummary = {
  inboundTotal: 0,
  inboundCount: 0,
  outboundTotal: 0,
  outboundCount: 0,
  rechargeTotal: 0,
  rechargeCount: 0,
  netFlow: 0,
  topInbound: [],
  topOutbound: [],
};

const toStartOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const toEndOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const computeSettlementSummary = (
  range: DateRangeKeys,
  transfers: TransferRecord[],
  recharges: RechargeRecord[],
): SettlementSummary => {
  if (!range.start || !range.end) {
    return { ...EMPTY_SETTLEMENT_SUMMARY };
  }

  const rangeStart = toStartOfDay(parseDateKey(range.start));
  const rangeEnd = toEndOfDay(parseDateKey(range.end));

  if (rangeEnd < rangeStart) {
    return { ...EMPTY_SETTLEMENT_SUMMARY };
  }

  let inboundTotal = 0;
  let inboundCount = 0;
  let outboundTotal = 0;
  let outboundCount = 0;

  const inboundByContact = new Map<string, number>();
  const outboundByContact = new Map<string, number>();

  transfers.forEach((transfer: TransferRecord) => {
    const date = new Date(transfer.createdAt);
    if (Number.isNaN(date.getTime()) || date < rangeStart || date > rangeEnd) {
      return;
    }
    const key = transfer.contactName || transfer.phone;
    if (transfer.direction === "inbound") {
      inboundTotal += transfer.amount;
      inboundCount += 1;
      inboundByContact.set(key, (inboundByContact.get(key) ?? 0) + transfer.amount);
    } else {
      outboundTotal += transfer.amount;
      outboundCount += 1;
      outboundByContact.set(key, (outboundByContact.get(key) ?? 0) + transfer.amount);
    }
  });

  let rechargeTotal = 0;
  let rechargeCount = 0;

  recharges.forEach((recharge: RechargeRecord) => {
    const date = new Date(recharge.createdAt);
    if (Number.isNaN(date.getTime()) || date < rangeStart || date > rangeEnd) {
      return;
    }
    rechargeTotal += recharge.amount;
    rechargeCount += 1;
  });

  const netFlow = inboundTotal - (outboundTotal + rechargeTotal);

  const topInbound: SummaryEntry[] = Array.from(inboundByContact.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  const topOutbound: SummaryEntry[] = Array.from(outboundByContact.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  return {
    inboundTotal,
    inboundCount,
    outboundTotal,
    outboundCount,
    rechargeTotal,
    rechargeCount,
    netFlow,
    topInbound,
    topOutbound,
  };
};

const computeOccurrences = (start: Date, frequency: RecurringFrequency, count: number) => {
  const occurrences: Date[] = [];
  const current = new Date(start);
  while (occurrences.length < count) {
    occurrences.push(new Date(current));
    if (frequency === "weekly") {
      current.setDate(current.getDate() + 7);
    } else if (frequency === "biweekly") {
      current.setDate(current.getDate() + 14);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  return occurrences;
};

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildSettlementReportHtml = (options: {
  monthLabel: string;
  summary: SettlementSummary;
  generatedAt: Date;
}) => {
  const { monthLabel, summary, generatedAt } = options;
  const generatedLabel = dateTimeFormatter.format(generatedAt);
  const netFlowTone = summary.netFlow > 0 ? "positive" : summary.netFlow < 0 ? "negative" : "neutral";
  const netFlowLabel = summary.netFlow > 0 ? "Superávit neto" : summary.netFlow < 0 ? "Déficit neto" : "Flujo equilibrado";

  const inboundList = summary.topInbound.length
    ? summary.topInbound
        .map(
          (item: SummaryEntry, index: number) => `
            <li class="list-item">
              <span class="badge">${index + 1}</span>
              <div class="list-text">
                <strong>${escapeHtml(item.name)}</strong>
                <small>${formatCurrency(item.amount)} recibidos</small>
              </div>
            </li>
          `,
        )
        .join("")
    : '<li class="list-item empty">Sin ingresos relevantes durante este periodo.</li>';

  const outboundList = summary.topOutbound.length
    ? summary.topOutbound
        .map(
          (item: SummaryEntry, index: number) => `
            <li class="list-item">
              <span class="badge">${index + 1}</span>
              <div class="list-text">
                <strong>${escapeHtml(item.name)}</strong>
                <small>${formatCurrency(item.amount)} enviados</small>
              </div>
            </li>
          `,
        )
        .join("")
    : '<li class="list-item empty">No se registraron egresos destacados.</li>';

  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
  <title>Resumen ${escapeHtml(monthLabel)}</title>
      <style>
        :root {
          color-scheme: light;
        }
        @page {
          size: A4 portrait;
          margin: 14mm 14mm;
        }
        html, body {
          height: auto;
        }
        body, * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #101828;
        }
        .wrapper {
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e0e4ed;
          overflow: hidden;
          box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
        }
        header {
          padding: 24px 28px 18px;
          background: linear-gradient(120deg, rgba(227, 246, 255, 0.95), rgba(244, 238, 255, 0.95));
          page-break-after: avoid;
        }
        header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #152645;
        }
        header p {
          margin: 8px 0 0;
          color: #475467;
          font-size: 13px;
        }
        .badge-flow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          background: #e4f1ff;
          color: #1554a1;
        }
        .badge-flow.positive { background: #ecfdf3; color: #027a48; }
        .badge-flow.negative { background: #fef3f2; color: #d92d20; }
        .badge-flow.neutral { background: #eff4ff; color: #1554a1; }
        main {
          padding: 20px 24px 24px;
          page-break-inside: auto;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .metric-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px 16px;
        }
        .metric-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          color: #667085;
        }
        .metric-value {
          display: block;
          margin-top: 10px;
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
        }
        .metric-sub {
          margin-top: 4px;
          font-size: 10px;
          color: #475467;
        }
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .section h2 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #152645;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          page-break-inside: avoid;
          border: 1px solid #e4e7ec;
        }
        th, td {
          padding: 10px 14px;
          text-align: left;
        }
        th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          color: #475467;
          background: #f2f4f7;
        }
        tr:nth-child(even) td { background: #f8fafc; }
        .list {
          margin: 0;
          padding: 0;
          list-style: none;
          background: #ffffff;
          border-radius: 15px;
          border: 1px solid #e4e7ec;
          page-break-inside: avoid;
        }
        .list-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-bottom: 1px solid #e4e7ec;
        }
        .list-item:last-child { border-bottom: none; }
        .badge {
          width: 24px;
          height: 24px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff4ff;
          color: #1554a1;
          font-weight: 700;
          font-size: 11px;
        }
        .list-text strong {
          display: block;
          font-size: 13px;
          color: #101828;
        }
        .list-text small {
          display: block;
          margin-top: 2px;
          color: #475467;
        }
        .list-item.empty {
          justify-content: center;
          color: #667085;
          font-style: italic;
        }
        footer {
          padding: 16px 26px 20px;
          font-size: 10px;
          color: #475467;
          background: #f8fafc;
          page-break-before: avoid;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <header>
          <h1>Resumen mensual · ${escapeHtml(monthLabel)}</h1>
          <p>Resumen automático de cobros SINPE Móvil. Usa este documento como respaldo o compártelo con tu equipo.</p>
          <span class="badge-flow ${netFlowTone}">${netFlowLabel}: ${formatCurrency(summary.netFlow)}</span>
        </header>
        <main>
          <section class="grid">
            <article class="metric-card">
              <span class="metric-label">Ingresos recibidos</span>
              <span class="metric-value">${formatCurrency(summary.inboundTotal)}</span>
              <span class="metric-sub">${summary.inboundCount} movimientos</span>
            </article>
            <article class="metric-card">
              <span class="metric-label">Transferencias emitidas</span>
              <span class="metric-value">${formatCurrency(summary.outboundTotal)}</span>
              <span class="metric-sub">${summary.outboundCount} movimientos</span>
            </article>
            <article class="metric-card">
              <span class="metric-label">Recargas móviles</span>
              <span class="metric-value">${formatCurrency(summary.rechargeTotal)}</span>
              <span class="metric-sub">${summary.rechargeCount} operaciones</span>
            </article>
          </section>

          <section class="section">
            <h2>Resumen detallado</h2>
            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Movimientos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Entradas de dinero</td>
                  <td>${formatCurrency(summary.inboundTotal)}</td>
                  <td>${summary.inboundCount}</td>
                </tr>
                <tr>
                  <td>Egresos por transferencias</td>
                  <td>${formatCurrency(summary.outboundTotal)}</td>
                  <td>${summary.outboundCount}</td>
                </tr>
                <tr>
                  <td>Egresos por recargas</td>
                  <td>${formatCurrency(summary.rechargeTotal)}</td>
                  <td>${summary.rechargeCount}</td>
                </tr>
                <tr>
                  <td>Flujo neto</td>
                  <td>${formatCurrency(summary.netFlow)}</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="section">
            <h2>Principales ingresos</h2>
            <ul class="list">${inboundList}</ul>
          </section>

          <section class="section">
            <h2>Principales egresos</h2>
            <ul class="list">${outboundList}</ul>
          </section>
        </main>
        <footer>
          Generado automáticamente el ${escapeHtml(generatedLabel)} · App bancaria sinpe movil
        </footer>
      </div>
    </body>
  </html>`;
};

const ChargesScreen = () => {
  const router = useRouter();
  const { themeName } = useTheme();
  const usesBrightVariant = themeName === "pionero" || themeName === "aurora";
  const isWeb = Platform.select({ web: true, default: false }) ?? false;
  const iconAccent = usesBrightVariant ? "#FFFFFF" : palette.accentCyan;
  const { transfers, recharges, createEnvelope } = useBankStore();

  const [splitLabel, setSplitLabel] = useState("");
  const [participantNameInput, setParticipantNameInput] = useState("");
  const [participantsList, setParticipantsList] = useState<string[]>([]);
  const [splitAmountRaw, setSplitAmountRaw] = useState("");
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [splitStatus, setSplitStatus] = useState<string | null>(null);

  const [recurringLabel, setRecurringLabel] = useState("");
  const [recurringAmountRaw, setRecurringAmountRaw] = useState("");
  const [recurringStartDate, setRecurringStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>("monthly");
  const [recurringCharges, setRecurringCharges] = useState<RecurringChargeView[]>([]);
  const [recurringError, setRecurringError] = useState<string | null>(null);
  const [recurringStatus, setRecurringStatus] = useState<string | null>(null);
  const [startDatePickerVisible, setStartDatePickerVisible] = useState(false);

  const [settlementRange, setSettlementRange] = useState<DateRangeKeys>(() => {
    const now = new Date();
    const start = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = toDateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return { start, end };
  });
  const [settlementRangePickerVisible, setSettlementRangePickerVisible] = useState(false);
  const settlementSummary = useMemo(
    () => computeSettlementSummary(settlementRange, transfers, recharges),
    [settlementRange, transfers, recharges],
  );
  const settlementRangeLabel = useMemo(() => {
    if (!settlementRange.start || !settlementRange.end) {
      return "Selecciona un periodo";
    }
    const startDate = parseDateKey(settlementRange.start);
    const endDate = parseDateKey(settlementRange.end);
    const sameMonth =
      startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth();
    const monthLastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const isFullMonth = sameMonth && startDate.getDate() === 1 && endDate.getDate() === monthLastDay;
    if (isFullMonth) {
      return monthFormatter.format(startDate);
    }
    const startLabel = startDate.toLocaleDateString("es-CR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const endLabel = endDate.toLocaleDateString("es-CR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${startLabel} — ${endLabel}`;
  }, [settlementRange]);
  const recurringStartDateDisplay = useMemo(() => {
    if (!recurringStartDate) {
      return "";
    }
    const parsed = parseDateKey(recurringStartDate);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    return fullDateFormatter.format(parsed);
  }, [recurringStartDate]);
  const [settlementStatus, setSettlementStatus] = useState<string | null>(null);
  const canAddParticipant = participantNameInput.trim().length > 0;

  const handleSplitLabelChange = (value: string) => {
    setSplitStatus(null);
    setSplitLabel(value);
  };

  const handleParticipantNameChange = (value: string) => {
    setSplitError(null);
    setSplitStatus(null);
    setParticipantNameInput(value);
  };

  const handleAddParticipant = () => {
    const trimmed = participantNameInput.trim();
    setSplitStatus(null);
    if (!trimmed) {
      setSplitError("Ingresa un nombre válido antes de añadirlo.");
      return;
    }
    if (participantsList.some((name) => name.toLowerCase() === trimmed.toLowerCase())) {
      setSplitError("Ese participante ya está en la lista.");
      return;
    }
    setParticipantsList((prev) => [...prev, trimmed]);
    setParticipantNameInput("");
    setSplitError(null);
    setSplitResult(null);
  };

  const handleRemoveParticipant = (index: number) => {
    setSplitStatus(null);
    setSplitError(null);
    setParticipantsList((prev) => prev.filter((_, idx) => idx !== index));
    setSplitResult(null);
  };

  const handleSplitAmountChange = (value: string) => {
    setSplitError(null);
    setSplitStatus(null);
    setSplitAmountRaw(sanitizeAmountInput(value));
  };

  const handleCalculateSplit = () => {
    setSplitError(null);
    setSplitStatus(null);

    const names = participantsList.map((name) => name.trim()).filter((name): name is string => Boolean(name));

    const total = parseAmountToNumber(splitAmountRaw);

    if (names.length < 2) {
      setSplitError("Indica al menos dos participantes para dividir el monto.");
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      setSplitError("Ingresa un monto total válido.");
      return;
    }

    const totalCents = Math.round(total * 100);
    const baseShare = Math.floor(totalCents / names.length);
    const remainder = totalCents - baseShare * names.length;

    const participants = names.map((name, index) => {
      const cents = baseShare + (index < remainder ? 1 : 0);
      return {
        id: createId("split-participant"),
        name,
        amount: cents / 100,
      };
    });

    setSplitResult({
      id: createId("split"),
      label: splitLabel.trim() || "Cobro compartido",
      total,
      participants,
      remainderReceivers: remainder,
      createdAt: new Date().toISOString(),
    });
    setSplitError(null);
    setSplitStatus("Reparto generado. Envía el enlace personalizado a cada participante.");
  };

  const handleGenerateLinks = async () => {
    if (!splitResult) {
      return;
    }
    // Crear sobre en el store
    const sobreDraft = {
      name: splitResult.label,
      description: `Sobre generado automáticamente para ${splitResult.participants.map(p => p.name).join(", ")}`,
      targetAmount: splitResult.total,
    };
    const sobre = createEnvelope(sobreDraft);
    // Simular link único
    const link = `https://davivienda-app.com/sobre/${sobre.id}`;
    // Mensaje para compartir
    const message = `¡Aporta a nuestro sobre \"${sobre.name}\"! Participantes: ${splitResult.participants.map(p => p.name).join(", ")}. Ingresa aquí: ${link}`;
    try {
      await Share.share({ message });
      setSplitStatus("Enlace a sobre generado y listo para compartir.");
    } catch (error) {
      setSplitStatus("No se pudo compartir el enlace. Intenta de nuevo.");
    }
  };

  const handleRecurringLabelChange = (value: string) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringLabel(value);
  };

  const handleRecurringAmountChange = (value: string) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringAmountRaw(sanitizeAmountInput(value));
  };

  const handleRecurringStartDateChange = (value: string) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringStartDate(value);
  };

  const handleOpenRecurringStartDatePicker = () => {
    setRecurringError(null);
    setRecurringStatus(null);
    if (startDatePickerVisible) {
      return;
    }
    setStartDatePickerVisible(true);
  };

  const handleRecurringStartDateConfirm = (value: string) => {
    handleRecurringStartDateChange(value);
    setStartDatePickerVisible(false);
  };

  const handleFrequencySelect = (value: RecurringFrequency) => {
    setRecurringError(null);
    setRecurringStatus(null);
    setRecurringFrequency(value);
  };

  const handleAddRecurringCharge = () => {
    setRecurringStatus(null);

    const label = recurringLabel.trim();
    const amount = parseAmountToNumber(recurringAmountRaw);
    const start = parseDateKey(recurringStartDate);

    if (!label) {
      setRecurringError("Asigna un nombre al cobro recurrente.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setRecurringError("Ingresa un monto válido.");
      return;
    }
    if (Number.isNaN(start.getTime())) {
      setRecurringError("Selecciona una fecha de inicio válida.");
      return;
    }

    const occurrences = computeOccurrences(start, recurringFrequency, 4).map((date) => date.toISOString());

    const charge: RecurringChargeView = {
      id: createId("recurring"),
      label,
      amount,
      frequency: recurringFrequency,
      startDate: start.toISOString(),
      nextRuns: occurrences,
      createdAt: new Date().toISOString(),
    };

    setRecurringCharges((prev) => [charge, ...prev].slice(0, 6));
    setRecurringError(null);
    setRecurringStatus("Programamos tu recordatorio recurrente. Confirmaremos cada envío automáticamente.");
    setRecurringLabel("");
    setRecurringAmountRaw("");
  };

  const handleOpenSettlementRangePicker = () => {
    setSettlementStatus(null);
    setSettlementRangePickerVisible(true);
  };

  const handleSettlementRangeApply = (range: { start: DateKey; end: DateKey }) => {
    setSettlementRange(range);
    setSettlementRangePickerVisible(false);
    setSettlementStatus(null);
  };

  const handleSettlementRangeCancel = () => {
    setSettlementRangePickerVisible(false);
  };

  const handleGenerateSettlement = async () => {
    const periodLabel =
      settlementRange.start && settlementRange.end
        ? settlementRangeLabel
        : monthFormatter.format(new Date());
  setSettlementStatus("Generando PDF del resumen…");

    try {
      const html = buildSettlementReportHtml({
        monthLabel: periodLabel,
        summary: settlementSummary,
        generatedAt: new Date(),
      });

      if (isWeb) {
        const autoPrintHtml = html.replace(
          "</body>",
          `<script>window.addEventListener('load', function(){setTimeout(function(){window.print();}, 360);});</script></body>`,
        );

        try {
          const blob = new Blob([autoPrintHtml], { type: "text/html" });
          const previewUrl = URL.createObjectURL(blob);
          const popup = window.open(previewUrl, "_blank", "noopener,noreferrer");
          if (!popup) {
            URL.revokeObjectURL(previewUrl);
            setSettlementStatus("Activa las ventanas emergentes para ver el resumen.");
            return;
          }
          popup.focus();
          setSettlementStatus("Resumen generado. Descárgalo o imprímelo desde la nueva ventana.");
          setTimeout(() => {
            URL.revokeObjectURL(previewUrl);
          }, 60000);
        } catch (err) {
          setSettlementStatus("No se pudo abrir la vista previa. Intenta nuevamente.");
        }
        return;
      }

      const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
      const sanitizedLabel = periodLabel.replace(/\s+/g, "_").replace(/[^A-Za-z0-9_\-]/g, "");
  const fileName = `Resumen_${sanitizedLabel || "mes"}_${Date.now()}.pdf`;
      let fileUri = uri;

      const fileSystemModule = FileSystem as unknown as {
        cacheDirectory?: string | null;
        documentDirectory?: string | null;
      };

      const baseDir = fileSystemModule.cacheDirectory ?? fileSystemModule.documentDirectory ?? undefined;

      if (base64 && baseDir) {
        const targetPath = `${baseDir}${fileName}`;
        await FileSystem.writeAsStringAsync(targetPath, base64, {
          encoding: "base64" as any,
        });
        fileUri = targetPath;
      } else if (baseDir) {
        const targetPath = `${baseDir}${fileName}`;
        await FileSystem.copyAsync({ from: uri, to: targetPath });
        fileUri = targetPath;
      }

      if (Platform.OS === "web") {
        setSettlementStatus(`Resumen generado. Descarga el PDF desde ${fileUri}.`);
        return;
      }

      if (Platform.OS === "android") {
        const safFileName = fileName.replace(/\.pdf$/i, "");
        if (base64 && StorageAccessFramework?.requestDirectoryPermissionsAsync) {
          try {
            const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (!permissions.granted) {
              setSettlementStatus("Resumen generado. Concede acceso a una carpeta para guardarlo.");
              return;
            }
            const destinationUri = await StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              safFileName,
              "application/pdf",
            );
            await StorageAccessFramework.writeAsStringAsync(destinationUri, base64, {
              encoding: EncodingType.Base64,
            });
            setSettlementStatus("Resumen generado y guardado en la carpeta seleccionada.");
            return;
          } catch (safError) {
            console.warn("No se pudo guardar usando StorageAccessFramework", safError);
          }
        }

        const contentUri = await getContentUriAsync(fileUri);
        try {
          await Linking.openURL(contentUri);
          setSettlementStatus("Resumen generado. Ábrelo desde tu visor de documentos para guardarlo.");
        } catch (linkingError) {
          console.warn("No se pudo abrir el visor para el PDF", linkingError);
          setSettlementStatus(`Resumen generado. Ubícalo en: ${fileUri}`);
        }
        return;
      }

      if (Platform.OS === "ios") {
        try {
          await Sharing.shareAsync(fileUri, {
            dialogTitle: "Guardar resumen",
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
          });
          setSettlementStatus("Resumen generado. Selecciona un destino en la hoja para guardarlo.");
        } catch (shareError) {
          console.warn("Expo share sheet fallo", shareError);
          setSettlementStatus("Resumen generado. Abre Archivos para guardarlo manualmente: " + fileUri);
        }
        return;
      }
    } catch (error) {
      console.error("Error generating settlement PDF", error);
      setSettlementStatus("No se pudo generar el PDF. Intenta de nuevo en unos segundos.");
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
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 420 }}
          >
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.logoBadge}>
                  <Image
                    source={bankLogo}
                    style={styles.logoImage}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel="Logo Banco de Costa Rica"
                  />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={styles.title}>Cobros inteligentes</Text>
                </View>
              </View>
              <ProfileAvatarButton
                size={40}
                onPress={() =>
                  router.push({
                    pathname: "/(app)/notifications",
                    params: {
                      from: "/(app)/charges",
                    },
                  })
                }
                accessibilityLabel="Ver notificaciones"
                style={styles.profileShortcut}
              />
            </View>

            <Text style={styles.headerSubtitle}>
              Administra enlaces compartidos, programaciones recurrentes y resúmenes automáticos desde un solo lugar.
            </Text>

            <GlassCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.sectionTitle}>Dividir pagos</Text>
                  <MarqueeText
                    text="Ingresa a tus participantes, reparte el monto automáticamente y genera enlaces individuales."
                    containerStyle={styles.cardHintContainer}
                    textStyle={styles.cardHint}
                  />
                </View>
                <View style={styles.cardHeaderIconWrap}>
                  <MaterialCommunityIcons name="account-group" size={22} color={iconAccent} />
                </View>
              </View>

              {splitStatus ? <Text style={styles.statusMessage}>{splitStatus}</Text> : null}
              {splitError ? <Text style={styles.errorMessage}>{splitError}</Text> : null}

              <View style={styles.fieldGroup}>
                <NeonTextField
                  label="Nombre del cobro"
                  placeholder="Describe el cobro"
                  value={splitLabel}
                  onChangeText={handleSplitLabelChange}
                  icon={
                    <MaterialCommunityIcons name="notebook-outline" size={20} color={iconAccent} />
                  }
                />
                <View style={styles.participantsInputBlock}>
                  <NeonTextField
                    label="Participante"
                    placeholder="Ingresa participantes"
                    value={participantNameInput}
                    onChangeText={handleParticipantNameChange}
                    helpText='Escribe un nombre y pulsa "Añadir persona".'
                    returnKeyType="done"
                    onSubmitEditing={() => handleAddParticipant()}
                    icon={
                      <MaterialCommunityIcons name="account-multiple" size={20} color={iconAccent} />
                    }
                  />
                  <Pressable
                    onPress={handleAddParticipant}
                    disabled={!canAddParticipant}
                    accessibilityRole="button"
                    accessibilityLabel="Añadir participante"
                    style={({ pressed }) => [
                      styles.participantAddButton,
                      usesBrightVariant && styles.participantAddButtonBright,
                      pressed && styles.participantAddButtonPressed,
                      !canAddParticipant && styles.participantAddButtonDisabled,
                    ]}
                  >
                    <MaterialCommunityIcons name="account-plus" size={18} color={iconAccent} />
                    <Text
                      style={[
                        styles.participantAddLabel,
                        usesBrightVariant && styles.participantAddLabelBright,
                      ]}
                    >
                      Añadir persona
                    </Text>
                  </Pressable>
                  {participantsList.length > 0 ? (
                    <View style={styles.participantChips}>
                      {participantsList.map((name, index) => (
                        <View
                          key={`${name}-${index}`}
                          style={[
                            styles.participantChip,
                            usesBrightVariant && styles.participantChipBright,
                          ]}
                        >
                          <Text style={styles.participantChipLabel}>{name}</Text>
                          <Pressable
                            onPress={() => handleRemoveParticipant(index)}
                            accessibilityRole="button"
                            accessibilityLabel={`Eliminar a ${name}`}
                            style={({ pressed }) => [
                              styles.participantChipRemove,
                              usesBrightVariant && styles.participantChipRemoveBright,
                              pressed && styles.participantChipRemovePressed,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="close"
                              size={14}
                              color={usesBrightVariant ? "#FFFFFF" : palette.textSecondary}
                            />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.participantEmptyHelper}>
                      Añade al menos dos personas para repartir el monto.
                    </Text>
                  )}
                </View>
                <NeonTextField
                  label="Monto total"
                  placeholder="₡75,000"
                  value={formatAmountDisplay(splitAmountRaw)}
                  onChangeText={handleSplitAmountChange}
                  keyboardType="decimal-pad"
                  allowOnlyNumeric
                  icon={
                    <MaterialCommunityIcons name="currency-usd" size={20} color={iconAccent} />
                  }
                />
              </View>

              <PrimaryButton
                label="Calcular reparto"
                onPress={handleCalculateSplit}
                style={styles.sectionButton}
              />

              {splitResult ? (
                <View style={styles.splitResult}>
                  <View style={styles.splitSummaryRow}>
                    <Text style={styles.splitSummaryLabel}>{splitResult.label}</Text>
                    <Text style={styles.splitSummaryAmount}>{formatCurrency(splitResult.total)}</Text>
                  </View>
                  <View style={styles.resultsList}>
                    {splitResult.participants.map((participant) => (
                      <View key={participant.id} style={styles.resultRow}>
                        <View style={styles.resultNameRow}>
                          <MaterialCommunityIcons
                            name="account-circle-outline"
                            size={20}
                            color={palette.textSecondary}
                          />
                          <Text style={styles.resultName}>{participant.name}</Text>
                        </View>
                        <Text style={styles.resultAmount}>{formatCurrency(participant.amount)}</Text>
                      </View>
                    ))}
                  </View>
                  {splitResult.remainderReceivers > 0 ? (
                    <Text style={styles.resultHint}>
                      {splitResult.remainderReceivers === 1
                        ? "Sumamos ₡0.01 adicional a la primera persona para cuadrar el total."
                        : `Sumamos ₡0.01 adicional a las primeras ${splitResult.remainderReceivers} personas para cuadrar el total.`}
                    </Text>
                  ) : null}
                  <PrimaryButton
                    label="Generar enlace a sobre"
                    onPress={handleGenerateLinks}
                    style={styles.secondaryButton}
                  />
                </View>
              ) : null}
            </GlassCard>

            <GlassCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.sectionTitle}>Cobros recurrentes</Text>
                  <MarqueeText
                    text="Programa recordatorios automáticos para cobros periódicos."
                    containerStyle={styles.cardHintContainer}
                    textStyle={styles.cardHint}
                  />
                </View>
                <View style={styles.cardHeaderIconWrap}>
                  <MaterialCommunityIcons name="autorenew" size={22} color={iconAccent} />
                </View>
              </View>

              {recurringStatus ? <Text style={styles.statusMessage}>{recurringStatus}</Text> : null}
              {recurringError ? <Text style={styles.errorMessage}>{recurringError}</Text> : null}

              <View style={styles.fieldGroup}>
                <NeonTextField
                  label="Nombre del cobro"
                  placeholder="Suscripción gimnasio"
                  value={recurringLabel}
                  onChangeText={handleRecurringLabelChange}
                  icon={
                    <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={iconAccent} />
                  }
                />
                <NeonTextField
                  label="Monto"
                  placeholder="₡15,000"
                  value={formatAmountDisplay(recurringAmountRaw)}
                  onChangeText={handleRecurringAmountChange}
                  keyboardType="decimal-pad"
                  allowOnlyNumeric
                  icon={
                    <MaterialCommunityIcons name="cash-sync" size={20} color={iconAccent} />
                  }
                />
                <View style={styles.datePickerFieldWrapper}>
                  <NeonTextField
                    label="Fecha de inicio"
                    placeholder="Selecciona una fecha"
                    value={recurringStartDateDisplay}
                    editable={false}
                    caretHidden
                    showSoftInputOnFocus={false}
                    selectTextOnFocus={false}
                    icon={
                      <MaterialCommunityIcons name="calendar" size={20} color={iconAccent} />
                    }
                  />
                  <Pressable
                    style={styles.datePickerOverlay}
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar fecha de inicio"
                    onPress={handleOpenRecurringStartDatePicker}
                  />
                </View>
              </View>

              <View style={styles.chipRow}>
                {FREQUENCY_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => handleFrequencySelect(option.id)}
                    style={[
                      styles.chip,
                      recurringFrequency === option.id && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        recurringFrequency === option.id && styles.chipLabelActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.chipDescription}>{option.description}</Text>
                  </Pressable>
                ))}
              </View>

              <PrimaryButton
                label="Programar cobro"
                onPress={handleAddRecurringCharge}
                style={styles.sectionButton}
              />

              {recurringCharges.length > 0 ? (
                <View style={styles.recurringList}>
                  {recurringCharges.map((charge) => (
                    <View key={charge.id} style={styles.recurringItem}>
                      <View style={styles.recurringHeaderRow}>
                        <Text style={styles.recurringTitle}>{charge.label}</Text>
                        <Text style={styles.recurringAmount}>{formatCurrency(charge.amount)}</Text>
                      </View>
                      <Text style={styles.recurringMeta}>
                        {FREQUENCY_OPTIONS.find((item) => item.id === charge.frequency)?.label ?? ""} · Inicio {dateFormatter.format(new Date(charge.startDate))}
                      </Text>
                      <View style={styles.nextRunsRow}>
                        {charge.nextRuns.map((run) => (
                          <View key={run} style={styles.nextRunChip}>
                            <Text style={styles.nextRunText}>{dateFormatter.format(new Date(run))}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyHelper}>
                  Aún no tienes cobros programados. Crea el primero para ver los próximos recordatorios aquí.
                </Text>
              )}
            </GlassCard>

            <GlassCard>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.sectionTitle}>Resumen Financiero</Text>
                  <MarqueeText
                    text="Genera un resumen mensual de tus ingresos y egresos listo para compartir con contabilidad."
                    containerStyle={styles.cardHintContainer}
                    textStyle={styles.cardHint}
                  />
                </View>
                <View style={styles.cardHeaderIconWrap}>
                  <MaterialCommunityIcons name="file-chart-outline" size={22} color={iconAccent} />
                </View>
              </View>

              <View style={styles.datePickerFieldWrapper}>
                <NeonTextField
                  label="Periodo analizado"
                  placeholder="Selecciona un periodo"
                  value={settlementRangeLabel}
                  editable={false}
                  caretHidden
                  showSoftInputOnFocus={false}
                  selectTextOnFocus={false}
                  icon={
                    <MaterialCommunityIcons name="calendar-range" size={20} color={iconAccent} />
                  }
                />
                <Pressable
                  style={styles.datePickerOverlay}
                  accessibilityRole="button"
                  accessibilityLabel="Seleccionar periodo para el resumen"
                  onPress={handleOpenSettlementRangePicker}
                />
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Ingresos recibidos</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(settlementSummary.inboundTotal)}</Text>
                  <Text style={styles.summaryDescription}>
                    {settlementSummary.inboundCount} transferencias entrantes
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Transferencias enviadas</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(settlementSummary.outboundTotal)}</Text>
                  <Text style={styles.summaryDescription}>
                    {settlementSummary.outboundCount} transferencias salientes
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Recargas y extras</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(settlementSummary.rechargeTotal)}</Text>
                  <Text style={styles.summaryDescription}>
                    {settlementSummary.rechargeCount} recargas registradas
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Balance neto</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      settlementSummary.netFlow >= 0 ? styles.positiveValue : styles.negativeValue,
                    ]}
                  >
                    {formatCurrency(settlementSummary.netFlow)}
                  </Text>
                  <Text style={styles.summaryDescription}>Ingresos menos egresos y recargas</Text>
                </View>
              </View>

              <View style={styles.topContacts}>
                <Text style={styles.topContactsTitle}>Destinos destacados</Text>
                {settlementSummary.topOutbound.length > 0 ? (
                  settlementSummary.topOutbound.map((item: SummaryEntry) => (
                    <View key={item.name} style={styles.topContactRow}>
                      <View style={styles.topContactBadge}>
                        <MaterialCommunityIcons
                          name="arrow-top-right-bold-outline"
                          size={16}
                          color={iconAccent}
                        />
                      </View>
                      <Text style={styles.topContactName}>{item.name}</Text>
                      <Text style={styles.topContactAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyHelper}>Sin egresos registrados este mes.</Text>
                )}
              </View>

              <View style={styles.topContacts}>
                <Text style={styles.topContactsTitle}>Remitentes destacados</Text>
                {settlementSummary.topInbound.length > 0 ? (
                  settlementSummary.topInbound.map((item: SummaryEntry) => (
                    <View key={item.name} style={styles.topContactRow}>
                      <View style={styles.topContactBadge}>
                        <MaterialCommunityIcons
                          name="arrow-bottom-left-bold-outline"
                          size={16}
                          color="#63F7B0"
                        />
                      </View>
                      <Text style={styles.topContactName}>{item.name}</Text>
                      <Text style={styles.topContactAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyHelper}>Sin ingresos registrados este mes.</Text>
                )}
              </View>

              {settlementStatus ? <Text style={styles.statusMessage}>{settlementStatus}</Text> : null}

              <PrimaryButton
                label="Descargar resumen"
                onPress={handleGenerateSettlement}
                style={styles.sectionButton}
              />
            </GlassCard>
          </MotiView>
        </ScrollView>
      </View>
      <SingleDatePickerModal
        visible={startDatePickerVisible}
        initialDate={recurringStartDate || null}
        onCancel={() => setStartDatePickerVisible(false)}
        onConfirm={handleRecurringStartDateConfirm}
        title="Selecciona la fecha de inicio"
        confirmLabel="Guardar"
      />
      <SettlementRangePickerModal
        visible={settlementRangePickerVisible}
        initialRange={settlementRange}
        onCancel={handleSettlementRangeCancel}
        onApply={handleSettlementRangeApply}
      />
    </FuturisticBackground>
  );
};

const styles = StyleSheet.create({
  chipRowRedesigned: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chipRedesigned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    minWidth: 0,
    maxWidth: 110,
  },
  chipRedesignedActive: {
    backgroundColor: palette.accentCyan,
    shadowOpacity: 0.18,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabelRedesigned: {
    color: palette.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  chipLabelRedesignedActive: {
    color: '#fff',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 4,
    width: '100%',
  },
  cardHeaderTextWrap: {
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
    maxWidth: '82%',
  },
  cardHeaderIconWrap: {
    flexShrink: 0,
    paddingLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },
  cardHintContainer: {
    maxWidth: '100%',
    marginTop: 2,
    marginBottom: 2,
  },
  datePickerFieldWrapper: {
    position: "relative",
  },
  datePickerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 20,
    zIndex: 1,
  },
  screen: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    paddingBottom: 260,
  },
  container: {
    paddingTop: 68,
    paddingHorizontal: 24,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  headerCopy: {
    flex: 1,
    gap: 12,
    paddingRight: 16,
    alignItems: "center",
  },
  caption: {
    color: palette.textMuted,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontSize: 12,
    textAlign: "center",
  },
  title: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  headerSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
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
    shadowOpacity: 0.25,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  cardHint: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  participantsInputBlock: {
    gap: 12,
  },
  participantAddButton: {
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  participantAddButtonBright: {
    borderColor: "rgba(255,255,255,0.32)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  participantAddButtonPressed: {
    backgroundColor: "rgba(0, 240, 255, 0.2)",
  },
  participantAddButtonDisabled: {
    opacity: 0.5,
  },
  participantAddLabel: {
    color: palette.accentCyan,
    fontSize: 13,
    fontWeight: "600",
  },
  participantAddLabelBright: {
    color: "#FFFFFF",
  },
  participantChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  participantChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.28)",
    backgroundColor: "rgba(0, 240, 255, 0.12)",
  },
  participantChipBright: {
    borderColor: "rgba(255,255,255,0.32)",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  participantChipLabel: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  participantChipRemove: {
    borderRadius: 12,
    padding: 4,
    backgroundColor: "rgba(0, 0, 0, 0.16)",
  },
  participantChipRemoveBright: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  participantChipRemovePressed: {
    backgroundColor: "rgba(0, 0, 0, 0.26)",
  },
  participantEmptyHelper: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  fieldGroup: {
    gap: 14,
    marginBottom: 16,
  },
  sectionButton: {
    marginTop: 8,
  },
  statusMessage: {
    backgroundColor: "rgba(99, 247, 176, 0.12)",
    borderColor: "rgba(99, 247, 176, 0.35)",
    borderWidth: 1,
    color: palette.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    fontSize: 13,
    marginBottom: 16,
  },
  errorMessage: {
    backgroundColor: "rgba(255, 72, 66, 0.16)",
    borderColor: "rgba(255, 72, 66, 0.45)",
    borderWidth: 1,
    color: palette.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    fontSize: 13,
    marginBottom: 16,
  },
  splitResult: {
    marginTop: 18,
    gap: 14,
  },
  splitSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  splitSummaryLabel: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  splitSummaryAmount: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  resultsList: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 6,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  resultNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultName: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  resultAmount: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  resultHint: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  secondaryButton: {
    marginTop: 4,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: {
    borderColor: palette.accentCyan,
    backgroundColor: "rgba(0, 240, 255, 0.14)",
  },
  chipLabel: {
    color: palette.textSecondary,
    fontWeight: "700",
    textAlign: "center",
  },
  chipLabelActive: {
    color: palette.textPrimary,
  },
  chipDescription: {
    color: palette.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  recurringList: {
    marginTop: 12,
    gap: 12,
  },
  recurringItem: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 10,
  },
  recurringHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recurringTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  recurringAmount: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  recurringMeta: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  nextRunsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nextRunChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
  },
  nextRunText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyHelper: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: "48%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 6,
  },
  summaryLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  summaryDescription: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  positiveValue: {
    color: "#63F7B0",
  },
  negativeValue: {
    color: palette.danger,
  },
  topContacts: {
    marginTop: 18,
    gap: 10,
  },
  topContactsTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  topContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  topContactBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
  },
  topContactName: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  topContactAmount: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
});

export default ChargesScreen;
