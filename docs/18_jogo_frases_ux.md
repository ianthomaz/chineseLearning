# Jogo de frases — decisões de UX

Estado: **set 2026**. Porque o ecrã de setup é como é, e o que ficou por fazer.

Pontuação: [phrase-game-scoring.md](phrase-game-scoring.md).
Backlog geral: [phrase-game-upgrades.md](phrase-game-upgrades.md).

---

## 1. O problema do setup antigo

O ecrã pedia **oito decisões antes de o jogador ver uma única frase**:

1. "Nível de idioma" — Iniciante / Básico
2. "Dificuldade" — 1 a 5
3. a 7. Cinco checkboxes em "Ajustes de dificuldade"

Quatro problemas concretos:

**Dois nomes, o mesmo sentido.** "Nível de idioma" e "Dificuldade" soam ambos a
dificuldade, mas o primeiro escolhe o **banco de vocabulário** e o segundo o
**comportamento das peças**.

**O título mentia.** Das cinco checkboxes, **quatro tornam o jogo mais fácil**
(pinyin, tradução, mostrar a frase) e só uma o torna mais difícil (hanzi extras)
— todas debaixo de "Ajustes de dificuldade".

**Desmarcavam-se sozinhas.** `clampDisplaySettingsForLevel` apaga opções que o
nível proíbe. Marcar "Hanzi + Pinyin" e depois mudar para o nível 3 fazia a opção
desaparecer sem qualquer explicação.

**Eram redundantes.** Cada checkbox já tinha um botão equivalente **dentro** do
jogo:

| Checkbox no setup | Botão durante a frase |
|---|---|
| Pinyin nas palavras difíceis · Hanzi + Pinyin | `showPinyin` |
| Tradução nas palavras difíceis | `showTranslation` |
| Apresentar frase em português | `showFullPrompt` |
| Adicionar 2 hanzi extras | `removeExtras` (desfaz) |

Ou seja: o setup pedia decisões que o jogo já resolve a pedido, quando o jogador
sabe se precisa delas.

## 2. O que se fez

**Presets.** Três botões que descrevem uma intenção, não uma mecânica
([`presets.ts`](../web/src/lib/phrase-game/presets.ts)):

| | Vocabulário | Dificuldade | Ajudas |
|---|---|---|---|
| 始 **Começar** | só HSK1 | 1 — frases curtas | pinyin em tudo + frase à vista |
| 练 **Treinar** | completo | 2 — até ~5 palavras | tradução nas palavras difíceis |
| 战 **Desafio** | completo | 4 — longas, caracteres soltos | nenhuma (pedir durante o jogo) |

Um preset é só um triplo `(tier, level, settings)` legal — **não há regras de
jogo novas**. Passa pelo mesmo `clampDisplaySettingsForLevel`, por isso nunca
descreve uma combinação que o jogo desfizesse a seguir.

O ecrã abre no preset mais suave, já seleccionado: dá para carregar em Jogar sem
decidir nada.

**"Personalizar" recolhido.** Os controlos completos continuam lá, num
`<details>` fechado, com três correcções:

- "Nível de idioma" → **"Vocabulário"**, com uma linha a dizer o que cada opção
  contém (`só HSK1` / `HSK1 + extra`).
- "Ajustes de dificuldade" → **"Ajudas"** (as que facilitam) e **"Dificultar"**
  (a que complica), separadas.
- Nada fica cinzento sem explicação: um controlo indisponível diz porquê
  ("Indisponível na dificuldade 4"). Quando **todas** as ajudas estão fora, a
  razão aparece uma vez, não quatro.

**Tiers por vir.** Intermediário e Avançado eram dois botões permanentemente
desactivados; são agora uma linha de texto.

## 3. Regra de escrita

Presets e rótulos descrevem **o que o jogador vai ver**, não a implementação.
"Frases longas, palavras partidas em caracteres, peças a mais e sem tradução"
diz mais do que "nível 5, split total, 2 distratores".

## 4. Língua

A UI tem três línguas — **pt-BR, EN, ES** — com as mesmas chaves nas três
(`web/src/messages/`). O português é **pt-BR**: "você", "tela", "celular",
"salvar", "arquivo". Havia strings em pt-PT misturadas ("ecrã", "telemóvel",
"podes", "a carregar"); foram normalizadas. Números seguem a língua
(`1,39` em pt/es, `1.39` em en).

Ao acrescentar uma string: as três línguas ou nenhuma — uma chave em falta
renderiza o próprio caminho da chave (`createTranslator` devolve `path`).

## 5. Cor e contraste

As cores de categoria (`--cat-*`) **invertem** entre temas: `--cat-violet` é
`#7c3aed` (escuro) no claro e `#b794f6` (pálido) no escuro. Texto branco sobre
elas só funciona no tema claro — no escuro dá 2,45:1, abaixo de qualquer mínimo.

Por isso existe **`--on-category`**: branco no claro, `#16130f` no escuro.
Qualquer texto sobre um fundo `--cat-*` usa esse token, nunca `text-white`.
Medido: 5,70:1 no claro, 7,57:1 no escuro.

O bloco `@media (prefers-color-scheme: dark)` não definia nenhum `--cat-*`, por
isso quem tem o SO em escuro e nunca tocou no botão de tema via as cores claras
sobre fundo escuro. Agora espelha o `:root[data-theme="dark"]`.

## 6. Por fazer

- **Persistir** pontos e histórico — é o que falta para o aviso de protótipo sair
  do topo do jogo ([09](09_google_auth_jogo.md) §3).
- **Repetir o que se errou.** Os eventos `phrase_result` já têm o que é preciso
  para re-enfileirar frases falhadas; falta guardá-las por jogador.
- **Preset adaptativo.** Com histórico, um quarto preset "Continuar de onde
  parei" faria mais sentido do que escolher a dificuldade à mão.
- **`respostasAceitas`.** Ferramenta pronta, curadoria por fazer: 557 frases
  ainda têm uma só ordem aceite. Ver
  [phrase-game-accepted-orders.md](phrase-game-accepted-orders.md).
- **`EdgeSettingsDrawer`** continua montado em `/phrase-game`, onde os seus
  interruptores não controlam nada.

*Última revisão: set 2026*
