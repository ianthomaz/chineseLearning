# Ordens alternativas no jogo de frases

Regra pedagógica para o tutor e para o RAG. Isto **não** é um corpus de tudo o que um nativo entenderia.

## Quando listar outra ordem

Só quando a ordem for estrutura **padrão, neutra e ensinável** em manual de mandarim, e preservar:

- as mesmas relações gramaticais;
- o mesmo significado básico;
- o mesmo registro;
- a mesma estrutura informacional, tanto quanto possível;
- todas as fronteiras de constituinte.

A expectativa é **zero alternativas** na maior parte das frases. Na dúvida, não listar.

## O que rejeitar

Não gerar alternativas que dependam de discurso: contraste, topicalização, ênfase, elipse, frase anterior, entoação especial, ou contexto só falado/coloquial.

Não mover objeto para o início só porque o chinês admite tópico-comentário.

Exemplo: de `我喝茶` **não** gerar `茶我喝`. `茶，我喝` pode ocorrer como tópico contrastivo (“chá, eu bebo”), mas não é ordem normal de exercício para iniciante.

Não partir constituintes:

- `一家非常大的公司`
- `今天下午`
- `在学校`

Tempo só se move como bloco, segundo a sintaxe habitual:

- `你今天下午忙吗？` e `今天下午你忙吗？` — ambas padrão.
- `你下午今天忙吗？` — inválida (parte `今天下午`).

Não antecipar lugar, objeto, complemento ou modificador só porque a frase ainda “daria para entender”.

Trocar argumentos de `给` (quem dá / a quem) **muda o significado** — não é alternativa.

## O que costuma ser válido

- Expressão de tempo (bloco inteiro) antes ou depois do sujeito: `我明天去北京` ↔ `明天我去北京`.
- Par de manual `住在` + lugar ↔ `在` + lugar + `住`: `我住在北京` ↔ `我在北京住`.

Não maximizar o número de alternativas. Permutações pedagógicas, não reescritas criativas.
