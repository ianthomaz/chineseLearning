# Avaliação iOS + Web — nov 2026

Revisão económica (8 nov 2026) do app iOS (`appMobile/ios`) e do site (`web/`).
Android fora de âmbito: não revisto; nenhum gap anotado além de "não olhei".

Effort: **S** < meia jornada · **M** 1–2 dias · **L** 3+ dias.
Recomendação: **fazer** · **adiar** · **ignorar**.

---

## 1. O que foi verificado (e passou)

| Área | Verificação | Resultado |
|------|-------------|-----------|
| Web | `npx tsc --noEmit` | limpo |
| Web | `npx eslint src` | limpo |
| Web | Paridade de chaves `en`/`pt`/`es` em `web/src/messages/` | 0 chaves em falta / a mais |
| Web | `force-dynamic` em `route.ts` simples (parte o export estático) | nenhum; todas as rotas com servidor usam `route.server.ts` |
| Web | `text-white` sobre fundo `--cat-*` | nenhum |
| Web | Clearance NOIA no código cliente | nenhum; `accountPayload` só devolve `released` |
| Web | Caminho convidado do jogo de frases | `usePhraseBank` tenta `/api/phrase-game/bank` e cai para `/data/phrase-game-bank.json`, sem sessão |
| iOS | Clearance NOIA | só no teste que garante que **não** aparece (`HanziMemorizeTests/AccountTests.swift`) |
| iOS | `try!` / `as!` / `fatalError` | 1 `fatalError`, só no container SwiftData em memória (último recurso) |
| iOS | Catálogo de strings reprodutível pelo script | sim (diff vazio antes das adições) |

Não corrido (custo): `next build`, `npm run build:webplace`, `swift test`
(não há toolchain Swift neste ambiente), teste a 390 px. As alterações feitas
são strings/JSON; nenhuma toca rotas, build ou layout.

## 2. Feito nesta rodada (commitado)

1. **iOS — 8 strings fora do catálogo de traduções** (apareciam sempre em
   português em en/es): `Vocabulário vazio`, `O vocabulário ainda não foi
   carregado.`, `Todo o vocabulário vira um baralho…` (o código mudou
   "léxico"→"vocabulário" sem atualizar o script), `Frase anterior`,
   `Próxima frase`, `Entrar com Alipay`, `Próximo hanzi` e a descrição do
   App Intent. Paths: `appMobile/ios/Scripts/build-strings-catalog.py`,
   `appMobile/ios/LearnChineseToday/Localizable.xcstrings` (regenerado).
2. **Web — pt-PT em pt.json**: `gameProgress.guest` dizia "guardar" → "salvar".
   Path: `web/src/messages/pt.json`.

## 3. Riscos / dívida por área — para priorizar

### iOS

| # | O que vi | Path | Effort | Rec. |
|---|----------|------|--------|------|
| 3.1 | **Strings fora do catálogo voltam a acontecer**: as chaves são o texto PT no Swift, e nada falha quando se muda o texto. Acrescentar ao script um modo `--check` que extrai os literais de `Text/Label/accessibilityLabel/ContentUnavailableView` e falha se algum não estiver em `T`. | `ios/Scripts/build-strings-catalog.py` | S | fazer |
| 3.2 | **Avisos (NoticeCenter) gravados já em português**: "Biblioteca atualizada", "Conteúdo v% importado.", "Você já passou por N caracteres diferentes." são guardados como texto e mostrados tal qual — não traduzem em en/es e não se corrigem com o catálogo. Guardar `kind` + parâmetros e formatar na leitura. | `ios/Shared/LexiconUpdateService.swift:95,156`, `ios/Shared/RotationCoordinator.swift:190`, `ios/Shared/NoticeCenter.swift` | M | adiar |
| 3.3 | **Chaves antigas mortas no catálogo** ("O léxico ainda não…", "Todo o léxico vira…", "Léxico"): inofensivo, mas confunde. Limpar quando se fizer 3.1. | `ios/Scripts/build-strings-catalog.py` | S | adiar |
| 3.4 | `windowLabel` devolve "Manhã" / "Tarde" só por `hour < 12` — às 21h diz "Tarde". Ou acrescentar "Noite" (3 línguas) ou tirar o rótulo. | `ios/Features/HanziMemorize/AppModel.swift` (fim) | S | fazer (quando mexer no Início) |
| 3.5 | `HomeView.currentCard` chama `model.store.entries(inCategory:)` 2–3× por render (link "Continuar neste tema" + `navigationDestination` + callback). É query SwiftData dentro do `body`. Cachear num `@State` por `snap.entry.id`. | `ios/Features/HanziMemorize/HomeView.swift` | S | adiar (só se notar jank) |
| 3.6 | Plano aberto do doc 07 do app continua válido: rever erradas (2.2), interação das peças (2.3), áudio por palavra (2.5), frases via pack (2.6). Nada disto é bug; é produto. | `appMobile/docs/07_plano_melhorias.md` | M–L | adiar |
| 3.7 | Sem toolchain Swift neste ambiente: `swift test` não foi corrido nesta revisão. Correr localmente antes do TestFlight. | `appMobile/ios` | — | fazer |

### Web

| # | O que vi | Path | Effort | Rec. |
|---|----------|------|--------|------|
| 4.1 | Checagem de i18n é manual. Um script `scripts/check-messages.mjs` (paridade de chaves + lista de palavras pt-PT proibidas do `CLAUDE.md`) ligado ao `npm run lint` evita regressões como a de hoje. | `web/scripts/`, `web/package.json` | S | fazer |
| 4.2 | 7 valores iguais ao inglês em pt e es (`visuals.pdfPageOf`, `writingGame.progress`, `footer.phraseFontLink`, `footer.hanziWriterMmh`, `phraseGame.extra.hanziPinyin`, `ktv.modeCards`, `gameProgress.points`). Confirmei por amostra que são formatos/nomes próprios (ex. "{n} / {total}"); se algum for copy, traduzir. | `web/src/messages/{pt,es}.json` | S | ignorar (salvo revisão de copy) |
| 4.3 | Não validei layout a 390 px nem performance nesta rodada (só strings). Manter a regra do `CLAUDE.md` para a próxima mudança de UI. | `web/` | — | — |

### Android
Não revisto (fora de âmbito). Se 3.2 for feito no iOS, o Android tem o mesmo
padrão de avisos em texto e precisará do mesmo tratamento.

## 4. Sugestão de ordem

1. 4.1 + 3.1 (guard-rails de i18n nos dois lados; baratos, evitam o tipo de
   bug corrigido hoje).
2. 3.4 na próxima vez que se mexer no Início.
3. 3.2 quando houver uma rodada de localização séria (en/es no app).
4. Resto conforme `appMobile/docs/07_plano_melhorias.md`.
