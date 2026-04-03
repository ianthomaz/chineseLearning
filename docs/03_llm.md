# LLM, tutor e API

## O que o utilizador vê

O **tutor** na UI chama o backend Next (**`POST …/aulaChines/api/chat`**). O Next atua como **proxy** para a API LLM no endpoint educacional (**`/edu/chat`**), com autenticação por token.

Sem esse fluxo (por exemplo, só ficheiros estáticos servidos de `out/`), o tutor **não** consegue falar com o modelo.

## Onde corre a API

A API corre **fora** deste repo (Docker em `featureLLM` no Mac mini, atrás de Nginx/Cloudflare para HTTPS público). O site lê **`LLM_API_URL`** (sem barra final).

- **Dev no mesmo Mac que o Docker da API:** típico **`http://127.0.0.1:28471`** — `web/.env` no repo.
- **Node em servidor (VM, nginx):** a URL tem de ser **alcançável a partir desse host**. Não uses **`127.0.0.1:28471`** na VM salvo túnel SSH explícito (itcsVM — ver manual abaixo). Em geral: **`https://llm.webplace.cc`** (caminho A, HTTPS) ou **`http://<IP-Tailscale-do-Mac>:28471`** (caminho B). Referência: repositório **ITCS/featureLLM**, **`docs/MANUAL_INTEGRACAO.md`** § 1.1 e § 2.

Ficheiro de deploy: **`web/deploy/server.env`** (template **`server.env.example`**).

## Variáveis de ambiente no `web/`

| Variável | Uso |
|----------|-----|
| `LLM_API_URL` | Base da API (sem barra final desnecessária; scripts normalizam) |
| `LLM_API_TOKEN` | Bearer para `/health`, `/edu/chat`, ingest, etc. |

O modo **`./start.sh --local`** exige **`web/.env.local`** com token preenchido.

## Verificação rápida

- Na pasta `web/`: **`npm run check:llm`** (usa `.env` + `.env.local`).
- Na raiz: **`./start.sh --local`** faz **`GET …/health`** antes de subir o site; em modo `--local` falha se o health não passar com o token configurado.

## Documentação detalhada na API

Este ficheiro resume o papel do repo. Para contratos JSON, erros 401/403, `reply_structured` e fluxos educativos, usar:

- `connectLLM/ACESSO_E_VERIFICACAO.md`
- `connectLLM/CONTRATO_EDU_COMPLETO.md`
- `connectLLM/GUIA_LLM_EDU.md`
