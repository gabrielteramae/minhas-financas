import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { brl } from "@/lib/finance/format";

type TipPayload = { name?: string; value?: number; color?: string; dataKey?: string };

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm">
      {label ? <p className="mb-1 text-muted">{label}</p> : null}
      {payload.map((row) => (
        <p key={String(row.dataKey ?? row.name)} className="flex justify-between gap-4 tabular-nums text-fg">
          <span className="text-muted">{row.name}</span>
          <span>{brl(Number(row.value) || 0)}</span>
        </p>
      ))}
    </div>
  );
}

const axis = { fill: "var(--color-muted)", fontSize: 12 };

export function FlowChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Nada realizado neste período.</p>;
  }
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis hide />
          <Tooltip content={<Tip />} cursor={{ fill: "var(--color-raised)" }} />
          <Bar dataKey="income" name="Entradas" fill="var(--color-sage)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="expense" name="Saídas" fill="var(--color-clay)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WealthChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="h-48 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--color-line)" />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<Tip />} />
          <Area
            type="monotone"
            dataKey="value"
            name="Patrimônio"
            stroke="var(--color-leaf)"
            fill="var(--color-leaf)"
            fillOpacity={0.08}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeekChart({ data }: { data: { label: string; expense: number }[] }) {
  return (
    <div className="h-40 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<Tip />} cursor={{ fill: "var(--color-raised)" }} />
          <Bar dataKey="expense" name="Saídas" fill="var(--color-clay)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SharePie({ data }: { data: { name: string; value: number; fill: string }[] }) {
  const total = data.reduce((n, d) => n + d.value, 0);
  if (total <= 0) return <p className="py-6 text-sm text-muted">Sem saídas neste período.</p>;
  return (
    <div className="mx-auto h-48 w-full max-w-xs">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={2} stroke="none">
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
