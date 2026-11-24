import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { brl } from "@/lib/finance/format";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-3xl bg-surface p-4", className)}>{children}</section>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-muted">{children}</p>;
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" | "danger" }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40",
        variant === "primary" && "bg-leaf text-paper",
        variant === "ghost" && "bg-surface text-ink ring-1 ring-mist",
        variant === "quiet" && "bg-transparent text-muted",
        variant === "danger" && "bg-clay/15 text-clay",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "h-10 shrink-0 rounded-full px-3 text-sm transition-transform duration-150 active:scale-[0.96]",
        active ? "bg-leaf text-paper" : "bg-surface text-moss ring-1 ring-mist",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export const fieldClass =
  "h-11 w-full rounded-xl border border-transparent bg-bg px-3 text-base text-fg outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-fg/15";

let motionReduced = false;
const motionListeners = new Set<() => void>();
let motionWatching = false;

function watchMotion() {
  if (motionWatching || typeof window === "undefined") return;
  motionWatching = true;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionReduced = mq.matches;
  mq.addEventListener("change", () => {
    motionReduced = mq.matches;
    motionListeners.forEach((listener) => listener());
  });
}

export function usePrefersReducedMotion() {
  const [, bump] = useState(0);
  useEffect(() => {
    watchMotion();
    const listener = () => bump((n) => n + 1);
    motionListeners.add(listener);
    if (motionReduced) listener();
    return () => {
      motionListeners.delete(listener);
    };
  }, []);
  return motionReduced;
}

export function Money({
  value,
  intent = "neutral",
  cents = true,
  display = false,
  className,
}: {
  value: number;
  intent?: "neutral" | "income" | "expense" | "result";
  cents?: boolean;
  display?: boolean;
  className?: string;
}) {
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const start = from.current;
    const delta = value - start;
    if (Math.abs(delta) < 0.005 || reduce) {
      from.current = value;
      setShown(value);
      return;
    }
    setFlash(delta > 0 ? "up" : "down");
    const clear = window.setTimeout(() => setFlash(null), 700);
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 680);
      const eased = 1 - (1 - p) ** 3;
      setShown(start + delta * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(clear);
    };
  }, [value, reduce]);

  const settled =
    intent === "income"
      ? "text-sage"
      : intent === "expense"
        ? "text-clay"
        : intent === "result"
          ? value >= 0
            ? "text-sage"
            : "text-clay"
          : "text-fg";

  const flashing =
    flash === "up" ? (intent === "expense" ? "text-clay" : "text-sage") : flash === "down" ? (intent === "expense" ? "text-sage" : "text-clay") : settled;

  return (
    <span
      className={cn(
        "inline-block tabular-nums transition-colors duration-300",
        display && "font-serif",
        flash ? flashing : settled,
        className,
      )}
    >
      {brl(shown, { cents })}
    </span>
  );
}

export function Delta({
  pct,
  goodWhenUp,
}: {
  pct: number | null;
  goodWhenUp: boolean;
}) {
  if (pct === null || !Number.isFinite(pct)) {
    return <span className="text-xs text-faint">sem comparação</span>;
  }
  if (Math.abs(pct) < 0.05) return <span className="text-xs text-muted">estável vs anterior</span>;
  const up = pct > 0;
  const good = up ? goodWhenUp : !goodWhenUp;
  const abs = Math.abs(pct);
  const text = `${abs >= 10 ? abs.toFixed(0) : abs.toFixed(1).replace(".", ",")}% ${up ? "acima" : "abaixo"}`;
  return <span className={cn("text-xs", good ? "text-sage" : "text-clay")}>{text}</span>;
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface px-4 py-8 text-center ring-1 ring-mist">
      <p className="font-serif text-xl text-fg">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
