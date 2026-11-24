import { useMemo, useRef, useState } from "react";
import {
  ArrowsLeftRight,
  Bank,
  ChartLine,
  Eye,
  EyeSlash,
  Gear,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Receipt,
  Tag,
  Target,
  Trash,
  Wallet,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/store";
import {
  balances,
  byCategory,
  granularityFor,
  goalSaved,
  netWorthSeries,
  seriesFor,
  spentInMonth,
  splitPeriod,
  sumFlow,
  upcoming,
  wealthSplit,
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
import { FlowChart, SharePie, WealthChart } from "./charts";
import { useClock, useUI } from "./context";
import { Chevron, Icon, toneClass, toneStroke } from "./icons";
import { Button, Card, Chip, Empty, fieldClass, Kicker, Money } from "./ui";

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

export function PeriodBar({ compact = false }: { compact?: boolean }) {
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
      {compact ? null : (
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
      )}
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
  const hideHint = useFinance((s) => s.hideHint);
  const resetDemo = useFinance((s) => s.resetDemo);
  const { today, todayISO } = useClock();
  const ui = useUI();
  const period = usePeriod();
  const [hidden, setHidden] = useState(false);
  const picture = useMemo(() => {
    const map = balances(ledger.accounts, ledger.transactions, todayISO);
    const wealth = wealthSplit(map);
    const nowFlow = sumFlow(ledger.transactions, period.realized);
    const soon = upcoming(ledger.transactions, todayISO).slice(0, 1);
    const recent = ledger.transactions
      .filter((t) => t.date <= todayISO && t.type !== "transfer")
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, 3);
    return { wealth, nowFlow, soon, recent };
  }, [ledger, period, todayISO]);
  const { wealth, nowFlow, soon, recent } = picture;

  const hello = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const mask = hidden ? "R$ ••••" : null;

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
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-paper">GC</span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tracking-tight text-ink">Olá, Gabriel</p>
          <p className="text-sm text-moss">{hello}</p>
        </div>
      </div>

      {ledger.origin === "demo" && !ledger.hintHidden ? (
        <div className="flex items-center gap-3">
          <p className="flex-1 text-sm text-moss">Números de exemplo, só neste aparelho.</p>
          <button type="button" className="grid size-11 shrink-0 place-items-center text-moss" aria-label="Dispensar aviso" onClick={hideHint}>
            <X className="size-4" weight="bold" />
          </button>
        </div>
      ) : null}

      <div className="flex min-h-40 flex-col justify-between rounded-3xl bg-paper p-5 ring-1 ring-mist">
        <span className="flex w-full items-start justify-between">
          <button
            type="button"
            aria-label={hidden ? "Mostrar saldo" : "Ocultar saldo"}
            className="grid size-11 place-items-center rounded-full text-leaf"
            onClick={() => setHidden((v) => !v)}
          >
            {hidden ? <EyeSlash className="size-5" weight="bold" /> : <Eye className="size-5" weight="bold" />}
          </button>
          <button type="button" className="text-sm font-medium text-leaf" onClick={() => setView("accounts")}>
            Contas
          </button>
        </span>
        <span>
          <span className="block text-sm text-moss">Saldo</span>
          {mask ? (
            <span className="mt-1 block text-4xl font-semibold tracking-tight text-ink">{mask}</span>
          ) : (
            <Money value={wealth.net} display className="mt-1 text-4xl leading-none" />
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Shortcut icon={Receipt} label="Extrato" onClick={() => setView("flow")} />
        <Shortcut icon={Wallet} label="Orçamento" onClick={() => setView("budgets")} />
        <Shortcut icon={Target} label="Metas" onClick={() => setView("goals")} />
        <Shortcut icon={ChartLine} label="Relatórios" onClick={() => setView("reports")} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Shortcut icon={Bank} label="Contas" compact onClick={() => setView("accounts")} />
        <Shortcut icon={Tag} label="Categorias" compact onClick={() => setView("classes")} />
        <Shortcut icon={Gear} label="Ajustes" compact onClick={() => setView("settings")} />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Últimos</h2>
          <button type="button" className="text-sm font-medium text-leaf" onClick={() => setView("flow")}>
            Extrato
          </button>
        </div>
        <div className="flex flex-col">
          {recent.map((tx) => {
            const cat = ledger.categories.find((c) => c.id === tx.categoryId);
            return (
              <button key={tx.id} type="button" className="flex items-center gap-3 py-3 text-left" onClick={() => setView("flow")}>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-leaf ring-1 ring-mist">
                  <Icon name={cat?.icon ?? "spark"} className="size-5" weight="fill" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{tx.note || cat?.name || TX_LABEL[tx.type]}</span>
                  <span className="block truncate text-xs text-moss">
                    {cat?.name ?? TX_LABEL[tx.type]} · {shortDate(tx.date)}
                  </span>
                </span>
                <span className={cn("text-sm font-medium tabular-nums", tx.type === "expense" ? "text-clay" : "text-sage")}>
                  {mask ?? `${tx.type === "expense" ? "− " : "+ "}${brl(tx.amount)}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {soon[0] ? (
        <button type="button" className="flex items-center justify-between gap-3 rounded-3xl bg-paper px-4 py-4 text-left ring-1 ring-mist" onClick={() => setView("flow")}>
          <span>
            <span className="block text-sm text-moss">Próximo</span>
            <span className="mt-0.5 block text-sm font-medium text-ink">{soon[0].note || TX_LABEL[soon[0].type]}</span>
          </span>
          <span className="text-right text-sm text-moss">
            {shortDate(soon[0].date)}
            <span className="mt-0.5 block font-medium text-ink">{mask ?? brl(soon[0].amount, { cents: false })}</span>
          </span>
        </button>
      ) : null}

      <p className="text-center text-sm text-moss">
        {mask ? "Valores ocultos" : <>Neste mês entrou {brl(nowFlow.income, { cents: false })} e saiu {brl(nowFlow.expense, { cents: false })}.</>}
      </p>
    </div>
  );
}

function Shortcut({
  icon: IconGlyph,
  label,
  onClick,
  compact,
}: {
  icon: typeof Receipt;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col justify-between rounded-3xl bg-paper p-4 text-left ring-1 ring-mist active:scale-[0.98]",
        compact ? "min-h-28" : "min-h-36",
      )}
      onClick={onClick}
    >
      <IconGlyph className="size-6 text-leaf" weight="bold" />
      <span className="text-[15px] font-medium leading-tight text-ink">{label}</span>
    </button>
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
  const [moreFilters, setMoreFilters] = useState(false);

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

  return (
    <div className="rise flex flex-col gap-4">
      <PeriodBar />
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm text-muted">{filtered.length} lançamentos</p>
      </div>
      <div className="relative">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" weight="bold" />
        <input
          className={cn(fieldClass, "pl-10")}
          placeholder="Buscar por nome"
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
        <Chip active={moreFilters} onClick={() => setMoreFilters((v) => !v)}>
          Filtros
        </Chip>
      </div>
      {flow.categoryId !== "all" ? (
        <button type="button" className="text-left text-sm text-leaf" onClick={() => setFlow({ categoryId: "all" })}>
          {categories.find((c) => c.id === flow.categoryId)?.name ?? "Categoria"} · tirar filtro
        </button>
      ) : null}
      {moreFilters ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip active={!flow.periodOnly} onClick={() => setFlow({ periodOnly: !flow.periodOnly })}>
              {flow.periodOnly ? "Só este período" : "Histórico todo"}
            </Chip>
            <Chip active={flow.sort === "amount"} onClick={() => setFlow({ sort: flow.sort === "amount" ? "recent" : "amount" })}>
              {flow.sort === "amount" ? "Maiores" : "Mais recentes"}
            </Chip>
          </div>
          <div className="scroll-thin -mx-4 flex gap-2 overflow-x-auto px-4">
            <Chip active={flow.categoryId === "all"} onClick={() => setFlow({ categoryId: "all" })}>
              Todas
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
        </div>
      ) : null}

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
          <Plus className="size-4" weight="bold" /> Teto
        </Button>
      </div>
      {rows.length === 0 ? (
        <Empty title="Sem teto neste mês" body="Diga quanto cada categoria pode gastar. A barra mostra o que já saiu e o que ainda está previsto." action={<Button onClick={() => ui.openBudget(cursor)}>Criar teto</Button>} />
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
      <div className="flex justify-end">
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
  const [part, setPart] = useState<"mes" | "categorias" | "patrimonio">("mes");
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

  return (
    <div className="rise flex flex-col gap-4">
      <div className="flex gap-2">
        {(
          [
            ["mes", "Mês"],
            ["categorias", "Categorias"],
            ["patrimonio", "Patrimônio"],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} active={part === id} onClick={() => setPart(id)}>
            {label}
          </Chip>
        ))}
      </div>
      <PeriodBar />
      {part === "patrimonio" ? (
        <Card>
          <Kicker>O que você tem</Kicker>
          <p className="mt-1 text-sm text-muted">Até {shortDate(todayISO)}.</p>
          <div className="mt-3">
            <WealthChart data={wealth} />
          </div>
        </Card>
      ) : null}
      {part === "mes" ? (
        <Card>
          <Kicker>Entrou e saiu</Kicker>
          <div className="mt-3">
            <FlowChart data={points} />
          </div>
        </Card>
      ) : null}
      {part === "categorias" ? (
        <Card>
          <Kicker>Para onde foi</Kicker>
          <SharePie data={pie} />
          <ul className="mt-2 space-y-2">
            {pie.map((row) => {
              const total = pie.reduce((n, item) => n + item.value, 0) || 1;
              return (
                <li key={row.name} className="flex items-center gap-3 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: row.fill }} />
                  <span className="min-w-0 flex-1 truncate">{row.name}</span>
                  <span className="tabular-nums">{Math.round((row.value / total) * 100)}%</span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
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
              <Icon name={cat.icon} className="size-5" weight="fill" />
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
                toast[ok ? "success" : "error"](ok ? "Categoria removida" : "Categoria em uso");
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
    { id: "accounts" as const, title: "Contas", detail: "Banco, cartão, carteira e investimentos", icon: Bank },
    { id: "reports" as const, title: "Relatórios", detail: "Gráficos do mês, das categorias e dos dias", icon: ChartLine },
    { id: "classes" as const, title: "Categorias", detail: "Os nomes das entradas e das saídas", icon: Tag },
    { id: "settings" as const, title: "Ajustes", detail: "Exportar, importar ou recomeçar", icon: Gear },
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
