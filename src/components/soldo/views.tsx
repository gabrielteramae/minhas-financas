import { useMemo, useRef, useState } from "react";
import {
  ArrowsLeftRight,
  Bank,
  ChartLine,
  Gear,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Tag,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/store";
import {
  balances,
  byCategory,
  deltaPct,
  granularityFor,
  goalSaved,
  largestExpense,
  netWorthSeries,
  safetyMonths,
  seriesFor,
  spentInMonth,
  splitPeriod,
  sumFlow,
  upcoming,
  wealthSplit,
  weekdayExpenses,
  WEEKDAY_LABELS,
  makePeriod,
} from "@/lib/finance/calc";
import {
  addDaysISO,
  addMonthsISO,
  brl,
  monthKey,
  monthLabelFromKey,
  shortDate,
  dayHeading,
  uid,
} from "@/lib/finance/format";
import { ACCOUNT_TYPE_LABEL, TX_LABEL } from "@/lib/finance/labels";
import type { Category, Transaction } from "@/lib/finance/types";
import { cn } from "@/lib/cn";
import { FlowChart, SharePie, WealthChart, WeekChart } from "./charts";
import { useClock, useUI } from "./context";
import { Chevron, Icon, toneClass, toneStroke } from "./icons";
import { Button, Card, Chip, Delta, Empty, fieldClass, Kicker, Money } from "./ui";

export function usePeriod() {
  const mode = useFinance((s) => s.rangeMode);
  const offset = useFinance((s) => s.monthOffset);
  const txs = useFinance((s) => s.transactions);
  const { today, todayISO } = useClock();
  return useMemo(() => {
    let earliest: string | undefined;
    for (const t of txs) if (!earliest || t.date < earliest) earliest = t.date;
    const period = makePeriod(mode, offset, today, earliest);
    const parts = splitPeriod(period.start, period.end, todayISO);
    return { ...period, ...parts };
  }, [mode, offset, txs, today, todayISO]);
}

export function PeriodBar() {
  const mode = useFinance((s) => s.rangeMode);
  const offset = useFinance((s) => s.monthOffset);
  const setRangeMode = useFinance((s) => s.setRangeMode);
  const setMonthOffset = useFinance((s) => s.setMonthOffset);
  const shiftMonth = useFinance((s) => s.shiftMonth);
  const period = usePeriod();
  const modes = [
    { id: "month" as const, label: "Mês" },
    { id: "d90" as const, label: "90 dias" },
    { id: "m12" as const, label: "12 meses" },
    { id: "all" as const, label: "Tudo" },
  ];
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Período anterior"
          onClick={() => shiftMonth(-1)}
          disabled={mode === "month" && offset <= -36}
          className="grid size-11 place-items-center rounded-full bg-surface text-fg disabled:opacity-30"
        >
          <Chevron className="size-5" />
        </button>
        <p className="flex-1 text-center font-serif text-lg text-fg">{period.label}</p>
        <button
          type="button"
          aria-label="Próximo período"
          onClick={() => shiftMonth(1)}
          disabled={mode === "month" && offset >= 1}
          className="grid size-11 place-items-center rounded-full bg-surface text-fg disabled:opacity-30"
        >
          <Chevron dir="right" className="size-5" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {modes.map((item) => (
          <Chip
            key={item.id}
            active={mode === item.id}
            onClick={() => {
              setRangeMode(item.id);
              if (item.id === "month") setMonthOffset(0);
            }}
          >
            {item.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Meter({ realized, scheduled, limit }: { realized: number; scheduled: number; limit: number }) {
  const base = limit > 0 ? limit : realized + scheduled || 1;
  const over = limit > 0 && realized + scheduled > limit;
  const rw = Math.min(100, (realized / base) * 100);
  const sw = Math.min(100 - rw, (scheduled / base) * 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-bg" role="progressbar" aria-valuemin={0} aria-valuemax={limit || realized} aria-valuenow={Math.round(realized)}>
      <div className="flex h-full">
        <div className={cn("h-full transition-[width] duration-500 ease-out", over ? "bg-clay" : "bg-sage")} style={{ width: `${rw}%` }} />
        <div className="h-full bg-gold/45 transition-[width] duration-500 ease-out" style={{ width: `${sw}%` }} />
      </div>
    </div>
  );
}

export function Overview() {
  const ledger = useFinance();
  const setView = useFinance((s) => s.setView);
  const setFlow = useFinance((s) => s.setFlow);
  const hideHint = useFinance((s) => s.hideHint);
  const resetDemo = useFinance((s) => s.resetDemo);
  const { today, todayISO } = useClock();
  const ui = useUI();
  const period = usePeriod();
  const rangeMode = ledger.rangeMode;

  const map = balances(ledger.accounts, ledger.transactions, todayISO);
  const wealth = wealthSplit(map);
  const nowFlow = sumFlow(ledger.transactions, period.realized);
  const laterFlow = sumFlow(ledger.transactions, period.scheduled);
  const prevBounds = period.prevStart && period.prevEnd ? { start: period.prevStart, end: period.prevEnd } : null;
  const prevFlow = sumFlow(ledger.transactions, prevBounds);
  const cats = [...byCategory(ledger.transactions, period.realized, "expense")].sort((a, b) => b[1] - a[1]);
  const catTotal = cats.reduce((n, [, v]) => n + v, 0) || 1;
  const grain = period.realized ? granularityFor(period.realized.start, period.realized.end) : "day";
  const points = seriesFor(ledger.transactions, period.realized, grain);
  const soon = upcoming(ledger.transactions, todayISO).slice(0, 5);
  const safety = safetyMonths(ledger, today);
  const big = largestExpense(ledger.transactions, period.realized);
  const week = weekdayExpenses(ledger.transactions, period.realized);
  let hot = 0;
  week.forEach((v, i) => {
    if (v > week[hot]!) hot = i;
  });
  const budgetMonth = rangeMode === "month" ? period.start.slice(0, 7) : monthKey(today);
  const budgetRows = ledger.categories
    .filter((c) => c.kind === "expense")
    .map((cat) => {
      const budget = ledger.budgets.find((b) => b.categoryId === cat.id && b.month === budgetMonth);
      const spent = spentInMonth(ledger.transactions, cat.id, budgetMonth, todayISO);
      return { cat, budget, ...spent };
    })
    .filter((row) => row.budget)
    .sort((a, b) => (b.realized + b.scheduled) / (b.budget?.limit || 1) - (a.realized + a.scheduled) / (a.budget?.limit || 1))
    .slice(0, 3);

  const hello = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const circles = ledger.categories.filter((c) => c.kind === "expense").slice(0, 8);

  if (ledger.origin === "empty" && ledger.transactions.length === 0) {
    return (
      <Empty
        title="Livro em branco"
        body="Lance a primeira entrada ou saída, ou carregue um mês de exemplo para ver os gráficos funcionando."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => ui.openTx()}>Primeiro lançamento</Button>
            <Button variant="ghost" onClick={() => resetDemo(today)}>
              Carregar exemplo
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <div className="rise flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">{hello}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Minhas Finanças</h1>
        <p className="mt-1 text-sm text-moss">{period.label}</p>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scroll-thin">
        {circles.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            onClick={() => {
              setFlow({ categoryId: cat.id, type: "expense", periodOnly: true, q: "", accountId: "all", sort: "recent" });
              setView("flow");
            }}
          >
            <span className="grid size-14 place-items-center rounded-full bg-paper text-leaf ring-1 ring-mist">
              <Icon name={cat.icon} className="size-6" />
            </span>
            <span className="w-full truncate text-center text-xs text-moss">{cat.name}</span>
          </button>
        ))}
      </div>

      <button type="button" className="overflow-hidden rounded-3xl bg-leaf px-5 py-5 text-left text-paper active:scale-[0.99]" onClick={() => setView("reports")}>
        <p className="text-sm text-paper/75">Caixinha do mês</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight leading-tight">
          {nowFlow.net >= 0 ? "Entrou mais do que saiu." : "Saiu mais do que entrou."}
        </p>
        <p className="mt-2 text-sm text-paper/80">Resultado {brl(nowFlow.net)} · abrir o relatório</p>
      </button>

      {ledger.origin === "demo" && !ledger.hintHidden ? (
        <div className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3">
          <p className="flex-1 text-sm text-muted">Livro de exemplo para explorar. O que você lançar fica só neste aparelho.</p>
          <button type="button" className="grid size-11 shrink-0 place-items-center text-muted" aria-label="Dispensar aviso" onClick={hideHint}>
            ×
          </button>
        </div>
      ) : null}

      <Card>
        <Kicker>Patrimônio líquido</Kicker>
        <p className="mt-2">
          <Money value={wealth.net} display className="text-4xl leading-none sm:text-5xl" />
        </p>
        <p className="mt-3 text-sm text-muted">
          Ativos {brl(wealth.assets)}
          {wealth.debts > 0 ? <span className="text-clay"> · Dívidas {brl(wealth.debts)}</span> : null}
        </p>
        {wealth.assets > 0 ? (
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-bg">
            {ledger.accounts.map((account) => {
              const value = map.get(account.id) ?? 0;
              if (value <= 0) return null;
              return (
                <div
                  key={account.id}
                  style={{ width: `${(value / wealth.assets) * 100}%`, background: toneStroke(account.tone) }}
                  title={account.name}
                />
              );
            })}
          </div>
        ) : null}
      </Card>

      <PeriodBar />

      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <p className="text-xs text-muted">Entradas</p>
          <Money value={nowFlow.income} intent="income" className="mt-1 text-sm sm:text-base" />
          <div className="mt-1">
            <Delta pct={deltaPct(nowFlow.income, prevBounds ? prevFlow.income : null)} goodWhenUp />
          </div>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted">Saídas</p>
          <Money value={nowFlow.expense} intent="expense" className="mt-1 text-sm sm:text-base" />
          <div className="mt-1">
            <Delta pct={deltaPct(nowFlow.expense, prevBounds ? prevFlow.expense : null)} goodWhenUp={false} />
          </div>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted">Resultado</p>
          <Money value={nowFlow.net} intent="result" className="mt-1 text-sm sm:text-base" />
          <div className="mt-1">
            <Delta pct={deltaPct(nowFlow.net, prevBounds ? prevFlow.net : null)} goodWhenUp />
          </div>
        </Card>
      </div>

      {(laterFlow.income > 0 || laterFlow.expense > 0) && (
        <p className="text-sm text-muted">
          Previsto ainda neste período:{" "}
          {laterFlow.income > 0 ? <span className="text-sage">{brl(laterFlow.income)} a entrar</span> : null}
          {laterFlow.income > 0 && laterFlow.expense > 0 ? " e " : null}
          {laterFlow.expense > 0 ? <span className="text-clay">{brl(laterFlow.expense)} a sair</span> : null}.
        </p>
      )}

      <Card>
        <Kicker>Movimento</Kicker>
        <div className="mt-3">
          <FlowChart data={points} />
        </div>
        <p className="mt-2 text-xs text-muted">Só o que já aconteceu. Verde entra, vermelho sai.</p>
      </Card>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-serif text-xl">Classes de saída</h2>
          <button type="button" className="text-sm font-medium text-fg" onClick={() => setView("classes")}>
            Ver todas
          </button>
        </div>
        {cats.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma saída realizada neste período.</p>
        ) : (
          <Card className="divide-y divide-line p-0">
            {cats.slice(0, 5).map(([id, value]) => {
              const cat = ledger.categories.find((c) => c.id === id);
              if (!cat) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() => {
                    setFlow({ categoryId: id, type: "expense", periodOnly: true, q: "", accountId: "all", sort: "recent" });
                    setView("flow");
                  }}
                >
                  <span className={cn("grid size-11 place-items-center rounded-full bg-mist text-leaf")}>
                    <Icon name={cat.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{cat.name}</span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-bg">
                      <span className="block h-full rounded-full bg-clay" style={{ width: `${(value / catTotal) * 100}%` }} />
                    </span>
                  </span>
                  <span className="text-sm tabular-nums text-fg">{brl(value, { cents: false })}</span>
                </button>
              );
            })}
          </Card>
        )}
      </section>

      {soon.length > 0 ? (
        <section>
          <h2 className="mb-3 font-serif text-xl">A caminho</h2>
          <Card className="divide-y divide-line p-0">
            {soon.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-14 shrink-0 text-xs text-muted">{shortDate(tx.date)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{tx.note || TX_LABEL[tx.type]}</span>
                <Money
                  value={tx.type === "expense" ? -tx.amount : tx.amount}
                  intent={tx.type === "expense" ? "expense" : tx.type === "income" ? "income" : "neutral"}
                  className="text-sm"
                />
              </div>
            ))}
          </Card>
        </section>
      ) : null}

      {budgetRows.length > 0 ? (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-serif text-xl">Limites</h2>
            <button type="button" className="text-sm font-medium text-fg" onClick={() => setView("budgets")}>
              Abrir
            </button>
          </div>
          <Card className="flex flex-col gap-4">
            {budgetRows.map((row) => (
              <div key={row.cat.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span>{row.cat.name}</span>
                  <span className="tabular-nums text-muted">
                    {brl(row.realized, { cents: false })} / {brl(row.budget?.limit ?? 0, { cents: false })}
                  </span>
                </div>
                <Meter realized={row.realized} scheduled={row.scheduled} limit={row.budget?.limit ?? 0} />
              </div>
            ))}
          </Card>
        </section>
      ) : null}

      <section className="grid gap-3">
        <Card>
          <Kicker>Reserva</Kicker>
          <p className="mt-2 font-serif text-2xl text-fg">
            {safety ? `${safety.months.toFixed(1).replace(".", ",")} meses` : "—"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {safety ? `Média de ${brl(safety.avg, { cents: false })} por mês nas saídas recentes.` : "Ainda sem histórico suficiente."}
          </p>
        </Card>
        <Card>
          <Kicker>Maior saída</Kicker>
          <p className="mt-2 font-serif text-2xl text-fg">{big ? brl(big.amount, { cents: false }) : "—"}</p>
          <p className="mt-1 truncate text-sm text-muted">{big ? big.note || "Sem nota" : "Nada neste período."}</p>
        </Card>
        <Card>
          <Kicker>Dia mais caro</Kicker>
          <p className="mt-2 font-serif text-2xl text-fg">{week[hot]! > 0 ? WEEKDAY_LABELS[hot] : "—"}</p>
          <p className="mt-1 text-sm text-muted">
            {week[hot]! > 0 ? `${brl(week[hot]!, { cents: false })} em saídas.` : "Sem saídas para comparar."}
          </p>
        </Card>
      </section>

      <details className="rounded-2xl border border-line bg-surface px-4 py-3">
        <summary className="cursor-pointer text-sm text-muted">Como os números fecham</summary>
        <div className="mt-3 space-y-2 text-sm text-muted">
          <p>Patrimônio soma contas, reserva, carteira e investimentos, e desconta faturas e saldos negativos.</p>
          <p>Entradas e saídas não incluem transferências entre as suas contas.</p>
          <p>Metas organizam um plano. Só entram no patrimônio se você mover o dinheiro de verdade.</p>
          <p>Lançamentos futuros aparecem como previstos e não mudam o saldo de hoje.</p>
        </div>
      </details>
    </div>
  );
}

function TxMark({ tx, categories }: { tx: Transaction; categories: Category[] }) {
  if (tx.type === "transfer") {
    return (
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist text-moss">
        <ArrowsLeftRight className="size-4" weight="fill" />
      </span>
    );
  }
  const cat = categories.find((c) => c.id === tx.categoryId);
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist text-leaf">
      <Icon name={cat?.icon ?? "spark"} className="size-4" />
    </span>
  );
}

export function FlowView() {
  const txs = useFinance((s) => s.transactions);
  const accounts = useFinance((s) => s.accounts);
  const categories = useFinance((s) => s.categories);
  const flow = useFinance((s) => s.flow);
  const setFlow = useFinance((s) => s.setFlow);
  const removeTx = useFinance((s) => s.removeTx);
  const addTx = useFinance((s) => s.addTx);
  const ui = useUI();
  const { todayISO } = useClock();
  const period = usePeriod();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = txs.filter((t) => {
    if (flow.periodOnly && (t.date < period.start || t.date > period.end)) return false;
    if (flow.type !== "all" && t.type !== flow.type) return false;
    if (flow.categoryId !== "all" && t.categoryId !== flow.categoryId) return false;
    if (flow.accountId !== "all" && t.accountId !== flow.accountId && t.toAccountId !== flow.accountId) return false;
    const q = flow.q.trim().toLowerCase();
    if (q) {
      const cat = categories.find((c) => c.id === t.categoryId)?.name.toLowerCase() ?? "";
      if (!t.note.toLowerCase().includes(q) && !cat.includes(q)) return false;
    }
    return true;
  });
  const amountSorted = filtered.slice().sort((a, b) => b.amount - a.amount || b.date.localeCompare(a.date));
  const upcomingItems = filtered
    .filter((t) => t.date > todayISO)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const pastItems = filtered
    .filter((t) => t.date <= todayISO)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const groups: { key: string; items: Transaction[] }[] = [];
  const pushGroup = (tx: Transaction) => {
    const last = groups[groups.length - 1];
    if (!last || last.key !== tx.date) groups.push({ key: tx.date, items: [tx] });
    else last.items.push(tx);
  };
  if (flow.sort === "amount") groups.push({ key: "maiores", items: amountSorted });
  else {
    for (const tx of upcomingItems) pushGroup(tx);
    for (const tx of pastItems) pushGroup(tx);
  }

  const income = filtered.filter((t) => t.type === "income").reduce((n, t) => n + t.amount, 0);
  const expense = filtered.filter((t) => t.type === "expense").reduce((n, t) => n + t.amount, 0);

  return (
    <div className="rise flex flex-col gap-4">
      <PeriodBar />
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{filtered.length} lançamentos</p>
          <p className="text-sm">
            <span className="text-sage">{brl(income, { cents: false })}</span>
            <span className="text-muted"> · </span>
            <span className="text-clay">{brl(expense, { cents: false })}</span>
          </p>
        </div>
        <Chip active={!flow.periodOnly} onClick={() => setFlow({ periodOnly: !flow.periodOnly })}>
          {flow.periodOnly ? "No período" : "Histórico todo"}
        </Chip>
      </div>
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" weight="bold" />
        <input
          className={cn(fieldClass, "pl-10")}
          placeholder="Buscar nota ou classe"
          value={flow.q}
          onChange={(e) => setFlow({ q: e.target.value })}
        />
      </div>
      <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4">
        {(
          [
            ["all", "Tudo"],
            ["expense", "Saídas"],
            ["income", "Entradas"],
            ["transfer", "Transferências"],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} active={flow.type === id} onClick={() => setFlow({ type: id })}>
            {label}
          </Chip>
        ))}
        <Chip active={flow.sort === "amount"} onClick={() => setFlow({ sort: flow.sort === "amount" ? "recent" : "amount" })}>
          {flow.sort === "amount" ? "Maiores" : "Recentes"}
        </Chip>
      </div>
      <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={flow.categoryId === "all"} onClick={() => setFlow({ categoryId: "all" })}>
          Todas as classes
        </Chip>
        {categories.map((cat) => (
          <Chip key={cat.id} active={flow.categoryId === cat.id} onClick={() => setFlow({ categoryId: cat.id, type: cat.kind })}>
            {cat.name}
          </Chip>
        ))}
      </div>
      <select className={fieldClass} value={flow.accountId} onChange={(e) => setFlow({ accountId: e.target.value })}>
        <option value="all">Todas as contas</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <Empty title="Nada por aqui" body="Troque o filtro ou lance um movimento novo." action={<Button onClick={() => ui.openTx()}>Novo lançamento</Button>} />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-2 text-xs font-medium tracking-widest text-muted uppercase">
                {group.key === "maiores" ? "Maiores valores" : dayHeading(group.key, todayISO)}
              </h2>
              <Card className="divide-y divide-line p-0">
                {group.items.map((tx) => {
                  const open = openId === tx.id;
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const from = accounts.find((a) => a.id === tx.accountId)?.name ?? "Conta";
                  const to = accounts.find((a) => a.id === tx.toAccountId)?.name;
                  return (
                    <div key={tx.id}>
                      <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(open ? null : tx.id)}>
                        <TxMark tx={tx} categories={categories} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm">{tx.note || cat?.name || TX_LABEL[tx.type]}</span>
                            {tx.date > todayISO ? <span className="shrink-0 text-xs text-muted">previsto</span> : null}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            {tx.type === "transfer" ? `${from} → ${to ?? ""}` : `${cat?.name ?? TX_LABEL[tx.type]} · ${from}`}
                            {tx.installment ? ` · ${tx.installment.index}/${tx.installment.count}` : ""}
                            {flow.sort === "amount" ? ` · ${shortDate(tx.date)}` : ""}
                          </span>
                        </span>
                        <Money
                          value={tx.type === "expense" ? -tx.amount : tx.amount}
                          intent={tx.type === "income" ? "income" : tx.type === "expense" ? "expense" : "neutral"}
                          className="text-sm"
                        />
                      </button>
                      <div className={cn("grid transition-[grid-template-rows] duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                        <div className="overflow-hidden" inert={open ? undefined : true}>
                          <div className="flex flex-wrap gap-2 px-4 pb-3">
                            <Button variant="ghost" className="h-10 px-3" onClick={() => ui.editTx(tx)}>
                              <PencilSimple className="size-4" weight="bold" /> Editar
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-10 px-3"
                              onClick={() => {
                                addTx({ ...tx, id: uid("tx"), date: todayISO, installment: undefined });
                                toast.success("Lançado de novo");
                              }}
                            >
                              De novo
                            </Button>
                            {tx.recurring !== "none" ? (
                              <Button
                                variant="ghost"
                                className="h-10 px-3"
                                onClick={() => {
                                  const date = tx.recurring === "weekly" ? addDaysISO(tx.date, 7) : addMonthsISO(tx.date, 1);
                                  addTx({ ...tx, id: uid("tx"), date, installment: undefined });
                                  toast.success("Próximo lançado");
                                }}
                              >
                                Próximo
                              </Button>
                            ) : null}
                            {confirmId === tx.id ? (
                              <Button
                                variant="danger"
                                className="h-10 px-3"
                                onClick={() => {
                                  removeTx(tx.id);
                                  setConfirmId(null);
                                  toast.success("Lançamento excluído");
                                }}
                              >
                                Confirmar
                              </Button>
                            ) : (
                              <Button variant="danger" className="h-10 px-3" onClick={() => setConfirmId(tx.id)}>
                                <Trash className="size-4" weight="bold" /> Excluir
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function BudgetsView() {
  const { today, todayISO } = useClock();
  const [cursor, setCursor] = useState(monthKey(today));
  const categories = useFinance((s) => s.categories);
  const budgets = useFinance((s) => s.budgets);
  const txs = useFinance((s) => s.transactions);
  const ui = useUI();
  const rows = categories
    .filter((c) => c.kind === "expense")
    .map((cat) => {
      const budget = budgets.find((b) => b.categoryId === cat.id && b.month === cursor);
      const spent = spentInMonth(txs, cat.id, cursor, todayISO);
      return { cat, budget, ...spent };
    })
    .filter((row) => row.budget || row.realized > 0 || row.scheduled > 0)
    .sort((a, b) => {
      const ar = (a.realized + a.scheduled) / (a.budget?.limit || a.realized + a.scheduled || 1);
      const br = (b.realized + b.scheduled) / (b.budget?.limit || b.realized + b.scheduled || 1);
      return br - ar;
    });
  const shift = (delta: number) => {
    const [y, m] = cursor.split("-").map(Number);
    const d = new Date(y || 1970, (m || 1) - 1 + delta, 1);
    setCursor(monthKey(d));
  };

  return (
    <div className="rise flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Mês anterior" className="grid size-11 place-items-center rounded-full bg-surface" onClick={() => shift(-1)}>
          <Chevron className="size-5" />
        </button>
        <p className="flex-1 text-center font-serif text-lg">{monthLabelFromKey(cursor)}</p>
        <button type="button" aria-label="Próximo mês" className="grid size-11 place-items-center rounded-full bg-surface" onClick={() => shift(1)}>
          <Chevron dir="right" className="size-5" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="text-sage">Realizado</span> e <span className="text-fg">previsto</span>
        </p>
        <Button className="h-10 px-3" onClick={() => ui.openBudget(cursor)}>
          <Plus className="size-4" weight="bold" /> Limite
        </Button>
      </div>
      {rows.length === 0 ? (
        <Empty title="Sem limites neste mês" body="Defina um teto por classe para acompanhar o ritmo dos gastos." action={<Button onClick={() => ui.openBudget(cursor)}>Criar limite</Button>} />
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => {
            const limit = row.budget?.limit ?? 0;
            const used = row.realized + row.scheduled;
            const over = limit > 0 && used > limit;
            return (
              <button key={row.cat.id} type="button" className="rounded-2xl border border-line bg-surface p-4 text-left" onClick={() => ui.openBudget(cursor, row.cat.id)}>
                <div className="mb-2 flex items-center gap-3">
                  <span className={cn("grid size-10 place-items-center rounded-full", toneClass(row.cat.tone))}>
                    <Icon name={row.cat.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{row.cat.name}</span>
                    <span className={cn("text-xs", over ? "text-clay" : "text-muted")}>
                      {limit > 0 ? (over ? `${brl(used - limit)} acima` : `faltam ${brl(limit - used)}`) : "Sem limite"}
                    </span>
                  </span>
                  <span className="text-right text-sm tabular-nums">
                    {brl(row.realized, { cents: false })}
                    <span className="block text-xs text-muted">{limit > 0 ? brl(limit, { cents: false }) : "—"}</span>
                  </span>
                </div>
                <Meter realized={row.realized} scheduled={row.scheduled} limit={limit} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function GoalsView() {
  const goals = useFinance((s) => s.goals);
  const removeContribution = useFinance((s) => s.removeContribution);
  const ui = useUI();
  const { todayISO } = useClock();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rise flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <p className="max-w-xs text-sm text-muted">As metas não somam de novo no patrimônio. Aporte e, se quiser, mova o saldo junto.</p>
        <Button className="h-10 shrink-0 px-3" onClick={() => ui.openGoal()}>
          <Plus className="size-4" weight="bold" /> Meta
        </Button>
      </div>
      {goals.length === 0 ? (
        <Empty title="Nenhuma meta" body="Crie um alvo — reserva, viagem, curso — e vá marcando os aportes." action={<Button onClick={() => ui.openGoal()}>Criar meta</Button>} />
      ) : (
        goals.map((goal) => {
          const saved = goalSaved(goal);
          const pct = goal.target > 0 ? (saved / goal.target) * 100 : 0;
          const late = goal.deadline && goal.deadline < todayISO && saved < goal.target;
          const open = openId === goal.id;
          return (
            <Card key={goal.id}>
              <div className="flex items-center gap-4">
                <div className="grid size-16 place-items-center rounded-full" style={{ background: `conic-gradient(${toneStroke(goal.tone)} ${Math.min(100, pct)}%, var(--color-line) 0)` }}>
                  <div className="grid size-12 place-items-center rounded-full bg-surface">
                    <Icon name={goal.icon} className="size-4" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{goal.name}</p>
                  <p className="text-sm text-muted">
                    <Money value={saved} className="text-sm" /> de {brl(goal.target, { cents: false })}
                  </p>
                  <p className={cn("text-xs", late ? "text-clay" : "text-muted")}>
                    {Math.round(pct)}%{goal.deadline ? ` · até ${shortDate(goal.deadline)}` : ""}
                    {late ? " · prazo passou" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="h-10 px-3" onClick={() => ui.openContribute(goal.id)}>
                  Aportar
                </Button>
                <Button variant="ghost" className="h-10 px-3" onClick={() => ui.openGoal(goal)}>
                  Editar
                </Button>
                <Button variant="quiet" className="h-10 px-3" onClick={() => setOpenId(open ? null : goal.id)}>
                  {open ? "Fechar" : "Aportes"}
                </Button>
              </div>
              {open ? (
                <ul className="mt-3 divide-y divide-line">
                  {goal.contributions.length === 0 ? <li className="py-2 text-sm text-muted">Nenhum aporte ainda.</li> : null}
                  {goal.contributions
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((c) => (
                      <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                        <span className="w-14 text-xs text-muted">{shortDate(c.date)}</span>
                        <span className="min-w-0 flex-1 truncate text-muted">{c.note || "Aporte"}</span>
                        <span className="tabular-nums">{brl(c.amount)}</span>
                        <button type="button" aria-label="Remover aporte" className="grid size-11 place-items-center text-clay" onClick={() => removeContribution(goal.id, c.id)}>
                          <Trash className="size-4" weight="bold" />
                        </button>
                      </li>
                    ))}
                </ul>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
}

export function AccountsView() {
  const accounts = useFinance((s) => s.accounts);
  const txs = useFinance((s) => s.transactions);
  const removeAccount = useFinance((s) => s.removeAccount);
  const ui = useUI();
  const { todayISO } = useClock();
  const map = balances(accounts, txs, todayISO);
  const wealth = wealthSplit(map);
  const [confirm, setConfirm] = useState<string | null>(null);

  return (
    <div className="rise flex flex-col gap-4">
      <Card>
        <Kicker>Patrimônio líquido</Kicker>
        <p className="mt-2">
          <Money value={wealth.net} display className="text-4xl" />
        </p>
      </Card>
      <div className="flex justify-end">
        <Button className="h-10 px-3" onClick={() => ui.openAccount()}>
          <Plus className="size-4" weight="bold" /> Conta
        </Button>
      </div>
      {accounts.map((account) => {
        const value = map.get(account.id) ?? 0;
        return (
          <Card key={account.id}>
            <div className="flex items-center gap-3">
              <span className={cn("grid size-11 place-items-center rounded-full", toneClass(account.tone))}>
                <Icon name={account.icon} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate">{account.name}</p>
                <p className="text-xs text-muted">{ACCOUNT_TYPE_LABEL[account.type]}</p>
              </div>
              <Money value={value} intent={value < 0 ? "expense" : "neutral"} display className="text-xl" />
            </div>
            {account.type === "credit" && value < 0 ? <p className="mt-2 text-xs text-clay">Fatura em aberto {brl(-value)}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" className="h-10 px-3" onClick={() => ui.openTx({ accountId: account.id, type: account.type === "credit" ? "expense" : "expense" })}>
                Lançar
              </Button>
              {account.type === "credit" && value < 0 ? (
                <Button variant="ghost" className="h-10 px-3" onClick={() => ui.openTx({ type: "transfer", accountId: accounts.find((a) => a.type === "checking")?.id })}>
                  Pagar fatura
                </Button>
              ) : null}
              <Button variant="ghost" className="h-10 px-3" onClick={() => ui.openAccount(account)}>
                Editar
              </Button>
              {confirm === account.id ? (
                <Button
                  variant="danger"
                  className="h-10 px-3"
                  onClick={() => {
                    const ok = removeAccount(account.id);
                    toast[ok ? "success" : "error"](ok ? "Conta removida" : "Conta com lançamentos ou é a última");
                    setConfirm(null);
                  }}
                >
                  Confirmar
                </Button>
              ) : (
                <Button variant="quiet" className="h-10 px-3" onClick={() => setConfirm(account.id)}>
                  Excluir
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export function ReportsView() {
  const ledger = useFinance();
  const { today, todayISO } = useClock();
  const period = usePeriod();
  const wealth = netWorthSeries(ledger, today, 6);
  const grain = period.realized ? granularityFor(period.realized.start, period.realized.end) : "month";
  const points = seriesFor(ledger.transactions, period.realized, grain);
  const cats = [...byCategory(ledger.transactions, period.realized, "expense")].sort((a, b) => b[1] - a[1]);
  const top = cats.slice(0, 5);
  const rest = cats.slice(5).reduce((n, [, v]) => n + v, 0);
  const pie = top.map(([id, value]) => {
    const cat = ledger.categories.find((c) => c.id === id);
    return { name: cat?.name ?? "Classe", value, fill: toneStroke(cat?.tone ?? "mist") };
  });
  if (rest > 0) pie.push({ name: "Outras", value: rest, fill: "var(--color-faint)" });
  const week = weekdayExpenses(ledger.transactions, period.realized);
  const weekData = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ label: WEEKDAY_LABELS[i] ?? "", expense: week[i] ?? 0 }));
  const big = ledger.transactions
    .filter((t) => t.type === "expense" && period.realized && t.date >= period.realized.start && t.date <= period.realized.end)
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const rateBase = sumFlow(ledger.transactions, period.realized);
  const rate = rateBase.income > 0 ? (rateBase.net / rateBase.income) * 100 : null;

  return (
    <div className="rise flex flex-col gap-4">
      <PeriodBar />
      <Card>
        <Kicker>Patrimônio</Kicker>
        <p className="mt-1 text-sm text-muted">Fechamento de cada um dos últimos meses, até {shortDate(todayISO)}.</p>
        <div className="mt-3">
          <WealthChart data={wealth} />
        </div>
      </Card>
      <Card>
        <div className="flex items-end justify-between gap-3">
          <Kicker>Entradas e saídas</Kicker>
          <p className="text-sm text-muted">{rate === null ? "Sem entradas" : `Sobra ${rate.toFixed(0)}% das entradas`}</p>
        </div>
        <div className="mt-3">
          <FlowChart data={points} />
        </div>
      </Card>
      <Card>
        <Kicker>Por classe</Kicker>
        <SharePie data={pie} />
        <ul className="mt-2 space-y-2">
          {pie.map((row) => {
            const total = pie.reduce((n, item) => n + item.value, 0) || 1;
            return (
              <li key={row.name} className="flex items-center gap-3 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: row.fill }} />
                <span className="min-w-0 flex-1 truncate">{row.name}</span>
                <span className="tabular-nums text-muted">{Math.round((row.value / total) * 100)}%</span>
                <span className="tabular-nums">{brl(row.value, { cents: false })}</span>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card>
        <Kicker>Dia da semana</Kicker>
        <div className="mt-3">
          <WeekChart data={weekData} />
        </div>
      </Card>
      <Card>
        <Kicker>Maiores saídas</Kicker>
        <ul className="mt-3 divide-y divide-line">
          {big.length === 0 ? <li className="text-sm text-muted">Nenhuma saída no período.</li> : null}
          {big.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-14 text-xs text-muted">{shortDate(tx.date)}</span>
              <span className="min-w-0 flex-1 truncate">{tx.note || "Saída"}</span>
              <span className="tabular-nums text-clay">{brl(tx.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export function ClassesView() {
  const categories = useFinance((s) => s.categories);
  const removeCategory = useFinance((s) => s.removeCategory);
  const setFlow = useFinance((s) => s.setFlow);
  const setView = useFinance((s) => s.setView);
  const ui = useUI();
  const period = usePeriod();
  const txs = useFinance((s) => s.transactions);

  const block = (kind: "income" | "expense") => {
    const rows = categories
      .filter((c) => c.kind === kind)
      .map((cat) => {
        const total = txs
          .filter((t) => t.categoryId === cat.id && t.type === kind && period.realized && t.date >= period.realized.start && t.date <= period.realized.end)
          .reduce((n, t) => n + t.amount, 0);
        return { cat, total };
      })
      .sort((a, b) => b.total - a.total);
    const max = Math.max(...rows.map((r) => r.total), 1);
    return (
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl">{kind === "expense" ? "Saídas" : "Entradas"}</h2>
        {rows.map(({ cat, total }) => (
          <Card key={cat.id} className="flex items-center gap-3">
            <span className={cn("grid size-10 place-items-center rounded-full", toneClass(cat.tone))}>
              <Icon name={cat.icon} className="size-4" />
            </span>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => {
                setFlow({ categoryId: cat.id, type: kind, periodOnly: true, q: "", accountId: "all", sort: "recent" });
                setView("flow");
              }}
            >
              <span className="block truncate text-sm">{cat.name}</span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-bg">
                <span className={cn("block h-full rounded-full", kind === "income" ? "bg-sage" : "bg-clay")} style={{ width: `${(total / max) * 100}%` }} />
              </span>
            </button>
            <span className="text-sm tabular-nums">{brl(total, { cents: false })}</span>
            <button type="button" aria-label={`Editar ${cat.name}`} className="grid size-11 place-items-center text-muted" onClick={() => ui.openCategory(cat)}>
              <PencilSimple className="size-4" weight="bold" />
            </button>
            <button
              type="button"
              aria-label={`Excluir ${cat.name}`}
              className="grid size-11 place-items-center text-clay"
              onClick={() => {
                const ok = removeCategory(cat.id);
                toast[ok ? "success" : "error"](ok ? "Classe removida" : "Classe em uso");
              }}
            >
              <Trash className="size-4" weight="bold" />
            </button>
          </Card>
        ))}
      </section>
    );
  };

  return (
    <div className="rise flex flex-col gap-5">
      <PeriodBar />
      <div className="flex justify-end">
        <Button className="h-10 px-3" onClick={() => ui.openCategory()}>
          <Plus className="size-4" weight="bold" /> Classe
        </Button>
      </div>
      {block("expense")}
      {block("income")}
    </div>
  );
}

export function SettingsView() {
  const resetDemo = useFinance((s) => s.resetDemo);
  const clearAll = useFinance((s) => s.clearAll);
  const importLedger = useFinance((s) => s.importLedger);
  const { today } = useClock();
  const fileRef = useRef<HTMLInputElement>(null);
  const [arm, setArm] = useState<"clear" | "demo" | null>(null);

  const download = () => {
    const s = useFinance.getState();
    const payload = {
      v: 1,
      accounts: s.accounts,
      categories: s.categories,
      transactions: s.transactions,
      budgets: s.budgets,
      goals: s.goals,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minhas-financas.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo gerado");
  };

  return (
    <div className="rise flex flex-col gap-4">
      <Card>
        <h2 className="font-serif text-xl">Neste aparelho</h2>
        <p className="mt-2 text-sm text-muted">
          Minhas Finanças não envia seus números para lugar nenhum. Exportar é o jeito de guardar uma cópia ou levar para outro navegador.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={download}>Exportar</Button>
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Importar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                const data = JSON.parse(await file.text()) as unknown;
                const ok = importLedger(data);
                if (ok) toast.success("Dados importados");
                else toast.error("Arquivo não reconhecido");
              } catch {
                toast.error("Não foi possível ler o arquivo");
              }
            }}
          />
        </div>
      </Card>
      <Card>
        <h2 className="font-serif text-xl">Recomeçar</h2>
        <p className="mt-2 text-sm text-muted">Restaurar o exemplo substitui o livro atual. Apagar zera lançamentos, limites e metas.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {arm === "demo" ? (
            <Button
              onClick={() => {
                resetDemo(today);
                setArm(null);
                toast.success("Exemplo restaurado");
              }}
            >
              Confirmar exemplo
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setArm("demo")}>
              Restaurar exemplo
            </Button>
          )}
          {arm === "clear" ? (
            <Button
              variant="danger"
              onClick={() => {
                clearAll();
                setArm(null);
                toast.success("Livro apagado");
              }}
            >
              Confirmar exclusão
            </Button>
          ) : (
            <Button variant="danger" onClick={() => setArm("clear")}>
              Apagar tudo
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export function MoreView() {
  const setView = useFinance((s) => s.setView);
  const items = [
    { id: "accounts" as const, title: "Contas", detail: "Saldos, fatura e patrimônio", icon: Bank },
    { id: "reports" as const, title: "Relatórios", detail: "Meses, classes e dias da semana", icon: ChartLine },
    { id: "classes" as const, title: "Classes", detail: "Categorias de entrada e saída", icon: Tag },
    { id: "settings" as const, title: "Ajustes", detail: "Exportar, importar, recomeçar", icon: Gear },
  ];
  return (
    <div className="rise overflow-hidden rounded-2xl bg-surface">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left", index > 0 && "border-t border-line")}
          onClick={() => setView(item.id)}
        >
          <span className="grid size-9 place-items-center rounded-full bg-raised text-fg">
            <item.icon className="size-5" weight="fill" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base">{item.title}</span>
            <span className="block text-sm text-muted">{item.detail}</span>
          </span>
          <Chevron dir="right" className="size-4 text-faint" />
        </button>
      ))}
    </div>
  );
}
