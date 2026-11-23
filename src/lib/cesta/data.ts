export type CatId = "frutas" | "verduras" | "padaria" | "laticinios" | "mercearia";

export type Product = {
  id: string;
  name: string;
  unit: string;
  price: number;
  was?: number;
  cat: CatId;
  blurb: string;
};

export const CATS: { id: CatId; label: string }[] = [
  { id: "frutas", label: "Frutas" },
  { id: "verduras", label: "Verduras" },
  { id: "padaria", label: "Padaria" },
  { id: "laticinios", label: "Laticínios" },
  { id: "mercearia", label: "Mercearia" },
];

export const PRODUCTS: Product[] = [
  { id: "morango", name: "Morango", unit: "250 g", price: 1290, was: 1590, cat: "frutas", blurb: "Doce, firme e colhido pra chegar hoje." },
  { id: "maca", name: "Maçã fuji", unit: "1 kg", price: 890, was: 1090, cat: "frutas", blurb: "Crocante, boa pra lanchar ou assar." },
  { id: "banana", name: "Banana prata", unit: "dúzia", price: 699, cat: "frutas", blurb: "Madura no ponto, sem mancha escura." },
  { id: "tomate", name: "Tomate italiano", unit: "1 kg", price: 799, was: 949, cat: "verduras", blurb: "Polpa densa, pouco semente, ótimo no molho." },
  { id: "cenoura", name: "Cenoura", unit: "500 g", price: 399, cat: "verduras", blurb: "Lavada, sem a rama, pronta pra picar." },
  { id: "alface", name: "Alface crespa", unit: "1 un", price: 349, cat: "verduras", blurb: "Folha solta, crocante, lavada na feira." },
  { id: "pao", name: "Pão de fermentação", unit: "500 g", price: 1490, was: 1690, cat: "padaria", blurb: "Casca crocante, miolo aberto. Assado de manhã." },
  { id: "leite", name: "Leite integral", unit: "1 L", price: 549, cat: "laticinios", blurb: "Fresco, garrafa de vidro retornável." },
  { id: "ovos", name: "Ovos caipiras", unit: "10 un", price: 1490, was: 1690, cat: "laticinios", blurb: "Gema alta. Caixa de papel, sem plástico." },
  { id: "queijo", name: "Queijo minas", unit: "300 g", price: 1890, cat: "laticinios", blurb: "Frescal, sal leve, corta fácil." },
  { id: "cafe", name: "Café torrado", unit: "250 g", price: 1690, was: 1990, cat: "mercearia", blurb: "Moagem média, torra clara, pacote selado." },
  { id: "arroz", name: "Arroz agulhinha", unit: "1 kg", price: 799, cat: "mercearia", blurb: "Grão solto. Pacote simples, sem mistura." },
];

export const ADDRESSES = [
  { id: "casa" as const, title: "Casa", line: "Rua Harmonia, 420", area: "Vila Madalena" },
  { id: "trabalho" as const, title: "Trabalho", line: "Av. Faria Lima, 3500", area: "Itaim Bibi" },
];

export const SLOTS = ["10:00 – 12:00", "12:00 – 14:00", "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00", "20:00 – 22:00"];

export const FREE_FROM = 8000;
export const FEE = 790;

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function off(p: Product) {
  if (!p.was || p.was <= p.price) return 0;
  return Math.round((1 - p.price / p.was) * 100);
}
