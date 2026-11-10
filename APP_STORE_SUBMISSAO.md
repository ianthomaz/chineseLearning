# App Store / TestFlight — checklist

Atualizado: **10 nov 2026**. ASC: **en-GB** (primary) + en-US + pt-BR + es-MX + es-ES.  
Espelho: `appMobile/docs/09_app_store_testflight.md` · copy: `appMobile/store/listing-en.txt`.

---

## Checklist

| # | Item | Estado |
|---|------|--------|
| 1 | Bundle ID + widget + SIWA + App Groups | Feito |
| 2 | Servidor auth + progresso | Live |
| 3 | Privacy / Terms + contacto | Feito |
| 4 | Créditos OSS / Arphic | Feito |
| 5 | Login obrigatório + léxico EN/ES (UI) | Feito |
| 6 | Léxico pack v14 (`translationEn`/`Es`) | Feito |
| 7 | Prints iPhone 6.7" + iPad 13" (todos os locales) | Feito + ASC |
| 8 | App ASC `6832237621` | Feito |
| 9 | Build **3** VALID ligada à 1.0 | Feito |
| 10 | Ficha: textos EN/PT/ES · Notes SIWA · Education+Reference · copyright · a11y draft · cabeçalho/busca | Feito (textos listing-* reenviados 10 nov; whatsNew N/A na 1.0) |
| 11 | Preço **grátis** (faixa 0) | Feito |
| 12 | App Privacy nutrition (UI) | Feito pelo dono |
| 13 | TestFlight | **Passou** (10 nov 2026) |
| 14 | Submit App Review | **Não** — só quando pedires |

ASC: https://appstoreconnect.apple.com/apps/6832237621/distribution

**Fora desta submissão:** Game Center, WeChat, Android store, PWA.

### Próximo passo

**Submit** para App Review — só quando pedires.

---

## Conta e logins (Notes)

Sign-in **obrigatório**. Mesma conta do site. Produto **gratuito**.

### Notes for Reviewer (no ASC)

```
LearnChinese Today requires sign-in (same account as learnchinese.today).

There is no username/password demo account for App Review.
Sign-in is via third-party providers only on the review path we recommend:
use Sign in with Apple with your own Apple ID (free; account is created immediately).
Google and Alipay also work; Alipay needs the Alipay app on the device.

The account exists so progress and preferences sync across the website and the phone.
The app is free — no in-app purchases, no subscription.

After sign-in: phrase practice, vocabulary / hanzi study, progress sync, and an
optional Home / Lock Screen widget (study content only while signed in).

No Game Center.
```

ASC: **Início de sessão obrigatório** marcado; usuário/senha vazios; `demoAccountRequired=false`.

---

## App no ASC

| Campo | Valor |
|-------|--------|
| Apple ID (ASC) | **6832237621** |
| Name | LearnChinese Today (en-GB / en-US / pt-BR / es-MX / es-ES) |
| Primary Language | English (U.K.) `en-GB` |
| Bundle ID | today.learnchinese.app |
| SKU | learnchinese-today-ios |
| Category | Education · Secondary Reference |
| Price | Free |
| Copyright | `2026 webplace.cc (ITCS webplace LTDA - Brazil)` |
| Team | `7Z7GR6UFNZ` |

---

## Textos (EN base)

**Subtitle:** `Learn Chinese games + widget`  
**Keywords:** `chinese,mandarin,hanzi,pinyin,hsk,flashcards,phrases,learn`  
**Support / Marketing:** `https://learnchinese.today/`  
**Privacy:** `https://learnchinese.today/privacy`

**Description:** ver `appMobile/store/listing-en.txt`.  
pt-BR / es no ASC (API).

---

## Privacy · idade

Nutrition (UI): **Nome**, **E-mail**, **ID de usuário**, **Interações com o produto** — ligados ao user · Funcionalidade do app · sem tracking.

**Idade:** override `SIXTEEN_PLUS` → BR **16** / US **17+** (política de conta, não conteúdo). Conteúdo do questionário está limpo (seria 4+ sem override).

### Acessibilidade

iPhone **DRAFT**: Dark Interface, Larger Text, VoiceOver, Sufficient Contrast = sim.  
Publish só depois de estar na loja.

### Criativos (opcional, já no ASC)

Cabeçalho 3840×1646 + busca 3840×2560 em `appMobile/store/asc-creative/` — ligados em todos os locales.

---

## Prints

| Pasta | Uso |
|-------|-----|
| `appMobile/store/screenshots/iphone-67/` | 6 × 1320×2868 |
| `appMobile/store/screenshots/ipad-129/` | 6 × 2048×2732 (`APP_IPAD_PRO_3GEN_129`) |

---

## Build / upload

1. Commit/push submodule + monorepo  
2. `node Scripts/sync-secrets-xcconfig.mjs` · bump `CURRENT_PROJECT_VERSION`  
3. Archive → Upload ASC → TestFlight  
4. Submit (quando pedires)

Marketing: **1.0** · build actual: **3**.
