# Ordens alternativas aceites (`respostasAceitas`)

Estado: **ferramenta pronta, curadoria por fazer** (set 2026).

## O problema

`validate.ts` compara a resposta do jogador com **uma** string canónica. Chinês
aceita reordenações válidas, por isso o jogo marcava respostas certas como
erradas — e, desde que a pontuação passou a valer, isso custa pontos. Pune
precisamente quem percebeu a gramática bem o suficiente para produzir uma
variante correcta.

Caso reportado (`docs/phrase-game-upgrades.md` §14), agora **corrigido**:

| | |
|---|---|
| Peças | `太太 给 他 一只 很小的 狗` |
| Canónica | `太太给他一只很小的狗` |
| Montada pelo jogador | `他给太太一只很小的狗` — chinês correcto |
| Antes | *"Quase!"* |
| Agora | aceite |

Restam **557** frases com ≥3 peças e nenhuma alternativa listada.

## A regra

Uma resposta aceite só pode ser uma **reordenação das peças que o jogador
recebe**. Não pode introduzir, remover, partir ou alterar um carácter — o
tabuleiro nem conseguiria produzir tal resposta.

A verificação vive num único sítio,
[`web/scripts/accepted-orders-lib.mjs`](../web/scripts/accepted-orders-lib.mjs),
e corre em **três** momentos: ao filtrar a saída do LLM, antes de escrever no
banco, e no validador do build. O build **falha** se uma resposta inválida
chegar lá:

```
[phrase-game] ERROR pg-559: respostasAceitas "他给太太一只很大的狗" — not a reordering of the phrase's pieces
[phrase-game] build failed: 1 error(s).
```

## Como curar

Nada entra no banco sem aprovação humana.

```bash
cd web

# 1. Ver o que seria enviado (sem chamar o LLM)
node scripts/propose-accepted-orders.mjs

# 2. Pedir propostas ao LLM do site (precisa de LLM_API_URL de pé)
node scripts/propose-accepted-orders.mjs --llm --limit 60 --batch 15
```

Isto escreve **só** um ficheiro de revisão:
`FRASES_GAME/curated/pending-accepted-orders.json`.

```jsonc
{
  "id": "pg-559",
  "hanzi": "太太给他一只很小的狗",
  "pieces": ["太太", "给", "他", "一只", "很小的", "狗"],
  "alternative": "他给太太一只很小的狗",
  "reason": "…",
  "approved": null        // ← mude para true nas que aceitar
}
```

```bash
# 3. Aprovar: editar o ficheiro, pôr "approved": true nas boas
# 4. Ver o que mudaria
node scripts/apply-accepted-orders.mjs --dry-run

# 5. Aplicar ao banco curado
node scripts/apply-accepted-orders.mjs

# 6. Reconstruir — o seed normal SALTA tabelas com linhas, daí o FORCE_RESEED
npm run prebuild:phrase-game
FORCE_RESEED=1 npm run seed:content
```

Notas:

- Re-correr o passo 2 **não perde aprovações**: decisões anteriores são
  preservadas por `id` + alternativa.
- `approved` só conta quando é exactamente `true`; `null` e `false` são ignorados.
- O passo 6 é essencial em modo servidor: `getAllPhrases()` lê o SQLite, não o
  JSON. Sem `FORCE_RESEED=1` o jogador continua a ver as respostas antigas.

## O prompt

O LLM é instruído a devolver **lista vazia por omissão** — a maioria das frases
não tem alternativa válida, e modelos tendem a inventar uma para agradar.
Depois disso, tudo o que ele propuser passa pelo verificador mecânico: uma
sugestão que troque um carácter é descartada com a razão à vista.

*Última revisão: set 2026*
