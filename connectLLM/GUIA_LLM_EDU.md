# Chinese Learning — visão geral da integração LLM

Este guia complementa os outros ficheiros desta pasta (**todos autossuficientes**). Lê primeiro [README.md](README.md) para o índice.

---

## O que estamos a ligar

A **API LLM** é um serviço HTTP único que expõe:

1. **Eixo educacional** (`/edu/*`) — tutor, exercícios, vocabulário, gramática, progresso. Pensado para mandarim / HSK; dados em PostgreSQL.
2. **Outros eixos** (opcional para ti) — RAG com `/ask` + `/ingest` — ver [RAG_PROJETOS_INGEST_ASK.md](RAG_PROJETOS_INGEST_ASK.md).

O chineseLearning (Next, conteúdo em `web/out/`, etc.) pode:

- Chamar só **`/edu`** para funcionalidades de aula e progresso.
- Mais tarde, **indexar** exportações (markdown/texto) no mesmo servidor e usar **`/ask`** para perguntas ao material.

---

## Documentação nesta pasta (sem acesso ao repo da API)

| Ficheiro | Para quê |
|----------|----------|
| [ACESSO_E_VERIFICACAO.md](ACESSO_E_VERIFICACAO.md) | URL base, **como obter e usar o token**, `/health`, segurança |
| [CONTRATO_EDU_COMPLETO.md](CONTRATO_EDU_COMPLETO.md) | Todos os endpoints `/edu` com JSON |
| [RAG_PROJETOS_INGEST_ASK.md](RAG_PROJETOS_INGEST_ASK.md) | Projetos, ingest, `/ask` e polling |

---

## Conteúdo estático deste repo vs API

- **`web/out/`** (vocabulary, grammar, review, …) — ficheiros gerados pelo teu build; **não** são automaticamente a base da API.
- A API **`/edu`** tem as **suas** tabelas. Para alinhar conteúdo:
  - **Script de sync** que lê os teus ficheiros e chama `POST /edu/vocabulary` e `POST /edu/grammar`, **ou**
  - Manter apenas na API o que precisas para tutor/exercícios.

Para **RAG**, o servidor da API precisa de **caminhos de pastas** que o container/processo consiga ler — coordena com quem faz deploy (volumes Docker). Não assumes que o GitHub do chineseLearning é visível de dentro do container sem montagem explícita.

---

## Variáveis de ambiente (app)

- `LLM_API_URL` — sem `/` final.
- `LLM_API_TOKEN` — **apenas servidor** (nunca `NEXT_PUBLIC_*`).

---

## Limitação conhecida (abril 2026)

`POST /edu/chat` aceita `user_id` mas **ainda não** personaliza com base em `edu_progress`. O registo em `POST /edu/progress` já guarda dados para evoluções futuras.

---

## Checklist de integração

1. Ler [ACESSO_E_VERIFICACAO.md](ACESSO_E_VERIFICACAO.md) e validar `health` + uma chamada autenticada.  
2. Implementar fluxos com [CONTRATO_EDU_COMPLETO.md](CONTRATO_EDU_COMPLETO.md).  
3. Quando for altura de RAG, seguir [RAG_PROJETOS_INGEST_ASK.md](RAG_PROJETOS_INGEST_ASK.md) e definir `project_id` e caminhos com a equipa que opera o Docker.
