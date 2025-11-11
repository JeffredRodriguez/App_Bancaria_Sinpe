import { create } from "zustand";

import { createId } from "@/utils/id";

export type GoalStatus = "active" | "completed";

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
  color: string;
  status: GoalStatus;
};

export type GoalDraft = {
  title: string;
  targetAmount: number;
  deadline?: string;
  color?: string;
};

type SetState = (
  partial:
    | GoalsState
    | Partial<GoalsState>
    | ((state: GoalsState) => GoalsState | Partial<GoalsState>),
  replace?: boolean,
) => void;

type GetState = () => GoalsState;

const GOAL_COLORS = ["#00F0FF", "#FF3B6B", "#7A2BFF", "#4ADE80", "#FACC15"];

const DEFAULT_GOALS: Goal[] = [
  {
    id: createId("goal"),
    title: "Ahorro emergencia",
    targetAmount: 150_000,
    currentAmount: 45_000,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    createdAt: new Date().toISOString(),
    color: GOAL_COLORS[0],
    status: "active",
  },
  {
    id: createId("goal"),
    title: "Viaje familiar",
    targetAmount: 250_000,
    currentAmount: 120_000,
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    createdAt: new Date().toISOString(),
    color: GOAL_COLORS[1],
    status: "active",
  },
];

export type GoalsState = {
  goals: Goal[];
  addGoal: (draft: GoalDraft) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  recordContribution: (id: string, amount: number) => void;
  markGoalCompleted: (id: string) => void;
  deleteGoal: (id: string) => void;
  resetGoals: () => void;
};

export const useGoalsStore = create<GoalsState>(
  (set: SetState, get: GetState) => ({
    goals: DEFAULT_GOALS,
    addGoal: ({ title, targetAmount, deadline, color }: GoalDraft) => {
      const paletteColor =
        color || GOAL_COLORS[get().goals.length % GOAL_COLORS.length];
      const goal: Goal = {
        id: createId("goal"),
        title: title.trim(),
        targetAmount: Math.max(targetAmount, 0),
        currentAmount: 0,
        deadline,
        createdAt: new Date().toISOString(),
        color: paletteColor,
        status: "active",
      };
      set((state: GoalsState) => ({ goals: [goal, ...state.goals] }));
      return goal;
    },
    updateGoal: (id: string, updates: Partial<Goal>) => {
      set((state: GoalsState) => ({
        goals: state.goals.map((goal: Goal) =>
          goal.id === id
            ? {
                ...goal,
                ...updates,
                title: updates.title ? updates.title.trim() : goal.title,
              }
            : goal,
        ),
      }));
    },
    recordContribution: (id: string, amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }
      set((state: GoalsState) => ({
        goals: state.goals.map((goal: Goal) => {
          if (goal.id !== id) {
            return goal;
          }
          const updatedAmount = Math.min(
            goal.targetAmount,
            goal.currentAmount + amount,
          );
          const status =
            updatedAmount >= goal.targetAmount ? "completed" : goal.status;
          return {
            ...goal,
            currentAmount: updatedAmount,
            status,
          };
        }),
      }));
    },
    markGoalCompleted: (id: string) => {
      set((state: GoalsState) => ({
        goals: state.goals.map((goal: Goal) =>
          goal.id === id
            ? {
                ...goal,
                currentAmount: goal.targetAmount,
                status: "completed",
              }
            : goal,
        ),
      }));
    },
    deleteGoal: (id: string) => {
      set((state: GoalsState) => ({
        goals: state.goals.filter((goal: Goal) => goal.id !== id),
      }));
    },
    resetGoals: () => set({ goals: DEFAULT_GOALS }),
  }),
);
