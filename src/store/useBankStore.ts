import { create } from "zustand";

import { formatCurrency } from "@/utils/currency";
import { createId } from "@/utils/id";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  favorite: boolean;
  lastUsedAt?: string;
};

export type ContactDraft = {
  name: string;
  phone: string;
  avatarColor?: string;
  favorite?: boolean;
};

export type ContactUpdate = Partial<Omit<Contact, "id" | "phone">> & {
  phone?: string;
};

export type TransferDirection = "inbound" | "outbound";

export type TransferRecord = {
  id: string;
  contactName: string;
  phone: string;
  normalizedPhone: string;
  amount: number;
  note?: string;
  createdAt: string;
  direction: TransferDirection;
  linkedEnvelopeId?: string;
  automationId?: string;
};

type SimulationTransferOptions = {
  amount?: number;
  contactName?: string;
  phone?: string;
  note?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var simulateIncomingTransfer:
    | ((options?: SimulationTransferOptions) => TransferRecord)
    | undefined;
}

export type RechargeRecord = {
  id: string;
  provider: string;
  phone: string;
  amount: number;
  createdAt: string;
};

export type Envelope = {
  id: string;
  name: string;
  color: string;
  balance: number;
  targetAmount?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type EnvelopeDraft = {
  name: string;
  color?: string;
  targetAmount?: number;
  description?: string;
};

export type EnvelopeUpdate = Partial<
  Omit<Envelope, "id" | "createdAt">
>;

export type AutomationRule = {
  id: string;
  title: string;
  matchPhone: string;
  normalizedPhone: string;
  envelopeId: string;
  active: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
};

export type AutomationDraft = {
  title?: string;
  matchPhone: string;
  envelopeId: string;
  active?: boolean;
};

export type AutomationUpdate = Partial<
  Omit<AutomationRule, "id" | "createdAt">
>;

export type NotificationCategory =
  | "transfer"
  | "recharge"
  | "security"
  | "general";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
};

export type NotificationDraft = {
  title: string;
  message: string;
  category?: NotificationCategory;
};

export type BiometricAttemptResult = "success" | "mismatch" | "timeout";

export type UserProfile = {
  name: string;
  id: string;
  phone: string;
  avatarColor: string;
  idType: string;
};

export type TransferDraft = {
  contactName: string;
  phone: string;
  amount: number;
  note?: string;
};

export type RechargeDraft = {
  provider: string;
  phone: string;
  amount: number;
};

export type BankState = {
  initialBalance: number;
  balance: number;
  isAuthenticated: boolean;
  user: UserProfile;
  biometricRegistered: boolean;
  biometricLastSync?: string;
  biometricAttempts: Array<{
    id: string;
    label: string;
    result: BiometricAttemptResult;
    timestamp: string;
    device: string;
  }>;
  contacts: Contact[];
  transfers: TransferRecord[];
  recharges: RechargeRecord[];
  envelopes: Envelope[];
  automations: AutomationRule[];
  notifications: NotificationItem[];
  addContact: (draft: ContactDraft) => Contact;
  updateContact: (id: string, updates: ContactUpdate) => void;
  removeContact: (id: string) => void;
  toggleFavoriteContact: (id: string) => void;
  recordContactUsage: (phone: string, name?: string) => void;
  login: (payload: { id: string; phone: string; idType?: string }) => boolean;
  simulateBiometricValidation: (payload?: {
    latencyMs?: number;
    expectedMatch?: boolean;
  }) => Promise<{ success: boolean; deviceName: string }>;
  registerBiometrics: (provider: { displayName: string }) => void;
  logout: () => void;
  sendTransfer: (draft: TransferDraft) => TransferRecord;
  receiveTransfer: (draft: TransferDraft) => TransferRecord;
  makeRecharge: (draft: RechargeDraft) => RechargeRecord;
  createEnvelope: (draft: EnvelopeDraft) => Envelope;
  updateEnvelope: (id: string, updates: EnvelopeUpdate) => Envelope | null;
  removeEnvelope: (id: string) => void;
  allocateToEnvelope: (
    id: string,
    amount: number,
    options?: { allowNegative?: boolean; label?: string },
  ) => void;
  createAutomationRule: (draft: AutomationDraft) => AutomationRule;
  updateAutomationRule: (
    id: string,
    updates: AutomationUpdate,
  ) => AutomationRule | null;
  removeAutomationRule: (id: string) => void;
  addNotification: (draft: NotificationDraft) => NotificationItem;
  markNotificationRead: (id: string) => void;
  toggleNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
};

