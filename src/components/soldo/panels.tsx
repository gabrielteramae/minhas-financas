import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useFinance } from "@/lib/finance/store";
import { ACCOUNT_TYPE_LABEL } from "@/lib/finance/labels";
import {
  addMonthsISO,
  formatISODate,
  parseMoney,
  splitAmount,
  uid,
} from "@/lib/finance/format";
import type {
  Account,
  AccountType,
  Category,
  CategoryKind,
  Goal,
  IconName,
  Recurrence,
  Tone,
  Transaction,
  TxType,
} from "@/lib/finance/types";
import { ICON_NAMES, TONES } from "@/lib/finance/types";
import { Icon, toneStroke } from "./icons";
import { Button, Field, fieldClass } from "./ui";
import { cn } from "@/lib/cn";
import { useClock } from "./context";

export type Panel =
  | { kind: "tx"; tx?: Transaction; presetType?: TxType; presetAccountId?: string }
  | { kind: "budget"; month: string; categoryId?: string }
  | { kind: "goal"; goal?: Goal }
  | { kind: "contribute"; goalId: string }
  | { kind: "account"; account?: Account }
  | { kind: "category"; category?: Category };

function Sheet({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay fixed inset-0 z-40 bg-fg/40" />
        <Dialog.Content className="sheet fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border border-line bg-surface outline-none">
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-line" />
          <div className="flex items-start justify-between gap-3 px-5 pt-4">
            <div>
              <Dialog.Title className="font-serif text-2xl text-fg">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
            </div>
            <Dialog.Close className="grid size-11 shrink-0 place-items-center rounded-full bg-raised text-muted" aria-label="Fechar">
              <X className="size-5" weight="bold" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function parseSigned(raw: string) {
  const trimmed = raw.trim();
  const neg = trimmed.startsWith("-");
  const value = parseMoney(trimmed.replace(/^-/, ""), { allowZero: true });
  if (value === null) return null;
  return neg ? -value : value;
}

export function Panels({ panel, onClose }: { panel: Panel | null; onClose: () => void }) {
  if (!panel) return null;
  const title =
    panel.kind === "tx"
      ? panel.tx
        ? "Editar lançamento"
        : "Novo lançamento"
      : panel.kind === "budget"
        ? "Limite do mês"
        : panel.kind === "goal"
          ? panel.goal
            ? "Editar meta"
            : "Nova meta"
          : panel.kind === "contribute"
            ? "Aportar na meta"
            : panel.kind === "account"
              ? panel.account
                ? "Editar conta"
                : "Nova conta"
              : panel.category
                ? "Editar categoria"
                : "Nova categoria";
  const description =
    panel.kind === "tx"
      ? "Entrada, saída ou movimento entre contas."
      : panel.kind === "budget"
        ? "Quanto esta categoria pode gastar no mês."
        : panel.kind === "goal"
          ? "Um alvo para separar dinheiro."
          : panel.kind === "contribute"
            ? "Marca o progresso. O saldo pode ser movido junto."
            : panel.kind === "account"
              ? "O saldo inicial entra antes dos lançamentos."
              : "Categorias organizam entradas e saídas.";

  return (
    <Sheet title={title} description={description} onClose={onClose}>
      {panel.kind === "tx" ? (
        <TxForm
          key={panel.tx?.id ?? `new-${panel.presetType ?? "expense"}-${panel.presetAccountId ?? ""}`}
          initial={panel.tx}
          presetType={panel.presetType}
          presetAccountId={panel.presetAccountId}
          onDone={onClose}
        />
      ) : null}
      {panel.kind === "budget" ? (
        <BudgetForm key={`${panel.month}-${panel.categoryId ?? "new"}`} month={panel.month} categoryId={panel.categoryId} onDone={onClose} />
      ) : null}
      {panel.kind === "goal" ? <GoalForm key={panel.goal?.id ?? "new"} goal={panel.goal} onDone={onClose} /> : null}
      {panel.kind === "contribute" ? <ContributeForm key={panel.goalId} goalId={panel.goalId} onDone={onClose} /> : null}
      {panel.kind === "account" ? <AccountForm key={panel.account?.id ?? "new"} account={panel.account} onDone={onClose} /> : null}
      {panel.kind === "category" ? <CategoryForm key={panel.category?.id ?? "new"} category={panel.category} onDone={onClose} /> : null}
    </Sheet>
  );
}

function TxForm({
  initial,
  presetType,
  presetAccountId,
  onDone,
}: {
  initial?: Transaction;
  presetType?: TxType;
  presetAccountId?: string;
  onDone: () => void;
}) {
  const accounts = useFinance((s) => s.accounts);
  const categories = useFinance((s) => s.categories);
  const addManyTx = useFinance((s) => s.addManyTx);
  const updateTx = useFinance((s) => s.updateTx);
  const { todayISO } = useClock();
  const firstAccount = accounts.find((a) => a.id === presetAccountId)?.id ?? accounts.find((a) => a.type === "checking")?.id ?? accounts[0]?.id ?? "";
  const [type, setType] = useState<TxType>(initial?.type ?? presetType ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount).replace(".", ",") : "");
  const [accountId, setAccountId] = useState(initial?.accountId ?? firstAccount);
  const [toAccountId, setToAccountId] = useState(initial?.toAccountId ?? accounts.find((a) => a.id !== firstAccount)?.id ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO);
  const [note, setNote] = useState(initial?.note ?? "");
  const [recurring, setRecurring] = useState<Recurrence>(initial?.recurring ?? "none");
  const [parcelas, setParcelas] = useState(1);
  const [error, setError] = useState("");

  const kind = type === "income" ? "income" : "expense";
  const options = categories.filter((c) => c.kind === kind);
  const selectedCategory = options.some((c) => c.id === categoryId) ? categoryId : (options[0]?.id ?? "");

  const submit = () => {
    const value = parseMoney(amount);
    if (!value) {
      setError("Informe um valor maior que zero.");
      return;
    }
    if (!accountId) {
      setError("Escolha uma conta.");
      return;
    }
    if (!date) {
      setError("Escolha a data.");
      return;
    }
    if (type === "transfer") {
      if (!toAccountId || toAccountId === accountId) {
        setError("Escolha outra conta de destino.");
        return;
      }
      const tx: Transaction = {
        id: initial?.id ?? uid("tx"),
        type,
        amount: value,
        accountId,
        toAccountId,
        date,
        note: note.trim(),
        recurring,
      };
      if (initial) updateTx(initial.id, tx);
      else addManyTx([tx]);
      toast.success(initial ? "Lançamento atualizado" : "Transferência lançada");
      onDone();
      return;
    }
    if (!selectedCategory) {
      setError("Crie uma categoria antes de lançar.");
      return;
    }
    if (initial) {
      updateTx(initial.id, {
        type,
        amount: value,
        accountId,
        toAccountId: undefined,
        categoryId: selectedCategory,
        date,
        note: note.trim(),
        recurring,
      });
      toast.success("Lançamento atualizado");
      onDone();
      return;
    }
    const parts = Math.max(1, Math.min(12, parcelas));
    const amounts = splitAmount(value, parts);
    const groupId = parts > 1 ? uid("grp") : undefined;
    const txs: Transaction[] = amounts.map((part, i) => ({
      id: uid("tx"),
      type,
      amount: part,
      accountId,
      categoryId: selectedCategory,
      date: addMonthsISO(date, i),
      note: parts > 1 ? `${note.trim() || "Parcela"} (${i + 1}/${parts})` : note.trim(),
      recurring: parts > 1 ? "none" : recurring,
      installment: groupId ? { index: i + 1, count: parts, groupId } : undefined,
    }));
    addManyTx(txs);
    toast.success(parts > 1 ? `${parts} parcelas lançadas` : "Lançamento salvo");
    onDone();
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["expense", "Saída"],
            ["income", "Entrada"],
            ["transfer", "Transferir"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setType(id)}
            className={cn(
              "h-11 rounded-full text-sm transition-transform duration-150 active:scale-[0.96]",
              type === id ? "bg-leaf text-paper" : "bg-bg text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <Field label={parcelas > 1 && !initial ? "Valor total" : "Valor"}>
        <input
          autoFocus
          inputMode="decimal"
          className={cn(fieldClass, "font-serif text-2xl")}
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <Field label={type === "transfer" ? "De" : "Conta"}>
        <select className={fieldClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      {type === "transfer" ? (
        <Field label="Para">
          <select className={fieldClass} value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <Field label="Categoria">
          <select className={fieldClass} value={selectedCategory} onChange={(e) => setCategoryId(e.target.value)}>
            {options.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data">
          <input type="date" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Repete">
          <select
            className={fieldClass}
            value={recurring}
            onChange={(e) => setRecurring(e.target.value as Recurrence)}
            disabled={!initial && parcelas > 1}
          >
            <option value="none">Não</option>
            <option value="monthly">Todo mês</option>
            <option value="weekly">Toda semana</option>
          </select>
        </Field>
      </div>
      {!initial && type !== "transfer" ? (
        <Field label="Parcelas" hint="O total se divide pelos meses seguintes.">
          <select
            className={fieldClass}
            value={parcelas}
            onChange={(e) => {
              const n = Number(e.target.value);
              setParcelas(n);
              if (n > 1) setRecurring("none");
            }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i === 0 ? "À vista" : `${i + 1}x`}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      <Field label="Nota">
        <input className={fieldClass} maxLength={80} value={note} placeholder="Ex.: mercado, aluguel" onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" className="w-full">
        Salvar
      </Button>
    </form>
  );
}

function BudgetForm({ month, categoryId, onDone }: { month: string; categoryId?: string; onDone: () => void }) {
  const categories = useFinance((s) => s.categories.filter((c) => c.kind === "expense"));
  const budgets = useFinance((s) => s.budgets);
  const upsert = useFinance((s) => s.upsertBudget);
  const remove = useFinance((s) => s.removeBudget);
  const [cat, setCat] = useState(categoryId ?? categories[0]?.id ?? "");
  const existing = budgets.find((b) => b.categoryId === cat && b.month === month);
  const [amount, setAmount] = useState(existing ? String(existing.limit).replace(".", ",") : "");
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = parseMoney(amount);
        if (!value || !cat) {
          setError("Escolha a categoria e um limite maior que zero.");
          return;
        }
        upsert(cat, month, value);
        toast.success("Limite salvo");
        onDone();
      }}
    >
      <Field label="Categoria">
        <select
          className={fieldClass}
          value={cat}
          onChange={(e) => {
            const id = e.target.value;
            setCat(id);
            const found = budgets.find((b) => b.categoryId === id && b.month === month);
            setAmount(found ? String(found.limit).replace(".", ",") : "");
          }}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Limite">
        <input inputMode="decimal" className={cn(fieldClass, "font-serif text-2xl")} value={amount} placeholder="0,00" onChange={(e) => setAmount(e.target.value)} />
      </Field>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" className="w-full">
        Salvar limite
      </Button>
      {existing ? (
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            remove(existing.id);
            toast.success("Limite removido");
            onDone();
          }}
        >
          Remover limite
        </Button>
      ) : null}
    </form>
  );
}

function ToneIconPick({
  tone,
  icon,
  onTone,
  onIcon,
}: {
  tone: Tone;
  icon: IconName;
  onTone: (tone: Tone) => void;
  onIcon: (icon: IconName) => void;
}) {
  return (
    <>
      <div className="flex gap-2 px-1 py-1">
        {TONES.map((item) => (
          <button
            key={item}
            type="button"
            aria-label={item}
            onClick={() => onTone(item)}
            className={cn("size-11 rounded-full", tone === item ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : "")}
            style={{ background: toneStroke(item) }}
          />
        ))}
      </div>
      <div className="grid grid-cols-6 gap-2 py-1">
        {ICON_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            onClick={() => onIcon(name)}
            className={cn(
              "grid h-11 place-items-center rounded-xl",
              icon === name ? "bg-leaf text-paper" : "bg-bg text-fg",
            )}
          >
            <Icon name={name} className="size-4" />
          </button>
        ))}
      </div>
    </>
  );
}

function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const save = useFinance((s) => s.saveGoal);
  const remove = useFinance((s) => s.removeGoal);
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target).replace(".", ",") : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [tone, setTone] = useState<Tone>(goal?.tone ?? "gold");
  const [icon, setIcon] = useState<IconName>(goal?.icon ?? "piggy");
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = parseMoney(target);
        if (!name.trim() || !value) {
          setError("Dê um nome e informe o valor do alvo.");
          return;
        }
        save({
          id: goal?.id ?? uid("goal"),
          name: name.trim(),
          target: value,
          deadline: deadline || null,
          tone,
          icon,
          contributions: goal?.contributions ?? [],
        });
        toast.success("Meta salva");
        onDone();
      }}
    >
      <Field label="Nome">
        <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Reserva, viagem, curso" />
      </Field>
      <Field label="Alvo">
        <input inputMode="decimal" className={cn(fieldClass, "font-serif text-2xl")} value={target} placeholder="0,00" onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <Field label="Prazo" hint="Opcional.">
        <input type="date" className={fieldClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </Field>
      <ToneIconPick tone={tone} icon={icon} onTone={setTone} onIcon={setIcon} />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" className="w-full">
        Salvar meta
      </Button>
      {goal ? (
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            remove(goal.id);
            toast.success("Meta removida");
            onDone();
          }}
        >
          Excluir meta
        </Button>
      ) : null}
    </form>
  );
}

