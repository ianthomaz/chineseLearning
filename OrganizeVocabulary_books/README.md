# OrganizeVocabulary_books — léxico curado dos PDFs

Seed do léxico dos livros **新时代汉语口语** (初级·上 + 初级·下).

**Escopo:** só léxico estruturado por lição. Sem ligação a site, HTML ou aulas reais.

## O que vai para o git

| Incluir | Excluir (ficam só na máquina) |
|---------|-------------------------------|
| `curated/**/*.json` — lições, índice, progresso | `*.pdf` — livros fonte |
| `README.md`, `curated/README.md` | `scripts/` — ferramentas de extração |
| | `output/` — rascunho automático antigo |
| | `schema.json` — schema do pipeline `output/` |

**Fonte de verdade no repositório:** `curated/`

## Estrutura curada (`curated/`)

Cada `primary-up/lesson-NN.json` e `primary-down/lesson-NN.json` tem dois agrupamentos em paralelo:

### 1. `byLessonSource` — como o livro apresenta

| Bloco | Origem no PDF |
|-------|----------------|
| `text` | 促成—课文 (词语表 N-1) |
| `extension` | 促成—拓展 (词语表 N-4) |
| `produce` | 任务支持 (core + supplement por tema) |

Cada entrada: `hanzi`, `pinyin`, `pos`, `glossEn`, `examples`.

### 2. `byPos` — categorias linguísticas

Agrupamento por classe gramatical (动, 名, 形, 副, 代, 连, 量, 专有…).

Palavras só em 任务支持 sem entrada completa na lição → `produceOnly`.

Mapa POS → inglês: `_pos-map.json`.

## Ficheiros principais

| Ficheiro | Conteúdo |
|----------|----------|
| `primary-up/lesson-01.json` … `lesson-16.json` | 初级·上, lição a lição |
| `primary-down/lesson-01.json` … `lesson-16.json` | 初级·下, lição a lição |
| `lexicon-by-book.json` | Índice global (hanzi → lições + POS) |
| `progress.json` | Estado da curadoria (32/32) |
| `_pos-map.json` | Mapa 动/名/形 → chaves em inglês |

## Progresso

Ver `curated/progress.json` — **32/32 lições** revisadas (`primary-up` 1–16 + `primary-down` 1–16).

## Regenerar localmente (opcional)

Requer PDFs e `scripts/` na máquina (não estão no git):

```bash
python3 OrganizeVocabulary_books/scripts/build_curated.py
python3 OrganizeVocabulary_books/scripts/review_and_fix_curated.py
python3 OrganizeVocabulary_books/scripts/build_lexicon_from_curated.py
```

Depois de rever, commitar só as alterações em `curated/`.
