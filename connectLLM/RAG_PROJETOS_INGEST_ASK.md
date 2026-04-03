# RAG: projetos, ingest e perguntas (`/ask`)

Este documento é **independente** do repositório da API. Descreve como usar a **mesma** API LLM para:

- registar um **projeto** com pastas de ficheiros (markdown, texto, PDFs indexáveis);
- correr **ingest** (indexação vetorial);
- fazer **perguntas** com RAG via `POST /ask` (assíncrono, com polling).

Isto é **distinto** do eixo **`/edu`**: o `/edu` usa tabelas `edu_*` e não a biblioteca RAG. Podes usar **os dois** no mesmo produto (ex.: chat tutor `/edu/chat` + “perguntas ao material” `/ask`).

---

## 1. Autenticação

Igual ao resto da API:

```
Authorization: Bearer <LLM_API_TOKEN>
Content-Type: application/json
```

URLs: ver [ACESSO_E_VERIFICACAO.md](ACESSO_E_VERIFICACAO.md).

---

## 2. Caminhos `sources` — leitura obrigatória

Os valores em `sources` são **caminhos absolutos no sistema de ficheiros onde o processo da API corre**.

- Se a API corre em **Docker no Mac**, só indexa pastas que estejam **montadas** no container (volumes no `docker-compose`) **ou** que existam dentro da imagem.
- O teu repositório **chineseLearning** no teu laptop **não** é visível dentro do container por magia: alguém tem de **montar** essa pasta no compose **ou** copiar o conteúdo para um caminho que o container já veja **ou** correr ingest a partir de um ambiente com o mesmo código sem Docker.

**Antes de automatizar**, confirma com quem opera o servidor um exemplo real de `sources` que já funcione (ex.: `/Users/.../projects/chineseLearning/export-md` montado em `/app/data/chineseLearning`).

---

## 3. Criar ou listar projeto — `GET/POST /projects`

### Listar — `GET {BASE}/projects`

```bash
curl -s -H "Authorization: Bearer $LLM_API_TOKEN" "$LLM_API_URL/projects"
```

Resposta (200) contém `projects[]` com `project_id`, `name`, `sources`, `config_json`, `themes`, datas.

### Criar — `POST {BASE}/projects`

Corpo JSON (201 Created):

```json
{
  "project_id": "chinese_learning",
  "name": "Chinese Learning",
  "sources": [
    "/caminho/absoluto/para/biblioteca-conteudo",
    "/caminho/absoluto/para/mapa-fluxos-opcional"
  ],
  "config_json": null,
  "themes": []
}
```

- `project_id`: slug estável (só letras, números, underscore — usa o que acordares com a equipa).
- `sources`: array de **pastas** (não ficheiros soltos) que o indexer percorre.

### Atualizar — `PUT {BASE}/projects/{project_id}`

Mesmos campos, todos opcionais.

### Apagar — `DELETE {BASE}/projects/{project_id}`

204 sem corpo.

---

## 4. Indexar — `POST {BASE}/ingest`

Dispara indexação em **background** (a resposta HTTP volta logo; a indexação continua no servidor).

### Corpo JSON

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `project_id` | sim | Slug do projeto. |
| `incremental` | não | Default `true` — só ficheiros novos/alterados; `false` força reindexação mais ampla. |
| `name` | não | Nome legível se o projeto for **criado** nesta chamada. |
| `sources` | condicional | Obrigatório se o projeto **ainda não existir** e não houver override por variável de ambiente no servidor. |

### Exemplo — projeto já existe com `sources` configurados

```bash
curl -s -X POST -H "Authorization: Bearer $LLM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"chinese_learning","incremental":true}' \
  "$LLM_API_URL/ingest"
```

### Exemplo — criar projeto e definir pastas na mesma chamada

```bash
curl -s -X POST -H "Authorization: Bearer $LLM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "chinese_learning",
    "name": "Chinese Learning",
    "incremental": true,
    "sources": ["/caminho/no/servidor/que/o/docker/ve"]
  }' \
  "$LLM_API_URL/ingest"
```

### Resposta (200)

```json
{
  "project_id": "chinese_learning",
  "status": "started",
  "message": "Ingest job queued. Indexing runs in background."
}
```

Erro **400** típico: projeto não existe e não enviaste `sources` nem existe `PROJECT_ID_SOURCES` no ambiente do servidor.

---

## 5. Pergunta com RAG — `POST {BASE}/ask`

Assíncrono: devolve **202** com `job_id`; o cliente faz polling.

### Corpo JSON

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `project_id` | sim | Mesmo slug usado no ingest. |
| `question` | sim | Texto da pergunta. |
| `user_id` | não | Identificador do utilizador para histórico no Postgres. |
| `user_context` | não | Objeto opcional (nome, CEP, etc.) — ver exemplos na documentação de integradores. |
| `history` | não | Últimas mensagens `{role, text}`. |
| `system_prompt` | não | Prefixo de persona. |
| `model` | não | `fast` / `smart` / nome Ollama. |

### Exemplo

```bash
curl -s -X POST -H "Authorization: Bearer $LLM_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "chinese_learning",
    "question": "Resumo das regras do tom 3",
    "user_id": "web-user-1"
  }' \
  "$LLM_API_URL/ask"
```

Resposta (202):

```json
{
  "job_id": "uuid",
  "message": "Question received...",
  "status_url": "/status/uuid",
  "result_url": "/result/uuid"
}
```

### Polling — `GET {BASE}/status/{job_id}`

Repetir até `status` deixar de ser `queued` ou `working`:

```json
{
  "job_id": "...",
  "status": "working",
  "client_status": "processing",
  "progress": "generating",
  "created_at": "2026-04-03T12:00:00Z"
}
```

Estados finais incluem: `done`, `no_answer`, `need_more_info`, `failed`, `cancelled`.

### Resultado — `GET {BASE}/result/{job_id}`

```json
{
  "job_id": "...",
  "status": "done",
  "answer": "Texto da resposta...",
  "sources": [{ "url": "https://..." }],
  "confidence": "high"
}
```

`source` só traz **URLs** públicas quando os chunks indexados têm metadata com `url`.

---

## 6. Resumo: EDU vs RAG

| Aspeto | `/edu/*` | `/ask` + ingest |
|--------|----------|------------------|
| Dados | Tabelas SQL (`edu_vocabulary`, …) | Ficheiros em disco + Chroma |
| Latência | Síncrono por request | 202 + polling |
| Uso típico | Tutor, exercícios, progresso | Perguntas ao “manual” ou conteúdo exportado |

---

## 7. Onde obter mais detalhe sem o repo

Se a equipa da API partilhar um manual externo (PDF, wiki), usa-o para campos avançados de `user_context`, políticas por projeto em `config_json`, e troubleshooting. **Este ficheiro** cobre o mínimo para chineseLearning avançar sem clones.

Próximo passo após RAG: alinhar com operação **caminhos montados no Docker** e um `project_id` único (ex.: `chinese_learning`).
