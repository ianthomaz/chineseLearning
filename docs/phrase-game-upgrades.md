# Phrase Game — Upgrade Roadmap

Backlog para o **Quebra-Cabeça de Frases** (`/aulaChines/phrase-game`).
Actualizado jun 2026 após banco de **596 frases**, tiers Iniciante/Básico, mix ponderado
por tamanho, e revisão de erros no fim da rodada.

Cada item: **impacto**, **esforço**, **ficheiros**. Ordem = melhor valor primeiro dentro de cada secção.

---

## Estado actual (baseline)

| Área | Situação |
|------|----------|
| Banco | 596 frases em `FRASES_GAME/curated/` (7 expansions + núcleo) |
| Build | `build-phrase-game-data.mjs` — schema, pinyin, max 2 distratores |
| Tiers UI | Iniciante (HSK1) + Básico (completo); Intermediário/Avançado desactivados |
| Selecção | `weightedSample` — níveis altos misturam frases curtas (~10–15% no L5) |
| Setup | Níveis 3–5 ocultos no Iniciante; sem contadores de pool na UI |
| Fim de rodada | Lista de frases erradas (hanzi + pinyin + tradução) |
| Score | `computeScore` implementado; **sem UI** |
| Auth | Google OAuth + One Tap; nick; progresso **não** persistido |
| Banner | Ainda mostra aviso “protótipo” |

---

## A. Quick wins (alto impacto, baixo esforço)

1. **Audio playback (TTS).** Web Speech API (`speechSynthesis`, `lang="zh-CN"`).
   Botão no painel de resultado + opcional auto-play ao acertar.
   _Impacto: alto · Esforço: ~1h · `GameplayScreen.tsx`._

2. **Tom colorido no pinyin.** `pinyin-pro` no build → `tone: 1..5` por carácter;
   colorir em `PieceCard.tsx` (pedagogia standard).
   _Impacto: alto · Esforço: ~1.5h · `build-phrase-game-data.mjs`, `PieceCard.tsx`._

3. **Feedback a11y.** `aria-live="polite"` no painel correcto/errado.
   _Impacto: médio · Esforço: 15m · `GameplayScreen.tsx`._

4. **Mostrar tentativa errada na revisão.** Guardar `attempt` por frase em `results`
   (além de correct/wrong) e exibir ao lado da resposta certa no `RoundComplete`.
   _Impacto: alto · Esforço: ~1h · `PhraseGame.tsx`, `GameplayScreen.tsx`._

---

## B. Médio (alto impacto, esforço moderado)

5. **Persistir progresso (activar stub SQLite).** POST em submit com
   `user_id, phrase_id, score, created_at` via `/api/game/progress`;
   mostrar “última rodada” no setup. Reutilizar `scoring.ts::computeScore`.
   _Impacto: alto · Esforço: ~3h · `server/db/`, route, `AuthPanel`._

6. **Score, streak e XP na UI.** Superfície pontos por frase (ajustados por ajuda),
   total da rodada, sequência. Ligação futura a `/gamification`.
   _Impacto: alto · Esforço: ~2–3h · `GameplayScreen`, `RoundComplete`, `scoring.ts`._

7. **Repetição orientada a erros (SRS-lite).** Re-enfileirar frases erradas no fim da
   rodada e/ou peso maior em `buildRound` para ids recentemente falhados (localStorage ou SQLite).
   _Impacto: alto · Esforço: ~3h · `select-phrases.ts`, store cliente/servidor._

8. **Filtro por tema (opcional).** Tags `tema:cores`, `tema:transporte-direcoes`, etc. já
   existem no JSON — expor multi-select no setup para rodadas temáticas.
   _Impacto: médio · Esforço: ~2h · `SetupScreen`, `select-phrases.ts`._

---

## C. Fase 2 (maior)

9. **Leaderboard.** `GET /api/game/leaderboard` + painel simples (nick + score acumulado).
   _Esforço: ~4h._

