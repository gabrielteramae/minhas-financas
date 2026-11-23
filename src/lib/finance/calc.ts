import type { Account, Category, Ledger, RangeMode, Transaction } from "./types";
import { addDays, formatISODate, parseISODate, titleMonth } from "./format";

export type Period = {
  start: string;
  end: string;
  prevStart: string | null;
  prevEnd: string | null;
  label: string;
};

export type Bounds = { start: string; end: string };

export function isoOf(d: Date) {
  return formatISODate(d);
}

export function makePeriod(mode: RangeMode, monthOffset: number, today: Date, earliest?: string): Period {
  const todayISO = isoOf(today);
  if (mode === "month") {
    const startD = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const endD = new Date(startD.getFullYear(), startD.getMonth() + 1, 0);
    const prevStartD = new Date(startD.getFullYear(), startD.getMonth() - 1, 1);
    const prevEndFull = new Date(startD.getFullYear(), startD.getMonth(), 0);
    const start = isoOf(startD);
    const end = isoOf(endD);
    let prevEnd = isoOf(prevEndFull);
    const partial = start <= todayISO && todayISO < end;
    if (partial) {
      const cap = Math.min(today.getDate(), prevEndFull.getDate());
      prevEnd = isoOf(new Date(prevStartD.getFullYear(), prevStartD.getMonth(), cap));
    }
    return {
      start,
      end,
      prevStart: isoOf(prevStartD),
      prevEnd,
      label: titleMonth(startD),
    };
  }

  if (mode === "d90") {
    const startD = addDays(today, -89);
    const prevEndD = addDays(startD, -1);
    const prevStartD = addDays(prevEndD, -89);
    return {
      start: isoOf(startD),
      end: todayISO,
      prevStart: isoOf(prevStartD),
      prevEnd: isoOf(prevEndD),
      label: "Últimos 90 dias",
    };
  }

  if (mode === "m12") {
    const startD = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const prevEndD = addDays(startD, -1);
    const prevStartD = new Date(prevEndD.getFullYear(), prevEndD.getMonth() - 11, 1);
    return {
      start: isoOf(startD),
      end: todayISO,
      prevStart: isoOf(prevStartD),
      prevEnd: isoOf(prevEndD),
      label: "Últimos 12 meses",
    };
  }

  return {
    start: earliest && earliest < todayISO ? earliest : todayISO,
    end: todayISO,
    prevStart: null,
    prevEnd: null,
    label: "Tudo",
  };
}

export function splitPeriod(start: string, end: string, todayISO: string) {
  if (end < todayISO) return { realized: { start, end } as Bounds, scheduled: null as Bounds | null };
  if (start > todayISO) return { realized: null as Bounds | null, scheduled: { start, end } };
  const next = formatISODate(addDays(parseISODate(todayISO), 1));
  return {
    realized: { start, end: todayISO } as Bounds,
    scheduled: next <= end ? ({ start: next, end } as Bounds) : null,
  };
}

export function sumFlow(txs: Transaction[], bounds: Bounds | null) {
  let income = 0;
  let expense = 0;
  if (!bounds) return { income, expense, net: 0 };
  for (const t of txs) {
    if (t.date < bounds.start || t.date > bounds.end) continue;
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }
  return { income, expense, net: roundSafe(income - expense) };
}

function roundSafe(n: number) {
  return Math.round(n * 100) / 100;
}

export function balances(accounts: Account[], txs: Transaction[], until?: string) {
  const map = new Map<string, number>();
  for (const a of accounts) map.set(a.id, a.opening);
  for (const t of txs) {
    if (until && t.date > until) continue;
    if (t.type === "income") {
      map.set(t.accountId, (map.get(t.accountId) ?? 0) + t.amount);
    } else if (t.type === "expense") {
      map.set(t.accountId, (map.get(t.accountId) ?? 0) - t.amount);
    } else if (t.type === "transfer") {
      map.set(t.accountId, (map.get(t.accountId) ?? 0) - t.amount);
      if (t.toAccountId) map.set(t.toAccountId, (map.get(t.toAccountId) ?? 0) + t.amount);
    }
  }
  for (const [k, v] of map) map.set(k, roundSafe(v));
  return map;
}

export function wealthSplit(map: Map<string, number>) {
  let assets = 0;
  let debts = 0;
  for (const v of map.values()) {
    if (v >= 0) assets += v;
    else debts += -v;
  }
  return { assets: roundSafe(assets), debts: roundSafe(debts), net: roundSafe(assets - debts) };
}

