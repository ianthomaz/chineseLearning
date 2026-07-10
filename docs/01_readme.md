# Documentação do repositório chineseLearning

Índice da pasta `docs/`. A ordem numérica sugere leitura para quem entra no projeto.

| Ficheiro | Conteúdo |
|----------|----------|
| [01_readme.md](01_readme.md) | Este índice e visão geral rápida |
| [02_arquitetura.md](02_arquitetura.md) | Pastas, Next.js, conteúdo e scripts |
| [03_llm.md](03_llm.md) | API LLM, tutor, variáveis e saúde do serviço |
| [04_operacao_local.md](04_operacao_local.md) | `start.sh`, portas, URLs com `basePath` |
| [05_rag_e_conteudo.md](05_rag_e_conteudo.md) | `rag_knowledge`, ingest, projeto `chinese_learning` |
| [06_deploy.md](06_deploy.md) | Estático (webplace) vs Node (`next start`) e nginx |
| [07_vocabulario_hanzi_strokes.md](07_vocabulario_hanzi_strokes.md) | Vocabulário: Make Me a Hanzi, Hanzi Writer, modal, licenças |
| [08_plano_jogo_frases.md](08_plano_jogo_frases.md) | Jogo de frases — **estado actual** (MVP implementado) |
| [09_google_auth_jogo.md](09_google_auth_jogo.md) | Login Google site-wide (OAuth ChineseSite), JWT, SQLite `users` |
| [11_content_db_schema.md](11_content_db_schema.md) | Conteúdo editorial em BD (`CONTENT_SOURCE=db`, seed, schema) |
| [12_aula_registro_roadmap.md](12_aula_registro_roadmap.md) | **Registo de aulas** — formulário, léxico global, roadmap (planeamento) |
| [phrase-game-scoring.md](phrase-game-scoring.md) | Regras de pontuação (implementadas, sem UI) |
| [phrase-game-upgrades.md](phrase-game-upgrades.md) | Backlog e sugestões de melhoria do jogo de frases |
| [10_phrase_game_implementation_prompt.md](10_phrase_game_implementation_prompt.md) | Spec histórica do MVP (referência; ver 08 + README do módulo) |

## Visão geral rápida

O site de aprendizagem de chinês vive em **`web/`** (Next.js 15, React 19). O tutor usa **`POST /aulaChines/api/chat`**, que faz proxy para a API externa no eixo educacional **`/edu/chat`**. O export estático (`out/`) **não** expõe esse POST; para tutor com LLM é preciso **`next dev`** / **`next start`**.

O **jogo de montar frases** está em **`/aulaChines/phrase-game`** (convidado ou login Google). Banco: **`FRASES_GAME/curated/`** → build → `web/src/data/phrase-game/phrases.json`.

Operação em máquina (portas, URLs, deploy local, `start.sh`): **[04_operacao_local.md](04_operacao_local.md)** — **única** fonte; não duplicar noutros ficheiros.

Documentação técnica aprofundada da API (contratos, token, RAG na API) continua em **`connectLLM/*.md`**; este `docs/` resume o fluxo no âmbito deste repo e aponta para lá quando fizer falta.

## Documentação noutras pastas

- **`web/README.md`** — scripts npm, preview estático, deploy
- **`web/src/components/phrase-game/README.md`** — módulo do jogo (layout, build do banco, OAuth)
- **`connectLLM/README.md`** — índice dos contratos LLM/RAG