10. **Tiers Intermediário / Avançado.** Conteúdo HSK2+ no banco + desbloquear botões em
    `SetupScreen`. _Esforço: limitado pelo conteúdo._

11. **Integração gamification.** Resultados da rodada no hub `/gamification` (meta diária, badges).
    _Esforço: ~3h._

12. **Modo “só frases novas”.** Trackear ids já vistas/acertadas por utilizador.
    _Esforço: ~2h · depende de (5)._

---

## D. Qualidade de dados

13. **Validação estrita de distratores.** Falhar o build se distraitor = token da resposta
    ou forma frase alternativa válida (hoje: WARN em colisões triviais).
    _Impacto: alto · Esforço: ~2h · `build-phrase-game-data.mjs`._

14. **`respostasAceitas`.** Variantes de ordem válidas (tempo, colocação de 了, sujeito/objeto
    permutável) para não marcar correcto como errado. _Esforço: curadoria + flag no validador._

    **Reportado jun 2026 (não corrigir ainda):** `pg-559` — peças `他 给 太太 一只 很小的 狗`.
    Canónica: `太太给他一只很小的狗`. User montou ordem alternativa válida (ex. `他给太太一只很小的狗`);
    jogo mostrou “Quase!” com uma só resposta certa. Código já suporta `respostasAceitas[]`
    em `validate.ts` — falta popular no banco + UI mostrar variantes aceites na revisão.
    Revisão mais ampla do **vocabulário** fica para depois.

15. **Passagem de glosses.** ~centenas de tokens com `words[].pt` fraco ou = hanzi;
    priorizar partículas e compostos do lote `expansion-05-temas-gerais`.
    _Esforço: contínuo · `FRASES_GAME/curated/`._

16. **Lacunas temáticas.** Ex.: 银色 (prata); mais frases **iniciante** com cor+objecto
    e transporte (hoje concentradas em `basico`). _Esforço: conteúdo._

17. **Auditoria periódica.** Script de relatório: duplicados hanzi, 1-token, bandas vazias
    por tier/nível, distribuição de tags. _Esforço: ~1h · script em `web/scripts/`._

---

## E. Polish e dev UX

18. **Mobile drag.** Alvos de toque maiores ou tap-two-pieces-to-swap. `Board.tsx`.

19. **`prefers-reduced-motion`** nas transições dnd. `Board.tsx`.

20. **Remover banner protótipo** quando score + persistência estiverem estáveis.
    `PhraseGame.tsx`, i18n `prototypeNotice`.

21. **FedCM / One Tap em dev.** `GoogleOneTap.tsx` já usa `use_fedcm_for_prompt: false`
    em localhost; documentar `NEXT_PUBLIC_GSI_USE_FEDCM` em `09_google_auth_jogo.md`.

22. **Evitar hydration mismatch.** Contadores de pool foram **removidos** da UI;
    preferir não reintroduzir texto dinâmico no SSR do setup sem `mounted` gate.

---

## Concluído recentemente

| Item | Notas |
|------|--------|
| Banco 596 frases + tags temáticas | `expansion-01` … `07` |
| Tier Básico activo (níveis 1–5) | Todo o banco jogável |
| Mix ponderado L3–L5 | Frases curtas podem aparecer em níveis altos |
| Revisão de erros (fim de rodada) | Hanzi + pinyin + PT/EN/ES — falta tentativa do user |
| Níveis 3–5 ocultos no Iniciante | Em vez de disabled + aviso |
| Tradução difícil no nível 2 | `settings-by-level.ts` |
| One Tap + validação JWT | `verify-google-id-token.ts` |

---

## Sprint sugerido (~1 dia)

**1 (TTS)** + **4 (tentativa na revisão)** + **3 (a11y)** + **5 (persistir progresso)** —
fecha o loop aprendizagem com feedback rico, sobre infra já existente.
