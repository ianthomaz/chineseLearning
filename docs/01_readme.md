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
| [07_vocabulario_hanzi_strokes.md](07_vocabulario_hanzi_strokes.md) | Vocabulário: Make Me a Hanzi, Hanzi Writer, modal, licenças |

## Visão geral rápida

O site de aprendizagem de chinês vive em **`web/`** (Next.js 15, React 19). O tutor usa **`POST /aulaChines/api/chat`**, que faz proxy para a API externa no eixo educacional **`/edu/chat`**. O export estático (`out/`) **não** expõe esse POST; para tutor com LLM é preciso **`next dev`** / **`next start`**.

Para o dia a dia: na raiz, **`./start.sh`** (sem flags) sobe **hot reload** numa única URL — **http://127.0.0.1:34827/aulaChines/** (igual `cd web && npm run dev`). Para Node como em produção **com** health/smoke da API antes, usa **`./start.sh --local`** (porta **34902** por defeito). Detalhes em [04_operacao_local.md](04_operacao_local.md).

Documentação técnica aprofundada da API (contratos, token, RAG na API) continua em **`connectLLM/*.md`**; este `docs/` resume o fluxo no âmbito deste repo e aponta para lá quando fizer falta.

## Documentação noutras pastas

- **`web/README.md`** — scripts npm, preview estático, deploy (mantido; alinhado com estes docs)
- **`connectLLM/README.md`** — índice dos contratos LLM/RAG
