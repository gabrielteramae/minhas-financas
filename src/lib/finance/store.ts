import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildSeed } from "./seed";
import type {
  Account,
  Budget,
  Category,
  Contribution,
  FlowQuery,
  Goal,
  Ledger,
  Origin,
  RangeMode,
  Transaction,
  View,
} from "./types";
import { round2, uid } from "./format";

type Persisted = Ledger & {
  rangeMode: RangeMode;
  monthOffset: number;
  origin: Origin;
  hintHidden: boolean;
  seeded: boolean;
};

export type FinanceState = Persisted & {
  view: View;
  flow: FlowQuery;
  ready: boolean;
  setView: (view: View) => void;
  setRangeMode: (mode: RangeMode) => void;
  setMonthOffset: (offset: number) => void;
  shiftMonth: (delta: number) => void;
  setFlow: (patch: Partial<FlowQuery>) => void;
  hideHint: () => void;
  addTx: (tx: Transaction) => void;
  addManyTx: (txs: Transaction[]) => void;
  updateTx: (id: string, patch: Partial<Transaction>) => void;
  removeTx: (id: string) => void;
  upsertBudget: (categoryId: string, month: string, limit: number) => void;
  removeBudget: (id: string) => void;
  saveGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  addContribution: (goalId: string, contribution: Contribution) => void;
  removeContribution: (goalId: string, contributionId: string) => void;
  saveAccount: (account: Account) => boolean;
  removeAccount: (id: string) => boolean;
  saveCategory: (category: Category) => void;
  removeCategory: (id: string) => boolean;
  resetDemo: (today?: Date) => void;
  clearAll: () => void;
  importLedger: (data: unknown) => boolean;
};

const blankFlow = (): FlowQuery => ({
  q: "",
  type: "all",
  categoryId: "all",
  accountId: "all",
  periodOnly: true,
  sort: "recent",
});

const blank = (): Persisted => ({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  rangeMode: "month",
  monthOffset: 0,
  origin: "empty",
  hintHidden: false,
  seeded: false,
});

const memory = new Map<string, string>();

const safeStorage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return memory.get(key) ?? null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") {
      memory.set(key, value);
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore quota */
    }
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") {
      memory.delete(key);
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

function touch(): Pick<FinanceState, "origin"> {
  return { origin: "user" };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function asLedger(data: unknown): Ledger | null {
  if (!isRecord(data)) return null;
  const accounts = Array.isArray(data.accounts) ? data.accounts.filter(isAccount) : null;
  const categories = Array.isArray(data.categories) ? data.categories.filter(isCategory) : null;
  const transactions = Array.isArray(data.transactions) ? data.transactions.filter(isTx) : null;
  const budgets = Array.isArray(data.budgets) ? data.budgets.filter(isBudget) : [];
  const goals = Array.isArray(data.goals) ? data.goals.filter(isGoal) : [];
  if (!accounts || !categories || !transactions || accounts.length === 0) return null;
  return { accounts, categories, transactions, budgets, goals };
}

function isAccount(v: unknown): v is Account {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.type === "checking" ||
      v.type === "savings" ||
      v.type === "credit" ||
      v.type === "cash" ||
      v.type === "investment") &&
    typeof v.opening === "number" &&
    typeof v.tone === "string" &&
    typeof v.icon === "string"
  );
}

function isCategory(v: unknown): v is Category {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.kind === "income" || v.kind === "expense") &&
    typeof v.tone === "string" &&
    typeof v.icon === "string"
  );
}

function isTx(v: unknown): v is Transaction {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    (v.type === "income" || v.type === "expense" || v.type === "transfer") &&
    typeof v.amount === "number" &&
    v.amount > 0 &&
    typeof v.accountId === "string" &&
    typeof v.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.date) &&
    typeof v.note === "string"
  );
}

function isBudget(v: unknown): v is Budget {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.categoryId === "string" &&
    typeof v.month === "string" &&
    typeof v.limit === "number"
  );
}

function isGoal(v: unknown): v is Goal {
  if (!isRecord(v)) return false;
  if (typeof v.id !== "string" || typeof v.name !== "string" || typeof v.target !== "number") return false;
  if (!Array.isArray(v.contributions)) return false;
  return true;
}

