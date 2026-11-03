#!/usr/bin/env python3
"""Extract 词语总表 from HSK Standard Course 2/3 image PDFs → hsk-lexico-core.json.

Requires: pymupdf, Pillow, pypinyin, and compiled Vision OCR binary at /tmp/ocr_zh
(or HSK_OCR_BIN). Regenerates pinyin from hanzi (OCR pinyin is unreliable on tables).
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import fitz
from PIL import Image
from pypinyin import Style, lazy_pinyin

ROOT = Path(__file__).resolve().parent
OCR_BIN = Path(__import__("os").environ.get("HSK_OCR_BIN", "/tmp/ocr_zh"))

BOOKS = {
    "hsk2": {
        "pdf": ROOT / "HSK标准教程2.pdf",
        "level": 2,
        "vocab_pdf_pages": range(144, 154),  # print ~121+
        "titleZh": "HSK标准教程2",
        "titleEn": "HSK Standard Course 2",
    },
    "hsk3": {
        "pdf": ROOT / "HSK标准教程3.pdf",
        "level": 3,
        "vocab_pdf_pages": range(197, 210),
        "titleZh": "HSK标准教程3",
        "titleEn": "HSK Standard Course 3",
    },
}

HANZI_RE = re.compile(r"^[\u4e00-\u9fff·〇一二三四五六七八九十百千万亿]+$")
SKIP_HANZI = {
    "词语",
    "拼音",
    "词性",
    "词义",
    "课号",
    "生词",
    "名词",
    "动词",
    "形容词",
    "代词",
    "数词",
    "量词",
    "副词",
    "介词",
    "连词",
    "助词",
    "叹词",
    "拟声词",
    "前缀",
    "后缀",
    "数量词",
    "助动词",
    "能愿动词",
}


def render_page(doc: fitz.Document, page_1based: int, out: Path, zoom: float = 2.5) -> Path:
    page = doc.load_page(page_1based - 1)
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    out.parent.mkdir(parents=True, exist_ok=True)
    pix.save(str(out))
    return out


def ocr_image(path: Path) -> list[str]:
    r = subprocess.run([str(OCR_BIN), str(path)], capture_output=True, text=True, check=False)
    lines = []
    for line in r.stdout.splitlines():
        if line.startswith("====="):
            continue
        s = line.strip()
        if s:
            lines.append(s)
    return lines


def crop_columns(img_path: Path, out_dir: Path) -> dict[str, Path]:
    """Crop the 生词 table body into logical columns."""
    img = Image.open(img_path)
    w, h = img.size
    # Heuristic: skip header band; keep main table
    body = img.crop((int(w * 0.05), int(h * 0.10), int(w * 0.97), int(h * 0.93)))
    bw, bh = body.size
    # Word | Pinyin | POS | Meaning | Lesson
    fracs = {
        "hanzi": (0.00, 0.15),
        "pinyin": (0.15, 0.33),
        "pos": (0.33, 0.43),
        "meaning": (0.43, 0.88),
        "lesson": (0.88, 1.00),
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = {}
    for name, (a, b) in fracs.items():
        c = body.crop((int(bw * a), 0, int(bw * b), bh))
        fp = out_dir / f"{name}.png"
        c.save(fp)
        paths[name] = fp
    return paths


def is_hanzi_lemma(s: str) -> bool:
    s = s.replace("*", "").replace(" ", "").strip()
    if not s or s in SKIP_HANZI:
        return False
    if len(s) > 8:
        return False
    return bool(HANZI_RE.match(s))


def pinyin_for(hanzi: str) -> str:
    parts = lazy_pinyin(hanzi, style=Style.TONE)
    return "".join(parts) if len(hanzi) == 1 else " ".join(parts)


def extract_book(book_id: str, cfg: dict, work: Path) -> list[dict]:
    pdf = cfg["pdf"]
    if not pdf.exists():
        print(f"MISSING {pdf}", file=sys.stderr)
        return []
    if not OCR_BIN.exists():
        print(f"MISSING OCR binary {OCR_BIN}", file=sys.stderr)
        sys.exit(1)

    doc = fitz.open(pdf)
    entries: list[dict] = []
    pages_dir = work / "pages"
    ocr_dir = work / "ocr"

    for page_no in cfg["vocab_pdf_pages"]:
        if page_no > doc.page_count:
            continue
        png = render_page(doc, page_no, pages_dir / f"p{page_no:03d}.png")
        cols = crop_columns(png, ocr_dir / f"p{page_no:03d}")
        hanzi_lines = ocr_image(cols["hanzi"])
        meaning_lines = ocr_image(cols["meaning"])
        lesson_lines = ocr_image(cols["lesson"])

        # Align by hanzi rows; meanings may wrap — take next non-empty meaning greedily
        mi = 0
        li = 0
        for hraw in hanzi_lines:
            starred = hraw.startswith("*")
            h = hraw.replace("*", "").replace(" ", "").strip()
            if not is_hanzi_lemma(h):
                continue
            # skip single Latin section letters OCR'd into hanzi column
            meaning = ""
            while mi < len(meaning_lines):
                m = meaning_lines[mi].strip()
                mi += 1
                # skip letter section headers like "F" / "G"
                if re.fullmatch(r"[A-Z]", m):
                    continue
                if re.fullmatch(r"\d+", m):
                    continue
                meaning = m
                # absorb continuation lines that don't look like new English entries starting with "to " only if short wrap
                while mi < len(meaning_lines):
                    nxt = meaning_lines[mi].strip()
                    if not nxt or re.fullmatch(r"[A-Z]", nxt) or re.fullmatch(r"\d+", nxt):
                        break
                    if nxt[0].islower() or nxt.startswith("(") or nxt.startswith("complement"):
                        meaning = meaning + " " + nxt
                        mi += 1
                        continue
                    break
                break

            lesson = None
            while li < len(lesson_lines):
                lab = lesson_lines[li].strip()
                li += 1
                if re.fullmatch(r"\d{1,2}", lab):
                    lesson = int(lab)
                    break

            entries.append(
                {
                    "hanzi": h,
                    "pinyin": pinyin_for(h),
                    "translation": meaning,
                    "hskLevel": cfg["level"],
                    "lesson": lesson,
                    "starred": starred,
                    "sourceBook": book_id,
                    "sourcePdfPage": page_no,
                }
            )
        print(f"  {book_id} p{page_no}: +entries running total {len(entries)}")

    doc.close()
    return entries


def merge_unified(all_entries: list[dict]) -> list[dict]:
    """One lemma → one row; keep shortest/clearest gloss; note levels."""
    by: dict[str, dict] = {}
    for e in all_entries:
        h = e["hanzi"]
        cur = by.get(h)
        if not cur:
            by[h] = {
                "hanzi": h,
                "pinyin": e["pinyin"],
                "translation": e.get("translation") or "",
                "hskLevels": [e["hskLevel"]],
                "lessons": {str(e["hskLevel"]): e.get("lesson")},
                "sources": [e["sourceBook"]],
            }
            continue
        if e["hskLevel"] not in cur["hskLevels"]:
            cur["hskLevels"].append(e["hskLevel"])
        if e["sourceBook"] not in cur["sources"]:
            cur["sources"].append(e["sourceBook"])
        cur["lessons"][str(e["hskLevel"])] = e.get("lesson")
        # Prefer non-empty / longer translation
        t = e.get("translation") or ""
        if len(t) > len(cur.get("translation") or ""):
            cur["translation"] = t
    rows = list(by.values())
    rows.sort(key=lambda r: (min(r["hskLevels"]), r["hanzi"]))
    return rows


def main() -> None:
    work_root = ROOT / "_hsk_extract_work"
    work_root.mkdir(exist_ok=True)
    collected: list[dict] = []
    for book_id, cfg in BOOKS.items():
        print(f"→ {book_id}")
        collected.extend(extract_book(book_id, cfg, work_root / book_id))

    unified = merge_unified(collected)
    # Form for lexico seed (≤3 hanzi preferred for widgets; keep all in full file)
    core = [
        {
            "hanzi": r["hanzi"],
            "pinyin": r["pinyin"],
            "translation": r["translation"],
            "category": None,
            "hskLevels": r["hskLevels"],
            "sources": r["sources"],
        }
        for r in unified
        if len(r["hanzi"]) <= 3
    ]

    out_full = ROOT / "hsk-lexico-full.json"
    out_core = ROOT / "hsk-lexico-core.json"
    out_full.write_text(
        json.dumps(
            {
                "meta": {
                    "note": "Unified HSK2+HSK3 词语总表 harvest. Project lexicon — not a book silo.",
                    "books": list(BOOKS.keys()),
                    "count": len(unified),
                },
                "entries": unified,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    out_core.write_text(
        json.dumps(
            {
                "meta": {
                    "source": "HSK标准教程 2+3 词语总表",
                    "maxHanziLength": 3,
                    "count": len(core),
                    "note": "For lexico_entries seed (like ntcsl-l2-core). Deduped across books.",
                },
                "entries": core,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"OK full={len(unified)} core≤3={len(core)}")
    print(f"  → {out_full}")
    print(f"  → {out_core}")


if __name__ == "__main__":
    main()
