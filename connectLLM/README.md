# connectLLM — Chinese Learning ↔ API LLM

Esta pasta contém **toda a documentação** para integrar o projeto **chineseLearning** com a API LLM (eixo educacional **`/edu`** e, mais tarde, **RAG** com `/ingest` e `/ask`).

**Não é necessário ter o repositório da API no computador** — os ficheiros abaixo repetem URLs, headers, corpos JSON e fluxos.

| Documento | Conteúdo |
|-----------|----------|
| [ACESSO_E_VERIFICACAO.md](ACESSO_E_VERIFICACAO.md) | URLs base (local, Tailscale, internet), **como usar o token**, `GET /health`, erros 401/403, boas práticas de segurança |
| [CONTRATO_EDU_COMPLETO.md](CONTRATO_EDU_COMPLETO.md) | Referência completa de **`/edu/*`**: métodos, query params, bodies e respostas JSON; **`/edu/chat`** com `reply_structured` / `full_reply_text` e fallback em `reply` |
| [RAG_PROJETOS_INGEST_ASK.md](RAG_PROJETOS_INGEST_ASK.md) | Criar projeto, `POST /ingest`, `POST /ask` com polling — para quando quiserem biblioteca vetorial (conteúdo estático no servidor da API) |
| [GUIA_LLM_EDU.md](GUIA_LLM_EDU.md) | Visão geral, fluxo recomendado, relação com `web/out/`, variáveis de ambiente no Next.js |

**Ordem sugerida para quem integra:** começar por **ACESSO_E_VERIFICACAO**, depois **CONTRATO_EDU_COMPLETO**, ler **GUIA_LLM_EDU** para contexto; **RAG_…** só quando for altura de indexar conteúdo para perguntas livres.
