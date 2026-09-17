# KTV — letras e catálogo

Rota do site: **`/ktv`** (pública, sem login).

| | |
|---|---|
| Catálogo | `catalog.json` |
| Letras | `letras/<slug>.json` — **única fonte** |
| UI | `web/src/components/lyrics-ktv/LyricsKtvSession.tsx` |
| Strings | `web/src/messages/{pt,en,es}.json`, secção `ktv` |

## Acrescentar uma música

1. Criar `letras/<slug>.json`
2. Registar em `catalog.json`

Formato de cada letra:

```jsonc
{
  "meta": { "titleHanzi": "過火", "titlePinyin": "guò huǒ" },
  "lines": [
    {
      "section": "副歌",
      "hanzi": "你说你想要逃",
      "pinyin": "nǐ shuō nǐ xiǎng yào táo",
      "words": [
        { "h": "你", "p": "nǐ", "g": "tu" }
      ]
    }
  ]
}
```

O protótipo HTML autónomo (`indexKTV.html`) foi removido; histórico disponível em git.
