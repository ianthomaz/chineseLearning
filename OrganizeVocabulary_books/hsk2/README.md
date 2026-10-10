# hsk2 — HSK Standard Course 2

**HSK标准教程 2** (*HSK Standard Course 2*). PDF: `../HSK标准教程2.pdf` (gitignored, image scan).

## What we harvest (project lexicon, not a book silo)

| Source in book | Use |
|----------------|-----|
| **词语总表** (print ~p.121+, PDF ~144+) | Core of unified `../hsk-lexico-core.json` |
| Lesson **New Words** + dialogues | Contexts / phrases → site context deck |
| Front matter / 语音·汉字 TOC columns | Skip |

PDF is image-only (`Pdg2Pic`). OCR via macOS Vision (`_ocr_zh` helper).

## Layout notes

- Print page ≈ PDF page − 23 (目录 PDF 18 → lessons start ~PDF 24).
- Vocab index: columns 词语 / 拼音 / 词性 / 词义 / 课号 (pinyin regenerated with `pypinyin` when OCR is noisy).

## Status

See `../hsk-lexico-core.json` and `../hsk-phrases.json` (shared with HSK3).
