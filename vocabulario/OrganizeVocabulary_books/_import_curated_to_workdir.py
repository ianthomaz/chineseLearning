#!/usr/bin/env python3
"""Import curated/primary-* lesson JSON into NTCSL-style work folders."""

from __future__ import annotations

import json
from collections import OrderedDict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PRI = {"core": 0, "brainstorm": 1, "extended": 2}

BOOKS = {
    "level1_primary-up": {
        "bookId": "primary-up",
        "bookTitleZh": "新时代汉语口语 初级·上",
        "bookTitleEn": "New Era Chinese Spoken Language — Elementary, Volume 1",
        "sourcePdf": "Level1.pdf",
        "curatedDir": ROOT / "curated" / "primary-up",
        "lessonPrefix": "lesson",
    },
    "level2_primary-down": {
        "bookId": "primary-down",
        "bookTitleZh": "新时代汉语口语 初级·下",
        "bookTitleEn": "New Era Chinese Spoken Language — Elementary, Volume 2",
        "sourcePdf": "level2.pdf",
        "curatedDir": ROOT / "curated" / "primary-down",
        "lessonPrefix": "lesson",
    },
}


def merge_entry(
    store: OrderedDict[str, dict],
    hanzi: str,
    *,
    pinyin: str = "",
    pos: str = "",
    gloss: str = "",
    priority: str,
    source: str,
    examples: list[str] | None = None,
):
    if hanzi in store:
        e = store[hanzi]
        if PRI[priority] < PRI[e["priority"]]:
            e["priority"] = priority
            if pinyin:
                e["pinyin"] = pinyin
            if pos:
                e["pos"] = pos
            if gloss:
                e["glossEn"] = gloss
        elif PRI[priority] == PRI[e["priority"]]:
            if pinyin and not e.get("pinyin"):
                e["pinyin"] = pinyin
            if pos and not e.get("pos"):
                e["pos"] = pos
            if gloss and not e.get("glossEn"):
                e["glossEn"] = gloss
        if source not in e["sources"]:
            e["sources"].append(source)
        if examples:
            prev = e.get("examples") or []
            e["examples"] = list(dict.fromkeys(prev + examples))
    else:
        e: dict = {
            "hanzi": hanzi,
            "pinyin": pinyin,
            "pos": pos,
            "glossEn": gloss,
            "priority": priority,
            "sources": [source],
        }
        if examples:
            e["examples"] = examples
        store[hanzi] = e


def lesson_from_curated(curated: dict, book: dict) -> dict:
    meta = curated["meta"]
    by_src = curated.get("byLessonSource", {})
    store: OrderedDict[str, dict] = OrderedDict()

    for row in by_src.get("text", []):
        merge_entry(
            store,
            row["hanzi"],
            pinyin=row.get("pinyin", ""),
            pos=row.get("pos", ""),
            gloss=row.get("glossEn", ""),
            priority="core",
            source="textVocab",
            examples=row.get("examples"),
        )

    for row in by_src.get("extension", []):
        merge_entry(
            store,
            row["hanzi"],
            pinyin=row.get("pinyin", ""),
            pos=row.get("pos", ""),
            gloss=row.get("glossEn", ""),
            priority="brainstorm",
            source="extensionVocab",
            examples=row.get("examples"),
        )

    produce = by_src.get("produce") or {}
    for group in produce.get("groups", []):
        theme = group.get("theme", "")
        for word in group.get("core", []):
            merge_entry(
                store,
                word,
                priority="core",
                source=f"produceCore:{theme}" if theme else "produceCore",
            )
        for word in group.get("supplement", []):
            merge_entry(
                store,
                word,
                priority="extended",
                source=f"produceSupplement:{theme}" if theme else "produceSupplement",
            )

    by_pos = curated.get("byPos") or {}
    produce_only = by_pos.get("produceOnly") or {}
    for word in produce_only.get("words", []):
        merge_entry(store, word, priority="extended", source="produceOnly")

    pages = meta.get("source", {}).get("pages", {})
    page_vals = [v for v in pages.values() if isinstance(v, int)]
    pdf_from = min(page_vals) if page_vals else None
    pdf_to = max(page_vals) if page_vals else None

    return {
        "meta": {
            "bookId": book["bookId"],
            "bookTitleZh": book["bookTitleZh"],
            "bookTitleEn": book["bookTitleEn"],
            "sourcePdf": book["sourcePdf"],
            "lesson": meta["lesson"],
            "titleZh": meta.get("title", ""),
            "volumeLabel": meta.get("volumeLabel", ""),
            "pdfPages": {"from": pdf_from, "to": pdf_to, "anchors": pages},
            "importedFrom": f"curated/{book['bookId']}/lesson-{meta['lesson']:02d}.json",
            "curatedAt": meta.get("curatedAt"),
            "reviewedAt": meta.get("reviewedAt"),
            "importedAt": date.today().isoformat(),
            "notes": "Imported from curated byLessonSource; priority: text=core, extension=brainstorm, produce=core/extended.",
        },
        "produce": {
            "groups": produce.get("groups", []),
            "expressionPatterns": produce.get("expressionPatterns", []),
        },
        "entries": list(store.values()),
        "stats": {
            "entryCount": len(store),
            "core": sum(1 for e in store.values() if e["priority"] == "core"),
            "brainstorm": sum(1 for e in store.values() if e["priority"] == "brainstorm"),
            "extended": sum(1 for e in store.values() if e["priority"] == "extended"),
        },
    }


