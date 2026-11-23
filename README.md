# Minhas Finanças

Dashboard financeiro pessoal. Patrimônio, fluxo, limites, metas e relatórios. Os números ficam neste aparelho.

## Por quê

| | |
| --- | --- |
| Sem conta | O livro fica no navegador |
| Mês | Entradas, saídas e o que ainda vai cair |
| Limites e metas | Teto por classe e o quanto já juntou |

## Stack

- React 19, TanStack Start, Vite, TypeScript
- Tailwind CSS 4
- Zustand e localStorage
- Recharts
- Phosphor Icons

## Estrutura

```text
src/components/soldo   interface
src/lib/finance        livro, cálculos e exemplo
src/routes             página
public                 ícone
```

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:8080`.

```bash
npm run typecheck
npm run build
```

© 2026 Gabriel Teramae Chan
