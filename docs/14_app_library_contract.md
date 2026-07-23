# 14 — Contrato biblioteca app ↔ site

Espelho de `APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md` (implementação neste repo).

Atualizado: 2026-07-22.

---

## Fonte única

| Consumidor | Fonte SQL |
|------------|-----------|
| Site `/praticar` | `lexico_*` + `context_decks` |
| Snapshot / API do app | as mesmas tabelas |

Artefacto gerado (não é edição): `web/data/app-library/{library,meta}.json`.

---

## API (`build:server` / Node — não no static export)

| Método | Path | Auth |
|--------|------|------|
| `GET` | `/api/app/content/manifest` | `Bearer APP_LIBRARY_TOKEN` |
| `GET` | `/api/app/content/pack/library` | igual |

`library.url` no manifesto inclui basePath (`/aulaChines/...`).

Token: `hanzi_app.APP_LIBRARY_TOKEN` → `sync-env-from-credentials.mjs` → `.env.local` / `deploy/server.env`. Sem token → `503`.

---

## Job

```bash
cd web
npm run build:app-library   # também no fim de seed:content
```

`contentVersion` sobe quando o fingerprint do conteúdo muda (piso > seed offline v1).

---

## Estado

1. [x] SQL → snapshot + API + Bearer  
2. [x] Token local alinhado com o app  
3. [ ] Deploy itcsVM3 (ops — quando autorizares)

---

## Fora deste contrato

- **Lyric Cards / KTV** (`/ktv`) — treino privado de letras (admin); dados em `web/public/ktv/`, não entram no pack do app.

---

## Referências

- App: `~/Projects/APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md`
- Content DB: [11_content_db_schema.md](11_content_db_schema.md)
