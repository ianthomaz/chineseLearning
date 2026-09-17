# Learn Chinese — documentação

Site Next.js em **`web/`** · produção **`https://learnchinese.today/`**

**10 ficheiros** — por ordem de leitura:

| # | Doc | Para quê |
|---|-----|----------|
| 1 | [01_readme.md](01_readme.md) | Este índice |
| 2 | [02_arquitetura.md](02_arquitetura.md) | Pastas, builds, rotas, scripts |
| 3 | [03_operacao_e_deploy.md](03_operacao_e_deploy.md) | Dev local, portas, deploy itcsVM3, nginx |
| 4 | [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md) | Tutor, API LLM, RAG, classificação léxico |
| 5 | [05_autenticacao.md](05_autenticacao.md) | Google OAuth, sessão, telemetria, WeChat (futuro) |
| 6 | [06_jogo_frases.md](06_jogo_frases.md) | Jogo `/phrase-game` — regras, UX, pontuação, backlog |
| 7 | [07_conteudo_dados.md](07_conteudo_dados.md) | SQLite/Prisma, seed, hanzi strokes, pack app |
| 8 | [08_produto_observabilidade.md](08_produto_observabilidade.md) | Performance, GA4, cookies, áudio |
| 9 | [09_roadmap_integracoes.md](09_roadmap_integracoes.md) | Registo de aulas, app iOS, pendências grandes |
| 10 | [10_compliance.md](10_compliance.md) | Textos legais, privacidade, termos |

## Qual doc abrir?

| Precisas de… | Doc |
|--------------|-----|
| Correr o site local / fazer deploy | [03_operacao_e_deploy.md](03_operacao_e_deploy.md) |
| Entender pastas e builds | [02_arquitetura.md](02_arquitetura.md) |
| Tutor, API LLM ou ingest RAG | [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md) + [`connectLLM/`](../connectLLM/README.md) |
| Login Google, quem vê o quê | [05_autenticacao.md](05_autenticacao.md) |
| Jogo de frases, pontuação, curadoria | [06_jogo_frases.md](06_jogo_frases.md) |
| Editar blocos, SQLite, Prisma, hanzi | [07_conteudo_dados.md](07_conteudo_dados.md) |
| GA, cookies, performance, áudio | [08_produto_observabilidade.md](08_produto_observabilidade.md) |
| Aulas curador, app iOS, backlog grande | [09_roadmap_integracoes.md](09_roadmap_integracoes.md) |
| Privacidade / termos / split legal | [10_compliance.md](10_compliance.md) |

## Visão rápida

- **Estudo:** `/review`, `/vocabulary`, `/grammar`, `/dialogues`, `/visuals`
- **Prática:** `/phrase-game` (sem login), `/praticar` + `/tutor` (login), `/gamification` (login), `/ktv`
- **Tutor:** `POST /api/chat` → `/edu/chat` — só com `next start` (não no export estático)
- **Conteúdo jogo:** `FRASES_GAME/curated/` → build → SQLite
- **Contratos LLM completos:** [`connectLLM/`](../connectLLM/README.md)

## Docs noutras pastas (não contam nos 10)

| Onde | O quê |
|------|--------|
| [`web/README.md`](../web/README.md) | Scripts npm resumidos |
| [`web/deploy/README.md`](../web/deploy/README.md) | Runbook nginx |
| [`web/src/components/phrase-game/README.md`](../web/src/components/phrase-game/README.md) | Módulo React do jogo |
| [`local/credentials/README.md`](../local/credentials/README.md) | Credenciais OAuth/ENV |

## Decisões de produto (fixas)

- **Sem busca global** no site — nunca.
- **PWA/offline** adiado.
- **UI:** pt-BR, EN, ES — chave nova entra nas três ou em nenhuma.
