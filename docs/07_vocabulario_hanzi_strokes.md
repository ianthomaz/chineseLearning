# Vocabulário no site: traços e escrita (Make Me a Hanzi + Hanzi Writer)

Documento de viabilidade e **estado de implementação** para o **modo Vocabulário**: ordem de traços e prática de escrita. A primeira versão no site usa **Hanzi Writer** com carregamento de dados via **CDN** (comportamento por defeito da biblioteca); mirror local dos JSON fica como melhoria futura.

---

## Objetivo

- No fluxo atual (`/vocabulary/[id]`, tabela hanzi · pinyin · tradução), oferecer um **atalho por caractere** (ou por palavra) para:
  - ver **ordem de traços** (SVG ou animação);
  - opcionalmente **praticar escrita** (quiz / traçado).
- Apresentar isso de forma **não intrusiva**: por exemplo um **modal** ao clicar num hanzi ou num ícone ao lado da linha.

---

## Contexto no projeto atual

- O conteúdo vem de `Content/consolidado_final.md` → `web/scripts/parse-consolidado.mjs` → `VocabTable` em `BlockStudyPage` (modo `vocabulary`).
- Ponto de extensão natural: célula **Hanzi** (ou botão adjacente) dispara abertura do modal; o modal recebe `character` (e, se útil, `word` completo para contexto).

---

## 1. Make Me a Hanzi (fonte de dados)

