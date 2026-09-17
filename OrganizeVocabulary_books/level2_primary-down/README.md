# level2_primary-down

**新时代汉语口语 初级·下** — work folder (same layout as `level2_NTCSL/`).

| Item | Path |
|------|------|
| PDF | `../level2.pdf` (gitignored) |
| Units | `units/lesson-01.json` … `lesson-16.json` |
| Index | `units/index.json` |
| App lexico hook | `lexico-core.json` (core ≤3 hanzi) |
| Page renders | `pages/` (local, gitignored) |
| OCR scratch | `ocr/` (local, gitignored) |

## Source

Imported from `curated/primary-down/` on 2026-09-11.
Re-run: `python3 _import_curated_to_workdir.py`

## vs NTCSL

This series uses **lessons** (16), not NTCSL **units** (10). Priority map:
`text` → core · `extension` → brainstorm · `produce` → core/extended.

`curated/` remains SoT for `seed:content` / book_vocab; this folder is for
unit-style work, OCR re-checks, and future app lexico (like NTCSL L2).
