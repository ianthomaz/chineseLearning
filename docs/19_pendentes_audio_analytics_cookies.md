# Pendentes: áudio, analytics e aviso de cookies

Estado: **nada implementado** (set 2026). Três frentes pedidas e paradas antes de
começar, para não perder o trabalho já feito. Este documento tem o levantamento
real (medido no código, não de memória) para se pegar nisto sem repetir a
investigação.

---

## 1. Áudio em todo o site

### O que já existe e funciona

| Peça | Onde |
|---|---|
| `speech.ts` | [`web/src/lib/phrase-game/speech.ts`](../web/src/lib/phrase-game/speech.ts) — Web Speech API (`speechSynthesis`), **sem backend e sem custo** |
| `SpeakButton.tsx` | [`web/src/components/phrase-game/SpeakButton.tsx`](../web/src/components/phrase-game/SpeakButton.tsx) — botão pronto, degrada sozinho onde não há voz chinesa |
| `hasChineseVoice()` | esconde o botão quando o dispositivo não tem voz `zh-*` |

### Onde está ligado — 1 de 9 superfícies

| Superfície | Áudio | Conteúdo em hanzi |
|---|:---:|---|
| Jogo de frases | ✅ | 616 frases |
| Vocabulário (`VocabTable`) | ❌ | 435 palavras |
| Revisão — estruturas (`ReviewStructures`) | ❌ | 96 |
| Revisão — frases avulsas (`ReviewStandalonePhrases`) | ❌ | — |
| Diálogos (`DialogueTurnRow`) | ❌ | 160 turnos |
| Gramática (`GrammarSections`) | ❌ | — |
| Bloco de estudo (`BlockStudyPage`) | ❌ | — |
| Flashcards de contexto (`ContextFlashcardSession`) | ❌ | 192 cartões |
| **Letras / KTV** (`LyricsKtvSession`) | ❌ | 2 músicas |

Um site de chinês onde se vê hanzi em todo o lado e só se **ouve** num sítio.
Para falantes de português o tom é a parte mais difícil e ler pinyin em silêncio
não o ensina. O caso mais irónico é o KTV: é sobre músicas e não toca nada.

### Como fazer

É **wiring**, não construção. Por ordem de valor:

1. **`VocabTable`** — um `SpeakButton` por linha. Maior volume, uso mais óbvio.
2. **`DialogueTurnRow`** — por turno; um diálogo ouvido vale mais que lido.
3. **`ContextFlashcardSession`** — o flashcard já é uma pausa natural para ouvir.
4. **`LyricsKtvSession`** — por linha, no modo cartões.
5. `ReviewStructures`, `ReviewStandalonePhrases`, `GrammarSections`.

Cuidados que já conhecemos:

- `SpeakButton` vive em `components/phrase-game/`. Ao usá-lo fora do jogo,
  **mover para `components/ui/`** — senão fica uma dependência estranha.
- Não montar centenas de botões com listeners próprios numa tabela de 435
  linhas sem medir; ver [17_performance_payloads.md](17_performance_payloads.md).
- O botão deve continuar a esconder-se sozinho onde não há voz `zh-*`
  (iOS/Android variam muito).
- Nada disto precisa de rede, backend ou custo por chamada.

---

## 2. Analytics

### O que existe hoje

- **GA4**, id `G-46HMWMHG18`, carregado incondicionalmente em
  [`layout.tsx`](../web/src/app/layout.tsx) com `strategy="afterInteractive"`.
- [`analytics.ts`](../web/src/lib/analytics.ts) — um único helper `trackEvent`
  que reenvia para `gtag("event", …)`.
- **Telemetria própria** em SQLite (`events`), independente do GA, só para o
  jogo de frases — ver [09_google_auth_jogo.md](09_google_auth_jogo.md) §3.

### Cobertura real — 3 componentes

`trackEvent` é chamado em:

| Ficheiro | Eventos |
|---|---|
| `phrase-game/PhraseGame.tsx` | `round_start`, `round_complete` |
| `phrase-game/GameplayScreen.tsx` | `phrase_submit`, `phrase_correct`, `phrase_wrong`, `help_used` |
| `HanziWritingGame.tsx` | 3 chamadas |
| `HanziStrokeModal.tsx` | 1 chamada |

**Sem nenhum evento:** KTV, diálogos, vocabulário, revisão, gramática, visuais,
quiz (`/gamification`), prática, tutor, e todo o fluxo de autenticação.

### O que falta

**a) Page views por rota.** O site é uma SPA: o GA regista a primeira página e
mais nada. Sem um listener de `usePathname()` a enviar `page_view`, metade do
site é invisível. **É o buraco maior e o mais barato de tapar.**

**b) Taxonomia de eventos.** Hoje cada sítio inventa o seu `action`/`category`.
Proposta — fixar num módulo tipado em vez de strings soltas:

| category | action | label / params |
|---|---|---|
| `navigation` | `page_view` | `path`, `locale` |
| `phrase_game` | `round_start`, `round_complete`, `help_used`, `phrase_result` | `tier`, `level`, `score` |
| `quiz` | `quiz_start`, `question_answered`, `quiz_complete` | `question_type`, `correct` |
| `ktv` | `song_open`, `mode_start`, `line_advance` | `song`, `mode` |
| `study` | `block_open`, `pinyin_toggle`, `translation_toggle` | `block_id`, `mode` |
| `vocab` | `stroke_modal_open`, `audio_play` | `hanzi` |
| `auth` | `sign_in_start`, `sign_in_success`, `sign_out` | `provider` |
| `settings` | `locale_change`, `theme_change` | `to` |

