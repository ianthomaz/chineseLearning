# Jogo de frases — estado actual

Estado: **MVP implementado** (jun 2026). Rota **`/aulaChines/phrase-game`**.

O plano antigo (phrase-bank em `Content/`, integração no `GamificationHub`, lote LLM automático) **não foi seguido** — foi substituído pela implementação abaixo. Mantém-se este ficheiro como mapa do que existe hoje.

---

## O que está feito

| Peça | Onde |
|------|------|
| Jogo drag-and-drop | `web/src/components/phrase-game/` |
| Lógica pura | `web/src/lib/phrase-game/` |
| Banco curado (596 frases) | `FRASES_GAME/curated/` → build → `web/src/data/phrase-game/phrases.json` |
| Validador + pinyin no build | `web/scripts/build-phrase-game-data.mjs` |
| Tiers **Iniciante** (HSK1) e **Básico** (banco completo) | `SetupScreen.tsx`, `select-phrases.ts` |
| Níveis 1–5 (peças, split, distratores) | `pieces.ts`, `settings-by-level.ts` |
| Mix ponderado por tamanho (níveis 3–5 incluem frases curtas) | `select-phrases.ts` (`ROUND_MIX_WEIGHTS`) |
| Revisão de erros no fim da rodada | `PhraseGame.tsx` (`RoundComplete`) |
| Auth Google + One Tap + nick | `AuthPanel.tsx`, `docs/09_google_auth_jogo.md` |
| Pontuação ponderada (sem UI) | `scoring.ts`, `docs/phrase-game-scoring.md` |
| Backlog de melhorias | `docs/phrase-game-upgrades.md` |

## Banco de frases

- **Fonte:** `FRASES_GAME/curated/phrases.json` + `expansion-01` … `expansion-07` (merge no build).
- **Tags:** temas gerais (`tema:cores`, `tema:lugares`, …) — não agrupar por PDF/fonte.
- **Tiers de vocabulário:** `hsk1` (247) | `basico` (349) — total 596.
- **Rebuild:** `cd web && npm run prebuild:phrase-game` (corre também no `predev`).

Ficheiros legados em `FRASES_GAME/Nivel*` e `all-phrases.json` **não alimentam o jogo**; o pipeline activo é só `curated/` + build script.

## Regras de jogo (resumo)

- **Iniciante:** só frases `tier: hsk1`; níveis de dificuldade **1–2** na UI (3–5 ocultos).
- **Básico:** todas as frases; níveis **1–5**.
- **Nível 1:** só frases curtas (≤3 tokens).
- **Nível 2:** mix 25% curtas / 75% médias (≤5 tokens); tradução nas palavras difíceis permitida.
- **Níveis 3–5:** mix ponderado (majoritariamente frases longas; ~10–15% curtas para variar).
- Máximo **2** distratores por frase, em qualquer configuração.

Detalhe de implementação histórico: [10_phrase_game_implementation_prompt.md](10_phrase_game_implementation_prompt.md) (spec MVP; parcialmente desactualizada — preferir este ficheiro e o README em `web/src/components/phrase-game/`).

## Por fazer (Fase 2)

Ver [phrase-game-upgrades.md](phrase-game-upgrades.md) e [09_google_auth_jogo.md](09_google_auth_jogo.md):

- Persistir pontuação / histórico server-side (SQLite stub existe).
- UI de score, streak, leaderboard.
- Tiers Intermediário / Avançado (conteúdo HSK2+).
- Qualidade contínua do banco (glosses, `respostasAceitas`, prata/银色, etc.).

## Auth e progresso

Convidado joga sem login. Com OAuth (modo servidor): Google One Tap + redirect; nick em SQLite. Ver [09_google_auth_jogo.md](09_google_auth_jogo.md).
