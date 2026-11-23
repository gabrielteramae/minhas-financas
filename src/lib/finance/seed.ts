import { balances } from "./calc";
import { addMonthsISO, formatISODate, round2 } from "./format";
import type { Account, Budget, Category, Contribution, Goal, Ledger, Transaction } from "./types";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)] as T;
}

function iso(y: number, m: number, d: number) {
  const last = new Date(y, m, 0).getDate();
  const day = Math.min(d, last);
  return formatISODate(new Date(y, m - 1, day));
}

const ACCOUNTS: Account[] = [
  { id: "acc-corrente", name: "Conta corrente", type: "checking", opening: 2400, tone: "gold", icon: "landmark" },
  { id: "acc-reserva", name: "Reserva", type: "savings", opening: 8600, tone: "sage", icon: "piggy" },
  { id: "acc-cartao", name: "Cartão", type: "credit", opening: 0, tone: "clay", icon: "card" },
  { id: "acc-carteira", name: "Carteira", type: "cash", opening: 180, tone: "mist", icon: "banknote" },
  { id: "acc-invest", name: "Investimentos", type: "investment", opening: 11200, tone: "gold", icon: "trend" },
];

const CATEGORIES: Category[] = [
  { id: "cat-moradia", name: "Moradia", kind: "expense", tone: "gold", icon: "home" },
  { id: "cat-mercado", name: "Mercado", kind: "expense", tone: "sage", icon: "cart" },
  { id: "cat-transporte", name: "Transporte", kind: "expense", tone: "mist", icon: "bus" },
  { id: "cat-alimentacao", name: "Alimentação", kind: "expense", tone: "clay", icon: "utensils" },
  { id: "cat-saude", name: "Saúde", kind: "expense", tone: "sage", icon: "heart" },
  { id: "cat-lazer", name: "Lazer", kind: "expense", tone: "gold", icon: "ticket" },
  { id: "cat-assinaturas", name: "Assinaturas", kind: "expense", tone: "clay", icon: "repeat" },
  { id: "cat-contas", name: "Contas da casa", kind: "expense", tone: "mist", icon: "zap" },
  { id: "cat-compras", name: "Compras", kind: "expense", tone: "gold", icon: "bag" },
  { id: "cat-educacao", name: "Educação", kind: "expense", tone: "sage", icon: "graduation" },
  { id: "cat-salario", name: "Salário", kind: "income", tone: "sage", icon: "briefcase" },
  { id: "cat-freelance", name: "Freelance", kind: "income", tone: "gold", icon: "wallet" },
  { id: "cat-rendimento", name: "Rendimentos", kind: "income", tone: "mist", icon: "trend" },
];

const LIMITS: Record<string, number> = {
  "cat-moradia": 2600,
  "cat-mercado": 1100,
  "cat-transporte": 380,
  "cat-alimentacao": 620,
  "cat-saude": 280,
  "cat-lazer": 360,
  "cat-assinaturas": 160,
  "cat-contas": 260,
  "cat-compras": 480,
  "cat-educacao": 220,
};

