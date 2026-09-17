# chineseLearning — notas para quem trabalha neste repo

Site Next.js em `web/`. Documentação completa em [`docs/01_readme.md`](docs/01_readme.md).

## Decisões de produto (não voltar a propor)

- **Busca / pesquisa no site: NUNCA.** Não é uma funcionalidade que este site vá
  ter, em nenhuma forma — nem campo de busca, nem índice pesquisável, nem
  filtro global. Não sugerir. Decisão do dono do projeto, set 2026.
- **PWA / offline: adiado.** A infraestrutura existe (`@ducanh2912/next-pwa`,
  `public/sw.js`) mas não foi desenhada para guardar conteúdo. Fica para depois;
  não abrir esta frente sem o dono pedir.

## Em aberto

[`docs/08_produto_observabilidade.md`](docs/08_produto_observabilidade.md):
GA, cookies, áudio — feitos; opcional: custom dimensions no GA4 Admin.

Curadoria por fazer: ordens alternativas aceites no jogo, 557 frases —
[`docs/06_jogo_frases.md`](docs/06_jogo_frases.md) § Ordens alternativas.

## Língua

A UI tem **três** línguas: **pt-BR**, **EN**, **ES** — em `web/src/messages/`.

- O português é **brasileiro**: "você", "tela", "celular", "salvar", "arquivo",
  "Carregando…". Nunca pt-PT ("ecrã", "telemóvel", "podes", "a carregar",
  "guardar", aspas «»).
- Uma chave nova entra **nas três línguas ou em nenhuma**: se faltar, o
  `createTranslator` renderiza o próprio caminho da chave no ecrã.
- Números seguem a língua (`1,39` em pt/es, `1.39` em en) — usar `Intl`.
- Ver [`docs/06_jogo_frases.md`](docs/06_jogo_frases.md) § UX.

## Código

- Código, comentários e nomes em **inglês**. Strings de UI só via i18n.
- Cores: usar os tokens de `globals.css`. Texto sobre um fundo `--cat-*` usa
  **`--on-category`**, nunca `text-white` — as cores de categoria invertem entre
  temas. Ver [`docs/08_produto_observabilidade.md`](docs/08_produto_observabilidade.md) § UI.
- Rotas que precisam de servidor (sessão, SQLite, `force-dynamic`) usam a
  extensão **`route.server.ts`** / `page.server.tsx`: é assim que ficam fora do
  export estático. Um `route.ts` com `force-dynamic` parte o `build:webplace`.

## Antes de dar por concluído

```bash
cd web
npx next build                                    # modo servidor
npm run build:webplace                            # export estático — testar SEMPRE os dois
npx eslint src && npx tsc --noEmit
```

Medir performance antes e depois, nunca estimar
([`docs/08_produto_observabilidade.md`](docs/08_produto_observabilidade.md) tem o comando).
Testar a 390 px de largura.

## Não fazer

- **Deploy.** Nunca correr `deploy:*` nem `start.sh` em produção.
- Mudar `web/prisma/schema.prisma` sem actualizar
  [`docs/07_conteudo_dados.md`](docs/07_conteudo_dados.md).
- Editar `web/src/data/phrase-game/phrases.json` à mão — é gerado a partir de
  `FRASES_GAME/curated/` por `npm run prebuild:phrase-game`.