**c) `trackEvent` está com `any`.** O ficheiro abre com
`/* eslint-disable @typescript-eslint/no-explicit-any */`. Ao fixar a taxonomia,
tipar os eventos e remover o disable.

**d) Dimensões úteis que não enviamos:** `locale` (temos 3 línguas e não sabemos
qual é usada), `theme`, logado vs convidado, e se o utilizador chegou por PWA.

**e) Decidir a fronteira com a tabela `events`.** Hoje o jogo escreve nos dois.
Regra sugerida: **GA para navegação e uso agregado; `events` para o que alimenta
aprendizagem** (por frase, por utilizador). Sem essa regra, vai duplicar.

> ⚠️ Qualquer coisa desta secção depende da secção 3: ligar mais analytics antes
> de ter consentimento aumenta o problema em vez de o resolver.

---

## 3. Aviso de cookies e sessão

> Levantamento técnico. **Não é aconselhamento jurídico** — a decisão sobre
> LGPD/GDPR é do dono do site, de preferência com quem perceba do assunto.

### O que o site guarda hoje, sem pedir nada

| O quê | Onde | Categoria | Precisa de consentimento? |
|---|---|---|---|
| `authjs.session-token` (JWT, 30 dias) | cookie | **Estritamente necessário** — sem ele não há login | Normalmente **não** |
| `authjs.csrf-token`, `authjs.callback-url` | cookie | Estritamente necessário (segurança) | Normalmente **não** |
| `_ga`, `_ga_G-46HMWMHG18` | cookie | **Analytics** | **Sim** |
| `pg_anon_id` (UUID) | `localStorage` | **Analytics** — identificador pseudónimo enviado para `/api/game/events` | **Provavelmente sim** |
| `theme`, locale, pinyin/tradução | `localStorage` | Preferência do próprio | Normalmente não |

**Dois pontos a sublinhar:**

1. O GA carrega **antes de qualquer consentimento**, para todos os visitantes.
2. O `pg_anon_id` é criado no primeiro evento do jogo e enviado ao servidor. É
   analytics com identificador estável por browser, mesmo sendo "anónimo" —
   ver [`game-log.ts`](../web/src/lib/phrase-game/game-log.ts). Foi desenhado
   antes de haver banner, e cai na mesma categoria que o GA.

### Estrutura proposta

**Não** é só uma faixa a dizer "aceito". O mínimo defensável:

1. **Consent Mode v2 do Google.** Antes do script do GA, declarar o estado por
   omissão:

   ```js
   gtag('consent', 'default', {
     analytics_storage: 'denied',
     ad_storage: 'denied',
     ad_user_data: 'denied',
     ad_personalization: 'denied',
   });
   ```

   E `gtag('consent', 'update', { analytics_storage: 'granted' })` quando o
   utilizador aceitar. Assim o GA carrega mas não escreve cookies até haver "sim".

2. **Contexto de consentimento** (`ConsentContext`), à imagem de
   `PinyinContext`/`TranslationContext`, guardando a escolha em `localStorage`
   com versão (`consent.v1`) para poder voltar a perguntar se a política mudar.

3. **Banner** com **três** acções — *Aceitar*, *Recusar* e *Só o essencial* —
   e um link para a política. Recusar tem de ser tão fácil como aceitar; um
   banner só com "OK" não vale.

4. **Gate do `pg_anon_id`.** Sem consentimento de analytics, `game-log.ts`
   continua a enviar o evento **sem** `anonId`. Não se perde a contagem
   agregada, perde-se a capacidade de agrupar por browser — que é exactamente o
   que o consentimento protege.

5. **Página de política** (`/privacidade`) a listar esta tabela em pt-BR/EN/ES,
   e um sítio para **mudar de ideias** depois (link no rodapé).

6. **A sessão JWT fica de fora do banner.** É estritamente necessária e o
   utilizador opta por ela ao fazer login. Documentar isso na política, não
   pedir consentimento para ela.

### Ordem sugerida

1. Consent Mode `default: denied` + banner + contexto. *(Sem isto, o resto é
   aumentar a exposição.)*
2. Gate do `pg_anon_id`.
3. Página de política + link no rodapé.
4. **Só depois** ligar os novos eventos da secção 2.

---

## Ficheiros que vão ser tocados

| Frente | Ficheiros |
|---|---|
| Áudio | `components/ui/SpeakButton.tsx` (movido), `VocabTable`, `DialogueTurnRow`, `ContextFlashcardSession`, `lyrics-ktv/LyricsKtvSession`, `ReviewStructures`, `ReviewStandalonePhrases`, `GrammarSections` |
| Analytics | `lib/analytics.ts`, `app/layout.tsx`, um `AnalyticsRouteListener` novo, + cada componente instrumentado |
| Cookies | `context/ConsentContext.tsx` (novo), `components/CookieBanner.tsx` (novo), `app/layout.tsx`, `lib/phrase-game/game-log.ts`, `app/privacidade/page.tsx` (novo), `messages/{pt,en,es}.json` |

Lembrete de [`CLAUDE.md`](../CLAUDE.md): qualquer string nova entra nas **três**
línguas, e o português é **pt-BR**.

*Última revisão: set 2026 — levantamento, não implementação.*
