import { createContext, useContext, type ReactNode } from "react";
import type { Account, Category, Goal, Transaction, TxType } from "@/lib/finance/types";

export type Clock = { today: Date; todayISO: string };

export type TxPreset = { type?: TxType; accountId?: string };

type UI = {
  openTx: (preset?: TxPreset) => void;
  editTx: (tx: Transaction) => void;
  openBudget: (month: string, categoryId?: string) => void;
  openGoal: (goal?: Goal) => void;
  openContribute: (goalId: string) => void;
  openAccount: (account?: Account) => void;
  openCategory: (category?: Category) => void;
};

const ClockContext = createContext<Clock | null>(null);
const UIContext = createContext<UI | null>(null);

export function ClockProvider({ value, children }: { value: Clock; children: ReactNode }) {
  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}

export function UIProvider({ value, children }: { value: UI; children: ReactNode }) {
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useClock() {
  const value = useContext(ClockContext);
  if (!value) throw new Error("Relógio indisponível");
  return value;
}

export function useUI() {
  const value = useContext(UIContext);
  if (!value) throw new Error("Ações indisponíveis");
  return value;
}
