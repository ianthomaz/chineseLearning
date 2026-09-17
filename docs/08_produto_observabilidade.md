# Produto — performance, analytics, cookies, áudio

---

## Performance (payloads)

Medir **sempre** antes e depois de alterações:

```bash
cd web && npx next build
find .next/server/app -maxdepth 3 \( -name '*.html' -o -name '*.rsc' \) \
  -printf '%10s  %p\n' | sort -rn | head -20
```

### Corrigido (set 2026)

| Fix | Efeito |
|-----|--------|
| Banco frases via `GET /api/phrase-game/bank` | `/phrase-game` HTML 656 kB → **22 kB** |
| `BlockIndexEntry` nos índices | `/`, `/review`, etc. ~127 kB → **~34 kB** |
| `/praticar` só carrega biblioteca com sessão | convidado 218 kB → **16 kB** |
| `/ktv` estático público | sem `force-dynamic` |
| `getAllPhrases()` memoizado | menos I/O SQLite |

**Total HTML+RSC (26 páginas):** 2,9 MB → **1,0 MB (−64%)**.

### Deixar como está

`/dialogues` — ~179 kB HTML porque **mostra 160 turnos de propósito**; ~31 kB gzip. Cortar exigiria mudar UX (índice + lazy load).

### Pendente menor

- `EdgeSettingsDrawer` em `/phrase-game` — toggles sem efeito nessa rota
- Route handlers JSON grandes — gzip manual (como `api/phrase-game/bank`)

---

## Analytics (GA4 `G-2YMPSSQJND`)

Só após **aceitar cookies** (Consent Mode v2).

| category | Exemplos de `action` |
|----------|----------------------|
| `navigation` | `page_view`, `nav_click` |
| `home` | `home_nav_click`, `home_featured_click` |
| `study` | `block_open`, `audio_play`, `pdf_view` |
| `phrase_game` | `round_start`, `phrase_result`, `help_used` |
| `quiz` | `quiz_start`, `question_answered`, `quiz_complete` |
| `ktv` | `song_open`, `mode_start`, `line_advance` |
| `practice` | `deck_open`, `card_advance` |
| `tutor` | `tutor_open`, `message_send`, `message_received` |
| `auth` | `sign_in_start`, `sign_in_success`, `sign_out` |
| `settings` | `locale_change`, `theme_change`, `pinyin_toggle` |
| `consent` | `consent_choice` |

Código: `web/src/lib/analytics.ts`, `AnalyticsRouteListener`, `GoogleAnalytics`.

User properties: `ui_locale`, `ui_theme`, `logged_in`.

Telemetria SQLite do jogo (`events`) = separada — [05_autenticacao.md](05_autenticacao.md).

### GA4 Admin (opcional, melhora relatórios)

Custom dimensions (event scope): `block_id`, `question_type`, `mode`, `deck_id`, `correct`, `locale`.

---

## Cookies e compliance

| Peça | Onde |
|------|------|
| Banner (aceitar / recusar analytics + link privacidade) | `CookieBanner.tsx` |
| Consent context | `ConsentContext.tsx` |
| GA gated | `GoogleAnalytics.tsx` |
| Gate `pg_anon_id` | `game-log.ts` |
| `/privacy`, `/terms` | pt/en/es |

Textos legais: [10_compliance.md](10_compliance.md)

---

## Áudio (Web Speech API)

Botão `SpeakButton` onde há **hanzi com valor pedagógico**:

| Superfície | Estado |
|---|:---:|
| Jogo, vocabulário, diálogos, flashcards, KTV, quiz, revisão/gramática (estruturas) | ✅ |
| Frases só traduzidas (sem hanzi) | — |

Sem backend, sem custo. Esconde-se se não houver voz `zh-*`.

---

## UI / design system

Repaginação visual (jul 2026): tokens CSS, dark mode, `components/ui/`, Newsreader — **concluída**. Manter tokens de `globals.css` e `--on-category` em fundos de categoria.

*Última revisão: set 2026*
