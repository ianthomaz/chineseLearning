# Plano — base de frases + jogo de montar frases

Estado: rascunho (jun 2026). Feature principal: **jogo de montar frases** com palavras já existentes. Pré-requisitos: reorganizar vocabulário/frases e absorver lote LLM (200–300) + PDFs novos.

---

## Situação actual (revisto)

| Camada | Onde | Gap |
|--------|------|-----|
| Site (blocos) | `Content/consolidado_final.md` → `consolidado.json` | Estruturas por bloco; não é banco de jogo |
| Review | `Content/review_extras.md` | Frases + glosses; lógica especial bloco 15 |
| RAG | `rag_knowledge/*.md` | Temático; duplica consolidado; não alimenta jogo |
| PDFs | `web/pdf-content/*.pdf` → manifest | Só download; **sem extracção de palavras** |
| Gamificação | `hsk1-quiz-bank.json` | Já tem tipo `ordering` (palavras + ordem); poucas perguntas |
| LLM | `/edu/chat`, ingest `chinese_learning` | Tutor activo; **sem pipeline de import em massa** |

**Project_id RAG `chinese_learning`:** registado, isolado — OK para batch LLM + RAG futuro.

---

## Fase 0 — Esquema da base (antes dos PDFs e do lote LLM)

**Objectivo:** uma fonte canónica de **frases jogáveis** + **léxico** com prioridade.

Proposta de ficheiros (nomes a confirmar contigo):

```
Content/
  phrase-bank/           # novo — frases normalizadas para o jogo
    manifest.json          # metadados, tiers, origem
    core.json              # frases dos blocos (derivado ou sync do consolidado)
    review-priority.json   # PDF revisão “palavras mais importantes” (manual ou extract)
    llm-batch-*.json       # lotes vindos do LLM (append-only até merge)

web/src/data/
  phrase-bank.json         # gerado no prebuild (merge + validação)
  lexicon-priority.json    # palavras-chave + tier (core | review | block-N | pdf-X)
```

Campos mínimos por frase: `id`, `hanzi`, `pinyin`, `translation.{pt,en,es}`, `source` (`block|review|llm|pdf`), `tier`, `block?`, `word_ids[]` (tokens para o jogo).

**Entregável:** script `build-phrase-bank.mjs` + schema TypeScript em `web/src/lib/phrase-bank/`.

---

## Fase 1 — PDFs novos (aula + revisão)

1. Colocar PDFs em `web/pdf-content/` (fluxo actual: `sync-pdf-downloads.sh` + manifest).
2. Marcar PDF de revisão prioritário em `vocabulary-pdf-descriptions.json` (flag `priority: true` ou id fixo acordado).
3. **Extracção:** decidir manual (tabela markdown) vs semi-auto (script/OCR futuro) — primeira versão: **tu colas lista prioritária** → `review-priority.json`.
4. Ligar palavras prioritárias às frases do banco (filtro do jogo “modo revisão”).

**Entregável:** PDFs no site + ficheiro de palavras prioritárias consumível pelo jogo.

---

## Fase 2 — Lote LLM 200–300 frases

Pipeline (não expor ao utilizador final):

1. Pedido em **blocos** (ex. 20–30 por chamada) — evita timeout e facilita revisão.
2. Prompt + resposta alinhada a `reply_structured` ou JSON fixo (hanzi, pinyin, pt).
3. Gravar em `Content/phrase-bank/llm-batch-NN.json`; revisão humana; merge para `phrase-bank.json`.
4. Opcional: re-ingest RAG só se quiser `/ask` sobre o material novo.

**Entregável:** script `import-llm-phrases.mjs` (curl → validar → batch file) + checklist de merge.

---

## Fase 3 — Jogo “montar frases”

Reutilizar padrões existentes:

- Tipos em `web/src/lib/gamification/types.ts` — **`ordering`** já define `words_*` + `correct_order_*`.
- UI: novo modo em `GamificationHub` ou rota dedicada (ex. `/games/phrase-builder`).
- Mecânica: dado um conjunto de tokens (hanzi ou pinyin+glosa), utilizador ordena até formar a frase-alvo; validação contra `phrase-bank`.
- Modos: por bloco, **só palavras prioritárias (revisão)**, aleatório HSK1.

**Entregável:** componente `PhraseBuilderGame.tsx`, banco alimentado por `phrase-bank.json`, i18n PT/EN/ES.

**Utilizador e memória:** login Google (OAuth **ChineseSite**) para persistir histórico server-side — ver [09_google_auth_jogo.md](09_google_auth_jogo.md). Convidado continua a jogar só com `localStorage`.

---

## Fase 4 — Documentação mínima (connectLLM + docs)

- `docs/05_rag_e_conteudo.md` — acrescentar secção “import em massa de frases”.
- `connectLLM/` — one-pager: batch LLM + `project_id` (sem misturar com `/edu/vocabulary` até precisarmos).

---

## Ordem de execução recomendada

1. Fase 0 (schema + build script) — **bloqueia tudo**
2. Fase 1 (PDFs + lista prioritária manual) — quando trouxeres os ficheiros
3. Fase 2 (lote LLM) — em paralelo ou logo a seguir à lista prioritária
4. Fase 3 (jogo) — MVP com subset do banco; expandir com merges
5. Fase 4 — doc enquanto implementamos

---

## Próximo passo contigo

Quando trouxeres os PDFs e o briefing do jogo: confirmar **nomes das pastas/ficheiros** (regra do projeto) e se o modo revisão usa **só hanzi** ou **hanzi + pinyin** nos tiles.
