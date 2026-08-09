# 15 — Contrato de trabalho: LLM × classificação do léxico

Âmbito: **site + app** (Hanzi Memorize).  
Não substitui o eixo tutor (`/edu/chat`); define o que o **orquestrador na tua LLM** deve devolver quando este job existir.

Atualizado: 2026-07-24.

---

## Papéis (não confundir)

| Papel | Quem | O quê |
|-------|------|--------|
| **Soberano** | Site (`chineseLearning` / SQL + seed) | Onde a informação vive e é classificada. Job LLM, assignments, `lexico_entries`, snapshot. |
| **Consumidor** | App + widgets (`APP_hanziMemorize`) | Lê o pack (`contentVersion` / `lexico.json` / API). **Não** classifica; **não** é SoT. |

Falar deste contrato “no site” é porque a classificação e o SQL são cá. O **motivo** de classificar bem é o app: rotação horária nos widgets e prática avulsa usam o mesmo pool (`lexico_entries` no pack). Site `/praticar` avulso também lê esse pool — espelho do app, não um segundo léxico.

Pipeline curto:

```
aula/contexto no site → (LLM classify se preciso) → lexico_entries
    → build:app-library / API pack → app + widgets
```

Contrato de entrega ao app: [14_app_library_contract.md](14_app_library_contract.md).  
Espelho no app: `APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md` (+ checklist de update) e `Shared/LEXICON_GROWTH.md`.

---

## Premissas (infra que já tens)

| Premissa | Detalhe |
|----------|---------|
| Onde corre a API | **Mac mini (mini62)** — stack **`ITCS/featureLLM`** (Ollama + orquestrador Docker). Ver [03_llm.md](03_llm.md). |
| Como o site chega lá | `LLM_API_URL` + `LLM_API_TOKEN` (mesmo par do **chat tutor**). Dev: `127.0.0.1:28471`; prod/VM: `https://llm.webplace.cc` ou IP via **Tailscale** até ao Mac (quando a rede estiver ligada). |
| Controlo | LLM **pessoal**: dá para afinar prompt, alias `fast`/`smart`, validação JSON e **endpoint dedicado** no orquestrador sem depender de produto SaaS. |
| Acesso neste repo | Já existe: proxy `POST /aulaChines/api/chat` → `/edu/chat`. O job de léxico **reutiliza a mesma base URL/token**; o formato de resposta ideal é **outro** (ver abaixo). |

Contratos gerais `/edu/*`: `connectLLM/CONTRATO_EDU_COMPLETO.md` e fonte canónica `ITCS/featureLLM/docs/EDU_API_CONTRACT.md`.

---

## Problema de produto

1. O **app** (widgets + prática avulsa) e o site `/praticar` avulso leem o mesmo pool: **`lexico_entries`** (só palavras **com** `rotation_category_id`).
2. Fontes soberanas no site (sem livro): blocos editoriais, `context_deck_cards`, `lexicon_global`.
3. Blocos já têm categoria via mapa fixo. Palavras **só** de contexto/aula precisam de categoria nas 7 buckets existentes.
4. Sem categoria → **pending** no site (não entram no pack → widgets não as mostram). Com categoria → `LEXICO_REBUILD` + pack → `contentVersion` sobe → app atualiza.

Ver [11_content_db_schema.md](11_content_db_schema.md) e [14_app_library_contract.md](14_app_library_contract.md).

---

## Por que um contrato à parte (e não só prompt no `/edu/chat`)

`/edu/chat` está otimizado para **tutor** → `reply_structured[]` com hanzi/pinyin/traduções por frase.

Classificar léxico precisa de:

- catálogo fixo de **7** `rotationCategoryId`;
- array 1:1 com as palavras enviadas;
- `confidence` + `rationale` curtos para review humano;
- **zero** prosa de tutor.

Hoje o gancho em `web/src/server/lexico/classify.ts` ainda chama `/edu/chat` e tenta extrair JSON do texto — **ponte temporária**. O alvo é um endpoint (ou modo) no **orquestrador featureLLM** que valide e devolva o schema abaixo, como já faz com `reply_structured` no edu.

Por ser a tua LLM: se este contrato estiver claro, o orquestrador no mini62 pode:

- system prompt + schema fixo;
- 1 retry se JSON inválido / categoria fora do enum;
- rejeitar ids inventados;
- opcionalmente alias `LLM_LEXICO_CLASSIFY_MODEL` (sugerido: `smart`).

---

## Categorias (enum fechado)

IDs estáveis — espelho de `web/scripts/lexico-rotation-config.mjs`:

| `rotationCategoryId` | Título (UI) |
|----------------------|-------------|
| `basics` | Básicos: números, tempo e perguntas |
| `people` | Pessoas, família e pronomes |
| `places_world` | Lugares, países e movimento |
| `food` | Frutas e bebidas |
| `descriptions` | Cores e qualidades |
| `verbs` | Verbos, gostos e preferências |
| `grammar_bits` | Partículas e revisão essencial |

Regras de desempate (orquestrador / prompt):

