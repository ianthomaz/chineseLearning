# connectLLM — Chinese Learning ↔ API LLM

Índice de alto nível do repo (arquitetura, portas, deploy): [`../docs/01_readme.md`](../docs/01_readme.md).

Esta pasta contém **toda a documentação** para integrar o projeto **chineseLearning** com a API LLM (eixo educacional **`/edu`** e, mais tarde, **RAG** com `/ingest` e `/ask`).

**Não é necessário ter o repositório da API no computador** — os ficheiros abaixo repetem URLs, headers, corpos JSON e fluxos.

**URL base da API (HTTPS vs Tailscale vs VM):** a matriz oficial e o caso **itcsVM** estão em **ITCS/featureLLM** — **`docs/MANUAL_INTEGRACAO.md`** § 1.1. Em **`web/deploy/server.env`**, usa **`https://llm.webplace.cc`** (ou o IP Tailscale do Mac) para o Node **não** depender de `127.0.0.1` na nuvem.

| Documento | Conteúdo |
|-----------|----------|
| [ACESSO_E_VERIFICACAO.md](ACESSO_E_VERIFICACAO.md) | URLs base (local, Tailscale, internet), **como usar o token**, `GET /health`, erros 401/403, boas práticas de segurança |
| [CONTRATO_EDU_COMPLETO.md](CONTRATO_EDU_COMPLETO.md) | Referência completa de **`/edu/*`**: métodos, query params, bodies e respostas JSON; **`/edu/chat`** com `reply_structured` / `full_reply_text` e fallback em `reply` |
| [RAG_PROJETOS_INGEST_ASK.md](RAG_PROJETOS_INGEST_ASK.md) | Criar projeto, `POST /ingest`, `POST /ask` com polling — para quando quiserem biblioteca vetorial (conteúdo estático no servidor da API) |
| [GUIA_LLM_EDU.md](GUIA_LLM_EDU.md) | Visão geral, fluxo recomendado, relação com `web/out/`, variáveis de ambiente no Next.js |

**Ordem sugerida para quem integra:** começar por **ACESSO_E_VERIFICACAO**, depois **CONTRATO_EDU_COMPLETO**, ler **GUIA_LLM_EDU** para contexto; **RAG_…** só quando for altura de indexar conteúdo para perguntas livres.

**Arranque local:** na raiz do repo, **`./start.sh --local`** ou **`--webplace`** faz health + verificação do projeto `chinese_learning` e pode incluir **`--ingest`** (ver `web/README.md`).

**Deploy vs RAG:** `deploy:webplace`, `deploy:local` e `deploy:node` **não** fazem `POST /ingest`. O projeto (`chinese_learning`) regista-se na API na **primeira** ingest bem-sucedida (ou já existe na BD). Depois de alterares `rag_knowledge/*.md`, corre **`npm run ingest:rag`** (na pasta `web/`, com `.env.local` e API a correr). No servidor `featureLLM`, `CHINESE_LEARNING_SOURCES` no `.env` deve apontar para a pasta que o **container** vê.
