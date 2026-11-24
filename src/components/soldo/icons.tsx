import {
  Airplane,
  Bank,
  Briefcase,
  Bus,
  CreditCard,
  ForkKnife,
  GraduationCap,
  Heartbeat,
  House,
  Lightning,
  Money,
  PiggyBank,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Sparkle,
  Ticket,
  TrendUp,
  Wallet,
  type IconWeight,
} from "@phosphor-icons/react";
import type { IconName, Tone } from "@/lib/finance/types";

const ICONS = {
  home: House,
  cart: ShoppingCart,
  bus: Bus,
  utensils: ForkKnife,
  heart: Heartbeat,
  ticket: Ticket,
  repeat: Repeat,
  zap: Lightning,
  bag: ShoppingBag,
  wallet: Wallet,
  briefcase: Briefcase,
  trend: TrendUp,
  landmark: Bank,
  card: CreditCard,
  banknote: Money,
  piggy: PiggyBank,
  plane: Airplane,
  graduation: GraduationCap,
  spark: Sparkle,
} as const;

export function Icon({
  name,
  className,
  weight = "fill",
}: {
  name: IconName;
  className?: string;
  weight?: IconWeight;
}) {
  const Cmp = ICONS[name] ?? Sparkle;
  return <Cmp className={className} weight={weight} aria-hidden />;
}

export function Chevron({ dir = "left", className }: { dir?: "left" | "right"; className?: string }) {
  const d = dir === "left" ? "M14.25 5.25 7.5 12l6.75 6.75" : "M9.75 5.25 16.5 12l-6.75 6.75";
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function toneClass(_tone?: Tone) {
  return "bg-mist text-leaf";
}

export function toneStroke(tone: Tone) {
  switch (tone) {
    case "gold":
      return "#a3a3a3";
    case "sage":
      return "#30d158";
    case "clay":
      return "#ff453a";
    default:
      return "#737373";
  }
}

export const ICON_LIST = Object.keys(ICONS) as IconName[];