1. Ação / processo → `verbs`
2. Partícula, conector, classificador, “cola” gramatical → `grammar_bits`
3. Papel social / grupo / pessoa → `people`
4. Sítio, deslocação, objeto físico de sítio → `places_world`
5. Qualidade, cor, adjetivo, nome abstrato de qualidade → `descriptions`
6. Tempo / perguntas / bits de rotina de estudo → `basics`
7. Comida / bebida → `food`
8. Em dúvida: escolher uma e baixar `confidence` (&lt; 0.6)

Limite de produto no site: só hanzi com **≤ 3** caracteres (Unicode) entram no pool; compostos maiores ficam só em context decks.

---

## Contrato alvo (orquestrador)

Nome sugerido no featureLLM (a confirmar quando implementares na API):

`POST {LLM_API_URL}/edu/lexico/classify`  
(ou `/jobs/lexico-classify` — o path exacto decide-se no repo da API; o **body/response** é o que importa.)

Auth: igual ao resto — `Authorization: Bearer <LLM_API_TOKEN>`.

### Request

```json
{
  "schemaVersion": 1,
  "language": "zh-CN",
  "model": "smart",
  "candidates": [
    {
      "hanzi": "社团",
      "pinyin": "shètuán",
      "translation": "clube; associação estudantil",
      "from": "context:aulas_semana2"
    }
  ]
}
```

| Campo | Notas |
|-------|--------|
| `schemaVersion` | Começar em `1`; o site rejeita major desconhecido. |
| `candidates[]` | Lote pequeno (ex. ≤ 40) para JSON estável. |
| `from` | Origem editorial (`context:…`, `lexicon_global`) — contexto para o modelo, não vira categoria. |
| `model` | Opcional; default no servidor pode ser `smart` para este job. |

### Response 200

```json
{
  "schemaVersion": 1,
  "classifications": [
    {
      "hanzi": "社团",
      "rotationCategoryId": "people",
      "confidence": 0.82,
      "rationale": "group / social role"
    }
  ]
}
```

| Campo | Obrigatório | Regra |
|-------|-------------|--------|
| `hanzi` | sim | Exact match a um candidate |
| `rotationCategoryId` | sim | **Só** um dos 7 ids |
| `confidence` | recomendado | 0–1 |
| `rationale` | opcional | Curto, EN ou PT |

Validação no orquestrador (espelho do que o site fará):

1. Array não vazio se `candidates` não vazio  
2. Todo `hanzi` do request aparece **no máximo uma vez** na resposta  
3. `rotationCategoryId` ∈ enum  
4. Se faltar algum `hanzi`, o cliente trata como pending (não inventa categoria)

Erros: 401/403 token; 422 schema; 503 modelo indisponível — alinhado ao resto da API.

---

## Fluxo de trabalho (site / ops)

```
fontes SQL (sem livro)
    → diff vs lexico_entries + assignments
    → pending
    → LLM (este contrato)     [Mac / site com LLM_API_*]
    → review humano (confidence baixa)
    → web/scripts/lexico-category-assignments.mjs
    → LEXICO_REBUILD=1 npm run seed:content
    → build:app-library → contentVersion↑ → app/widgets
```

Comandos já no repo:

```bash
cd web
npm run lexico:pending        # lista gaps
npm run lexico:classify-llm   # ponte actual via /edu/chat (temporária)
# depois de merge no assignments:
LEXICO_REBUILD=1 npm run seed:content
```

Código parcial: `web/src/server/lexico/{pending,classify}.ts`.  
**Não** auto-grava no SQL: classificação errada no widget é cara de reverter na UX do telemóvel.

---

## O que o orquestrador no mini62 deve ganhar (backlog API)

1. [ ] Endpoint (ou modo) com schema deste doc + validação enum  
2. [ ] Retry 1× se JSON inválido (padrão já usado no `/edu/chat`)  
3. [ ] Default `model=smart` só neste job (tutor continua `fast`)  
4. [ ] Log INFO: tamanho do lote, falhas de enum, latência  
5. [ ] (Opcional) `dry_run` que só devolve classificação sem side effects na API  

Enquanto 1–2 não existem: manter a ponte `/edu/chat` + parse + review manual.

---

## Fora de âmbito

- Ligar **Tailscale** só para validar latência/rota até ao mini62 — fora do contrato de JSON; ops de rede quando precisares.  
- Vocabulário do **livro** (`book_vocab_*`) — não entra no pool de widgets.  
- RAG `/ask` — eixo diferente; não misturar com classify.  
- Tabela só para widget — **não**; consumo = `lexico_entries`.

---

## Referências

- [03_llm.md](03_llm.md) — URL, token, health, tutor  
- [11_content_db_schema.md](11_content_db_schema.md) — materialização do léxico  
- [14_app_library_contract.md](14_app_library_contract.md) — pack app / widgets  
- `connectLLM/CONTRATO_EDU_COMPLETO.md` — `/edu/chat` actual  
- `ITCS/featureLLM` — implementação do orquestrador (mini62)
