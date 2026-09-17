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
| [09_google_auth_jogo.md](09_google_auth_jogo.md) | **Autenticação** — modelo de utilizador, convidado vs. logado, o que fica guardado, que rotas exigem login |
| [11_content_db_schema.md](11_content_db_schema.md) | Conteúdo editorial em BD (`CONTENT_SOURCE=db`, seed, schema) |
| [12_aula_registro_roadmap.md](12_aula_registro_roadmap.md) | **Registo de aulas** — formulário, léxico global, roadmap (planeamento) |
| [phrase-game-accepted-orders.md](phrase-game-accepted-orders.md) | Ordens alternativas aceites — pipeline LLM + revisão humana |
| [phrase-game-scoring.md](phrase-game-scoring.md) | Regras de pontuação — implementadas e visíveis no fim da rodada |
| [phrase-game-upgrades.md](phrase-game-upgrades.md) | Backlog e sugestões de melhoria do jogo de frases |
| [14_app_library_contract.md](14_app_library_contract.md) | Pack app ↔ site (manifest, Bearer, `contentVersion`) |
| [15_lexico_llm_classify_contract.md](15_lexico_llm_classify_contract.md) | Contrato LLM (mini62 / featureLLM) para categorizar léxico → widgets |
| [16_auth_wechat_roadmap.md](16_auth_wechat_roadmap.md) | Login WeChat — pesquisa e checklist de bloqueios (**não implementado**) |
| [17_performance_payloads.md](17_performance_payloads.md) | Payloads de primeira pintura — como medir, o que foi corrigido, o que falta |
| [18_jogo_frases_ux.md](18_jogo_frases_ux.md) | Jogo de frases — presets, porquê, e regra de língua (pt-BR/EN/ES) |
| [19_pendentes_audio_analytics_cookies.md](19_pendentes_audio_analytics_cookies.md) | **Pendente** — áudio no site, analytics e aviso de cookies (levantamento) |
| [phrase-game-backoffice.md](phrase-game-backoffice.md) | Dashboard de telemetria do jogo (`/backoffice`, só admin) |

## Visão geral rápida

O site de aprendizagem de chinês vive em **`web/`** (Next.js 15, React 19). O tutor usa **`POST /aulaChines/api/chat`**, que faz proxy para a API externa no eixo educacional **`/edu/chat`**. O export estático (`out/`) **não** expõe esse POST; para tutor com LLM é preciso **`next dev`** / **`next start`**.

O **jogo de montar frases** está em **`/aulaChines/phrase-game`** e joga-se **sem conta** — o login Google é opcional e só guarda o apelido. Banco: **`FRASES_GAME/curated/`** → build → `web/src/data/phrase-game/phrases.json` → SQLite, servido ao browser por `GET /api/phrase-game/bank`.

As **letras / KTV** estão em **`/aulaChines/ktv`**, também sem login. Fonte única dos dados: `web/public/ktv/`.

Operação em máquina (portas, URLs, deploy local, `start.sh`): **[04_operacao_local.md](04_operacao_local.md)** — **única** fonte; não duplicar noutros ficheiros.

Documentação técnica aprofundada da API (contratos, token, RAG na API) continua em **`connectLLM/*.md`**; este `docs/` resume o fluxo no âmbito deste repo e aponta para lá quando fizer falta.

## Documentação noutras pastas

- **`web/README.md`** — scripts npm, preview estático, deploy
- **`web/src/components/phrase-game/README.md`** — módulo do jogo (layout, build do banco, OAuth)
- **`connectLLM/README.md`** — índice dos contratos LLM/RAG
