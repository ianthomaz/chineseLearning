# Compliance — textos legais e privacidade

Site: **https://learnchinese.today/**  
Contacto operador: **email@webplace.cc** (empresa — não é URL do site)

---

## Fonte única dos textos

Editar **`docs/legal/learnchinese-6-textos-legais.txt`** — 6 blocos (privacidade + termos × pt/en/es).

**Não** manter cópias Markdown paralelas na pasta `legal/`.

---

## Gerar páginas do site

```bash
cd web
node scripts/split-legal-content.mjs
```

Saída: `web/src/content/legal/*.md` + `content.ts` → rotas `/privacy` e `/terms`.

---

## Analytics nos textos

- GA4 stream **LearnChineseCOM** · ID **`G-2YMPSSQJND`**
- Consent Mode v2 — cookies `_ga` só após aceitar (ver [08_produto_observabilidade.md](08_produto_observabilidade.md))

---

## Cookies no produto

| Cookie / storage | Categoria |
|------------------|-----------|
| `authjs.*` | Estritamente necessário (login) |
| `_ga`, `_ga_*` | Analytics (com consent) |
| `pg_anon_id` | Analytics pseudónimo (com consent) |
| `theme`, locale, pinyin/tradução | Preferência |

Banner: **aceitar** ou **recusar** analytics (essencial-only) + link para `/privacy` — `CookieBanner.tsx`. Reabrir via rodapé (`SiteLegalLinks`).
