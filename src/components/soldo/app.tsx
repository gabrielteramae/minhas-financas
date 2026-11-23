import { useEffect, useMemo, useState } from "react";
import {
  ArrowsLeftRight,
  ChartLine,
  ChartPie,
  Gear,
  House,
  Plus,
  SquaresFour,
  Target,
  type IconWeight,
} from "@phosphor-icons/react";
import { Toaster } from "sonner";
import { formatISODate } from "@/lib/finance/format";
import { hydrateFinance, useFinance } from "@/lib/finance/store";
import type { View, Transaction, Goal, Account, Category } from "@/lib/finance/types";
import { cn } from "@/lib/cn";
import { ClockProvider, UIProvider, type TxPreset } from "./context";
import { Panels, type Panel } from "./panels";
import {
  AccountsView,
  BudgetsView,
  ClassesView,
  FlowView,
  GoalsView,
  MoreView,
  Overview,
  ReportsView,
  SettingsView,
} from "./views";

const INTRO_KEY = "caixa-intro";

const PRIMARY: { id: View; label: string; icon: typeof House }[] = [
  { id: "home", label: "Início", icon: House },
  { id: "flow", label: "Fluxo", icon: ArrowsLeftRight },
  { id: "budgets", label: "Limites", icon: ChartPie },
  { id: "goals", label: "Metas", icon: Target },
  { id: "more", label: "Mais", icon: SquaresFour },
];

function CaixaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 96" className={className} aria-hidden>
      <path d="M10 40 36 20l26 20v6H10z" fill="#f7f6f2" />
      <rect x="16" y="48" width="8" height="22" rx="1.5" fill="#f7f6f2" />
      <rect x="32" y="48" width="8" height="22" rx="1.5" fill="#f7f6f2" />
      <rect x="48" y="48" width="8" height="22" rx="1.5" fill="#f7f6f2" />
      <rect x="8" y="72" width="56" height="8" rx="2" fill="#f7f6f2" />
      <rect x="80" y="44" width="58" height="36" rx="6" fill="#f7f6f2" />
      <circle cx="109" cy="62" r="9" fill="#f2c14b" />
      <rect x="152" y="40" width="62" height="40" rx="7" fill="#f7f6f2" />
      <rect x="160" y="50" width="14" height="10" rx="2" fill="#f2c14b" />
      <rect x="160" y="66" width="28" height="4" rx="2" fill="#146b4a" opacity="0.35" />
      <rect x="230" y="58" width="12" height="22" rx="3" fill="#c8e6d4" />
      <rect x="246" y="44" width="12" height="36" rx="3" fill="#f7f6f2" />
      <rect x="262" y="28" width="12" height="52" rx="3" fill="#f2c14b" />
    </svg>
  );
}

function SceneMonth({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 220" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="360" height="220" fill="#146b4a" />
      <rect x="48" y="120" width="28" height="64" rx="8" fill="#f4f7f2" />
      <rect x="92" y="88" width="28" height="96" rx="8" fill="#c8e6d4" />
      <rect x="136" y="56" width="28" height="128" rx="8" fill="#f7f4ea" />
      <rect x="180" y="96" width="28" height="88" rx="8" fill="#c8e6d4" />
      <rect x="224" y="40" width="28" height="144" rx="8" fill="#f2c14b" />
      <rect x="268" y="72" width="28" height="112" rx="8" fill="#f4f7f2" />
    </svg>
  );
}

function SceneGoals({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 220" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="360" height="220" fill="#146b4a" />
      <circle cx="180" cy="118" r="72" fill="none" stroke="#0c3d2c" strokeWidth="16" />
      <circle cx="180" cy="118" r="72" fill="none" stroke="#f4f7f2" strokeWidth="16" strokeDasharray="300 160" strokeLinecap="round" transform="rotate(-90 180 118)" />
      <circle cx="180" cy="118" r="36" fill="#f2c14b" />
    </svg>
  );
}

