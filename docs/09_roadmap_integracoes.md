# Roadmap — integrações e features grandes

Itens **não** cobertos pelos docs operacionais do dia-a-dia. MVP de cada um indicado.

---

## Registo de aulas (eixo B)

Estado: **MVP implementado** — `/registerClass`, `/reviewClass` (curador only).

### Dois eixos (não misturar)

| Eixo | O quê | Onde |
|------|-------|------|
| **A** | Vocabulário canónico por capítulo de livro | `OrganizeVocabulary_books/` → `book_vocab_entries` |
| **B** | Aula real que registas (data, classe, palavras) | Formulário curador |

Capítulo ≠ aula. Material ref (livro+cap) é opcional.

### Formulário (resumo)

Campos: data, **classe** (dropdown), lista hanzi (vírgulas), notas, material ref opcional.

Ao guardar: destaques da aula + merge em **`lexicon_global`** (nunca apaga ao apagar aula).

Código: `web/src/server/db/lessons.ts`, `RegisterClassForm`, APIs `/api/lessons/**`.

### Catálogo de classes (privado)

A tabela **`classes`** existe — opções do dropdown em `/registerClass`. É **configuração privada do criador** (turmas reais em que dás aulas); **não** faz parte da documentação pública do site e **não** listamos os nomes aqui.

Seed inicial: `web/src/server/db/index.ts` (`INSERT OR IGNORE INTO classes`). Para alterar ou acrescentar turmas, edita esse seed (ou a BD local com `npm run db:studio`) — só curador.

Uso actual: **baixo** — o MVP está implementado mas o fluxo de registo de aulas não é o foco do dia-a-dia neste momento.

Auth: [05_autenticacao.md](05_autenticacao.md)

---

## App iOS — pack biblioteca

Estado: **API implementada** · deploy prod = ops quando autorizares.

Site = **soberano** (SQL). App Hanzi Memorize = consumidor.

| Endpoint | Auth |
|----------|------|
| `GET /api/app/content/manifest` | Bearer `APP_LIBRARY_TOKEN` |
| `GET /api/app/content/pack/library` | igual |

```bash
cd web && npm run build:app-library   # → data/app-library/
```

`contentVersion` sobe quando o fingerprint muda.

Lexico partilhado: [07_conteudo_dados.md](07_conteudo_dados.md) · Classificação LLM: [04_llm_conteudo_rag.md](04_llm_conteudo_rag.md)

Espelho app: `APP_hanziMemorize/docs/03_contratoAtualizacaoAPP.md`

**Fora do pack:** KTV (`/ktv`) — dados em `web/public/ktv/`.

---

## WeChat login

Ver [05_autenticacao.md](05_autenticacao.md) § WeChat — bloqueio administrativo Tencent, não técnico.

---

## Jogo de frases — Fase 2

Ver backlog em [06_jogo_frases.md](06_jogo_frases.md): persistência, `respostasAceitas` (557 frases), histórico por jogador.

*Última revisão: set 2026*