const STARTING_BALANCE = 509_015.4;
const DEFAULT_USER: UserProfile = {
  name: "María Rodríguez",
  id: "1-1234-5678",
  phone: "6203-4545",
  avatarColor: "#FF3358",
  idType: "Cédula de identidad",
};

const CONTACT_COLORS = [
  "#00F0FF",
  "#FF8A65",
  "#8F9BFF",
  "#4ADE80",
  "#FACC15",
  "#7A2BFF",
];

const DEFAULT_CONTACTS: Contact[] = [
  {
    id: createId("contact"),
    name: "Juan Perez Rojas",
    phone: "6203-4545",
    avatarColor: CONTACT_COLORS[0],
    favorite: true,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: createId("contact"),
    name: "Laura Hernández",
    phone: "7102-9090",
    avatarColor: CONTACT_COLORS[1],
    favorite: true,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: createId("contact"),
    name: "Carlos Jiménez",
    phone: "8803-1212",
    avatarColor: CONTACT_COLORS[2],
    favorite: false,
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: createId("notification"),
    title: "Transferencia recibida",
    message: `Carlos Jiménez te envió ${formatCurrency(35_000)} hace unas horas.`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    read: false,
    category: "transfer",
  },
  {
    id: createId("notification"),
    title: "Alerta de seguridad",
    message: "Recordatorio: actualiza tu PIN de SINPE Móvil periódicamente.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: false,
    category: "security",
  },
  {
    id: createId("notification"),
    title: "Recarga exitosa",
    message: `Se acreditaron ${formatCurrency(10_000)} a tu línea prepago.`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    read: true,
    category: "recharge",
  },
];

const getDefaultNotifications = () => DEFAULT_NOTIFICATIONS.map((item) => ({ ...item }));
const getDefaultContacts = () => DEFAULT_CONTACTS.map((contact) => ({ ...contact }));

export const ENVELOPE_COLORS = [
  "#63F7B0",
  "#8D84FF",
  "#FFB786",
  "#4CEAF7",
  "#FF86E8",
  "#7A2BFF",
];