def build_lexico_core(all_entries: list[dict], book_id: str, max_len: int = 3) -> dict:
    seen: set[str] = set()
    out: list[dict] = []
    for e in all_entries:
        if e.get("priority") != "core":
            continue
        hanzi = e["hanzi"]
        if len(hanzi) > max_len or hanzi in seen:
            continue
        seen.add(hanzi)
        out.append(
            {
                "hanzi": hanzi,
                "pinyin": e.get("pinyin", ""),
                "translation": e.get("glossEn", ""),
            }
        )
    return {
        "meta": {
            "bookId": book_id,
            "source": "units/*/priority=core",
            "maxHanziLength": max_len,
            "count": len(out),
            "note": "Core ≤3 hanzi for optional lexico/app pipeline (not book_vocab).",
        },
        "entries": out,
    }


def import_book(workdir_name: str, book: dict) -> None:
    work = ROOT / workdir_name
    units_dir = work / "units"
    units_dir.mkdir(parents=True, exist_ok=True)
    (work / "pages").mkdir(exist_ok=True)
    (work / "ocr").mkdir(exist_ok=True)

    lessons_meta = []
    all_entries: list[dict] = []
    total = 0

    for n in range(1, 17):
        src = book["curatedDir"] / f"lesson-{n:02d}.json"
        curated = json.loads(src.read_text(encoding="utf-8"))
        unit = lesson_from_curated(curated, book)
        out_name = f"lesson-{n:02d}.json"
        (units_dir / out_name).write_text(
            json.dumps(unit, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        all_entries.extend(unit["entries"])
        total += unit["stats"]["entryCount"]
        lessons_meta.append(
            {
                "lesson": n,
                "titleZh": unit["meta"]["titleZh"],
                "file": out_name,
                "pdfPages": unit["meta"]["pdfPages"],
                "entryCount": unit["stats"]["entryCount"],
            }
        )

    unique = len({e["hanzi"] for e in all_entries})
    index = {
        "bookId": book["bookId"],
        "workdir": workdir_name,
        "sourcePdf": book["sourcePdf"],
        "bookTitleZh": book["bookTitleZh"],
        "bookTitleEn": book["bookTitleEn"],
        "importedAt": date.today().isoformat(),
        "source": "curated/ import (see _import_curated_to_workdir.py)",
        "lessonCount": 16,
        "totalEntries": total,
        "uniqueHanzi": unique,
        "lessons": lessons_meta,
    }
    (units_dir / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    core = build_lexico_core(all_entries, book["bookId"])
    (work / "lexico-core.json").write_text(
        json.dumps(core, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    readme = f"""# {workdir_name}

**{book["bookTitleZh"]}** — work folder (same layout as `level2_NTCSL/`).

| Item | Path |
|------|------|
| PDF | `../{book["sourcePdf"]}` (gitignored) |
| Units | `units/lesson-01.json` … `lesson-16.json` |
| Index | `units/index.json` |
| App lexico hook | `lexico-core.json` (core ≤3 hanzi) |
| Page renders | `pages/` (local, gitignored) |
| OCR scratch | `ocr/` (local, gitignored) |

## Source

Imported from `curated/{book["bookId"]}/` on {date.today().isoformat()}.
Re-run: `python3 _import_curated_to_workdir.py`

## vs NTCSL

This series uses **lessons** (16), not NTCSL **units** (10). Priority map:
`text` → core · `extension` → brainstorm · `produce` → core/extended.

`curated/` remains SoT for `seed:content` / book_vocab; this folder is for
unit-style work, OCR re-checks, and future app lexico (like NTCSL L2).
"""
    (work / "README.md").write_text(readme, encoding="utf-8")
    print(f"{workdir_name}: {total} entries, {unique} unique, core≤3={core['meta']['count']}")


def main() -> None:
    for name, book in BOOKS.items():
        import_book(name, book)


if __name__ == "__main__":
    main()