function Splash() {
  return (
    <main className="grid min-h-dvh place-items-center bg-leaf px-6 text-paper">
      <div className="cesta-pop flex flex-col items-center text-center">
        <CaixaMark className="h-24 w-full max-w-sm" />
        <p className="mt-4 text-4xl font-semibold tracking-tight">Minhas Finanças</p>
        <p className="mt-2 text-sm text-paper/80">Abrindo minha caixinha</p>
      </div>
    </main>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const slides = [
    {
      art: <SceneMonth className="h-auto w-full" />,
      title: "O mês inteiro, numa caixinha.",
      body: "Entradas, saídas e o que ainda vai cair. Os números sobem e descem na hora.",
    },
    {
      art: <SceneGoals className="h-auto w-full" />,
      title: "Limite do mercado. Meta da viagem.",
      body: "Cada classe tem um teto. Cada meta mostra o quanto já juntou.",
    },
  ];
  const last = i === slides.length - 1;
  const slide = slides[i]!;
  return (
    <main className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-leaf">
      <div className="flex items-center px-5 pt-6 text-paper">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <rect x="2" y="16" width="7" height="12" rx="1.5" fill="#c8e6d4" />
          <rect x="12" y="10" width="7" height="18" rx="1.5" fill="#f7f6f2" />
          <rect x="22" y="4" width="7" height="24" rx="1.5" fill="#f2c14b" />
        </svg>
        <span className="ml-2 text-lg font-semibold tracking-tight">Minhas Finanças</span>
      </div>
      <div className="cesta-in flex min-h-0 flex-1 items-end px-3 pb-2">{slide.art}</div>
      <div className="rounded-t-3xl bg-paper px-5 pt-6 pb-8">
        <div className="mb-4 flex gap-1.5">
          {slides.map((_, n) => (
            <span key={n} className={cn("h-1.5 rounded-full", n === i ? "w-6 bg-leaf" : "w-1.5 bg-mist")} />
          ))}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{slide.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-moss">{slide.body}</p>
        <button
          type="button"
          className="mt-6 h-12 w-full rounded-full bg-leaf text-sm font-semibold text-paper active:scale-[0.98]"
          onClick={() => (last ? onDone() : setI(i + 1))}
        >
          {last ? "Abrir a caixinha" : "Continuar"}
        </button>
        <button type="button" className="mt-2 h-11 w-full text-sm font-medium text-moss" onClick={onDone}>
          Pular
        </button>
      </div>
    </main>
  );
}

const TITLES: Partial<Record<View, string>> = {
  flow: "Fluxo",
  budgets: "Limites",
  goals: "Metas",
  accounts: "Contas",
  reports: "Relatórios",
  classes: "Classes",
  settings: "Ajustes",
  more: "Mais",
};

function Shell() {
  const view = useFinance((s) => s.view);
  const setView = useFinance((s) => s.setView);
  const [panel, setPanel] = useState<Panel | null>(null);
  const today = useMemo(() => new Date(), []);
  const clock = useMemo(() => ({ today, todayISO: formatISODate(today) }), [today]);
  const ui = useMemo(
    () => ({
      openTx: (preset?: TxPreset) => setPanel({ kind: "tx", presetType: preset?.type, presetAccountId: preset?.accountId }),
      editTx: (tx: Transaction) => setPanel({ kind: "tx", tx }),
      openBudget: (month: string, categoryId?: string) => setPanel({ kind: "budget", month, categoryId }),
      openGoal: (goal?: Goal) => setPanel({ kind: "goal", goal }),
      openContribute: (goalId: string) => setPanel({ kind: "contribute", goalId }),
      openAccount: (account?: Account) => setPanel({ kind: "account", account }),
      openCategory: (category?: Category) => setPanel({ kind: "category", category }),
    }),
    [],
  );

  const moreActive = view === "more" || view === "accounts" || view === "reports" || view === "classes" || view === "settings";

  return (
    <ClockProvider value={clock}>
      <UIProvider value={ui}>
        <div className="min-h-dvh bg-deep md:py-4">
          <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-foam md:h-[min(920px,100dvh)] md:rounded-[2rem]">
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-5 pb-36">
              {view !== "home" && TITLES[view] ? (
                <div className="mb-4 flex items-center gap-2">
                  {view === "accounts" || view === "reports" || view === "classes" || view === "settings" ? (
                    <button
                      type="button"
                      className="grid size-11 place-items-center rounded-full bg-paper text-ink ring-1 ring-mist"
                      aria-label="Voltar"
                      onClick={() => setView("more")}
                    >
                      <span className="text-lg leading-none">‹</span>
                    </button>
                  ) : null}
                  <h1 className="text-3xl font-semibold tracking-tight text-ink">{TITLES[view]}</h1>
                </div>
              ) : null}
              {view === "home" ? <Overview /> : null}
              {view === "flow" ? <FlowView /> : null}
              {view === "budgets" ? <BudgetsView /> : null}
              {view === "goals" ? <GoalsView /> : null}
              {view === "accounts" ? <AccountsView /> : null}
              {view === "reports" ? <ReportsView /> : null}
              {view === "classes" ? <ClassesView /> : null}
              {view === "settings" ? <SettingsView /> : null}
              {view === "more" ? <MoreView /> : null}
            </div>
            <button
              type="button"
              aria-label="Novo lançamento"
              className="absolute right-4 bottom-24 z-30 grid size-14 place-items-center rounded-full bg-leaf text-paper shadow-none active:scale-[0.96]"
              onClick={() => ui.openTx()}
            >
              <Plus className="size-6" weight="bold" />
            </button>
            <nav className="absolute inset-x-3 bottom-3 z-30">
              <div className="grid h-[4.5rem] grid-cols-5 rounded-[1.75rem] bg-paper ring-1 ring-mist">
                {PRIMARY.map((item) => {
                  const active = item.id === "more" ? moreActive : view === item.id;
                  const weight: IconWeight = active ? "fill" : "bold";
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.label}
                      className="grid place-items-center px-1"
                      onClick={() => setView(item.id)}
                    >
                      <span className={cn("flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-2xl", active && "bg-mist")}>
                        <item.icon className={cn("size-5", active ? "text-leaf" : "text-moss")} weight={weight} />
                        <span className={cn("text-[10px] font-medium leading-none", active ? "text-leaf" : "text-moss")}>{item.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
            <Panels panel={panel} onClose={() => setPanel(null)} />
            <Toaster
              theme="light"
              position="top-center"
              toastOptions={{
                style: {
                  background: "var(--color-paper)",
                  color: "var(--color-ink)",
                  border: "1px solid var(--color-mist)",
                },
              }}
            />
          </div>
        </div>
      </UIProvider>
    </ClockProvider>
  );
}

export function SoldoApp() {
  const [phase, setPhase] = useState<"splash" | "intro" | "app">("splash");

  useEffect(() => {
    let live = true;
    const started = performance.now();
    void hydrateFinance().then(() => {
      if (!live) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const min = reduce ? 200 : 1100;
      const wait = Math.max(0, min - (performance.now() - started));
      window.setTimeout(() => {
        if (!live) return;
        let seen = false;
        try {
          seen = window.localStorage.getItem(INTRO_KEY) === "1";
        } catch {
          seen = true;
        }
        setPhase(seen ? "app" : "intro");
      }, wait);
    });
    return () => {
      live = false;
    };
  }, []);

  const finishIntro = () => {
    try {
      window.localStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* ignore */
    }
    setPhase("app");
  };

  if (phase === "splash") return <Splash />;
  if (phase === "intro") return <Intro onDone={finishIntro} />;
  return <Shell />;
}
