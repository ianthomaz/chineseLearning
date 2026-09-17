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
| 4 | `/dialogues` | 179 kB de HTML | `getGlobalDialogueSections()` envia todos os diálogos globais para o índice |
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

Somando HTML + RSC das 26 páginas presentes nas duas builds:
**2 891 345 → 1 030 294 bytes (−64%)**.

O tamanho do JS não muda de forma significativa (First Load JS continua ~104 kB
partilhados) — o problema nunca foi o bundle, era o conteúdo embebido no HTML.

## 3. Por corrigir

### `/praticar` — 218 kB para quem não tem sessão (gargalo 3)

`page.tsx` faz `await loadPracticeLibrary()` e só depois envolve em `LoginGate`.
Como `LoginGate` é um client component, os `children` já foram renderizados no
servidor: a biblioteca vai no payload mesmo para quem vê o cartão de login.

Correcção possível — carregar a biblioteca só quando há sessão:

```tsx
const user = await getSessionUser();
const library = user
  ? await loadPracticeLibrary()
  : { categories: [], contextDecks: [], contextDeckMeta: [] };
```

**Porque não está feito:** `getSessionUser()` lê cookies, o que torna a rota
dinâmica (deixa de ser pré-renderizada) e exige um guard para o export estático,
onde `cookies()` não é suportado. É uma mudança com um trade-off real —
convidados poupam 180 kB, quem está logado passa a pagar SSR por pedido — e
merece ser decidida, não feita de passagem.

### `/dialogues` — 179 kB (gargalo 4)

Mesmo padrão do gargalo 2: o índice provavelmente só precisa de título e
contagem por secção. Verificar o que `DialoguesIndexContent` lê de facto antes de
projectar.

### Outros

- `EdgeSettingsDrawer` está montado em todas as páginas mas os seus toggles só
  afectam conteúdo do consolidado. Já não aparece nas rotas imersivas
  ([`immersive-routes.ts`](../web/src/lib/immersive-routes.ts)); em
  `/phrase-game` continua a ser um controlo sem efeito.
- Respostas de route handlers **não** passam pela compressão do Next (as páginas
  passam). Qualquer rota nova que devolva JSON grande tem de gzipar à mão, como
  `api/phrase-game/bank`.

*Última revisão: set 2026*