export const useFinance = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...blank(),
      view: "home",
      flow: blankFlow(),
      ready: false,
      setView: (view) => set({ view }),
      setRangeMode: (rangeMode) => set({ rangeMode, monthOffset: rangeMode === "month" ? get().monthOffset : 0 }),
      setMonthOffset: (monthOffset) => set({ monthOffset }),
      shiftMonth: (delta) => {
        const { rangeMode, monthOffset } = get();
        if (rangeMode !== "month") {
          set({ rangeMode: "month", monthOffset: delta > 0 ? 0 : -1 });
          return;
        }
        const next = Math.max(-36, Math.min(1, monthOffset + delta));
        set({ monthOffset: next });
      },
      setFlow: (patch) => set({ flow: { ...get().flow, ...patch } }),
      hideHint: () => set({ hintHidden: true }),
      addTx: (tx) => set((s) => ({ transactions: [tx, ...s.transactions], ...touch() })),
      addManyTx: (txs) => set((s) => ({ transactions: [...txs, ...s.transactions], ...touch() })),
      updateTx: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch, amount: patch.amount ? round2(patch.amount) : t.amount } : t)),
          ...touch(),
        })),
      removeTx: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id), ...touch() })),
      upsertBudget: (categoryId, month, limit) =>
        set((s) => {
          const i = s.budgets.findIndex((b) => b.categoryId === categoryId && b.month === month);
          const budgets = s.budgets.slice();
          if (i >= 0) {
            const current = budgets[i];
            if (current) budgets[i] = { ...current, limit: round2(limit) };
          } else budgets.push({ id: uid("bud"), categoryId, month, limit: round2(limit) });
          return { budgets, ...touch() };
        }),
      removeBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id), ...touch() })),
      saveGoal: (goal) =>
        set((s) => {
          const i = s.goals.findIndex((g) => g.id === goal.id);
          const goals = s.goals.slice();
          if (i >= 0) goals[i] = goal;
          else goals.push(goal);
          return { goals, ...touch() };
        }),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id), ...touch() })),
      addContribution: (goalId, contribution) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, contributions: [contribution, ...g.contributions] } : g,
          ),
          ...touch(),
        })),
      removeContribution: (goalId, contributionId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, contributions: g.contributions.filter((c) => c.id !== contributionId) }
              : g,
          ),
          ...touch(),
        })),
      saveAccount: (account) => {
        const name = account.name.trim();
        if (!name) return false;
        set((s) => {
          const i = s.accounts.findIndex((a) => a.id === account.id);
          const accounts = s.accounts.slice();
          const next = { ...account, name, opening: round2(account.opening) };
          if (i >= 0) accounts[i] = next;
          else accounts.push(next);
          return { accounts, ...touch() };
        });
        return true;
      },
      removeAccount: (id) => {
        const s = get();
        if (s.accounts.length <= 1) return false;
        if (s.transactions.some((t) => t.accountId === id || t.toAccountId === id)) return false;
        set({ accounts: s.accounts.filter((a) => a.id !== id), ...touch() });
        return true;
      },
      saveCategory: (category) =>
        set((s) => {
          const name = category.name.trim();
          if (!name) return s;
          const i = s.categories.findIndex((c) => c.id === category.id);
          const categories = s.categories.slice();
          const next = { ...category, name };
          if (i >= 0) categories[i] = next;
          else categories.push(next);
          return { categories, ...touch() };
        }),
      removeCategory: (id) => {
        const s = get();
        if (s.transactions.some((t) => t.categoryId === id) || s.budgets.some((b) => b.categoryId === id)) {
          return false;
        }
        set({ categories: s.categories.filter((c) => c.id !== id), ...touch() });
        return true;
      },
      resetDemo: (today = new Date()) => {
        const ledger = buildSeed(today);
        set({
          ...ledger,
          origin: "demo",
          seeded: true,
          hintHidden: false,
          rangeMode: "month",
          monthOffset: 0,
          view: "home",
          flow: blankFlow(),
        });
      },
      clearAll: () => {
        const s = get();
        set({
          transactions: [],
          budgets: [],
          goals: [],
          accounts: s.accounts.map((a) => ({ ...a, opening: 0 })),
          origin: "empty",
          seeded: true,
          hintHidden: true,
          flow: blankFlow(),
        });
      },
      importLedger: (data) => {
        const ledger = asLedger(data);
        if (!ledger) return false;
        set({
          ...ledger,
          origin: "user",
          seeded: true,
          hintHidden: true,
        });
        return true;
      },
    }),
    {
      name: "soldo-v1",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (s) => ({
        accounts: s.accounts,
        categories: s.categories,
        transactions: s.transactions,
        budgets: s.budgets,
        goals: s.goals,
        rangeMode: s.rangeMode,
        monthOffset: s.monthOffset,
        origin: s.origin,
        hintHidden: s.hintHidden,
        seeded: s.seeded,
      }),
    },
  ),
);

export async function hydrateFinance() {
  try {
    await useFinance.persist.rehydrate();
  } catch {
    /* storage unreadable */
  }
  const state = useFinance.getState();
  const ok =
    state.seeded &&
    Array.isArray(state.transactions) &&
    Array.isArray(state.accounts) &&
    Array.isArray(state.categories) &&
    Array.isArray(state.budgets) &&
    Array.isArray(state.goals);
  if (!ok) {
    const ledger = buildSeed(new Date());
    useFinance.setState({ ...ledger, origin: "demo", seeded: true, hintHidden: false });
  }
  useFinance.setState({ ready: true });
}