- **Repositório:** [github.com/skishore/makemeahanzi](https://github.com/skishore/makemeahanzi)
- **O que entrega:** dados de dicionário e **gráficos** (incl. **SVG com ordem de traços**) para um grande conjunto de caracteres (simplificados e tradicionais comuns).
- **Formato:** ficheiros textuais `dictionary.txt` e `graphics.txt`, **uma linha = um objeto JSON** (fácil de indexar em build ou em runtime com mapa em memória).
- **Uso típico:** download dos ficheiros para `web/public/` ou para um volume servido pela app; **consulta local** → sem pedidos externos em tempo de utilização, sem rate limit.
- **Licença:** permissiva; atribuição a fontes **Arphic (1999)** — manter ficheiro `LICENSE` / nota de créditos na UI ou em “Sobre / Créditos” do site.

**Papel no site:** excelente como **fonte canónica de SVG / metadados** se quisermos renderizar nós SVG estáticos ou pré-processar para outro formato no build.

---

## 2. Hanzi Writer (biblioteca JS + dados)

- **Repositório (lib):** [github.com/chanind/hanzi-writer](https://github.com/chanind/hanzi-writer) · **npm:** `hanzi-writer`
- **Dados:** repositório [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) — **um JSON por carácter**; por defeito a lib pode carregar via **CDN (ex.: jsDelivr)**; também é possível **hospedar os JSON localmente** (PWA, export estático, offline).
- **O que entrega:** animação da ordem de traços, destaque de traço, **modo quiz** de escrita; suporta simplificado e tradicional conforme dados disponíveis.
- **Peso:** biblioteca pequena (ordem de dezenas de kb gzip — valores exactos variam por versão; ver documentação oficial).
- **Licença:** **MIT** (lib); confirmar licença dos dados no repositório de dados antes de redistribuir em produto.

**Papel no site:** caminho mais rápido para **UX interactiva** (canvas/SVG animado + prática) dentro de React/Next, especialmente se o modal for o “estúdio de escrita” do utilizador.

---

## Comparação resumida

| Critério | Make Me a Hanzi | Hanzi Writer |
|----------|-----------------|--------------|
| Foco principal | Dados + SVG (traços) | Animação + quiz de escrita |
| Integração UI | Mais trabalho próprio (render SVG, interacções) | Menos trabalho (API da lib) |
| Offline / zero CDN | Sim, com ficheiros locais | Sim, com mirror local dos JSON |
| Bundle | Só o que vocês renderizam | Lib + lazy-load por carácter |

**Abordagem híbrida (comum):** usar **Hanzi Writer no modal** para experiência de utilizador, e manter **Make Me a Hanzi** como referência ou backup de dados se no futuro quiserem SVG próprio ou pipelines de build diferentes.

---

## Modal: sim, encaixa bem

**Vantagens**

- Não aumenta a altura da tabela nem compete com pinyin/tradução na mesma linha.
- Permite **lazy loading**: só carregar dados da lib / JSON do carácter quando o modal abre.
- Acessível: foco preso no modal, `aria-modal`, fechar com Esc, título claro (“Traços: 学”).

**Conteúdo sugerido no modal**

- Título: carácter grande + pinyin curto (se já tiverem na linha).
- Área principal: componente Hanzi Writer (ou SVG de Make Me a Hanzi).
- Secção opcional: “Dica” / link “Créditos e licenças” (Arphic / MIT).
- Em mobile: modal fullscreen ou bottom-sheet para área de desenho confortável.

**Gatilho**

- Clique no hanzi na primeira coluna **ou** ícone “traços” (menos erro de toque em palavras multi-carácter).

**Palavras com vários caracteres**

- Por defeito: modal no **primeiro carácter** ou **selector de carácter** (tabs pequenos) se a palavra tiver 2–4 hanzis frequentes no curso.

---

## Integração técnica (Next.js / app actual)

1. **Cliente apenas:** Hanzi Writer manipula canvas/DOM — encapsular em componente com `"use client"` e import **dinâmico** (`next/dynamic` com `ssr: false`) para não quebrar SSR.
2. **Dados:**  
   - **CDN:** implementação mais simples; implica pedidos de rede por carácter na primeira abertura.  
   - **Local:** copiar subset de `hanzi-writer-data` para `public/hanzi-data/` (ou só os hanzis que aparecem no `consolidado`) para reduzir tamanho de deploy.
3. **Make Me a Hanzi:** se usarem SVG directamente, um script de build pode filtrar `graphics.txt` só para hanzis presentes em `consolidado.json` e gerar um JSON ou ficheiros por carácter.
4. **Performance:** pré-carregar dados do carácter ao **hover** no ícone (opcional) ou só na abertura do modal.

---

## Licenças e créditos (obrigatório em produto)

- **Make Me a Hanzi / Arphic:** incluir atribuição conforme o `LICENSE` do repositório (e não remover avisos de copyright dos SVG se os embutirem).
- **Hanzi Writer (MIT):** crédito na página “Sobre” ou rodapé do modal.
- Rever sempre o texto de licença dos **dados** (`hanzi-writer-data`, `dictionary.txt` / `graphics.txt`) antes de redistribuir cópias no vosso `public/`.

---

## Riscos e limitações

- Nem todo o hanzi raro do curso pode existir nos dois projetos; prever **fallback** (“Sem animação para este carácter”) ou ocultar o botão após verificação em build.
- **Tradicional vs simplificado:** alinhar com o que o curso ensina; os dados são por carácter — misturar sistemas sem critório confunde alunos.
- **Acessibilidade:** animações rápidas podem incomodar — preferir controlo “reproduzir / pausar” e respeitar `prefers-reduced-motion` se possível.

---

## Próximos passos sugeridos (implementação)

1. Prototipo: modal + Hanzi Writer para **um** hanzi fixo (ex.: 学) com dados via CDN.
2. Ligar ao `VocabTable`: prop `onHanziActivate` ou estado global mínimo.
3. Script: listar hanzis únicos a partir de `consolidado.json` e gerar lista de ficheiros necessários de `hanzi-writer-data` (ou subset Make Me a Hanzi).
4. Documentar no README da `web/` o comando de cópia/sync dos dados e onde ficam os créditos na UI.

---

## Implementado no repositório (resumo)

| Onde | O quê |
|------|--------|
| `web/src/components/VocabTable.tsx` | Botão **Traços** por linha (só se a célula tiver hanzi CJK); abre o modal. |
| `web/src/components/HanziStrokeModal.tsx` | Modal: animação em loop, **Repetir animação**, **Praticar escrita** (quiz), selector se a palavra tiver vários caracteres; `prefers-reduced-motion` reduz animação contínua. |
| `web/src/lib/hanzi-chars.ts` | Extração de caracteres CJK a partir da string da tabela. |
| `web/package.json` | Dependência `hanzi-writer`. |
| `web/src/messages/*.json` | Chaves `vocab.strokes`, `vocab.openStrokesAria`, bloco `hanziWriter.*` (modal + créditos). |
| `web/src/components/AppFooter.tsx` | Segundo parágrafo com links a **Hanzi Writer**, **hanzi-writer-data** e **Make Me a Hanzi** (alinhado à cadeia de atribuição). |

**Créditos na interface:** o modal inclui texto explicativo + links; o rodapé repete a linha de atribuição em **PT / EN / ES**, no mesmo espírito da menção à fonte Noto / parlr.

---

## Referências

- Make Me a Hanzi: [https://github.com/skishore/makemeahanzi](https://github.com/skishore/makemeahanzi)
- Hanzi Writer: [https://github.com/chanind/hanzi-writer](https://github.com/chanind/hanzi-writer)
- Hanzi Writer (site / docs): [https://hanziwriter.org/](https://hanziwriter.org/)
- Dados Hanzi Writer: repositório `hanzi-writer-data` (JSON por carácter; espelho via jsDelivr documentado na wiki do projecto)
