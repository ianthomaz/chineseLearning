# QA — testes contra o servidor e o build local

Scripts para o site **já a correr**. Não sobem o servidor e não fazem deploy.

## Primeira vez (browser / Lighthouse)

```bash
cd QA
npm install
npx playwright install chromium
```

## Correr (quando o dono mandar)

```bash
# Produção, só HTTP rápido
./QA/run-all.sh --target prod --quick

# Produção, suite live completa (HTTP + Playwright + Lighthouse)
./QA/run-all.sh --target prod

# Node local “como prod” (porta 34902) — o site tem de estar no ar
./QA/run-all.sh --target local

# Dev (34827)
./QA/run-all.sh --target dev

# Export estático (34901) — guest, sem /api
./QA/run-all.sh --target static

# Antes de subir: eslint, tsc, chaves i18n, dual-build (lento)
./QA/run-all.sh --build

# Um script
./QA/run-all.sh --target prod --only 01,02
bash QA/01-smoke-pages.sh   # usa QA_TARGET/BASE_URL do ambiente
```

| Flag | URL por omissão |
|------|-----------------|
| `--target prod` | https://learnchinese.today |
| `--target local` | http://127.0.0.1:34902 |
| `--target dev` | http://127.0.0.1:34827 |
| `--target static` | http://127.0.0.1:34901 |

`BASE_URL` no ambiente sobrepõe a tabela.

## Scripts

| Nº | Ficheiro | Precisa do site? |
|----|----------|------------------|
| 01 | `01-smoke-pages.sh` | sim — páginas + todos os blocos |
| 02 | `02-smoke-apis.sh` | sim — APIs / 401 / estático 404 |
| 03 | `03-headers-ssl.sh` | sim — SSL só em HTTPS |
| 04 | `04-redirects.sh` | sim — só prod (`learnchinese.page`) |
| 05 | `05-payloads.sh` | sim — tamanho HTML vs orçamento |
| 06 | `06-dead-routes.sh` | sim — lista vazia (sem inventário de rotas mortas) |
| 07 | `07-assets.sh` | sim — KTV JSON, PDFs (HEAD), manifest, sw |
| 08 | `08-auth-gates.sh` | sim — LoginGate / curador recusado |
| 09 | `09-internal-links.sh` | sim — crawl de `href` internos |
| 10 | `10-browser.sh` | sim — Playwright 1280 e 390 px |
| 11 | `11-lighthouse.sh` | sim — salta se não houver Chrome |
| 12 | `12-i18n-keys.sh` | não — mesmas chaves en/pt/es |
| 13 | `13-lint-types.sh` | não — eslint + tsc |
| 14 | `14-dual-build.sh` | não — `next build` + `build:webplace` |
| 15 | `15-llm-health.sh` | não — health da API LLM |

`--quick` = 01, 02, 06, 07, 08.

Relatórios: `QA/reports/` (gitignored).

## Fora de âmbito

- Login Google / sessão de curador (manual)
- POST de eventos, aulas ou chat **em produção**
- Busca no site (não existe de propósito)
- PWA / conteúdo offline (adiado)
- WeChat login
- `deploy:*`
