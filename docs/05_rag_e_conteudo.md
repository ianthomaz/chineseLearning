# RAG e conteúdo

## Duas “camadas” de conteúdo

1. **Site (páginas estáticas/SSG)** — ficheiros em **`Content/`** (e processamento em build via `parse-consolidado.mjs`). Isto alimenta a navegação e textos embutidos no Next.
2. **Biblioteca vetorial na API** — ficheiros em **`rag_knowledge/`** enviados para a API com **`POST /ingest`**, projeto **`chinese_learning`**, para uso futuro ou paralelo com endpoints tipo **`/ask`** (conforme a API).

O chat do tutor no eixo atual usa **`/edu/chat`**; o ingest alinha o projeto e os documentos na API para políticas RAG definidas lá. Não confundir “conteúdo no site” com “já ingestado na API”.

## Ingest a partir deste repo

Na pasta **`web/`**, com API a correr e **`web/.env.local`** com `LLM_API_TOKEN`:

```bash
npm run ingest:rag
```

Isto invoca **`connectLLM/ingest-chinese-learning.sh`**. Requisitos adicionais (caminhos visíveis pelo processo Docker da API, variáveis no `featureLLM`, etc.) estão em **`connectLLM/RAG_PROJETOS_INGEST_ASK.md`** e documentação do projeto da API.

## Verificação do projeto na API

`./start.sh` (e fluxos que chamam o mesmo check) pode avisar se **`chinese_learning`** não aparece em **`GET /projects`**. Nesse caso, uma ingest bem-sucedida costuma registar o projeto na primeira vez.

## Ficheiros de referência em `rag_knowledge/`

Exemplos: `extraContent.md`, `vocabulario_estruturas.md`, `dialogos_pratica.md`. Alterações aqui implicam **voltar a correr ingest** se quiseres o índice na API atualizado.
