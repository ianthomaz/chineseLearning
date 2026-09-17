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

**Dois eixos, dois controlos — não misturar:**

| Controlo | Escolhe |
|---|---|
| Dropdown "Knowledge" | **que vocabulário** entra na rodada (HSK 1 … HSK 3) |
| Presets | **que configuração** se joga |

Um preset é só isso: uma **selecção de configuração** que o jogador podia ter
montado à mão em "Customise". Não mexe no vocabulário, e **não bloqueia nada**.

| | Dificuldade | Peças | Dicas ligadas |
|---|---|---|---|
| 超 Super easy | 1 — frases curtas | palavras inteiras | frase + pinyin em todas + tradução nas difíceis |
| 易 Easy | 2 — até ~5 palavras | palavras inteiras | frase + pinyin em todas |
| 练 Practise | 3 — frases longas | palavras inteiras | frase |
| 战 Challenge | 4 — frases longas | partidas em caracteres | nenhuma, + peças a mais |

**Dificuldade e dicas são independentes.** Até set 2026 o nível *apagava* as
dicas (`clampDisplaySettingsForLevel`): sem pinyin acima do nível 1, sem tradução
acima do 2. Isso tornava impossível pedir "frases mais longas, mas mantém o
pinyin" — que é exactamente o que o preset **Easy** é. Já não há esse
bloqueio: qualquer dica funciona em qualquer nível, e as checkboxes nunca
aparecem cinzentas.

Abrir "Customise" depois de escolher um preset mostra o que ele marcou; montar à
mão a mesma combinação volta a acender o preset (`matchPreset`).

O vocabulário escolhido define o **tecto**: HSK 1 não tem frases longas o
suficiente para os níveis 3+, por isso `applyPreset()` limita o nível ao que o
pool permite — "Challenge" com HSK 1 é a rodada mais difícil que HSK 1 consegue
produzir. Esse limite vive num só sítio, `maxLevelForPool()`.

**Copy:** um rótulo descreve só a variável do seu próprio controlo, e não se
acrescenta linha de ajuda a repetir o que o controlo já diz. Ver
[`CLAUDE.md`](../CLAUDE.md) § Copy.

### Por fazer — palavras que nunca se partem

Níveis 1–3 mantêm as palavras inteiras, por isso 跑步 chega como uma peça só nos
presets fáceis. A partir do nível 4 `pieces.ts` parte palavras de vários
caracteres sem saber quais formam uma unidade indivisível. Marcar essas palavras
no banco (`FRASES_GAME/curated/`) e respeitá-las em `pickPartialSplitTargets()`
é curadoria de dados, ainda por fazer.

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

**Persistência (set 2026):** uma rodada terminada vai para `POST /api/game/round`
e alimenta duas tabelas — `game_rounds` (histórico) e `progress` (domínio por
item). Só para quem tem sessão; convidado continua só com o log `events`.
O servidor **recalcula** os pontos a partir dos resultados por item: o cliente
diz se acertou, não diz quanto vale. Ver [07_conteudo_dados.md](07_conteudo_dados.md)
§ Progresso do jogador.

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
| Persistir progresso por user | ✅ (frases **e** quiz) |
| Histórico + "a rever" no setup | ✅ `PlayerProgressCard` |
| Remover banner protótipo | ✅ — substituído por estado real |
| Repetir frases erradas numa rodada | ❌ — `itemsToReview()` já devolve a fila, falta usá-la em `buildRound` |
| Preset "continuar de onde parei" | ❌ |
| Curadoria `respostasAceitas` | ❌ — 35 de 1067 |
| Tom colorido no pinyin | ❌ |

*Última revisão: set 2026*
