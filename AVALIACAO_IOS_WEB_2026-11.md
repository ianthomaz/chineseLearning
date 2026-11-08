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

## 2. Feito (commitado) — duas levas em 8 nov 2026

### Leva 1 — bugs de string
1. **iOS — 8 strings fora do catálogo de traduções** (apareciam sempre em
   português em en/es): `Vocabulário vazio`, `O vocabulário ainda não foi
   carregado.`, `Todo o vocabulário vira um baralho…`, `Frase anterior`,
   `Próxima frase`, `Entrar com Alipay`, `Próximo hanzi` e a descrição do
   App Intent.
2. **Web — pt-PT em pt.json**: `gameProgress.guest` dizia "guardar" → "salvar".

### Leva 2 — guard-rails e itens S do plano
3. **iOS — `--check` no script de strings**: `python3 Scripts/build-strings-catalog.py --check`
   extrai os literais de UI do Swift, compara com a tabela `T` e sai com 1 se
   faltar alguma linha (avisa também linhas sem uso). Encontrou mais 5 textos
   em falta (Sobre, agradecimentos open source, dois erros de token) — já
   acrescentados. Limpou 30 chaves mortas do catálogo (254 linhas agora).
   Ponto cego conhecido: palavras ASCII isoladas ("Sei") — iguais a nomes de
   recurso; textos com espaço ou acento são apanhados.
   Path: `appMobile/ios/Scripts/build-strings-catalog.py`.
4. **iOS — avisos (NoticeCenter) traduzidos na leitura**: `AppNotice` guarda a
   chave do catálogo + `args` (`%@`) e expõe `localizedTitle/Message`; os três
   pontos que publicam avisos (atualização disponível, biblioteca atualizada,
   marco de hanzi vistos) e os dois que mostram (Config, banner) passaram a
   usá-los. Avisos antigos gravados como texto continuam a decodificar
   (`args` opcional) e a aparecer tal qual. Dois testes novos em
   `HanziMemorizeTests/NoticeCenterTests.swift`.
   Paths: `appMobile/ios/Shared/NoticeCenter.swift`, `Shared/LexiconUpdateService.swift`,
   `Shared/RotationCoordinator.swift`, `Features/HanziMemorize/{ConfigView,NoticeBanner}.swift`.
5. **iOS — "Noite" no Início**: `windowLabel` devolve Manhã / Tarde / Noite
   (< 12 / < 18 / resto), nas três línguas. Path: `Features/HanziMemorize/AppModel.swift`.
6. **iOS — uma query por hanzi no Início**: `HomeView` carrega as entradas do
   tema num `@State` via `.task(id:)` em vez de três leituras SwiftData por
   render. Path: `Features/HanziMemorize/HomeView.swift`.
7. **Web — `scripts/check-messages.mjs`** (paridade en/pt/es, valores vazios,
   mesmos `{placeholders}`, palavras pt-PT e «»), ligado a `npm run lint`
   e disponível como `npm run check:messages`. Passa no estado atual.

**Não compilado nesta sessão** (sem toolchain Swift aqui): os itens 3–6 são
Swift simples, mas o dono deve correr `swift test` em `appMobile/ios` e abrir
o app uma vez (Início → Config → avisos) antes de publicar.

## 3. Riscos / dívida por área — o que resta

### iOS

| # | O que vi | Path | Effort | Rec. |
|---|----------|------|--------|------|
| 3.1 | O `--check` corre à mão. Ligá-lo como Run Script phase no `project.yml` (xcodegen) para falhar o build do Xcode quando faltar string. Não fiz porque não consigo testar o xcodegen aqui. | `ios/project.yml` | S | fazer |
| 3.2 | Plano aberto do doc 07 do app continua válido: rever erradas (2.2), interação das peças (2.3), áudio por palavra (2.5), frases via pack (2.6). Produto, não bug. | `appMobile/docs/07_plano_melhorias.md` | M–L | adiar |
| 3.3 | `swift test` não foi corrido nesta revisão. Correr localmente antes do TestFlight. | `appMobile/ios` | — | fazer |

### Web

| # | O que vi | Path | Effort | Rec. |
|---|----------|------|--------|------|
| 4.1 | 7 valores iguais ao inglês em pt e es — confirmados como formatos (`{current} / {total}`, `({points} pts)`) ou nomes próprios ("Make Me a Hanzi", "Hanzi + Pinyin"). Nada a traduzir. | `web/src/messages/{pt,es}.json` | — | ignorar |
| 4.2 | Não validei layout a 390 px nem performance nesta rodada (só strings/scripts). Manter a regra do `CLAUDE.md` na próxima mudança de UI. | `web/` | — | — |

### Android
Não revisto (fora de âmbito). O padrão de avisos em texto (item 4 acima) existe
também no Android e precisará do mesmo tratamento quando se localizar o app.

## 4. Sugestão de ordem

1. `swift test` + abrir o app (3.3) para validar a leva 2.
2. 3.1 (Run Script phase) quando se mexer no `project.yml`.
3. Resto conforme `appMobile/docs/07_plano_melhorias.md`.
