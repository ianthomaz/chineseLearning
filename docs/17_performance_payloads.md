# Performance — payloads de primeira pintura

Estado: **set 2026**. Medições reais, não estimativas.

Como medir (o mesmo comando antes e depois de qualquer alteração):

```bash
cd web && npx next build
find .next/server/app -maxdepth 3 \( -name '*.html' -o -name '*.rsc' \) \
  -printf '%10s  %p\n' | sort -rn | head -20
```

O `.html` é o que o browser recebe na primeira pintura; o `.rsc` é o payload
React Server Components que acompanha a navegação SPA. Os dois incluem, em texto,
**tudo o que um server component passa como props a um client component**.

---

## 1. Gargalos encontrados

| # | Onde | Evidência | Causa |
|---|------|-----------|-------|
| 1 | `/phrase-game` | **656 kB** de HTML, 538 kB de RSC | `page.tsx` passava as 616 frases inteiras como props a um client component. O ecrã de setup não lê nenhuma |
| 2 | `/`, `/review`, `/vocabulary`, `/grammar` | ~127 kB de HTML e ~92 kB de RSC **cada** | Passavam `ContentBlock[]` completo (narrativa, vocabulário, diálogos, glosas em 3 línguas) para renderizar id, título e uma contagem |
| 3 | `/praticar` | 218 kB de HTML | Carrega a biblioteca de prática inteira **antes** do `LoginGate` — quem não tem sessão descarrega-a e vê um cartão de login |
| 4 | `/dialogues` | 179 kB de HTML | ~~Mesma causa que 2~~ — **medido: não é.** Ver §3 |
| 5 | `/ktv` | rota dinâmica (`ƒ`) | O gate de admin obrigava a `force-dynamic` só para ler o email da sessão |
| 6 | Banco de frases (BD) | — | `getAllPhrases()` relia e reparseava 616 linhas de SQLite em cada pedido |

## 2. O que foi corrigido

**1 — banco de frases fora da primeira pintura.**
`GET /api/phrase-game/bank` serve o banco; o cliente busca-o em segundo plano
enquanto o ecrã de setup já está interactivo
([`use-phrase-bank.ts`](../web/src/lib/phrase-game/use-phrase-bank.ts)).
Serializado, gzipado e com ETag uma vez por processo: **67 kB** na rede,
`304` nas visitas seguintes. Campos `nivel` e `tags` (metadados de autoria que o
jogo nunca lê) não vão. O export estático não tem route handlers, por isso aí o
banco continua a ir como props — `page.tsx` decide pelo `NEXT_STATIC_EXPORT`.

**2 — projecção em vez do bloco inteiro.**
`BlockIndexEntry` (`id`, `title`, contagens) em
[`blocks-types.ts`](../web/src/lib/blocks-types.ts); as páginas de índice usam
`getBlockIndexEntries()`.

**3 — `/praticar` só carrega a biblioteca com sessão.**
`getSessionUser()` antes do `loadPracticeLibrary()`; sem sessão vai uma
biblioteca vazia. A rota deixa de ser pré-renderizada (`○` → `ƒ`), o que é
correcto para uma página cujo conteúdo depende de quem pergunta.
Convidado: **218 kB → 16 kB** de HTML (5,4 kB gzipado).

**5 — `/ktv` público** deixou de precisar de sessão e passou a estático (`○`).

**6 — `getAllPhrases()` memoizado** por processo.

### Resultado

| Página | HTML antes | HTML depois |
|--------|-----------:|------------:|
| `/phrase-game` | 656 670 | **22 138** |
| `/` | 129 532 | **38 777** |
| `/vocabulary` | 126 687 | **34 442** |
| `/review` | 126 334 | **34 089** |
| `/grammar` | 126 305 | **34 060** |
| `/praticar` (convidado) | 218 193 | **16 327** |

Somando HTML + RSC das 26 páginas presentes nas duas builds:
**2 891 345 → 1 030 294 bytes (−64%)**.

O tamanho do JS não muda de forma significativa (First Load JS continua ~104 kB
partilhados) — o problema nunca foi o bundle, era o conteúdo embebido no HTML.

## 3. `/dialogues` — medido, e **não** é o mesmo problema

A primeira versão deste documento assumiu que `/dialogues` era outro caso do
gargalo 2. Medindo antes de mexer, não é: a página **mostra mesmo tudo**.
`DialoguesIndexContent` renderiza as 46 conversas completas (160 turnos) e o
filtro por categoria apenas esconde secções do lado do cliente.

| | Bytes |
|---|---:|
| Dados dos diálogos (JSON) | 37 066 |
| ... só num idioma (sem en/es) | 24 670 |
| ... só títulos + contagem | 1 889 |
| HTML renderizado da página | ~179 000 |
| **Na rede, gzipado** | **~31 000** |

Ou seja: os 179 kB são sobretudo **markup dos 160 turnos que a página mostra de
propósito**, não dados a mais. 31 kB na rede para esse conteúdo é razoável.

O que sobraria para cortar:

- As traduções vão nos três idiomas (37 kB vs 24,7 kB num só) porque a troca de
  idioma é do lado do cliente — é assim em todo o site, não é específico desta
  página.
- Reduzir a sério exigiria mudar a UX (índice de secções + carregar uma
  conversa de cada vez, ou secções colapsadas). É uma decisão de produto, não
  uma correcção de performance.

**Conclusão: deixar como está.** Registado aqui para não voltar a ser
investigado do zero.

## 4. Por corrigir

### Outros

- `EdgeSettingsDrawer` está montado em todas as páginas mas os seus toggles só
  afectam conteúdo do consolidado. Já não aparece nas rotas imersivas
  ([`immersive-routes.ts`](../web/src/lib/immersive-routes.ts)); em
  `/phrase-game` continua a ser um controlo sem efeito.
- Respostas de route handlers **não** passam pela compressão do Next (as páginas
  passam). Qualquer rota nova que devolva JSON grande tem de gzipar à mão, como
  `api/phrase-game/bank`.

*Última revisão: set 2026*
