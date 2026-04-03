# Contrato completo — eixo `/edu/*` (API LLM)

Referência autossuficiente. **Todas** as rotas abaixo exigem:

```
Authorization: Bearer <LLM_API_TOKEN>
Content-Type: application/json
```

(exceto quando indicado noutro documento). Substitui `{BASE}` pela tua URL base (ex.: `https://llm.webplace.cc`).

---

## Visão geral

| Aspeto | Valor |
|--------|--------|
| Natureza | Rotas **síncronas** — a resposta vem no mesmo HTTP request (não há `job_id`). |
| Dados | Vocabulário e gramática em PostgreSQL (`edu_vocabulary`, `edu_grammar`); progresso em `edu_progress`. |
| LLM | Ollama; por defeito modelo **`smart`** (configurável com campo `model` onde existir). |
| Idioma / nível | Por defeito `language: zh-CN`, níveis tipo **HSK1** … **HSK6**. |

---

## `POST {BASE}/edu/chat`

Tutor: recebe a mensagem do aluno e devolve texto de resposta. O servidor carrega vocabulário e gramática do nível para enriquecer o prompt.

### Corpo JSON (request)

| Campo | Obrigatório | Tipo | Notas |
|-------|-------------|------|--------|
| `message` | sim | string | Mínimo 1 carácter. |
| `user_id` | não | string | Aceite mas **ainda não** altera o prompt com base em progresso (abril 2026). |
| `language` | não | string | Default `zh-CN`. |
| `level` | não | string | Ex.: `HSK1`. Se vazio, o backend pode assumir comportamento por defeito. |
| `history` | não | array | Turnos `{ "role": "user"\|"assistant", "text": "..." }` — também aceita `content` em vez de `text`. |
| `model` | não | string | `fast`, `smart` ou nome completo do modelo Ollama. |

### Exemplo request

```json
{
  "message": "Como digo 'bom dia'?",
  "user_id": "web:usuario-uuid",
  "level": "HSK1",
  "language": "zh-CN",
  "history": [
    {"role": "user", "text": "Oi!"},
    {"role": "assistant", "text": "你好 — Olá!"}
  ]
}
```

### Exemplo response (200)

```json
{
  "reply": "Para dizer 'bom dia', usamos 早上好 (Zǎoshang hǎo).",
  "language": "zh-CN"
}
```

### Erros

- **500** — falha Ollama ou interna; corpo pode conter `detail` com mensagem.

---

## `POST {BASE}/edu/exercise`

Gera exercícios. É necessário haver **vocabulário** na base: ou envias `vocab_ids`, ou há entradas para o par `language` + `level`.

### Corpo JSON (request)

| Campo | Obrigatório | Tipo | Notas |
|-------|-------------|------|--------|
| `level` | sim | string | Nível HSK ou custom. |
| `language` | não | string | Default `zh-CN`. |
| `user_id` | não | string | Opcional. |
| `vocab_ids` | não | string[] | UUIDs de linhas em `edu_vocabulary`. Se preenchido, usa estas entradas. |
| `exercise_types` | não | string[] | Ex.: `fill_blank`, `translation`, `char_recognition`, `sentence_construction`. |
| `count` | não | int | Default 5; mínimo 1, máximo 20. |
| `model` | não | string | `fast` / `smart` / nome Ollama. |

### Exemplo request

```json
{
  "user_id": "web-user-1",
  "level": "HSK1",
  "language": "zh-CN",
  "count": 3,
  "exercise_types": ["fill_blank", "translation"]
}
```

### Exemplo response (200)

```json
{
  "language": "zh-CN",
  "level": "HSK1",
  "exercises": [
    {
      "type": "translation",
      "prompt": "Traduza: 你好",
      "answer": "Olá",
      "options": ["Olá", "Obrigado", "Adeus", "Por favor"],
      "hint": "É a saudação mais comum.",
      "vocab_id": "uuid-da-palavra"
    }
  ],
  "count": 1
}
```

### Erros

- **400** — texto típico: *No vocabulary found for the specified level/IDs.* — popula primeiro com `POST /edu/vocabulary` ou ajusta `level`/`language`.

---

## `GET {BASE}/edu/vocabulary`

Lista entradas de vocabulário.

### Query parameters

| Parâmetro | Obrigatório | Default | Notas |
|-----------|-------------|---------|--------|
| `language` | não | `zh-CN` | |
| `level` | não | — | Filtra por nível exato (ex. `HSK1`). |
| `limit` | não | 50 | |
| `offset` | não | 0 | |

### Exemplo

