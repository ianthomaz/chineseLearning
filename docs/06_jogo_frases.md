# Jogo de frases (`/phrase-game`)

Estado: **MVP completo** (616 frases, tiers, pontuação visível, auth opcional).

Código: `web/src/components/phrase-game/` · `web/src/lib/phrase-game/` · README do módulo no mesmo folder.

---

## Banco e build

- **Fonte:** `FRASES_GAME/curated/` (não editar `phrases.json` à mão)
- **Build:** `cd web && npm run prebuild:phrase-game`
- **Servir:** `GET /api/phrase-game/bank` (fetch em background no cliente)
- **Tiers:** Iniciante (HSK1) · Básico (completo)
- **Níveis 1–5:** peças, distratores, mix ponderado (`select-phrases.ts`)

Auth: [05_autenticacao.md](05_autenticacao.md)

---

## UX — presets (não o setup antigo)

Três botões em [`presets.ts`](../web/src/lib/phrase-game/presets.ts):

| | Vocabulário | Dificuldade | Ajudas |
|---|---|---|---|
| 始 Começar | HSK1 | 1 | pinyin + frase à vista |
| 练 Treinar | completo | 2 | tradução nas difíceis |
| 战 Desafio | completo | 4 | nenhuma |

"Personalizar" fica num `<details>` fechado. Tiers Intermediário/Avançado = texto, não botões mortos.

### Língua e cores

- UI pt-BR / EN / ES — chaves nas três (`web/src/messages/`)
- Texto sobre `--cat-*` usa **`--on-category`**, nunca `text-white`

---

## Pontuação

Implementada em [`scoring.ts`](../web/src/lib/phrase-game/scoring.ts) — visível no fim da rodada.

**Por frase [0,1]:** base (acerto 1ª = 1,0 · retry = 0,7 · erro = fracção posições) × multiplicador de ajuda.

| Ajuda | × |
|---|---:|
| Ouvir · remover extras | 1,00 |
| Mostrar frase / pinyin | 0,75 |
| Tradução | 0,50 |
| Próxima peça | 0,25 |

**Rodada:** soma até 10 frases. Evento `round_complete` guarda `"7/10 · 6.25pts"`.

**Fase 2:** persistir em `progress` (schema existe, não escrito).

---

## Ordens alternativas (`respostasAceitas`)

Chinês aceita reordenações válidas. Alternativas = **reordenação das peças do tabuleiro** (não alterar caracteres).

Pipeline LLM + revisão humana — **557 frases** ainda com uma só ordem:

```bash
cd web
node scripts/propose-accepted-orders.mjs    # gera propostas
node scripts/apply-accepted-orders.mjs      # aplica revisadas
```

Validação: `web/scripts/accepted-orders-lib.mjs` (build falha se inválido).

Curadoria: `FRASES_GAME/curated/pending-accepted-orders.json`

---

## Backoffice

`/backoffice` — admin only, server mode.

- KPIs, funnel, frases mais erradas
- SQLite `events` — ver [05_autenticacao.md](05_autenticacao.md)
- Cliente: `game-log.ts` → `POST /api/game/events` (gate consent para `anonId`)

---

## Backlog (prioridade)

| Item | Estado |
|------|--------|
| TTS / SpeakButton | ✅ |
| Pontuação UI | ✅ |
| Persistir progresso por user | ❌ Fase 2 |
| Repetir frases erradas | ❌ |
| Preset "continuar" | ❌ |
| Curadoria `respostasAceitas` (557) | ❌ |
| Tom colorido no pinyin | ❌ |
| Remover banner protótipo | ❌ (depende persistência) |

*Última revisão: set 2026*
