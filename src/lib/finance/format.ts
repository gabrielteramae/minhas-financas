export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function brl(n: number, opts?: { cents?: boolean }) {
  if (!Number.isFinite(n)) return "—";
  const cents = opts?.cents !== false;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(n);
}

export function formatPct(n: number) {
  const abs = Math.abs(n);
  const digits = abs >= 10 || abs === 0 ? 0 : 1;
  return `${abs.toFixed(digits).replace(".", ",")}%`;
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function formatISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

export function addDaysISO(iso: string, n: number) {
  return formatISODate(addDays(parseISODate(iso), n));
}

export function addMonthsISO(iso: string, n: number) {
  const d = parseISODate(iso);
  const day = d.getDate();
  const x = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(day, last));
  return formatISODate(x);
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthKeyFromISO(iso: string) {
  return iso.slice(0, 7);
}

export function titleMonth(d: Date) {
  const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function monthLabelFromKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return titleMonth(new Date(y || 1970, (m || 1) - 1, 1));
}

export function shortMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(y || 1970, (m || 1) - 1, 1));
}

export function dayHeading(iso: string, todayISO: string) {
  if (iso === todayISO) return "Hoje";
  if (iso === addDaysISO(todayISO, -1)) return "Ontem";
  if (iso === addDaysISO(todayISO, 1)) return "Amanhã";
  const d = parseISODate(iso);
  const s = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shortDate(iso: string) {
  const d = parseISODate(iso);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
}

export function parseMoney(raw: string, opts?: { allowZero?: boolean }) {
  const s = raw.trim().replace(/\s/g, "").replace(/^R\$\s?/i, "");
  if (!s) return null;
  let n: string;
  if (s.includes(",") && s.includes(".")) n = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) n = s.replace(",", ".");
  else n = s;
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return null;
  if (v === 0 && !opts?.allowZero) return null;
  return round2(v);
}

export function splitAmount(total: number, parts: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / parts);
  let rem = cents - base * parts;
  const out: number[] = [];
  for (let i = 0; i < parts; i++) {
    const extra = rem > 0 ? 1 : 0;
    if (rem > 0) rem -= 1;
    out.push((base + extra) / 100);
  }
  return out;
}

export function uid(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return `${prefix}-${id}`;
}

export function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
