# Repaginação visual — sugestões (backlog)

Estado: **backlog visual** (jul 2026). **Nada aplicado.** Este ficheiro só regista sugestões de
melhoria gráfica levantadas numa auditoria de UI, para serem aplicadas **quando o curador decidir** —
nunca misturar com PRs funcionais (ver §5).

Relacionado: [01_readme.md](01_readme.md), [02_arquitetura.md](02_arquitetura.md).

---

## 1. Método

Auditoria feita sobre `web/` (Next 15, Tailwind 3, sem component library nem icon library). O site é
consistente na estrutura (server `page.tsx` fino → componente client), mas cada página costura o seu
próprio layout. As sugestões abaixo priorizam **unificação** e **quick wins** sem redesenho de identidade.

Como priorizar: começar pelos primitivos partilhados (§2.1) — resolvem repetição em cascata; depois
tokens (§2.3); só então polir páginas específicas (§3).

---

## 2. Sugestões globais

### 2.1 Extrair primitivos partilhados
Hoje não existem `Container` / `PageHeader` / `Card` / `Button`. Copy-paste espalhado:
- **Header de página** (kicker `text-xs uppercase tracking-widest text-ink/35` + `h1 font-display text-2xl sm:text-3xl md:text-4xl`) repetido em `StudyModeIndex`, `BlockStudyPage`, `DialoguesIndexContent`, `VisualsView`, `Tutor`.
- **Cards** (`rounded-2xl/xl border p-5/6` + `borderColor:var(--border)`) sem primitivo.
→ Extrair um `<PageHeader kicker title />` e um `<Card />` mata a maior parte da duplicação.

### 2.2 Família `sans` no tema
`style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}` aparece **~40+ vezes** inline para
sobrepor o corpo serif (Newsreader) em UI/labels. Adicionar `fontFamily.sans` ao `tailwind.config.ts`
e trocar por `font-sans` (ou definir no `globals.css`).

### 2.3 Tokens de cor
- `--border` **não** tem alias no Tailwind → uso misto `border-ink/10` (0.10) vs inline `var(--border)` (0.12). Alinhar num só.
- `--bg` é referenciado (`DialoguesIndexContent` no `<select>`) mas **nunca definido** — **bug latente**, definir ou remover.
- Cores hardcoded fora do token set: `#b45309`, `#7c3aed`, `#15803d`, `#b91c1c`, etc. (cards da home, badges). Tokenizar.

### 2.4 Larguras de container
Inconsistentes: nav `max-w-5xl`, footer `max-w-6xl`, conteúdo varia `2xl–5xl` (block-study/tutor/randomhanzi `3xl`, phrase-game `2xl`, home/visuals `5xl`). `QuizGame` **troca** de largura entre pergunta (`3xl`) e resultado (`2xl`). Unificar com o `Container` de §2.1.

### 2.5 Ritmo vertical
Padding de topo varia: maioria `pt-8 sm:pt-10`, home `py-10 sm:py-16 md:py-20`, phrase-game `pt-6`, quiz `py-8 sm:py-10`. Padronizar.

### 2.6 Navegação
Colapsa para hambúrguer só **abaixo de `lg`** — tarde para 8+ abas (agora 10 com as do curador). Rever breakpoint / agrupar.

### 2.7 Ícones e fontes
- Ícones são glifos de texto (`☰ ✕ ▾ →`) + **Material Symbols** webfont só no phrase-game. Escolher uma estratégia única (ex. um set de ícones SVG inline).
- Fontes carregadas por `@import`/`<link>` (Newsreader, Noto Sans SC, "Hanzi Pinyin"). Migrar para `next/font` (evita FOUT, melhora LCP).

### 2.8 Dark mode
Não existe. Avaliar se desejado (tokens já em CSS vars facilitam).

---

## 3. Sugestões por página

| Página | Nota |
|--------|------|
| **home** (`HomeContent`) | 9 cards com `color` hardcoded (6 hex soltos). Tokenizar; considerar dashboard vs hero. |
| **review / vocabulary / grammar** | Consistentes (`StudyModeIndex` + `BlockIndex`). Bom modelo a seguir. |
| **dialogues** | `<select>` cru (`rounded border px-3 py-2`) destoa; usa `--bg` indefinido. |
| **visuals** | Página mais mobile-aware (orientação/`screen.orientation.lock`). Reaproveitar o padrão. |
| **tutor** | É `"use client"` direto, **sem `metadata`** (título default). Cores `text-red-500/amber` fora do token set. |
| **randomhanzi** | Tem `<footer>` próprio (AppFooter suprimido); h1 sem o passo `md:text-4xl`. Reconciliar. |
| **phrase-game** | Header sem kicker + `max-w-2xl` — visualmente distinto do resto. Mini design-system próprio (Material Symbols, dnd-kit). |
| **gamification/quiz** | Troca de largura entre estados (§2.4). Confirmar se `components/gamification/GamificationHub.tsx` está **morto** (rota renderiza `QuizGame`) e remover. |
| **registerClass / reviewClass** (novas) | Reaproveitar os primitivos de §2.1 quando existirem (hoje usam classes/tokens inline coerentes com o resto). |

---

## 4. Quick wins × redesigns

| Esforço | Impacto | Item |
|---------|---------|------|
| Baixo | Alto | Definir/remover `--bg`; alias `border`; família `sans` (§2.2/2.3) |
| Baixo | Médio | `metadata` no tutor; unificar padding vertical |
| Médio | Alto | Primitivos `Container`/`PageHeader`/`Card` (§2.1) |
| Médio | Médio | Unificar larguras; breakpoint do nav |
| Alto | Médio | `next/font`; estratégia única de ícones; dark mode |

---

## 5. Regras

- **Nunca** juntar mudança visual a PR funcional — este backlog é separado por decisão do curador.
- Manter identidade actual (paleta `--paper`/`--ink`/`--accent`, serif Newsreader + Noto Sans SC) salvo decisão explícita.
- Portas, i18n e OAuth **não** são temas deste ficheiro.

*Última revisão: jul 2026*
