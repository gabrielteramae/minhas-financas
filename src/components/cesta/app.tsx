import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CaretDown,
  CheckCircle,
  CreditCard,
  Funnel,
  Heart,
  House,
  MagnifyingGlass,
  MapPin,
  Money,
  Plus,
  Minus,
  QrCode,
  ShoppingBag,
  SquaresFour,
  Trash,
  User,
  X,
} from "@phosphor-icons/react";
import { ADDRESSES, CATS, FEE, FREE_FROM, PRODUCTS, SLOTS, brl, off, type Product } from "@/lib/cesta/data";
import { useCesta, type AddressId, type Tab } from "@/lib/cesta/store";
import { cn } from "@/lib/cn";
import { Basket, Mark, SceneMarket, SceneRide } from "./art";

type Pay = "dinheiro" | "cartao" | "pix";
type Sort = "destaque" | "preco" | "nome";

export function CestaApp() {
  const seen = useCesta((s) => s.seen);
  const [ready, setReady] = useState(false);
  const [stage, setStage] = useState<"splash" | "intro" | "app">("splash");

  useEffect(() => {
    let live = true;
    void Promise.resolve(useCesta.persist.rehydrate()).then(() => {
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setStage(useCesta.getState().seen ? "app" : "intro"), reduce ? 240 : 1500);
    return () => window.clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (ready && !seen && stage === "app") setStage("intro");
  }, [ready, seen, stage]);

  if (stage === "splash") return <Splash />;
  if (stage === "intro" && !seen) return <Intro onDone={() => setStage("app")} />;
  return <Shell />;
}

function Splash() {
  return (
    <main className="grid min-h-dvh place-items-center bg-leaf px-6 text-paper">
      <div className="cesta-pop flex flex-col items-center">
        <Basket className="h-36 w-36" />
        <p className="mt-5 text-4xl font-semibold tracking-tight">Cesta</p>
        <p className="mt-2 text-sm text-paper/80">Abrindo a feira…</p>
      </div>
    </main>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const markSeen = useCesta((s) => s.markSeen);
  const [i, setI] = useState(0);
  const slides = [
    {
      art: <SceneMarket className="h-auto w-full" />,
      title: "A feira inteira, numa cesta.",
      body: "Morango, pão quente e leite do dia. Sem fila e sem estacionamento.",
    },
    {
      art: <SceneRide className="h-auto w-full" />,
      title: "Chega na hora que você marca.",
      body: "De manhã ou no fim do dia. A janela é de duas horas, você escolhe.",
    },
  ];
  const last = i === slides.length - 1;
  const finish = () => {
    markSeen();
    onDone();
  };
  const slide = slides[i]!;
  return (
    <main className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-leaf">
      <div className="flex items-center px-5 pt-6 text-paper">
        <Basket className="h-8 w-8" />
        <span className="ml-2 text-lg font-semibold tracking-tight">Cesta</span>
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
        <button type="button" className="mt-6 h-12 w-full rounded-full bg-leaf text-sm font-semibold text-paper active:scale-[0.98]" onClick={() => (last ? finish() : setI(i + 1))}>
          {last ? "Abrir a feira" : "Continuar"}
        </button>
        <button type="button" className="mt-2 h-11 w-full text-sm font-medium text-moss" onClick={finish}>
          Pular
        </button>
      </div>
    </main>
  );
}

function Shell() {
  const tab = useCesta((s) => s.tab);
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("destaque");
  const count = useCesta((s) => Object.values(s.cart).reduce((n, q) => n + q, 0));
  const cartOpen = tab === "cart" && count > 0 && !checkout && !done;

  return (
    <div className="min-h-dvh bg-foam md:bg-deep">
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-foam md:h-[min(920px,100dvh)] md:rounded-[2rem]">
        <div className={cn("min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-4", cartOpen ? "pb-44" : "pb-28")}>
          {tab === "home" && <Home sort={sort} onOpen={setProduct} onAddress={() => setAddressOpen(true)} onFilter={() => setFilterOpen(true)} />}
          {tab === "cats" && <Cats />}
          {tab === "favs" && <Favs onOpen={setProduct} />}
          {tab === "cart" && <Cart onOpen={setProduct} />}
          {tab === "account" && <Account />}
        </div>
        <CartDock onCheckout={() => setCheckout(true)} hidden={!cartOpen || !!product || addressOpen || filterOpen} />
        {!checkout && !done ? <TabBar /> : null}
        {product ? <ProductSheet product={product} onClose={() => setProduct(null)} /> : null}
        {addressOpen ? <AddressSheet onClose={() => setAddressOpen(false)} /> : null}
        {filterOpen ? (
          <FilterSheet
            sort={sort}
            onSort={setSort}
            onClose={() => setFilterOpen(false)}
          />
        ) : null}
        {checkout ? (
          <Checkout
            onClose={() => setCheckout(false)}
            onDone={(slot) => {
              setCheckout(false);
              setDone(slot);
            }}
          />
        ) : null}
        {done ? <Done slot={done} onClose={() => setDone(null)} /> : null}
      </div>
    </div>
  );
}

function hello() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function arrange(list: Product[], sort: Sort) {
  const next = [...list];
  if (sort === "preco") next.sort((a, b) => a.price - b.price);
  else if (sort === "nome") next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  else next.sort((a, b) => off(b) - off(a) || a.name.localeCompare(b.name, "pt-BR"));
  return next;
}

function Home({
  sort,
  onOpen,
  onAddress,
  onFilter,
}: {
  sort: Sort;
  onOpen: (p: Product) => void;
  onAddress: () => void;
  onFilter: () => void;
}) {
  const cat = useCesta((s) => s.cat);
  const setCat = useCesta((s) => s.setCat);
  const addressId = useCesta((s) => s.addressId);
  const address = ADDRESSES.find((a) => a.id === addressId) ?? ADDRESSES[0]!;
  const [q, setQ] = useState("");
  const browsing = !q.trim() && cat === "todas" && sort === "destaque";
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const filtered = PRODUCTS.filter((p) => {
      if (cat !== "todas" && p.cat !== cat) return false;
      if (query && !`${p.name} ${p.blurb}`.toLowerCase().includes(query)) return false;
      return true;
    });
    return arrange(filtered, sort);
  }, [cat, q, sort]);
  const deals = PRODUCTS.filter((p) => off(p) > 0);
  const rest = PRODUCTS.filter((p) => off(p) === 0);

  return (
    <div className="cesta-in">
      <div className="flex items-center gap-3">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={onAddress}>
          <MapPin className="size-5 shrink-0 text-leaf" weight="fill" />
          <span className="min-w-0">
            <span className="block text-xs text-moss">Entregar em</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-ink">
              <span className="truncate">
                {address.title} · {address.line}
              </span>
              <CaretDown className="size-3 shrink-0" weight="bold" />
            </span>
          </span>
        </button>
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-leaf text-sm font-semibold text-paper">C</span>
      </div>

      <p className="mt-5 text-sm text-moss">{hello()}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Hortaliça fresca, com carinho até a porta.</h1>

      <div className="mt-4 flex gap-2">
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl bg-paper px-3">
          <MagnifyingGlass className="size-4 shrink-0 text-moss" weight="bold" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Morango, pão, leite…"
            className="h-full w-full bg-transparent text-base text-ink outline-none placeholder:text-moss"
          />
        </label>
        <button type="button" aria-label="Filtrar" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-leaf text-paper" onClick={onFilter}>
          <Funnel className="size-5" weight="fill" />
        </button>
      </div>

      {browsing ? (
        <>
          <button type="button" className="relative mt-4 block w-full overflow-hidden rounded-3xl text-left" onClick={() => setCat("frutas")}>
            <SceneMarket className="h-48 w-full" />
            <span className="absolute inset-0 bg-ink/35" />
            <span className="absolute inset-x-0 bottom-0 p-4 text-paper">
              <span className="block text-xs font-medium text-paper/80">Feira da manhã</span>
              <span className="mt-1 block text-xl font-semibold tracking-tight">Subiu cedo, a mesa já está posta.</span>
              <span className="mt-2 block text-sm font-medium">Até −19% · Comprar</span>
            </span>
          </button>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" className="rounded-3xl bg-paper p-3 text-left" onClick={() => setCat("padaria")}>
              <Mark id="pao" className="mx-auto h-20 w-20" />
              <p className="mt-1 text-sm font-semibold text-ink">Pão da manhã</p>
              <p className="text-xs text-moss">Assado hoje cedo</p>
            </button>
            <button type="button" className="flex flex-col rounded-3xl bg-leaf p-4 text-left text-paper" onClick={() => setCat("todas")}>
              <p className="text-xs font-medium text-paper/75">Cesta leve</p>
              <p className="mt-2 text-lg font-semibold tracking-tight">Frete some a partir de {brl(FREE_FROM)}</p>
              <span className="mt-auto pt-4 text-sm font-medium">Ver ofertas</span>
            </button>
          </div>

          <div className="mt-6 mb-3 flex items-end justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Categorias</h2>
            <button type="button" className="text-sm font-medium text-leaf" onClick={() => useCesta.getState().setTab("cats")}>
              Ver tudo
            </button>
          </div>
          <div className="scroll-thin -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
            {CATS.map((c) => {
              const sample = PRODUCTS.find((p) => p.cat === c.id)!;
              return (
                <button key={c.id} type="button" className="flex w-20 shrink-0 flex-col items-center gap-2" onClick={() => setCat(c.id)}>
                  <span className="grid size-16 place-items-center overflow-hidden rounded-full bg-paper">
                    <Mark id={sample.id} className="size-14" />
                  </span>
                  <span className="text-xs font-medium text-ink">{c.label}</span>
                </button>
              );
            })}
          </div>

          <Section title="Ofertas de hoje" hint="Preço menor do que o da banca.">
            <Grid products={deals} onOpen={onOpen} />
          </Section>
          <Section title="Da feira" hint="O que chegou hoje de manhã.">
            <Grid products={rest} onOpen={onOpen} />
          </Section>
        </>
      ) : (
        <Section title={q.trim() ? "Resultados" : cat === "todas" ? "Feira" : (CATS.find((c) => c.id === cat)?.label ?? "Feira")}>
          {cat !== "todas" ? (
            <button type="button" className="mb-3 text-sm font-medium text-leaf" onClick={() => setCat("todas")}>
              Limpar categoria
            </button>
          ) : null}
          {list.length === 0 ? <p className="text-sm text-moss">Nada com esse nome na feira de hoje.</p> : <Grid products={list} onOpen={onOpen} />}
        </Section>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {hint ? <p className="mt-0.5 mb-3 text-sm text-moss">{hint}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

function Grid({ products, onOpen }: { products: Product[]; onOpen: (p: Product) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p) => (
        <Card key={p.id} product={p} onOpen={() => onOpen(p)} />
      ))}
    </div>
  );
}

function Card({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const qty = useCesta((s) => s.cart[product.id] ?? 0);
  const fav = useCesta((s) => s.favs.includes(product.id));
  const add = useCesta((s) => s.add);
  const setQty = useCesta((s) => s.setQty);
  const toggleFav = useCesta((s) => s.toggleFav);
  const discount = off(product);
  return (
    <article className="flex flex-col">
      <div className="relative">
        <button type="button" className="block w-full overflow-hidden rounded-2xl bg-paper text-left" onClick={onOpen}>
          <Mark id={product.id} className="mx-auto h-32 w-32" />
        </button>
        {discount > 0 ? (
          <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-sale px-2 py-0.5 text-xs font-semibold text-paper">−{discount}%</span>
        ) : null}
        <button
          type="button"
          aria-label={fav ? "Tirar dos favoritos" : "Favoritar"}
          className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-paper"
          onClick={() => toggleFav(product.id)}
        >
          <Heart className={cn("size-4", fav ? "text-sale" : "text-moss")} weight={fav ? "fill" : "bold"} />
        </button>
      </div>
      <button type="button" className="mt-2 text-left" onClick={onOpen}>
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="text-xs text-moss">{product.unit}</p>
      </button>
      <div className="mt-2">
        {qty <= 0 ? (
          <div className="flex items-end justify-between gap-2">
            <div>
              {product.was ? <p className="text-xs text-moss line-through">{brl(product.was)}</p> : null}
              <p className="text-base font-semibold text-ink">{brl(product.price)}</p>
            </div>
            <button type="button" aria-label="Adicionar" className="grid size-11 place-items-center rounded-full bg-leaf text-paper active:scale-95" onClick={() => add(product.id)}>
              <Plus className="size-5" weight="bold" />
            </button>
          </div>
        ) : (
          <Stepper qty={qty} wide onSet={(n) => setQty(product.id, n)} />
        )}
      </div>
    </article>
  );
}

function Stepper({ qty, wide, onSet }: { qty: number; wide?: boolean; onSet: (n: number) => void }) {
  return (
    <div className={cn("flex h-11 items-center rounded-full bg-leaf text-paper", wide ? "w-full" : "")}>
      <button type="button" aria-label="Diminuir" className="grid size-11 place-items-center" onClick={() => onSet(qty - 1)}>
        {qty === 1 ? <Trash className="size-4" weight="bold" /> : <Minus className="size-4" weight="bold" />}
      </button>
      <span className={cn("text-center text-sm font-semibold tabular-nums", wide ? "flex-1" : "w-5")}>{qty}</span>
      <button type="button" aria-label="Aumentar" className="grid size-11 place-items-center" onClick={() => onSet(qty + 1)}>
        <Plus className="size-4" weight="bold" />
      </button>
    </div>
  );
}

function Cats() {
  const setCat = useCesta((s) => s.setCat);
  return (
    <div className="cesta-in">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Categorias</h1>
      <p className="mt-1 text-sm text-moss">Cinco bancas. Escolhe por onde começar.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {CATS.map((c) => {
          const sample = PRODUCTS.find((p) => p.cat === c.id)!;
          const n = PRODUCTS.filter((p) => p.cat === c.id).length;
          return (
            <button key={c.id} type="button" className="rounded-3xl bg-paper p-3 text-left" onClick={() => setCat(c.id)}>
              <span className="grid size-16 place-items-center overflow-hidden rounded-full bg-foam">
                <Mark id={sample.id} className="size-14" />
              </span>
              <p className="mt-3 text-base font-semibold text-ink">{c.label}</p>
              <p className="text-xs text-moss">{n} itens</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Favs({ onOpen }: { onOpen: (p: Product) => void }) {
  const favs = useCesta((s) => s.favs);
  const items = PRODUCTS.filter((p) => favs.includes(p.id));
  return (
    <div className="cesta-in">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Favoritos</h1>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-moss">O coração na foto guarda o que você compra sempre.</p>
      ) : (
        <div className="mt-4">
          <Grid products={items} onOpen={onOpen} />
        </div>
      )}
    </div>
  );
}

function Cart({ onOpen }: { onOpen: (p: Product) => void }) {
  const cart = useCesta((s) => s.cart);
  const clear = useCesta((s) => s.clear);
  const lines = PRODUCTS.filter((p) => (cart[p.id] ?? 0) > 0).map((p) => ({ p, qty: cart[p.id]! }));
  const sub = lines.reduce((n, l) => n + l.p.price * l.qty, 0);
  const fee = sub === 0 || sub >= FREE_FROM ? 0 : FEE;
  const left = Math.max(0, FREE_FROM - sub);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const suggest = PRODUCTS.filter((p) => !cart[p.id]).slice(0, 4);
  const pct = Math.min(100, Math.round((sub / FREE_FROM) * 100));

  return (
    <div className="cesta-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Sua cesta</h1>
          <p className="mt-1 text-sm text-moss">{lines.length === 0 ? "Ainda vazia." : `${count} itens · taxa ${fee === 0 ? "grátis" : brl(fee)}`}</p>
        </div>
        {lines.length > 0 ? (
          <button type="button" className="mt-2 text-sm font-medium text-leaf" onClick={clear}>
            Esvaziar
          </button>
        ) : null}
      </div>
      {lines.length === 0 ? (
        <button type="button" className="mt-6 h-12 rounded-full bg-leaf px-5 text-sm font-semibold text-paper" onClick={() => useCesta.getState().setTab("home")}>
          Ver a feira
        </button>
      ) : (
        <>
          <p className="mt-4 text-sm text-moss">{left === 0 ? "Entrega grátis nesta cesta." : `Mais ${brl(left)} e a entrega sai de graça.`}</p>
          <div className="mt-3 rounded-3xl bg-leaf p-4 text-paper">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span>{pct}%</span>
              <span>{left === 0 ? "Frete liberado" : `Faltam ${brl(left)}`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-paper/25">
              <div className="h-full rounded-full bg-paper" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-sm font-semibold">Cesta a partir de {brl(FREE_FROM)} não paga taxa.</p>
          </div>
          <ul className="mt-3 overflow-hidden rounded-3xl bg-paper">
            {lines.map(({ p, qty }, i) => (
              <li key={p.id} className={cn("flex items-center gap-3 px-3 py-3", i > 0 && "border-t border-mist")}>
                <button type="button" onClick={() => onOpen(p)} className="shrink-0 overflow-hidden rounded-2xl bg-foam">
                  <Mark id={p.id} className="size-14" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-moss">
                    {p.unit} · {brl(p.price)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{brl(p.price * qty)}</p>
                </div>
                <Stepper qty={qty} onSet={(n) => useCesta.getState().setQty(p.id, n)} />
              </li>
            ))}
          </ul>
          <h2 className="mt-6 text-lg font-semibold tracking-tight text-ink">Talvez entre também</h2>
          <div className="scroll-thin -mx-4 mt-3 flex gap-3 overflow-x-auto px-4">
            {suggest.map((p) => (
              <article key={p.id} className="w-36 shrink-0">
                <button type="button" className="block w-full overflow-hidden rounded-2xl bg-paper" onClick={() => onOpen(p)}>
                  <Mark id={p.id} className="mx-auto h-24 w-24" />
                </button>
                <p className="mt-2 truncate text-sm font-semibold text-ink">{p.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{brl(p.price)}</p>
                  <button type="button" aria-label={`Adicionar ${p.name}`} className="grid size-9 place-items-center rounded-full bg-leaf text-paper" onClick={() => useCesta.getState().add(p.id)}>
                    <Plus className="size-4" weight="bold" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Account() {
  const orders = useCesta((s) => s.orders);
  const addressId = useCesta((s) => s.addressId);
  const address = ADDRESSES.find((a) => a.id === addressId)!;
  const resetIntro = useCesta((s) => s.resetIntro);
  return (
    <div className="cesta-in">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Conta</h1>
      <p className="mt-1 text-sm text-moss">Pedidos ficam só neste aparelho.</p>
      <div className="mt-4 rounded-3xl bg-paper p-4">
        <p className="text-xs text-moss">Endereço padrão</p>
        <p className="mt-1 font-semibold text-ink">
          {address.title} · {address.line}
        </p>
        <p className="text-sm text-moss">{address.area}</p>
      </div>
      <h2 className="mt-6 mb-3 text-lg font-semibold text-ink">Pedidos</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-moss">Nenhum pedido ainda.</p>
      ) : (
        <ul className="overflow-hidden rounded-3xl bg-paper">
          {orders.map((o, i) => (
            <li key={o.id} className={cn("px-4 py-3", i > 0 && "border-t border-mist")}>
              <p className="text-sm font-semibold text-ink">
                {o.when === "hoje" ? "Hoje" : "Amanhã"} · {o.slot}
              </p>
              <p className="text-xs text-moss">
                {o.count} itens · {brl(o.total)} · {o.pay}
              </p>
            </li>
          ))}
        </ul>
      )}
      <button type="button" className="mt-6 text-sm font-medium text-leaf" onClick={resetIntro}>
        Ver a abertura de novo
      </button>
    </div>
  );
}

function ProductSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const qty = useCesta((s) => s.cart[product.id] ?? 0);
  const add = useCesta((s) => s.add);
  const setQty = useCesta((s) => s.setQty);
  return (
    <Sheet onClose={onClose}>
      <div className="overflow-hidden rounded-3xl bg-foam">
        <Mark id={product.id} className="mx-auto h-44 w-44" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">{product.name}</h2>
      <p className="text-sm text-moss">{product.unit}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink">{product.blurb}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {product.was ? <p className="text-xs text-moss line-through">{brl(product.was)}</p> : null}
          <p className="text-xl font-semibold text-ink">{brl(product.price)}</p>
        </div>
        {qty <= 0 ? (
          <button type="button" className="h-11 rounded-full bg-leaf px-5 text-sm font-semibold text-paper" onClick={() => add(product.id)}>
            Adicionar
          </button>
        ) : (
          <Stepper qty={qty} onSet={(n) => setQty(product.id, n)} />
        )}
      </div>
    </Sheet>
  );
}

function AddressSheet({ onClose }: { onClose: () => void }) {
  const addressId = useCesta((s) => s.addressId);
  const setAddress = useCesta((s) => s.setAddress);
  return (
    <Sheet onClose={onClose} title="Entregar em">
      <div className="flex flex-col gap-2">
        {ADDRESSES.map((a) => (
          <button
            key={a.id}
            type="button"
            className={cn("rounded-2xl px-4 py-3 text-left", addressId === a.id ? "bg-leaf text-paper" : "bg-foam text-ink")}
            onClick={() => {
              setAddress(a.id);
              onClose();
            }}
          >
            <p className="font-semibold">{a.title}</p>
            <p className={cn("text-sm", addressId === a.id ? "text-paper/80" : "text-moss")}>
              {a.line} · {a.area}
            </p>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function FilterSheet({ sort, onSort, onClose }: { sort: Sort; onSort: (s: Sort) => void; onClose: () => void }) {
  const cat = useCesta((s) => s.cat);
  const setCat = useCesta((s) => s.setCat);
  const sorts: { id: Sort; label: string }[] = [
    { id: "destaque", label: "Destaques" },
    { id: "preco", label: "Menor preço" },
    { id: "nome", label: "Nome" },
  ];
  return (
    <Sheet onClose={onClose} title="Filtrar a feira">
      <p className="text-xs font-medium text-moss">Ordem</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {sorts.map((s) => (
          <button key={s.id} type="button" className={cn("h-10 rounded-full px-4 text-sm font-medium", sort === s.id ? "bg-leaf text-paper" : "bg-foam text-ink")} onClick={() => onSort(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs font-medium text-moss">Banca</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={cn("h-10 rounded-full px-4 text-sm font-medium", cat === "todas" ? "bg-ink text-paper" : "bg-foam text-ink")} onClick={() => setCat("todas")}>
          Tudo
        </button>
        {CATS.map((c) => (
          <button key={c.id} type="button" className={cn("h-10 rounded-full px-4 text-sm font-medium", cat === c.id ? "bg-ink text-paper" : "bg-foam text-ink")} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <button type="button" className="mt-5 h-12 w-full rounded-full bg-leaf text-sm font-semibold text-paper" onClick={onClose}>
        Ver a feira
      </button>
    </Sheet>
  );
}

function Checkout({ onClose, onDone }: { onClose: () => void; onDone: (slot: string) => void }) {
  const cart = useCesta((s) => s.cart);
  const addressId = useCesta((s) => s.addressId);
  const setAddress = useCesta((s) => s.setAddress);
  const place = useCesta((s) => s.place);
  const [when, setWhen] = useState<"hoje" | "amanha">("hoje");
  const [slot, setSlot] = useState(SLOTS[0]!);
  const [pay, setPay] = useState<Pay>("dinheiro");
  const [note, setNote] = useState("");
  const lines = PRODUCTS.filter((p) => (cart[p.id] ?? 0) > 0);
  const sub = lines.reduce((n, p) => n + p.price * cart[p.id]!, 0);
  const fee = sub >= FREE_FROM ? 0 : FEE;
  const total = sub + fee;
  const count = lines.reduce((n, p) => n + cart[p.id]!, 0);
  const payLabel = pay === "dinheiro" ? "Dinheiro na entrega" : pay === "cartao" ? "Cartão na entrega" : "Pix";

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-foam">
      <header className="flex items-center gap-2 px-3 py-3">
        <button type="button" aria-label="Voltar" className="grid size-11 place-items-center rounded-full bg-paper text-ink" onClick={onClose}>
          <ArrowLeft className="size-5" weight="bold" />
        </button>
        <h2 className="flex-1 text-center text-base font-semibold text-ink">Confirmar pedido</h2>
        <span className="size-11" />
      </header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-28">
        <Block n="1" title="Entregar em">
          {ADDRESSES.map((a) => (
            <Choice
              key={a.id}
              active={addressId === a.id}
              onClick={() => setAddress(a.id as AddressId)}
              icon={<MapPin className="size-5" weight="fill" />}
              title={a.title}
              detail={`${a.line}, ${a.area}`}
            />
          ))}
        </Block>
        <Block n="2" title="Horário">
          <div className="mb-1 flex gap-2">
            {(["hoje", "amanha"] as const).map((w) => (
              <button key={w} type="button" className={cn("h-10 rounded-full px-4 text-sm font-semibold", when === w ? "bg-leaf text-paper" : "bg-paper text-ink")} onClick={() => setWhen(w)}>
                {w === "hoje" ? "Hoje" : "Amanhã"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SLOTS.map((s) => (
              <button key={s} type="button" className={cn("h-11 rounded-full text-sm font-medium", slot === s ? "bg-leaf text-paper" : "bg-paper text-ink")} onClick={() => setSlot(s)}>
                {s}
              </button>
            ))}
          </div>
        </Block>
        <Block n="3" title="Pagamento">
          <Choice active={pay === "dinheiro"} onClick={() => setPay("dinheiro")} icon={<Money className="size-5" weight="bold" />} title="Dinheiro na entrega" detail="Você paga quando a cesta chega." />
          <Choice active={pay === "cartao"} onClick={() => setPay("cartao")} icon={<CreditCard className="size-5" weight="bold" />} title="Cartão na entrega" detail="Máquina na porta. Débito ou crédito." />
          <Choice active={pay === "pix"} onClick={() => setPay("pix")} icon={<QrCode className="size-5" weight="bold" />} title="Pix" detail="A chave aparece depois que o pedido entra." />
        </Block>
        <Block n="4" title="Recado pro entregador">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Portão, interfone, deixar na portaria…"
            className="w-full resize-none rounded-2xl bg-paper px-4 py-3 text-sm text-ink outline-none placeholder:text-moss"
          />
        </Block>
        <Block n="5" title="Resumo">
          <div className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-3">
            <div className="flex">
              {lines.slice(0, 3).map((p, i) => (
                <span key={p.id} className={cn("overflow-hidden rounded-full bg-foam ring-2 ring-paper", i > 0 && "-ml-3")}>
                  <Mark id={p.id} className="size-10" />
                </span>
              ))}
            </div>
            <p className="text-sm font-medium text-ink">{count} {count === 1 ? "item" : "itens"}</p>
          </div>
        </Block>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-foam px-4 pt-2 pb-4">
        <button
          type="button"
          className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-leaf text-base font-semibold text-paper"
          onClick={() => {
            place({ total, slot, when, addressId, pay: note.trim() ? `${payLabel} · ${note.trim()}` : payLabel, count });
            onDone(`${when === "hoje" ? "Hoje" : "Amanhã"} · ${slot}`);
          }}
        >
          <span className="grid size-8 place-items-center rounded-full bg-paper/20">
            <ArrowRight className="size-4" weight="bold" />
          </span>
          Pedir agora · {brl(total)}
        </button>
      </div>
    </div>
  );
}

function Block({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="grid size-6 place-items-center rounded-full bg-leaf text-xs font-semibold text-paper">{n}</span>
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Choice({
  active,
  onClick,
  title,
  detail,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("flex items-center gap-3 rounded-2xl bg-paper px-3 py-3 text-left ring-1", active ? "ring-leaf" : "ring-mist")}>
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", active ? "bg-leaf text-paper" : "bg-foam text-leaf")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="block text-xs text-moss">{detail}</span>
      </span>
      <CheckCircle className={cn("size-6 shrink-0", active ? "text-leaf" : "text-mist")} weight={active ? "fill" : "bold"} />
    </button>
  );
}

function Done({ slot, onClose }: { slot: string; onClose: () => void }) {
  const addressId = useCesta((s) => s.addressId);
  const address = ADDRESSES.find((a) => a.id === addressId)!;
  return (
    <div className="absolute inset-0 z-50 grid place-items-end bg-leaf px-6 pb-12 text-paper">
      <div className="cesta-in w-full">
        <Basket className="mb-4 h-28 w-28" />
        <p className="text-4xl font-semibold tracking-tight">Pedido feito</p>
        <p className="mt-2 text-paper/85">
          {slot}
          <br />
          {address.line}, {address.area}
        </p>
        <button type="button" className="mt-8 h-12 rounded-full bg-paper px-6 text-sm font-semibold text-leaf" onClick={onClose}>
          Voltar pra feira
        </button>
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }: { title?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-ink/40" onClick={onClose}>
      <div className="cesta-sheet max-h-[88%] overflow-y-auto rounded-t-3xl bg-paper px-5 pt-3 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-mist" />
        <div className="mb-2 flex items-center justify-between">
          <p className="text-lg font-semibold text-ink">{title}</p>
          <button type="button" aria-label="Fechar" className="grid size-10 place-items-center rounded-full bg-foam" onClick={onClose}>
            <X className="size-4" weight="bold" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CartDock({ onCheckout, hidden }: { onCheckout: () => void; hidden: boolean }) {
  const cart = useCesta((s) => s.cart);
  const lines = PRODUCTS.filter((p) => (cart[p.id] ?? 0) > 0);
  if (hidden || lines.length === 0) return null;
  const sub = lines.reduce((n, p) => n + p.price * (cart[p.id] ?? 0), 0);
  const fee = sub >= FREE_FROM ? 0 : FEE;
  return (
    <div className="absolute inset-x-0 bottom-20 z-20 bg-foam px-4 pt-2 pb-2">
      <button type="button" className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-leaf text-base font-semibold text-paper" onClick={onCheckout}>
        <span className="grid size-8 place-items-center rounded-full bg-paper/20">
          <ArrowRight className="size-4" weight="bold" />
        </span>
        Fechar pedido · {brl(sub + fee)}
      </button>
    </div>
  );
}

function TabBar() {
  const tab = useCesta((s) => s.tab);
  const setTab = useCesta((s) => s.setTab);
  const count = useCesta((s) => Object.values(s.cart).reduce((n, q) => n + q, 0));
  const items: { id: Tab; label: string; icon: typeof House }[] = [
    { id: "home", label: "Início", icon: House },
    { id: "cats", label: "Categorias", icon: SquaresFour },
    { id: "favs", label: "Favoritos", icon: Heart },
    { id: "cart", label: "Cesta", icon: ShoppingBag },
    { id: "account", label: "Conta", icon: User },
  ];
  return (
    <nav className="absolute inset-x-3 bottom-3 z-30">
      <div className="grid h-16 grid-cols-5 rounded-full bg-paper ring-1 ring-mist">
        {items.map((item) => {
          const active = tab === item.id;
          return (
            <button key={item.id} type="button" aria-label={item.label} className="grid place-items-center" onClick={() => setTab(item.id)}>
              <span className={cn("relative grid size-11 place-items-center rounded-full", active && "bg-mist")}>
                <item.icon className={cn("size-6", active ? "text-leaf" : "text-moss")} weight={active ? "fill" : "bold"} />
                {item.id === "cart" && count > 0 ? (
                  <span className="absolute top-1 right-0 grid min-w-4 place-items-center rounded-full bg-sale px-1 text-xs font-semibold text-paper">{count}</span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
