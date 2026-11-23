export const TONES = ["gold", "sage", "clay", "mist"] as const;
export type Tone = (typeof TONES)[number];

export const ICON_NAMES = [
  "home",
  "cart",
  "bus",
  "utensils",
  "heart",
  "ticket",
  "repeat",
  "zap",
  "bag",
  "wallet",
  "briefcase",
  "trend",
  "landmark",
  "card",
  "banknote",
  "piggy",
  "plane",
  "graduation",
  "spark",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

export type AccountType = "checking" | "savings" | "credit" | "cash" | "investment";

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  opening: number;
  tone: Tone;
  icon: IconName;
};

export type CategoryKind = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  tone: Tone;
  icon: IconName;
};

export type TxType = "income" | "expense" | "transfer";
export type Recurrence = "none" | "weekly" | "monthly";

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  date: string;
  note: string;
  recurring: Recurrence;
  installment?: { index: number; count: number; groupId: string };
};

export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  limit: number;
};

export type Contribution = {
  id: string;
  amount: number;
  date: string;
  note: string;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  deadline: string | null;
  tone: Tone;
  icon: IconName;
  contributions: Contribution[];
};

export type RangeMode = "month" | "d90" | "m12" | "all";
export type Origin = "demo" | "user" | "empty";

export type View =
  | "home"
  | "flow"
  | "budgets"
  | "goals"
  | "accounts"
  | "reports"
  | "classes"
  | "settings"
  | "more";

export type FlowSort = "recent" | "amount";

export type FlowQuery = {
  q: string;
  type: "all" | TxType;
  categoryId: string;
  accountId: string;
  periodOnly: boolean;
  sort: FlowSort;
};

export type Ledger = {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
};