export function byCategory(txs: Transaction[], bounds: Bounds | null, kind: "income" | "expense") {
  const map = new Map<string, number>();
  if (!bounds) return map;
  for (const t of txs) {
    if (t.type !== kind || !t.categoryId) continue;
    if (t.date < bounds.start || t.date > bounds.end) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
}

export type Point = { key: string; label: string; income: number; expense: number };

export function seriesFor(txs: Transaction[], bounds: Bounds | null, granularity: "day" | "month"): Point[] {
  if (!bounds) return [];
  const buckets = new Map<string, Point>();
  const ensure = (key: string, label: string) => {
    let row = buckets.get(key);
    if (!row) {
      row = { key, label, income: 0, expense: 0 };
      buckets.set(key, row);
    }
    return row;
  };

  if (granularity === "day") {
    let d = parseISODate(bounds.start);
    const last = parseISODate(bounds.end);
    while (d <= last) {
      const key = formatISODate(d);
      ensure(key, String(d.getDate()));
      d = addDays(d, 1);
    }
  } else {
    let d = parseISODate(bounds.start.slice(0, 7) + "-01");
    const last = parseISODate(bounds.end);
    while (d <= last) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "");
      ensure(key, label);
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
  }

  for (const t of txs) {
    if (t.date < bounds.start || t.date > bounds.end) continue;
    if (t.type !== "income" && t.type !== "expense") continue;
    const key = granularity === "day" ? t.date : t.date.slice(0, 7);
    const row = buckets.get(key);
    if (!row) continue;
    if (t.type === "income") row.income += t.amount;
    else row.expense += t.amount;
  }

  return [...buckets.values()].map((p) => ({
    ...p,
    income: roundSafe(p.income),
    expense: roundSafe(p.expense),
  }));
}

export function granularityFor(start: string, end: string) {
  const a = parseISODate(start).getTime();
  const b = parseISODate(end).getTime();
  const days = Math.round((b - a) / 86400000) + 1;
  return days > 45 ? "month" : "day";
}

export function weekdayExpenses(txs: Transaction[], bounds: Bounds | null) {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  if (!bounds) return totals;
  for (const t of txs) {
    if (t.type !== "expense") continue;
    if (t.date < bounds.start || t.date > bounds.end) continue;
    totals[parseISODate(t.date).getDay()] += t.amount;
  }
  return totals.map(roundSafe);
}

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function deltaPct(current: number, previous: number | null) {
  if (previous === null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function categoryName(categories: Category[], id?: string) {
  if (!id) return "";
  return categories.find((c) => c.id === id)?.name ?? "Classe";
}

export function accountName(accounts: Account[], id?: string) {
  if (!id) return "";
  return accounts.find((a) => a.id === id)?.name ?? "Conta";
}

export function spentInMonth(txs: Transaction[], categoryId: string, month: string, todayISO: string) {
  let realized = 0;
  let scheduled = 0;
  for (const t of txs) {
    if (t.type !== "expense" || t.categoryId !== categoryId) continue;
    if (!t.date.startsWith(month)) continue;
    if (t.date <= todayISO) realized += t.amount;
    else scheduled += t.amount;
  }
  return { realized: roundSafe(realized), scheduled: roundSafe(scheduled) };
}

export function safetyMonths(ledger: Ledger, today: Date) {
  const todayISO = isoOf(today);
  let sum = 0;
  for (let i = 1; i <= 3; i++) {
    const startD = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const endD = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    sum += sumFlow(ledger.transactions, { start: isoOf(startD), end: isoOf(endD) }).expense;
  }
  const avg = sum / 3;
  const map = balances(ledger.accounts, ledger.transactions, todayISO);
  const savings = ledger.accounts.filter((a) => a.type === "savings");
  const saved = savings.reduce((n, a) => n + (map.get(a.id) ?? 0), 0);
  if (avg <= 0) return null;
  return { months: saved / avg, avg: roundSafe(avg), saved: roundSafe(saved) };
}

export function netWorthSeries(ledger: Ledger, today: Date, points = 6) {
  const rows: { key: string; label: string; value: number }[] = [];
  for (let i = points - 1; i >= 0; i--) {
    const startD = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const endD = new Date(startD.getFullYear(), startD.getMonth() + 1, 0);
    const todayISO = isoOf(today);
    const end = isoOf(endD) < todayISO ? isoOf(endD) : todayISO;
    if (isoOf(startD) > todayISO) continue;
    const map = balances(ledger.accounts, ledger.transactions, end);
    rows.push({
      key: isoOf(startD).slice(0, 7),
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(startD).replace(".", ""),
      value: wealthSplit(map).net,
    });
  }
  return rows;
}

export function largestExpense(txs: Transaction[], bounds: Bounds | null) {
  let best: Transaction | null = null;
  if (!bounds) return best;
  for (const t of txs) {
    if (t.type !== "expense") continue;
    if (t.date < bounds.start || t.date > bounds.end) continue;
    if (!best || t.amount > best.amount) best = t;
  }
  return best;
}

export function upcoming(txs: Transaction[], todayISO: string, days = 40) {
  const end = formatISODate(addDays(parseISODate(todayISO), days));
  return txs
    .filter((t) => t.date > todayISO && t.date <= end)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function goalSaved(goal: { contributions: { amount: number }[] }) {
  return roundSafe(goal.contributions.reduce((n, c) => n + c.amount, 0));
}