function ContributeForm({ goalId, onDone }: { goalId: string; onDone: () => void }) {
  const goal = useFinance((s) => s.goals.find((g) => g.id === goalId));
  const accounts = useFinance((s) => s.accounts);
  const addContribution = useFinance((s) => s.addContribution);
  const addTx = useFinance((s) => s.addTx);
  const { todayISO } = useClock();
  const fromDefault = accounts.find((a) => a.type === "checking")?.id ?? accounts[0]?.id ?? "";
  const toDefault = accounts.find((a) => a.type === "savings")?.id ?? "";
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO);
  const [note, setNote] = useState("");
  const [move, setMove] = useState(Boolean(fromDefault && toDefault && fromDefault !== toDefault));
  const [fromId, setFromId] = useState(fromDefault);
  const [toId, setToId] = useState(toDefault);
  const [error, setError] = useState("");

  if (!goal) return <p className="text-sm text-muted">Meta não encontrada.</p>;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = parseMoney(amount);
        if (!value) {
          setError("Informe o valor do aporte.");
          return;
        }
        if (move && (!fromId || !toId || fromId === toId)) {
          setError("Escolha contas diferentes para mover o dinheiro.");
          return;
        }
        addContribution(goal.id, { id: uid("aporte"), amount: value, date, note: note.trim() });
        if (move) {
          addTx({
            id: uid("tx"),
            type: "transfer",
            amount: value,
            accountId: fromId,
            toAccountId: toId,
            date,
            note: note.trim() || `Meta · ${goal.name}`,
            recurring: "none",
          });
        }
        toast.success(move ? "Aporte lançado e saldo movido" : "Aporte registrado");
        onDone();
      }}
    >
      <Field label="Valor">
        <input autoFocus inputMode="decimal" className={cn(fieldClass, "font-serif text-2xl")} value={amount} placeholder="0,00" onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Data">
        <input type="date" className={fieldClass} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Nota">
        <input className={fieldClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <label className="flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" className="mt-1 size-4" checked={move} onChange={(e) => setMove(e.target.checked)} />
        Também transferir entre contas, para o patrimônio acompanhar a meta.
      </label>
      {move ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="De">
            <select className={fieldClass} value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Para">
            <select className={fieldClass} value={toId} onChange={(e) => setToId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" className="w-full">
        Registrar aporte
      </Button>
    </form>
  );
}

function AccountForm({ account, onDone }: { account?: Account; onDone: () => void }) {
  const save = useFinance((s) => s.saveAccount);
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");
  const [opening, setOpening] = useState(account ? String(account.opening).replace(".", ",") : "0");
  const [tone, setTone] = useState<Tone>(account?.tone ?? "gold");
  const [icon, setIcon] = useState<IconName>(account?.icon ?? "landmark");
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = parseSigned(opening);
        if (!name.trim() || value === null) {
          setError("Informe o nome e o saldo inicial. Use um valor negativo se a fatura já estiver aberta.");
          return;
        }
        const ok = save({
          id: account?.id ?? uid("acc"),
          name,
          type,
          opening: value,
          tone,
          icon,
        });
        if (!ok) {
          setError("Não foi possível salvar.");
          return;
        }
        toast.success("Conta salva");
        onDone();
      }}
    >
      <Field label="Nome">
        <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Tipo">
        <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value as AccountType)}>
          {(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((id) => (
            <option key={id} value={id}>
              {ACCOUNT_TYPE_LABEL[id]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Saldo inicial" hint="Cartão: negativo se a fatura já existia. Ex.: -350.">
        <input inputMode="decimal" className={cn(fieldClass, "font-serif text-2xl")} value={opening} onChange={(e) => setOpening(e.target.value)} />
      </Field>
      <ToneIconPick tone={tone} icon={icon} onTone={setTone} onIcon={setIcon} />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" className="w-full">
        Salvar conta
      </Button>
    </form>
  );
}

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const save = useFinance((s) => s.saveCategory);
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? "expense");
  const [tone, setTone] = useState<Tone>(category?.tone ?? "gold");
  const [icon, setIcon] = useState<IconName>(category?.icon ?? "spark");
  const [error, setError] = useState("");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          setError("Dê um nome para a categoria.");
          return;
        }
        save({
          id: category?.id ?? uid("cat"),
          name,
          kind,
          tone,
          icon,
        });
        toast.success("Categoria salva");
        onDone();
      }}
    >
      <Field label="Nome">
        <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["expense", "Saída"],
            ["income", "Entrada"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cn("h-11 rounded-full text-sm", kind === id ? "bg-leaf text-paper" : "bg-bg text-muted")}
          >
            {label}
          </button>
        ))}
      </div>
      <ToneIconPick tone={tone} icon={icon} onTone={setTone} onIcon={setIcon} />
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit" className="w-full">
        Salvar categoria
      </Button>
    </form>
  );
}

export function todayStamp(d: Date) {
  return formatISODate(d);
}