```bash
curl -s -H "Authorization: Bearer $LLM_API_TOKEN" \
  "$LLM_API_URL/edu/vocabulary?language=zh-CN&level=HSK1&limit=20&offset=0"
```

### Response (200)

```json
{
  "items": [
    {
      "id": "uuid",
      "language": "zh-CN",
      "hanzi": "谢谢",
      "pinyin": "xièxie",
      "translation": "obrigado",
      "level": "HSK1",
      "category": "expressão",
      "example_sentence": "谢谢老师",
      "example_pinyin": "Xièxie lǎoshī",
      "example_translation": "Obrigado, professor"
    }
  ],
  "total": 1
}
```

---

## `POST {BASE}/edu/vocabulary`

Cria uma entrada.

### Corpo JSON

| Campo | Obrigatório | Notas |
|-------|-------------|--------|
| `hanzi` | sim | |
| `pinyin` | sim | |
| `translation` | sim | |
| `level` | sim | |
| `language` | não | Default `zh-CN`. |
| `category` | não | |
| `example_sentence` | não | |
| `example_pinyin` | não | |
| `example_translation` | não | |

### Exemplo

```json
{
  "hanzi": "谢谢",
  "pinyin": "xièxie",
  "translation": "obrigado",
  "level": "HSK1",
  "category": "expressão",
  "example_sentence": "谢谢老师",
  "example_pinyin": "Xièxie lǎoshī",
  "example_translation": "Obrigado, professor"
}
```

### Response (200)

Devolve o objeto criado, incluindo `id` (UUID string).

---

## `GET {BASE}/edu/grammar`

Lista pontos gramaticais.

### Query parameters

| Parâmetro | Obrigatório | Default |
|-----------|-------------|--------|
| `language` | não | `zh-CN` |
| `level` | não | — filtro opcional |

### Response (200)

```json
{
  "items": [
    {
      "id": "uuid",
      "language": "zh-CN",
      "pattern": "A 是 B",
      "explanation": "Verbo de ligação 'ser'...",
      "level": "HSK1",
      "examples": [
        {"hanzi": "我是学生", "pinyin": "Wǒ shì xuésheng", "translation": "Eu sou estudante"}
      ]
    }
  ],
  "total": 1
}
```

---

## `POST {BASE}/edu/grammar`

Cria um ponto gramatical.

### Corpo JSON

| Campo | Obrigatório |
|-------|-------------|
| `pattern` | sim |
| `explanation` | sim |
| `level` | sim |
| `language` | não (default `zh-CN`) |
| `examples` | não | Array de `{ "hanzi", "pinyin"?, "translation" }` |

### Exemplo

```json
{
  "pattern": "A 是 B",
  "explanation": "Verbo de ligação 'ser' para conectar dois substantivos.",
  "level": "HSK1",
  "examples": [
    {"hanzi": "我是学生", "pinyin": "Wǒ shì xuésheng", "translation": "Eu sou estudante"}
  ]
}
```

---

## `POST {BASE}/edu/progress`

Regista se o aluno acertou ou errou numa palavra (`vocab_id`). Após **5** respostas corretas acumuladas, o registo passa `mastered: true`.

### Corpo JSON

| Campo | Obrigatório | Tipo |
|-------|-------------|------|
| `user_id` | sim | string |
| `vocab_id` | sim | string (UUID da palavra) |
| `correct` | sim | boolean |

### Exemplo request

```json
{
  "user_id": "web-user-1",
  "vocab_id": "550e8400-e29b-41d4-a716-446655440000",
  "correct": true
}
```

### Exemplo response (200)

```json
{
  "user_id": "web-user-1",
  "vocab_id": "550e8400-e29b-41d4-a716-446655440000",
  "seen_count": 5,
  "correct_count": 3,
  "mastered": false
}
```

---

## Fluxo pedagógico sugerido

1. Definir nível do aluno (ex.: HSK1).
2. Garantir vocabulário (import ou `POST /edu/vocabulary`).
3. Opcional: `POST /edu/grammar` para regras.
4. Prática: `POST /edu/chat`.
5. Reforço: `POST /edu/exercise`.
6. A cada resposta do aluno a exercícios: `POST /edu/progress`.

---

## Documentos relacionados nesta pasta

- [ACESSO_E_VERIFICACAO.md](ACESSO_E_VERIFICACAO.md) — token e URLs.  
- [GUIA_LLM_EDU.md](GUIA_LLM_EDU.md) — contexto chineseLearning + RAG futuro.  
- [RAG_PROJETOS_INGEST_ASK.md](RAG_PROJETOS_INGEST_ASK.md) — `/projects`, `/ingest`, `/ask`.
