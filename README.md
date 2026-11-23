# Minhas Finanças — dashboard financeiro pessoal

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

Livro-caixa neste aparelho: patrimônio, fluxo, limites, metas e relatórios. Os lançamentos ficam em `localStorage`. Os números sobem e descem quando o mês muda.

## Stack

- React 19, TanStack Start, Vite e TypeScript
- Tailwind CSS 4
- Zustand, com o livro em `localStorage`
- Recharts e Phosphor Icons

## Estrutura

```
src/components/soldo/
src/lib/finance/
src/routes/
src/styles.css
public/favicon.svg
package.json
```

## Como rodar

```bash
git clone https://github.com/gabrielteramae/minhas-financas.git
cd minhas-financas
npm install
npm run dev
```

Abre em `http://localhost:8080`.

---

© 2026 Gabriel Teramae Chan