export function buildSeed(today = new Date()): Ledger {
  const rnd = mulberry32(20261120);
  const y = today.getFullYear();
  const monthIndex = today.getMonth();
  const todayISO = formatISODate(today);

  const months: { y: number; m: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, monthIndex - i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }
  const current = months[months.length - 1] as { y: number; m: number };

  const txs: Transaction[] = [];
  let n = 0;
  const push = (t: Omit<Transaction, "id">) => {
    n += 1;
    txs.push({ ...t, amount: round2(t.amount), id: `tx-${n}` });
  };

  for (const mo of months) {
    const prefix = `${mo.y}-${String(mo.m).padStart(2, "0")}`;
    const isCurrent = mo.y === current.y && mo.m === current.m;
    const D = (day: number) => iso(mo.y, mo.m, day);

    push({
      type: "income",
      amount: 7800,
      accountId: "acc-corrente",
      categoryId: "cat-salario",
      date: D(5),
      note: "Salário",
      recurring: "monthly",
    });

    if ((mo.m + mo.y) % 2 === 0) {
      push({
        type: "income",
        amount: 1280 + Math.round(rnd() * 700),
        accountId: "acc-corrente",
        categoryId: "cat-freelance",
        date: D(18),
        note: pick(rnd, ["Projeto freelance", "Consultoria", "Aula particular"]),
        recurring: "none",
      });
    }

    push({
      type: "income",
      amount: 64 + Math.round(rnd() * 48),
      accountId: "acc-invest",
      categoryId: "cat-rendimento",
      date: D(2),
      note: "Rendimento",
      recurring: "monthly",
    });

    push({
      type: "expense",
      amount: 2450,
      accountId: "acc-corrente",
      categoryId: "cat-moradia",
      date: D(7),
      note: "Aluguel",
      recurring: "monthly",
    });
    push({
      type: "expense",
      amount: 186.4,
      accountId: "acc-corrente",
      categoryId: "cat-contas",
      date: D(9),
      note: "Internet e energia",
      recurring: "monthly",
    });
    push({
      type: "transfer",
      amount: isCurrent ? 900 : 1200,
      accountId: "acc-corrente",
      toAccountId: "acc-reserva",
      date: D(6),
      note: "Aporte reserva",
      recurring: "monthly",
    });
    push({
      type: "transfer",
      amount: 160,
      accountId: "acc-corrente",
      toAccountId: "acc-carteira",
      date: D(8),
      note: "Saque",
      recurring: "monthly",
    });

    if (!isCurrent && mo.m % 2 === 0) {
      push({
        type: "transfer",
        amount: 500,
        accountId: "acc-corrente",
        toAccountId: "acc-invest",
        date: D(15),
        note: "Aporte investimentos",
        recurring: "none",
      });
    }

    push({
      type: "expense",
      amount: 55.9,
      accountId: "acc-cartao",
      categoryId: "cat-assinaturas",
      date: D(3),
      note: "Streaming",
      recurring: "monthly",
    });
    push({
      type: "expense",
      amount: 21.9,
      accountId: "acc-cartao",
      categoryId: "cat-assinaturas",
      date: D(3),
      note: "Música",
      recurring: "monthly",
    });
    push({
      type: "expense",
      amount: 34.9,
      accountId: "acc-cartao",
      categoryId: "cat-assinaturas",
      date: D(4),
      note: "Nuvem",
      recurring: "monthly",
    });

    const markets = 3 + Math.floor(rnd() * 2);
    for (let i = 0; i < markets; i++) {
      push({
        type: "expense",
        amount: 78 + rnd() * 210,
        accountId: "acc-cartao",
        categoryId: "cat-mercado",
        date: D(4 + Math.floor(rnd() * 22)),
        note: pick(rnd, ["Mercado da semana", "Feira", "Hortifruti", "Supermercado"]),
        recurring: "none",
      });
    }

    const meals = 3 + Math.floor(rnd() * 2);
    for (let i = 0; i < meals; i++) {
      const cash = rnd() > 0.62;
      push({
        type: "expense",
        amount: 22 + rnd() * 78,
        accountId: cash ? "acc-carteira" : "acc-cartao",
        categoryId: "cat-alimentacao",
        date: D(2 + Math.floor(rnd() * 25)),
        note: pick(rnd, ["Almoço", "Jantar", "Padaria", "Café"]),
        recurring: "none",
      });
    }

    for (let i = 0; i < 4; i++) {
      push({
        type: "expense",
        amount: 8 + rnd() * 36,
        accountId: "acc-cartao",
        categoryId: "cat-transporte",
        date: D(1 + Math.floor(rnd() * 26)),
        note: pick(rnd, ["Metrô", "Ônibus", "Aplicativo"]),
        recurring: "none",
      });
    }

    if (rnd() > 0.28) {
      push({
        type: "expense",
        amount: 36 + rnd() * 150,
        accountId: "acc-cartao",
        categoryId: "cat-lazer",
        date: D(11 + Math.floor(rnd() * 14)),
        note: pick(rnd, ["Cinema", "Show", "Livro", "Parque"]),
        recurring: "none",
      });
    }
    if (rnd() > 0.45) {
      push({
        type: "expense",
        amount: 42 + rnd() * 210,
        accountId: "acc-cartao",
        categoryId: "cat-saude",
        date: D(10 + Math.floor(rnd() * 12)),
        note: pick(rnd, ["Farmácia", "Consulta", "Exame"]),
        recurring: "none",
      });
    }
    if (rnd() > 0.55) {
      push({
        type: "expense",
        amount: 48 + rnd() * 220,
        accountId: "acc-cartao",
        categoryId: "cat-compras",
        date: D(14 + Math.floor(rnd() * 10)),
        note: pick(rnd, ["Roupa", "Casa", "Presente"]),
        recurring: "none",
      });
    }

    if (!isCurrent) {
      const spend = txs
        .filter(
          (t) =>
            t.type === "expense" && t.accountId === "acc-cartao" && t.date.startsWith(prefix),
        )
        .reduce((s, t) => s + t.amount, 0);
      if (spend > 0) {
        push({
          type: "transfer",
          amount: spend,
          accountId: "acc-corrente",
          toAccountId: "acc-cartao",
          date: D(26),
          note: "Pagamento da fatura",
          recurring: "monthly",
        });
      }
    }
  }

  const parcelStart = iso(months[months.length - 2]?.y ?? y, months[months.length - 2]?.m ?? monthIndex, 16);
  [0, 1, 2].forEach((i) => {
    push({
      type: "expense",
      amount: 1099,
      accountId: "acc-cartao",
      categoryId: "cat-compras",
      date: addMonthsISO(parcelStart, i),
      note: `Notebook (${i + 1}/3)`,
      recurring: "none",
      installment: { index: i + 1, count: 3, groupId: "grp-notebook" },
    });
  });

  const next = new Date(current.y, current.m, 1);
  const ny = next.getFullYear();
  const nm = next.getMonth() + 1;
  const future: Omit<Transaction, "id">[] = [
    {
      type: "income",
      amount: 7800,
      accountId: "acc-corrente",
      categoryId: "cat-salario",
      date: iso(ny, nm, 5),
      note: "Salário",
      recurring: "monthly",
    },
    {
      type: "expense",
      amount: 2450,
      accountId: "acc-corrente",
      categoryId: "cat-moradia",
      date: iso(ny, nm, 7),
      note: "Aluguel",
      recurring: "monthly",
    },
    {
      type: "expense",
      amount: 186.4,
      accountId: "acc-corrente",
      categoryId: "cat-contas",
      date: iso(ny, nm, 9),
      note: "Internet e energia",
      recurring: "monthly",
    },
    {
      type: "expense",
      amount: 55.9,
      accountId: "acc-cartao",
      categoryId: "cat-assinaturas",
      date: iso(ny, nm, 3),
      note: "Streaming",
      recurring: "monthly",
    },
    {
      type: "expense",
      amount: 21.9,
      accountId: "acc-cartao",
      categoryId: "cat-assinaturas",
      date: iso(ny, nm, 3),
      note: "Música",
      recurring: "monthly",
    },
    {
      type: "transfer",
      amount: 1200,
      accountId: "acc-corrente",
      toAccountId: "acc-reserva",
      date: iso(ny, nm, 6),
      note: "Aporte reserva",
      recurring: "monthly",
    },
  ];
  for (const t of future) {
    if (t.date > todayISO) push(t);
  }

  const accounts = ACCOUNTS.map((a) => ({ ...a }));
  const map = balances(accounts, txs, todayISO);
  for (const a of accounts) {
    if (a.type === "credit") continue;
    const b = map.get(a.id) ?? 0;
    const floor = a.type === "cash" ? 70 : a.type === "investment" ? 9000 : a.type === "savings" ? 6000 : 1800;
    if (b < floor) a.opening = round2(a.opening + (floor - b));
  }

  const budgets: Budget[] = [];
  const budgetMonths = [...months, { y: ny, m: nm }];
  for (const mo of budgetMonths) {
    const key = `${mo.y}-${String(mo.m).padStart(2, "0")}`;
    for (const [categoryId, limit] of Object.entries(LIMITS)) {
      budgets.push({ id: `bud-${categoryId}-${key}`, categoryId, month: key, limit });
    }
  }

  const contrib = (id: string, amount: number, date: string, note: string): Contribution => ({
    id,
    amount,
    date,
    note,
  });

  const emergency: Contribution[] = [];
  months.forEach((mo, i) => {
    const date = iso(mo.y, mo.m, 6);
    if (date <= todayISO) {
      const isCurrent = mo.y === current.y && mo.m === current.m;
      emergency.push(contrib(`c-e-${i}`, isCurrent ? 900 : 1200, date, "Aporte do mês"));
    }
  });

  const trip: Contribution[] = [];
  months.slice(-4).forEach((mo, i) => {
    const date = iso(mo.y, mo.m, 20);
    if (date <= todayISO) trip.push(contrib(`c-t-${i}`, 450, date, "Separado para a viagem"));
  });

  const course: Contribution[] = [];
  months.slice(-5).forEach((mo, i) => {
    const date = iso(mo.y, mo.m, 12);
    if (date <= todayISO) course.push(contrib(`c-c-${i}`, 320, date, "Curso"));
  });

  const goals: Goal[] = [
    {
      id: "goal-reserva",
      name: "Reserva de emergência",
      target: 24000,
      deadline: null,
      tone: "sage",
      icon: "piggy",
      contributions: emergency,
    },
    {
      id: "goal-viagem",
      name: "Viagem",
      target: 7500,
      deadline: formatISODate(new Date(y, monthIndex + 5, 1)),
      tone: "gold",
      icon: "plane",
      contributions: trip,
    },
    {
      id: "goal-curso",
      name: "Curso",
      target: 2000,
      deadline: formatISODate(new Date(y, monthIndex + 1, 15)),
      tone: "mist",
      icon: "graduation",
      contributions: course,
    },
  ];

  return {
    accounts,
    categories: CATEGORIES.map((c) => ({ ...c })),
    transactions: txs,
    budgets,
    goals,
  };
}
