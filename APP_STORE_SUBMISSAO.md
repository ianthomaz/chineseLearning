# App Store / TestFlight — checklist

Atualizado: **8 nov 2026**. Ficha ASC em **English (U.S.)**.  
Espelho: `appMobile/docs/09_app_store_testflight.md` · copy: `appMobile/store/listing-en.txt`.

---

## Checklist — o que falta (agora)

| # | Item | Estado |
|---|------|--------|
| 1 | Bundle ID + widget + SIWA + App Groups | Feito |
| 2 | Servidor auth + progresso | Live |
| 3 | Privacy / Terms + contacto | Feito |
| 4 | Créditos OSS / Arphic | Feito |
| 5 | Login obrigatório + widget sem sessão + léxico EN/ES (UI) | **Feito** — commit/push `1b85d5e` / monorepo `b85f7c0` |
| 6 | Léxico pack v14 (`translationEn`/`Es`) + merge scripts | Feito |
| 7 | Prints 6.7" EN 1320×2868 (`01`…`06`) | Feito + **upload ASC** |
| 8 | **New App** no App Store Connect | Feito — Apple ID `6832237621` |
| 9 | Archive build **2** + upload TestFlight | **Falta** (signing / archive neste Mac) |
| 10 | Ficha ASC: textos · Notes · category · idade 16+ · prints · copyright | **Feito via API** (sem Submit) |
| 11 | App Privacy nutrition labels no ASC | **Provável falta** (UI ASC / API separada) |
| 12 | TestFlight smoke → Submit | **Não** — só quando pedires |

ASC: https://appstoreconnect.apple.com/apps/6832237621/distribution

**Fora desta submissão:** Game Center, WeChat, Android store, PWA.

### Próximos passos

1. **Archive build 2** + upload → ligar build à versão 1.0.  
2. Confirmar **App Privacy** (nutrition) no ASC se ainda vazio.  
3. TestFlight smoke → **Submit** (só quando pedires).

---

## Conta e logins (Notes + produto)

Sign-in **obrigatório** no app (widget sem sessão bloqueado). Mesma conta do site.

**Apple / Google / Alipay:** login automático; conta **criada de imediato**; serve para progresso e preferências **cruzados** site↔telemóvel; produto **gratuito**.  
**E-mail + senha:** pode exigir confirmação de e-mail.

### Notes for Reviewer

```
LearnChinese Today requires sign-in (same account as learnchinese.today).

Sign-in: Sign in with Apple, Google, email/password, and Alipay.
Apple / Google / Alipay create the account immediately (no extra verification
step for those providers). The account exists so the learner can keep progress
and preferences in sync across the website and the phone. The app is free —
no in-app purchases, no subscription.

After sign-in: phrase practice, vocabulary / hanzi study, progress sync, and an
optional Home / Lock Screen widget (study content only while signed in).

No Game Center. Reviewer can use Apple or email.
```

---

## App no ASC (criada)

| Campo | Valor |
|-------|--------|
| Apple ID (ASC) | **6832237621** |
| URL | https://appstoreconnect.apple.com/apps/6832237621/distribution |
| Platforms | iOS |
| Name | LearnChinese Today |
| Primary Language | English (U.S.) |
| Bundle ID | today.learnchinese.app |
| SKU | learnchinese-today-ios |
| User Access | Full Access |

Team: `7Z7GR6UFNZ`.

---

## Textos da ficha (EN)

**Name:** `LearnChinese Today`  
**Subtitle (≤30):** `Learn Chinese games + widget`  
**Category:** Education (Secondary: Reference)  
**Keywords:** `chinese,mandarin,hanzi,pinyin,hsk,flashcards,phrases,learn`  
**Support / Marketing:** `https://learnchinese.today/`  
**Privacy:** `https://learnchinese.today/privacy`  
**Terms:** `https://learnchinese.today/terms`  
**Copyright:** `2026 webplace.cc (ITCS webplace LTDA - Brazil)`

**Description:**
```
LearnChinese Today helps you practice Mandarin every day — on your phone and on the Lock Screen.

Free app: 己欲立而立人，己欲达而达人  

Sign in required (same account as learnchinese.today): Apple, Google, email, or Alipay. Third-party sign-in creates your account immediately so progress and preferences sync across the website and the phone.

• Hanzi Memorize widget — a character or compound on a timer
• Phrase Puzzle — build real sentences with HSK vocabulary
• Vocabulary — practise hanzi, context decks, and browse by topic
• Progress — rounds sync to your account on the site
```

**What’s New (1.0):**
```
1.0 — Fresh release. Sign-in required; Vocabulary includes hanzi practice. Free!
```

**Promotional Text (≤170):**
```
Free Mandarin practice: phrase puzzles, vocabulary with hanzi, Lock Screen widget. Same account as learnchinese.today.
```

---

## Privacy · idade

Recolhe: Email, User ID, Product Interaction (`POST /api/game/round`).  
Sem tracking / ATT. Idade loja: **16+**. Sem Game Center.

---

## Prints

Pasta: `appMobile/store/screenshots/iphone-67/` · iPhone 17 Pro Max · **1320×2868** · UI **EN** + gloss EN.

| # | Ficheiro | Conteúdo |
|---|----------|----------|
| 1 | `01-signin.png` | Gate de Conta |
| 2 | `02-home.png` | Início (ex. 跳舞 · to dance) |
| 3 | `03-phrases.png` | Frases |
| 4 | `04-vocabulary.png` | Vocabulário |
| 5 | `05-study.png` | Baralho do tema |
| 6 | `06-progress.png` | Progresso |

---

## Build / upload

1. Commit/push (submodule `APP_learnChineseToday` + monorepo)  
2. `node Scripts/sync-secrets-xcconfig.mjs` · bump `CURRENT_PROJECT_VERSION`  
3. Archive **LearnChineseToday** → Upload ASC → TestFlight  
4. Colar textos + Notes + nutrition + idade + prints → Submit  

Marketing: **1.0**.
