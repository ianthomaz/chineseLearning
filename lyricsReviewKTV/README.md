# lyricsReviewKTV — arquivo histórico

O protótipo HTML autónomo (`indexKTV.html`) e a sua cópia das letras foram
removidos: viviam duplicados byte a byte com os ficheiros que o site serve.

A versão viva é a rota do site:

| | |
|---|---|
| Rota | `/ktv` (`/aulaChines/ktv` em produção) — pública, sem login |
| Dados | `web/public/ktv/catalog.json` + `web/public/ktv/letras/*.json` — **única fonte** |
| UI | `web/src/components/lyrics-ktv/LyricsKtvSession.tsx` |
| Strings | `web/src/messages/{pt,en,es}.json`, secção `ktv` |

Para acrescentar uma música: criar `web/public/ktv/letras/<slug>.json` e
registá-la em `web/public/ktv/catalog.json`.

Formato de cada letra:

```jsonc
{
  "meta": { "titleHanzi": "過火", "titlePinyin": "guò huǒ" },
  "lines": [
    {
      "section": "副歌",          // opcional, agrupa linhas
      "hanzi": "你说你想要逃",
      "pinyin": "nǐ shuō nǐ xiǎng yào táo",
      "words": [                  // opcional, glossário palavra por palavra
        { "h": "你", "p": "nǐ", "g": "tu" }
      ]
    }
  ]
}
```

O histórico do protótipo continua disponível em git.