const DEFAULT_ENVELOPES: Envelope[] = [
  {
    id: createId("envelope"),
    name: "Ahorro emergencia",
    color: ENVELOPE_COLORS[0],
    balance: 95000,
    targetAmount: 200000,
    description: "Respaldo para imprevistos",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: createId("envelope"),
    name: "Renta",
    color: ENVELOPE_COLORS[2],
    balance: 180000,
    targetAmount: 250000,
    description: "Pago mensual del apartamento",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  {
    id: createId("automation"),
    title: "SINPE salario",
    matchPhone: "8888-1212",
    normalizedPhone: "88881212",
    envelopeId: DEFAULT_ENVELOPES[0].id,
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    lastTriggeredAt: undefined,
  },
];

const getDefaultEnvelopes = () => DEFAULT_ENVELOPES.map((item) => ({ ...item }));
const getDefaultAutomations = () => DEFAULT_AUTOMATIONS.map((item) => ({ ...item }));

const normalizePhone = (phone: string) => phone.replace(/[^0-9]/g, "");
const phonesMatch = (a: string, b: string) => normalizePhone(a) === normalizePhone(b);

type SetState = (
  partial:
    | BankState
    | Partial<BankState>
    | ((state: BankState) => BankState | Partial<BankState>),
  replace?: boolean,
) => void;

type GetState = () => BankState;

export const useBankStore = create<BankState>(
  (set: SetState, get: GetState) => {
    const applyEnvelopeAllocation = (
      envelopeId: string,
      amount: number,
      options?: { label?: string; allowNegative?: boolean },
    ) => {
      const { allowNegative = false } = options ?? {};
      if (!Number.isFinite(amount) || amount === 0) {
        return;
      }
      set((state: BankState) => {
        const envelope = state.envelopes.find(
          (item: Envelope) => item.id === envelopeId,
        );
        if (!envelope) {
          return {};
        }
        const nextBalance = envelope.balance + amount;
        if (!allowNegative && nextBalance < 0) {
          return {};
        }
        const updated: Envelope = {
          ...envelope,
          balance: nextBalance,
          updatedAt: new Date().toISOString(),
        };
        return {
          envelopes: state.envelopes.map((item: Envelope) =>
            item.id === envelopeId ? updated : item,
          ),
        };
      });
    };

    const handleAutomationsForTransfer = (record: TransferRecord) => {
      if (record.direction !== "inbound") {
        return;
      }
      const state = get();
      const automation = state.automations.find(
        (rule: AutomationRule) =>
          rule.active && rule.normalizedPhone === record.normalizedPhone,
      );
      if (!automation) {
        return;
      }

      applyEnvelopeAllocation(automation.envelopeId, record.amount);

      set((current: BankState) => {
        const updatedTransfers = current.transfers.map(
          (item: TransferRecord) =>
            item.id === record.id
              ? {
                  ...item,
                  linkedEnvelopeId: automation.envelopeId,
                  automationId: automation.id,
                }
              : item,
        );
        const updatedAutomations = current.automations.map(
          (rule: AutomationRule) =>
            rule.id === automation.id
              ? { ...rule, lastTriggeredAt: record.createdAt }
              : rule,
        );
        return {
          transfers: updatedTransfers,
          automations: updatedAutomations,
        };
      });
    };

    return {
      initialBalance: STARTING_BALANCE,
      balance: STARTING_BALANCE,
      isAuthenticated: false,
      user: DEFAULT_USER,
      biometricRegistered: false,
      biometricLastSync: undefined,
      biometricAttempts: [],
      contacts: getDefaultContacts(),
      transfers: [],
      recharges: [],
      envelopes: getDefaultEnvelopes(),
      automations: getDefaultAutomations(),
      notifications: getDefaultNotifications(),
      addContact: (draft: ContactDraft) => {
        const rawPhone = draft.phone.trim();
        if (!rawPhone) {
          throw new Error("El número telefónico es requerido");
        }
        const normalizedPhone = normalizePhone(rawPhone);
        if (!normalizedPhone) {
          throw new Error("El número telefónico es inválido");
        }
        const name = draft.name.trim() || rawPhone;
        const now = new Date().toISOString();
        const existing = get().contacts.find((item: Contact) =>
          phonesMatch(item.phone, rawPhone),
        );
        const colorFallback =
          draft.avatarColor ||
          CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];

        if (existing) {
          const updated: Contact = {
            ...existing,
            name,
            phone: rawPhone,
            avatarColor: draft.avatarColor || existing.avatarColor,
            favorite: draft.favorite ?? existing.favorite,
            lastUsedAt: now,
          };
          set((state: BankState) => ({
            contacts: [
              updated,
              ...state.contacts.filter(
                (contact: Contact) => contact.id !== existing.id,
              ),
            ],
          }));
          return updated;
        }

        const contact: Contact = {
          id: createId("contact"),
          name,
          phone: rawPhone,
          avatarColor: colorFallback,
          favorite: draft.favorite ?? false,
          lastUsedAt: now,
        };

        set((state: BankState) => ({
          contacts: [contact, ...state.contacts],
        }));

        return contact;
      },
      updateContact: (id: string, updates: ContactUpdate) => {
        set((state: BankState) => ({
          contacts: state.contacts.map((contact: Contact) => {
            if (contact.id !== id) {
              return contact;
            }
            const nextPhone = updates.phone?.trim() || contact.phone;
            return {
              ...contact,
              name: updates.name?.trim() || contact.name,
              phone: nextPhone,
              avatarColor: updates.avatarColor || contact.avatarColor,
              favorite:
                typeof updates.favorite === "boolean"
                  ? updates.favorite
                  : contact.favorite,
              lastUsedAt: updates.lastUsedAt || contact.lastUsedAt,
            };
          }),
        }));
      },
      removeContact: (id: string) => {
        set((state: BankState) => ({
          contacts: state.contacts.filter((contact: Contact) => contact.id !== id),
        }));
      },
      toggleFavoriteContact: (id: string) => {
        set((state: BankState) => ({
          contacts: state.contacts.map((contact: Contact) =>
            contact.id === id
              ? {
                  ...contact,
                  favorite: !contact.favorite,
                }
              : contact,
          ),
        }));
      },
      recordContactUsage: (phone: string, name?: string) => {
        const normalized = normalizePhone(phone);
        if (!normalized) {
          return;
        }
        const displayPhone = phone.trim() || normalized;
        const now = new Date().toISOString();
        set((state: BankState) => {
          const current = state.contacts.find((item: Contact) =>
            phonesMatch(item.phone, displayPhone),
          );
          if (!current) {
            const fallbackName = name?.trim() || displayPhone;
            const color =
              CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];
            const contact: Contact = {
              id: createId("contact"),
              name: fallbackName,
              phone: displayPhone,
              avatarColor: color,
              favorite: state.contacts.length < 3,
              lastUsedAt: now,
            };
            return {
              contacts: [contact, ...state.contacts],
            };
          }
          const updated: Contact = {
            ...current,
            name: name?.trim() || current.name,
            phone: displayPhone,
            lastUsedAt: now,
          };
          return {
            contacts: [
              updated,
              ...state.contacts.filter(
                (contact: Contact) => contact.id !== current.id,
              ),
            ],
          };
        });
      },
      login: ({
      id,
      phone,
      idType,
    }: {
      id: string;
      phone: string;
      idType?: string;
    }) => {
      if (!id.trim() || !phone.trim()) {
        return false;
      }
      set((state: BankState) => ({
        isAuthenticated: true,
        user: {
          ...state.user,
          id: id.trim(),
          phone: phone.trim(),
          idType: idType?.trim() || state.user.idType,
        },
      }));
      return true;
    },
    simulateBiometricValidation: async ({ latencyMs = 1200, expectedMatch = true } = {}) => {
      const attemptId = createId("biometric");
      const deviceName = "FaceGraph Sensor v2";
      const delay = Math.max(400, latencyMs + Math.floor(Math.random() * 240 - 120));
      const rawResult: BiometricAttemptResult = expectedMatch
        ? "success"
        : Math.random() > 0.5
        ? "mismatch"
        : "timeout";

      await new Promise((resolve) => setTimeout(resolve, delay));

      const timestamp = new Date().toISOString();
      set((state: BankState) => ({
        biometricAttempts: [
          {
            id: attemptId,
            label: expectedMatch ? "Reconocimiento facial" : "Huella digital",
            device: deviceName,
            result: rawResult,
            timestamp,
          },
          ...state.biometricAttempts,
        ].slice(0, 5),
        biometricLastSync: timestamp,
      }));

      if (rawResult === "success") {
        set({ biometricRegistered: true });
      }

      return { success: rawResult === "success", deviceName };
    },
    registerBiometrics: ({ displayName }) => {
      const timestamp = new Date().toISOString();
      set((state: BankState) => ({
        biometricRegistered: true,
        biometricLastSync: timestamp,
        biometricAttempts: [
          {
            id: createId("biometric"),
            label: `Registro en ${displayName}`,
            result: "success" as BiometricAttemptResult,
            timestamp,
            device: displayName,
          },
          ...state.biometricAttempts,
        ].slice(0, 5),
      }));
    },
      logout: () => {
        set(() => ({
          isAuthenticated: false,
          balance: STARTING_BALANCE,
          transfers: [],
          recharges: [],
          contacts: getDefaultContacts(),
          envelopes: getDefaultEnvelopes(),
          automations: getDefaultAutomations(),
          notifications: getDefaultNotifications(),
        }));
      },
      sendTransfer: (draft: TransferDraft) => {
        const amount = Number.isFinite(draft.amount) ? draft.amount : 0;
        if (amount <= 0) {
          throw new Error("El monto debe ser mayor a cero");
        }
        if (amount > get().balance) {
          throw new Error("Saldo insuficiente");
        }
        const displayPhone = draft.phone.trim();
        const normalizedPhone = normalizePhone(displayPhone);
        if (!normalizedPhone) {
          throw new Error("Número telefónico inválido");
        }
        const record: TransferRecord = {
          id: createId("transfer"),
          contactName: draft.contactName.trim(),
          phone: displayPhone || normalizedPhone,
          normalizedPhone,
          amount,
          note: draft.note?.trim() || undefined,
          createdAt: new Date().toISOString(),
          direction: "outbound",
        };
        const notification: NotificationItem = {
          id: createId("notification"),
          title: "Transferencia enviada",
          message: `Enviaste ${formatCurrency(amount)} a ${
            record.contactName || record.phone
          }`,
          timestamp: record.createdAt,
          read: false,
          category: "transfer",
        };

        set((state: BankState) => {
          const now = record.createdAt;
          const existing = state.contacts.find((contact: Contact) =>
            phonesMatch(contact.phone, record.phone),
          );
          let contacts: Contact[];

          if (existing) {
            const updatedContact: Contact = {
              ...existing,
              name: record.contactName || existing.name,
              phone: record.phone,
              lastUsedAt: now,
            };
            contacts = [
              updatedContact,
              ...state.contacts.filter(
                (contact: Contact) => contact.id !== existing.id,
              ),
            ];
          } else {
            const color =
              CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];
            const contact: Contact = {
              id: createId("contact"),
              name: record.contactName || record.phone,
              phone: record.phone,
              avatarColor: color,
              favorite: state.contacts.length < 3,
              lastUsedAt: now,
            };
            contacts = [contact, ...state.contacts];
          }

          return {
            balance: state.balance - amount,
            transfers: [record, ...state.transfers].slice(0, 30),
            contacts,
            notifications: [notification, ...state.notifications].slice(0, 30),
          };
        });

        return record;
      },
      receiveTransfer: (draft: TransferDraft) => {
        const amount = Number.isFinite(draft.amount) ? draft.amount : 0;
        if (amount <= 0) {
          throw new Error("El monto debe ser mayor a cero");
        }
        const displayPhone = draft.phone.trim();
        const normalizedPhone = normalizePhone(displayPhone);
        if (!normalizedPhone) {
          throw new Error("Número telefónico inválido");
        }
        const record: TransferRecord = {
          id: createId("transfer"),
          contactName: draft.contactName.trim(),
          phone: displayPhone || normalizedPhone,
          normalizedPhone,
          amount,
          note: draft.note?.trim() || undefined,
          createdAt: new Date().toISOString(),
          direction: "inbound",
        };
        const notification: NotificationItem = {
          id: createId("notification"),
          title: "Transferencia recibida",
          message: `Recibiste ${formatCurrency(amount)} de ${
            record.contactName || record.phone
          }`,
          timestamp: record.createdAt,
          read: false,
          category: "transfer",
        };

        set((state: BankState) => {
          const now = record.createdAt;
          const existing = state.contacts.find((contact: Contact) =>
            phonesMatch(contact.phone, record.phone),
          );
          let contacts: Contact[];

          if (existing) {
            const updatedContact: Contact = {
              ...existing,
              name: record.contactName || existing.name,
              phone: record.phone,
              lastUsedAt: now,
            };
            contacts = [
              updatedContact,
              ...state.contacts.filter(
                (contact: Contact) => contact.id !== existing.id,
              ),
            ];
          } else {
            const color =
              CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];
            const contact: Contact = {
              id: createId("contact"),
              name: record.contactName || record.phone,
              phone: record.phone,
              avatarColor: color,
              favorite: state.contacts.length < 3,
              lastUsedAt: now,
            };
            contacts = [contact, ...state.contacts];
          }

          return {
            balance: state.balance + amount,
            transfers: [record, ...state.transfers].slice(0, 30),
            contacts,
            notifications: [notification, ...state.notifications].slice(0, 30),
          };
        });

        handleAutomationsForTransfer(record);

        return record;
      },
      createEnvelope: (draft: EnvelopeDraft) => {
        const name = draft.name.trim();
        if (!name) {
          throw new Error("El nombre del sobre es requerido");
        }

        const colorFallback =
          draft.color ||
          ENVELOPE_COLORS[Math.floor(Math.random() * ENVELOPE_COLORS.length)];
        const targetAmount =
          typeof draft.targetAmount === "number" && draft.targetAmount > 0
            ? draft.targetAmount
            : undefined;
        const description = draft.description?.trim() || undefined;
        const now = new Date().toISOString();

        const envelope: Envelope = {
          id: createId("envelope"),
          name,
          color: colorFallback,
          balance: 0,
          targetAmount,
          description,
          createdAt: now,
          updatedAt: now,
        };

        set((state: BankState) => ({
          envelopes: [envelope, ...state.envelopes],
        }));

        return envelope;
      },
      updateEnvelope: (id: string, updates: EnvelopeUpdate) => {
        const state = get();
        const existing = state.envelopes.find(
          (item: Envelope) => item.id === id,
        );
        if (!existing) {
          return null;
        }

        const name = updates.name?.trim();
        const description = updates.description?.trim();
        const targetAmount =
          typeof updates.targetAmount === "number" && updates.targetAmount >= 0
            ? updates.targetAmount
            : existing.targetAmount;
        const balance =
          typeof updates.balance === "number" && updates.balance >= 0
            ? updates.balance
            : existing.balance;

        const envelope: Envelope = {
          ...existing,
          name: name || existing.name,
          color: updates.color || existing.color,
          balance,
          targetAmount,
          description: description ?? existing.description,
          updatedAt: new Date().toISOString(),
        };

        set((current: BankState) => ({
          envelopes: current.envelopes.map((item: Envelope) =>
            item.id === id ? envelope : item,
          ),
        }));

        return envelope;
      },
      removeEnvelope: (id: string) => {
        set((state: BankState) => {
          if (!state.envelopes.some((item: Envelope) => item.id === id)) {
            return {};
          }

          const envelopes = state.envelopes.filter(
            (item: Envelope) => item.id !== id,
          );
          const automations = state.automations.filter(
            (rule: AutomationRule) => rule.envelopeId !== id,
          );
          const validAutomationIds = new Set(
            automations.map((rule: AutomationRule) => rule.id),
          );
          const transfers = state.transfers.map((transfer: TransferRecord) => {
            const automationId = transfer.automationId;
            const automationStillValid =
              typeof automationId === "string" &&
              validAutomationIds.has(automationId);

            if (transfer.linkedEnvelopeId === id) {
              return {
                ...transfer,
                linkedEnvelopeId: undefined,
                automationId: automationStillValid
                  ? automationId
                  : undefined,
              };
            }

            if (automationId && !automationStillValid) {
              return {
                ...transfer,
                automationId: undefined,
              };
            }

            return transfer;
          });

          return {
            envelopes,
            automations,
            transfers,
          };
        });
      },
      allocateToEnvelope: (
        id: string,
        rawAmount: number,
        options?: { allowNegative?: boolean; label?: string },
      ) => {
        const amount = Number(rawAmount);
        if (!Number.isFinite(amount) || amount === 0) {
          return;
        }

        const exists = get().envelopes.some(
          (item: Envelope) => item.id === id,
        );
        if (!exists) {
          throw new Error("El sobre seleccionado no existe");
        }

        applyEnvelopeAllocation(id, amount, options);
      },
      createAutomationRule: (draft: AutomationDraft) => {
        const phone = draft.matchPhone.trim();
        if (!phone) {
          throw new Error("Debes indicar el número del remitente");
        }
        const normalized = normalizePhone(phone);
        if (!normalized) {
          throw new Error("El número del remitente es inválido");
        }

        const envelopeExists = get().envelopes.find(
          (item: Envelope) => item.id === draft.envelopeId,
        );
        if (!envelopeExists) {
          throw new Error("El sobre seleccionado no existe");
        }

        const now = new Date().toISOString();
        const title =
          draft.title?.trim() || `Automatización ${envelopeExists.name}`;

        const rule: AutomationRule = {
          id: createId("automation"),
          title,
          matchPhone: phone,
          normalizedPhone: normalized,
          envelopeId: envelopeExists.id,
          active: draft.active ?? true,
          createdAt: now,
          lastTriggeredAt: undefined,
        };

        set((state: BankState) => ({
          automations: [rule, ...state.automations],
        }));

        return rule;
      },
      updateAutomationRule: (id: string, updates: AutomationUpdate) => {
        const state = get();
        const currentRule = state.automations.find(
          (rule: AutomationRule) => rule.id === id,
        );
        if (!currentRule) {
          return null;
        }

        let matchPhone = currentRule.matchPhone;
        let normalizedPhone = currentRule.normalizedPhone;
        if (typeof updates.matchPhone === "string") {
          const trimmed = updates.matchPhone.trim();
          const normalized = normalizePhone(trimmed);
          if (!normalized) {
            throw new Error("El número del remitente es inválido");
          }
          matchPhone = trimmed;
          normalizedPhone = normalized;
        }

        let envelopeId = currentRule.envelopeId;
        if (
          typeof updates.envelopeId === "string" &&
          updates.envelopeId !== currentRule.envelopeId
        ) {
          const exists = state.envelopes.some(
            (item: Envelope) => item.id === updates.envelopeId,
          );
          if (!exists) {
            throw new Error("El sobre seleccionado no existe");
          }
          envelopeId = updates.envelopeId;
        }

        const title =
          typeof updates.title === "string"
            ? updates.title.trim() || currentRule.title
            : currentRule.title;
        const active =
          typeof updates.active === "boolean"
            ? updates.active
            : currentRule.active;

        const nextRule: AutomationRule = {
          ...currentRule,
          title,
          matchPhone,
          normalizedPhone,
          envelopeId,
          active,
          lastTriggeredAt:
            updates.lastTriggeredAt ?? currentRule.lastTriggeredAt,
        };

        set((current: BankState) => ({
          automations: current.automations.map((rule: AutomationRule) =>
            rule.id === id ? nextRule : rule,
          ),
          transfers:
            envelopeId === currentRule.envelopeId
              ? current.transfers
              : current.transfers.map((transfer: TransferRecord) =>
                  transfer.automationId === id
                    ? {
                        ...transfer,
                        linkedEnvelopeId: envelopeId,
                      }
                    : transfer,
                ),
        }));

        return nextRule;
      },
      removeAutomationRule: (id: string) => {
        set((state: BankState) => {
          if (!state.automations.some((rule: AutomationRule) => rule.id === id)) {
            return {};
          }

          const automations = state.automations.filter(
            (rule: AutomationRule) => rule.id !== id,
          );
          const transfers = state.transfers.map((transfer: TransferRecord) =>
            transfer.automationId === id
              ? { ...transfer, automationId: undefined }
              : transfer,
          );

          return {
            automations,
            transfers,
          };
        });
      },
      makeRecharge: (draft: RechargeDraft) => {
      const amount = Number.isFinite(draft.amount) ? draft.amount : 0;
      if (amount <= 0) {
        throw new Error("El monto debe ser mayor a cero");
      }
      if (amount > get().balance) {
        throw new Error("Saldo insuficiente");
      }
      const record: RechargeRecord = {
        id: createId("recharge"),
        provider: draft.provider,
        phone: draft.phone.trim(),
        amount,
        createdAt: new Date().toISOString(),
      };
      const notification: NotificationItem = {
        id: createId("notification"),
        title: "Recarga realizada",
        message: `Recargaste ${formatCurrency(amount)} con ${record.provider}`,
        timestamp: record.createdAt,
        read: false,
        category: "recharge",
      };

      set((state: BankState) => ({
        balance: state.balance - amount,
        recharges: [record, ...state.recharges].slice(0, 20),
        notifications: [notification, ...state.notifications].slice(0, 30),
      }));

      return record;
    },
    addNotification: ({ title, message, category }: NotificationDraft) => {
      const notification: NotificationItem = {
        id: createId("notification"),
        title: title.trim(),
        message: message.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        category: category ?? "general",
      };

      set((state: BankState) => ({
        notifications: [notification, ...state.notifications].slice(0, 30),
      }));

      return notification;
    },
    markNotificationRead: (id: string) => {
      set((state: BankState) => ({
        notifications: state.notifications.map((item: NotificationItem) =>
          item.id === id
            ? {
                ...item,
                read: true,
              }
            : item,
        ),
      }));
    },
    toggleNotificationRead: (id: string) => {
      set((state: BankState) => ({
        notifications: state.notifications.map((item: NotificationItem) =>
          item.id === id
            ? {
                ...item,
                read: !item.read,
              }
            : item,
        ),
      }));
    },
    markAllNotificationsRead: () => {
      set((state: BankState) => ({
        notifications: state.notifications.map((item: NotificationItem) => ({
          ...item,
          read: true,
        })),
      }));
    },
    clearNotifications: () => {
      set({ notifications: [] });
    },
  };
});

if (typeof __DEV__ !== "undefined" && __DEV__) {
  const simulateIncomingTransfer = (
    options: SimulationTransferOptions = {},
  ): TransferRecord => {
    const {
      amount = 15000,
      contactName = "Transferencia demo",
      phone = "88888888",
      note,
    } = options;

    const parsedAmount = Number(amount);
    const safeAmount =
      Number.isFinite(parsedAmount) && parsedAmount > 0
        ? parsedAmount
        : 15000;

    const record = useBankStore.getState().receiveTransfer({
      contactName,
      phone,
      amount: safeAmount,
      note,
    });

    console.log(
      `Simulación: recibiste ${formatCurrency(safeAmount)} de ${
        contactName || phone
      }.`,
    );

    return record;
  };

  (globalThis as any).simulateIncomingTransfer = simulateIncomingTransfer;
}
