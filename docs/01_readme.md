# Documentação do repositório chineseLearning

Índice da pasta `docs/`. Cada ficheiro cobre um tema; a ordem numérica sugere leitura para quem entra no projeto.

| Ficheiro | Conteúdo |
|----------|----------|
| [01_readme.md](01_readme.md) | Este índice e visão geral rápida |
| [02_arquitetura.md](02_arquitetura.md) | Pastas, Next.js, conteúdo e scripts |
| [03_llm.md](03_llm.md) | API LLM, tutor, variáveis e saúde do serviço |
| [04_operacao_local.md](04_operacao_local.md) | `start.sh`, portas, URLs com `basePath` |
| [05_rag_e_conteudo.md](05_rag_e_conteudo.md) | `rag_knowledge`, ingest, projeto `chinese_learning` |
| [06_deploy.md](06_deploy.md) | Estático (webplace) vs Node (`next start`) e nginx |

## Visão geral rápida

O site de aprendizagem de chinês vive em **`web/`** (Next.js 15, React 19). O tutor usa **`POST /aulaChines/api/chat`**, que faz proxy para a API externa no eixo educacional **`/edu/chat`**. O export estático (`out/`) **não** expõe esse POST; para tutor com LLM é preciso **`next start`** (ou `npm run dev`).

Na raiz do repositório, **`./start.sh --local`** orquestra verificações (health LLM, projeto RAG) e sobe o site com API na porta **34902** (por defeito). Detalhes em [04_operacao_local.md](04_operacao_local.md).

Documentação técnica aprofundada da API (contratos, token, RAG na API) continua em **`connectLLM/*.md`**; este `docs/` resume o fluxo no âmbito deste repo e aponta para lá quando fizer falta.

## Documentação noutras pastas

- **`web/README.md`** — scripts npm, preview estático, deploy (mantido; alinhado com estes docs)
- **`connectLLM/README.md`** — índice dos contratos LLM/RAG
