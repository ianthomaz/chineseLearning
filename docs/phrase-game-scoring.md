# Quebra-Cabeça de Frases — pontuação

Estado: **implementada e visível** (set 2026). O ecrã de fim de rodada mostra os
pontos da rodada e de cada frase. **Ainda não persiste** — ver §5.

Regras em [`web/src/lib/phrase-game/scoring.ts`](../web/src/lib/phrase-game/scoring.ts)
(`computeScore`), chamadas em `GameplayScreen.tsx` quando a frase se resolve.

## 1. Princípio

É um jogo de **aprender**, não um placar. As regras seguem daí:

- Errar e corrigir vale mais do que ver a resposta.
- Uma frase quase certa não vale zero.
- Ouvir a frase em chinês é estudar, não é batota — não custa pontos.
- Só desistir vale zero.

## 2. Por frase — `[0, 1]`

```
pontos = base × multiplicador_de_ajuda
```

**Base**

| Situação | Base |
|---|---:|
| Acertou à primeira | 1,00 |
| Acertou depois de corrigir a própria resposta | 0,70 |
| Errou | fracção das peças na posição certa, no máximo **0,40** |
| Completou a frase toda com "Próxima peça" | **0** (ignora tudo o resto) |

A fracção usa `placementAccuracy`: peças na posição correcta ÷ comprimento da
resposta certa. Peças a menos ou a mais custam, porque o denominador é fixo.

**Multiplicador de ajuda** — vale a ajuda mais cara usada na frase; usar uma
ajuda barata a seguir não recupera pontos.

| Nível | Ajuda | × |
|---:|---|---:|
| 0 | nenhuma · **Ouvir** · **Remover peças extras** | 1,00 |
| 1 | Mostrar a frase · Mostrar pinyin | 0,75 |
| 2 | Mostrar tradução | 0,50 |
| 3 | Próxima peça (parcial) | 0,25 |

Ouvir e remover extras são grátis: ouvir é uma actividade de estudo, e remover
extras só desfaz dificuldade opcional.

## 3. Retry

Cada frase dá direito a **uma** segunda tentativa. Depois de um erro aparecem
"Tentar de novo" e "Ver resposta"; enquanto a segunda tentativa estiver
disponível **a resposta certa não é revelada**. A frase só é pontuada e
registada quando se resolve — uma vez, num único sítio (`finalize`).

## 4. Rodada

`roundScore` soma as frases: máximo **10 pontos** numa rodada de 10 frases.
O ecrã final mostra os acertos, o total ponderado e os pontos de cada frase.
O evento `round_complete` guarda `"7/10 · 6.25pts"` em `detail`.

Números aparecem com o separador decimal da língua — `1,39` em pt/es, `1.39`
em en.

## 5. Falta (Fase 2)

- Persistir por frase e por rodada (`user_id`, `phrase_id`, `score`) — a tabela
  `progress` existe no schema e **nunca é escrita**.
- Histórico, sequências e frases a rever para o próprio jogador.
- Ligar o `anon_id` do convidado ao `user_id` no login.

Ver [09_google_auth_jogo.md](09_google_auth_jogo.md) §3 e
[18_jogo_frases_ux.md](18_jogo_frases_ux.md).

Quando a Fase 2 chegar, actualizar este documento e `scoring.ts` juntos.
