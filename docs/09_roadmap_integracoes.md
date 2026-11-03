# Roadmap — integrações e features grandes

Itens **não** cobertos pelos docs operacionais do dia-a-dia. MVP de cada um indicado.

---

## Registo de aulas (eixo B)

Estado: **MVP implementado** — `/registerClass`, `/reviewClass` (curador only).

### Dois eixos (não misturar)

| Eixo | O quê | Onde |
|------|-------|------|
| **A** | Vocabulário canónico por capítulo de livro | `vocabulario/OrganizeVocabulary_books/` → `book_vocab_entries` |
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

Espelho app: `appApple/docs/03_contratoAtualizacaoAPP.md`

**Fora do pack:** KTV (`/ktv`) — dados em `web/public/ktv/`.

---

## Site + app como um produto só (nov 2026)

App iOS **LearnChinese Today** (`appApple/`, bundle `today.learnchinese.app`):
Hanzi Memorize + **Jogo de Frases offline** com as mesmas regras e pontuação do
site (portado de `web/src/lib/phrase-game/`). Estado, instalação em dev e
pendências do app: `appApple/docs/06_instalar_e_estado.md`.

Para partilhar pontuação: identidade e token do app em
[05](05_autenticacao.md) § Roadmap; dados em [07](07_conteudo_dados.md) §
Pendências.

### App Store na China (anotado, não prioritário)

- A App Store da China continental exige **número de 备案 ICP**; em geral pede
  entidade chinesa. Caminho prático: publicar em todos os países menos China
  continental. Quem está na China com Apple ID de outro país baixa normalmente;
  TestFlight funciona na China.
- Manter categoria **Educação**: app na categoria Jogos exige licença (版号).

### Site na China

`app/layout.tsx` carrega a fonte de `fonts.googleapis.com` como CSS bloqueante
no `<head>`. Na China sem VPN o domínio é bloqueado e pode segurar a primeira
pintura até timeout. **Medir** de dentro da China sem VPN antes de mexer
(alternativa: auto-hospedar um subset ou usar a fonte CJK do sistema).

---

## WeChat login

Ver [05_autenticacao.md](05_autenticacao.md) § WeChat — bloqueio administrativo Tencent, não técnico.

---

## Jogo de frases — Fase 2

Ver backlog em [06_jogo_frases.md](06_jogo_frases.md): persistência, `respostasAceitas` (557 frases), histórico por jogador.

*Última revisão: set 2026*
