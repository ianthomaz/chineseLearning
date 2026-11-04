# Roadmap — sequência de trabalho e features grandes

Um produto: site **learnchinese.today** + app iOS **LearnChinese Today**, uma
conta e um progresso. Este doc diz **em que ordem** trabalhar; o detalhe de cada
frente fica no doc dela.

*Revisão: nov 2026, depois de contas (Google, Apple, e-mail, Alipay) e da
junção site + app no mesmo repositório.*

---

## Sequência

Cada fase depende da anterior. Dentro da fase, a ordem é a da tabela.

### Fase 0 — pôr no ar o que já existe

| # | Trabalho | Onde | Quem |
|---|---|---|---|
| 0.1 | **Backup diário** do SQLite de produção (antes de qualquer usuário real) | VM | dono (ops) |
| 0.2 | Deploy do site com contas (e-mail+senha, Alipay, `/api/app/*`) | VM | dono |
| 0.3 | Credenciais: Google iOS client ID | `credentials.json` | dono |
| 0.4 | Teste no iPhone: login Apple/e-mail, rodadas indo para o site | app | dono |
| 0.5 | Resposta à pergunta 7 (Alipay junta por e-mail?) | [05](05_autenticacao.md) | dono |

### Fase 1 — dados confiáveis

| # | Trabalho | Doc |
|---|---|---|
| 1.1 | Ids estáveis no quiz + migração do `progress` | [07](07_conteudo_dados.md) § Pendências |
| 1.2 | Excluir conta e "conectar outra conta" no site | [05](05_autenticacao.md) § Pendências |
| 1.3 | Ligar `anon_id` do convidado ao usuário no primeiro login | [07](07_conteudo_dados.md) § Usuários |
| 1.4 | Admin pelo NOIA (A7) em vez de e-mail no env | [05](05_autenticacao.md) |

### Fase 2 — o app como ferramenta de estudo

| # | Trabalho | Doc |
|---|---|---|
| 2.1 | Guardar Errei/Acertei dos hanzi e priorizar a rotação | `appApple/docs/07_plano_melhorias.md` § 3 |
| 2.2 | Histórico de rodadas no app + "rever erradas" | idem § 2 |
| 2.3 | Frases no pack da biblioteca (atualizar sem nova versão do app) | idem § 2.6 |
| 2.4 | Escrita offline (dados de traço embutidos) + escrever com o dedo | idem § 3 |
| 2.5 | Alipay no app | [05](05_autenticacao.md) § Pendências |

### Fase 3 — loja

TestFlight externo → App Store (fora da China continental no início):
rótulos de privacidade, capturas em en/pt/es, exclusão de conta já pronta.
Passo a passo: `appApple/docs/09_app_store_testflight.md`.

### Fase 4 — catálogo de 老师 (aulas particulares online)

Ver § abaixo. Começa depois da Fase 1 (precisa de contas sólidas e backup).

---

## Catálogo de 老师 — aulas particulares online (ideia, nov 2026)

Pedido do dono: um catálogo de professores de chinês para aula particular
online, dentro do mesmo produto. **Ainda não desenhado** — fica registrado
aqui para a conversa.

O que já existe e serve de base:

- Contas e clearance NOIA → professor pode ser um nível próprio (ex.: insider
  `I*`), e o admin aprova (`clearance_changes`, origem `admin`).
- Progresso do aluno (frases, quiz, hanzi) → o professor poderia ver o que o
  aluno pratica, com permissão.
- Registro de aulas (eixo B, `/registerClass`) → embrião de "aula dada".

Perguntas para decidir antes de qualquer código:

1. **Quem entra no catálogo?** Só professores convidados/aprovados por você, ou
   cadastro aberto com aprovação?
2. **O que o site faz?** Só vitrine (perfil + contato externo: WeChat, e-mail),
   ou agenda + reserva dentro do site?
3. **Pagamento** passa pelo site (Alipay/Stripe, com comissão) ou fica entre
   aluno e professor?
4. **Aula** acontece onde? Link externo (Zoom/Tencent Meeting/VooV) ou vídeo no site?
5. Idiomas do professor (pt/en/es) e fuso — como o catálogo agrupa os perfis.
6. Avaliações de alunos: sim/não no começo?

Proposta de MVP (se a resposta for "vitrine primeiro"): página `/teachers` com
perfis aprovados (foto, idiomas, nível, preço indicativo, fuso, link de
contato), perfil editável pelo próprio professor com clearance de professor, e
botão "pedir aula" que manda um e-mail (Resend) ao professor. Sem pagamento e
sem agenda no MVP.

Atenção à decisão fixa do projeto: **sem busca no site** — o catálogo não terá
campo de busca nem filtro; a forma de organizar os perfis é decisão do dono.

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
