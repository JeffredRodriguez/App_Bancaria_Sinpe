import { create } from "zustand";

import { createId } from "@/utils/id";

export type AutomationType =
  | "roundup"
  | "auto-recharge"
  | "budget-alert"
  | "scheduled-transfer";

export type AutomationConfig = {
  threshold?: number;
  amount?: number;
  schedule?: string;
  targetLabel?: string;
  notes?: string;
};

export type Automation = {
  id: string;
  title: string;
  description: string;
  type: AutomationType;
  active: boolean;
  createdAt: string;
  config: AutomationConfig;
};

export type AutomationDraft = {
  title: string;
  description: string;
  type: AutomationType;
  config?: AutomationConfig;
  active?: boolean;
};

export type AutomationState = {
  automations: Automation[];
  addAutomation: (draft: AutomationDraft) => Automation;
  updateAutomation: (
    id: string,
    updates: Partial<Omit<Automation, "id" | "createdAt">>,
  ) => void;
  toggleAutomation: (id: string) => void;
  removeAutomation: (id: string) => void;
  resetAutomations: () => void;
};

type SetState = (
  partial:
    | AutomationState
    | Partial<AutomationState>
    | ((state: AutomationState) => AutomationState | Partial<AutomationState>),
  replace?: boolean,
) => void;

type GetState = () => AutomationState;

const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: createId("automation"),
    title: "Redondeo para metas",
    description:
      "Envía el vuelto de cada transferencia a tu meta de emergencia.",
    type: "roundup",
    active: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    config: {
      targetLabel: "Fondo emergencia",
      notes: "Simulación de redondeo al múltiplo de 500.",
    },
  },
  {
    id: createId("automation"),
    title: "Recarga automática",
    description: "Recarga ₡5,000 cuando tu saldo prepago sea menor a ₡2,000.",
    type: "auto-recharge",
    active: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    config: {
      threshold: 2000,
      amount: 5000,
      notes: "Se notificará antes de ejecutar.",
    },
  },
];

export const useAutomationStore = create<AutomationState>(
  (set: SetState, get: GetState) => ({
    automations: DEFAULT_AUTOMATIONS,
    addAutomation: ({
      title,
      description,
      type,
      config,
      active,
    }: AutomationDraft) => {
      const automation: Automation = {
        id: createId("automation"),
        title: title.trim(),
        description: description.trim(),
        type,
        active: Boolean(active),
        createdAt: new Date().toISOString(),
        config: config ? { ...config } : {},
      };
      set((state: AutomationState) => ({
        automations: [automation, ...state.automations],
      }));
      return automation;
    },
    updateAutomation: (id: string, updates) => {
      set((state: AutomationState) => ({
        automations: state.automations.map((automation: Automation) =>
          automation.id === id
            ? {
                ...automation,
                ...updates,
                title: updates.title ? updates.title.trim() : automation.title,
                description: updates.description
                  ? updates.description.trim()
                  : automation.description,
                config: updates.config
                  ? {
                      ...automation.config,
                      ...updates.config,
                    }
                  : automation.config,
              }
            : automation,
        ),
      }));
    },
    toggleAutomation: (id: string) => {
      set((state: AutomationState) => ({
        automations: state.automations.map((automation: Automation) =>
          automation.id === id
            ? {
                ...automation,
                active: !automation.active,
              }
            : automation,
        ),
      }));
    },
    removeAutomation: (id: string) => {
      set((state: AutomationState) => ({
        automations: state.automations.filter(
          (automation: Automation) => automation.id !== id,
        ),
      }));
    },
    resetAutomations: () => {
      set({ automations: DEFAULT_AUTOMATIONS });
    },
  }),
);
