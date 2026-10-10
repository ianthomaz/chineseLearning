#!/usr/bin/env python3
"""Rebuild site-ready HSK 2/3 phrases + context deck from dialogue page OCRs.

Reads PNGs under _hsk_extract_work/phrases/ (Vision OCR), pairs Chinese lines
with English Version blocks, filters junk, and writes:
  - hsk-phrases.json
  - web/src/data/context-decks/hsk2_hsk3_contexts.json (+ index.json)
  - refreshes weak glosses in hsk-lexico-core.json when New Words are seen
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from pypinyin import Style, lazy_pinyin

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
PHRASE_DIR = ROOT / "_hsk_extract_work" / "phrases"
OCR_BIN = Path("/tmp/ocr_zh")
DECK_DIR = REPO / "web" / "src" / "data" / "context-decks"

# HSK2 uses A/B; HSK3 uses named speakers (小丽 / 妈妈 / 秘书 …)
SPEAKER_RE = re.compile(r"^([\u4e00-\u9fff]{1,4}|[AB甲乙])\s*[:：]\s*(.*)$")
SPEAKER_STRIP_RE = re.compile(r"^([\u4e00-\u9fff]{1,4}|[AB甲乙])\s*[:：]\s*")
STOP_MARKERS = (
    "生词",
    "New Words",
    "Proper",
    "专有名词",
    "课文",
    "Texts",
    "热身",
    "Warm-up",
    "HSK",
)
def ocr(path: Path) -> list[str]:
    r = subprocess.run([str(OCR_BIN), str(path)], capture_output=True, text=True, check=False)
    out = []
    for line in r.stdout.splitlines():
        if line.startswith("====="):
            continue
        s = line.strip()
        if s:
            out.append(s)
    return out


def compact_zh(s: str) -> str:
    s = SPEAKER_STRIP_RE.sub("", s)
    s = re.sub(r"\s+", "", s)
    return s.replace("……", "…").replace("...", "…").strip()


def is_zh_text(s: str) -> bool:
    c = compact_zh(s)
    if len(c) < 2:
        return False
    hz = sum(1 for ch in c if "\u4e00" <= ch <= "\u9fff")
    return hz >= 2 and not re.search(r"[A-Za-z]", c)


def extract_zh_turns(lines: list[str]) -> list[str]:
    """Join multi-line speaker turns (小丽：… / A：…)."""
    turns: list[str] = []
    cur: str | None = None
    for s in lines:
        if any(s.startswith(x) for x in STOP_MARKERS) or s in STOP_MARKERS:
            if cur:
                turns.append(cur)
                cur = None
            continue
        m = SPEAKER_RE.match(s)
        if m:
            if cur:
                turns.append(cur)
            cur = compact_zh(m.group(2))
            continue
        if cur is not None and is_zh_text(s):
            cur += compact_zh(s)
    if cur:
        turns.append(cur)
    return turns


def extract_en_turns(lines: list[str]) -> list[str]:
    """English Version blocks (HSK2); HSK3 often has none."""
    turns: list[str] = []
    i = 0
    while i < len(lines):
        if lines[i].lower().startswith("english version"):
            i += 1
            cur: str | None = None
            while i < len(lines):
                s = lines[i]
                if s.lower().startswith("english version"):
                    break
                if s.startswith("New Words") or s.startswith("生词") or s.startswith("Proper"):
                    break
                m = re.match(r"^([AB])\s*[:：]\s*(.*)$", s)
                if m:
                    if cur:
                        turns.append(cur)
                    cur = m.group(2).strip()
                elif cur and re.search(r"[A-Za-z]", s) and not re.search(r"[\u4e00-\u9fff]", s):
                    cur = (cur + " " + s).strip()
                i += 1
            if cur:
                turns.append(cur)
            continue
        i += 1
    return turns


def good_gloss(s: str) -> str:
    s = re.sub(
        r"^(n\.|v\.|adj\.|adv\.|prep\.|conj\.|part\.|pron\.|num\.|m\.|aux\.|n1\.)\s*",
        "",
        s.strip(),
        flags=re.I,
    )
    s = s.strip(" .;")
    if len(s) < 2 or len(s) > 70:
        return ""
    if re.search(r"(New Words|Abbreviation|Standard Course|Proper)", s, re.I):
        return ""
    if not re.search(r"[a-zA-Z]{2,}", s):
        return ""
    return s


def pinyin_sent(hanzi: str) -> str:
    out: list[str] = []
    buf = ""
    for ch in hanzi:
        if "\u4e00" <= ch <= "\u9fff":
            buf += ch
        else:
            if buf:
                out.append(" ".join(lazy_pinyin(buf, style=Style.TONE)))
                buf = ""
            if ch.strip():
                out.append(ch)
    if buf:
        out.append(" ".join(lazy_pinyin(buf, style=Style.TONE)))
    return " ".join(out)


def pinyin_word(hanzi: str) -> str:
    return "".join(lazy_pinyin(hanzi, style=Style.TONE))


def is_good_sentence(zh: str) -> bool:
    if not (6 <= len(zh) <= 34):
        return False
    if "…" in zh or "⋯" in zh:
        return False
    hz = sum(1 for c in zh if "\u4e00" <= c <= "\u9fff")
    if hz < 5 or hz / len(zh) < 0.6:
        return False
    junk = [
        "选择",
        "图片",
        "练习",
        "下面",
        "标准教程",
        "热身",
        "看照片",
        "根据",
        "填空",
        "判断",
        "连线",
        "听力",
        "Match",
        "Warm-up",
    ]
    if any(j in zh for j in junk):
        return False
    # reject fragments that start with structural particles only
    if zh.startswith(("的人", "的是", "了吗", "了呢")):
        return False
    if zh.endswith(("的。", "的？")) and len(zh) < 10:
        return False
    # prefer real sentence punctuation or clear short dialogue turn
    if re.search(r"[。！？!?]", zh):
        return True
    return 8 <= len(zh) <= 22


def parse_page(lines: list[str], hsk_level: int, lesson: int) -> tuple[list[dict], dict[str, str]]:
    """Return (phrase dicts, new_word_gloss hanzi->en)."""
    phrases: list[dict] = []
    gloss: dict[str, str] = {}

    zh_turns = extract_zh_turns(lines)
    en_turns = extract_en_turns(lines)

    used: set[str] = set()
    n = min(len(zh_turns), len(en_turns))
    for idx in range(n):
        zh = zh_turns[idx]
        en = en_turns[idx]
        if not is_good_sentence(zh) or len(en) < 12:
            continue
        hanzi = zh if re.search(r"[。！？!?]$", zh) else zh + "。"
        phrases.append(
            {
                "hanzi": hanzi,
                "pinyin": pinyin_sent(zh),
                "translation": en,
                "hskLevel": hsk_level,
                "lesson": lesson,
                "source": f"hsk{hsk_level}-aligned",
            }
        )
        used.add(zh)

    for zh in zh_turns:
        if zh in used or not is_good_sentence(zh):
            continue
        hanzi = zh if re.search(r"[。！？!?]$", zh) else zh + "。"
        phrases.append(
            {
                "hanzi": hanzi,
                "pinyin": pinyin_sent(zh),
                "translation": "",
                "hskLevel": hsk_level,
                "lesson": lesson,
                "source": f"hsk{hsk_level}-zh",
            }
        )

    for j, s in enumerate(lines):
        m = re.match(r"^\*?\d+\.\s*([\u4e00-\u9fff]{1,6})\s*$", s)
        rest = ""
        if not m:
            m = re.match(r"^\*?\d+\.\s*([\u4e00-\u9fff]{1,6})\b(.*)$", s)
            if m:
                rest = (m.group(2) or "").strip()
        if not m:
            continue
        hanzi = m.group(1)
        gloss_en = good_gloss(rest)
        if not gloss_en:
            for k in range(j + 1, min(j + 8, len(lines))):
                cand = lines[k].strip()
                if re.match(r"^\*?\d+\.", cand):
                    break
                if is_zh_text(cand):
                    continue
                gloss_en = good_gloss(cand)
                if gloss_en:
                    break
        if gloss_en:
            gloss[hanzi] = gloss_en

    return phrases, gloss


def pick_headword(sentence: str, lemmas: set[str]) -> str | None:
    # longest lemma contained in sentence
    hits = [w for w in lemmas if w and w in sentence and len(w) >= 1]
    if not hits:
        return None
    hits.sort(key=len, reverse=True)
    return hits[0]


def main() -> None:
    if not OCR_BIN.exists():
        raise SystemExit(f"missing {OCR_BIN}")
    if not PHRASE_DIR.exists():
        raise SystemExit(f"missing {PHRASE_DIR} — run dialogue OCR first")

    all_phrases: list[dict] = []
    gloss_updates: dict[str, str] = {}

    files = sorted(PHRASE_DIR.glob("hsk*_L*_p*.png"))
    print(f"OCR pages: {len(files)}")
    for png in files:
        m = re.match(r"hsk([23])_L(\d+)_p(\d+)\.png", png.name)
        if not m:
            continue
        level, lesson = int(m.group(1)), int(m.group(2))
        lines = ocr(png)
        phrases, gloss = parse_page(lines, level, lesson)
        all_phrases.extend(phrases)
        gloss_updates.update(gloss)
        print(f"  {png.name}: +{len(phrases)} phrases, +{len(gloss)} glosses")

    # Dedupe by hanzi; prefer aligned with translation
    by: dict[str, dict] = {}
    for p in all_phrases:
        h = p["hanzi"]
        cur = by.get(h)
        if not cur:
            by[h] = p
            continue
        if p.get("translation") and not cur.get("translation"):
            by[h] = p
        elif p.get("source") == "hsk-dialogue-aligned" and cur.get("source") != "hsk-dialogue-aligned":
            by[h] = p

    phrases = list(by.values())
    phrases.sort(key=lambda p: (p["hskLevel"], p.get("lesson") or 0, p["hanzi"]))

    (ROOT / "hsk-phrases.json").write_text(
        json.dumps(
            {
                "meta": {
                    "note": "HSK2+HSK3 didactic phrases (dialogue OCR, EN aligned when available).",
                    "count": len(phrases),
                    "withTranslation": sum(1 for p in phrases if p.get("translation")),
                    "byLevel": {
                        "2": sum(1 for p in phrases if p["hskLevel"] == 2),
                        "3": sum(1 for p in phrases if p["hskLevel"] == 3),
                    },
                },
                "phrases": phrases,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"phrases → {len(phrases)}")

    # Refresh lexico glosses
    core_path = ROOT / "hsk-lexico-core.json"
    full_path = ROOT / "hsk-lexico-full.json"
    core = json.loads(core_path.read_text(encoding="utf-8"))
    full = json.loads(full_path.read_text(encoding="utf-8"))

    def apply_gloss(entries: list[dict]) -> int:
        n = 0
        for e in entries:
            g = gloss_updates.get(e["hanzi"])
            if not g:
                continue
            old = (e.get("translation") or "").strip()
            if not old or len(g) > len(old) or re.search(r"(New Words|^V\.$|^er$|^sS$)", old):
                e["translation"] = g
                e["pinyin"] = pinyin_word(e["hanzi"])
                n += 1
        return n

    n_full = apply_gloss(full["entries"])
    # rebuild core from full with translation
    new_core = []
    for e in full["entries"]:
        t = (e.get("translation") or "").strip()
        if not t or len(e["hanzi"]) > 3:
            continue
        if re.search(r"(New Words|^V\.$|^er$|^sS$)", t):
            continue
        new_core.append(
            {
                "hanzi": e["hanzi"],
                "pinyin": pinyin_word(e["hanzi"]),
                "translation": t,
                "category": None,
                "hskLevels": e.get("hskLevels"),
                "sources": e.get("sources"),
            }
        )
    # also add new words from dialogue gloss not yet in full
    have = {e["hanzi"] for e in full["entries"]}
    for h, g in gloss_updates.items():
        if h in have or len(h) > 3:
            continue
        full["entries"].append(
            {
                "hanzi": h,
                "pinyin": pinyin_word(h),
                "translation": g,
                "hskLevels": [],
                "sources": ["hsk-new-words-ocr"],
            }
        )
        new_core.append(
            {
                "hanzi": h,
                "pinyin": pinyin_word(h),
                "translation": g,
                "category": None,
                "hskLevels": [],
                "sources": ["hsk-new-words-ocr"],
            }
        )

    full["meta"]["withTranslation"] = sum(1 for e in full["entries"] if e.get("translation"))
    full["meta"]["count"] = len(full["entries"])
    core["meta"]["count"] = len(new_core)
    core["entries"] = new_core
    full_path.write_text(json.dumps(full, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    core_path.write_text(json.dumps(core, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"lexico gloss updates≈{n_full}; core={len(new_core)}")

    lemmas = {e["hanzi"] for e in new_core}
    lemma_gloss = {e["hanzi"]: e["translation"] for e in new_core}

    # Build deck: prefer EN-aligned sentences; headword from lexico
    cards = []
    seen_sent = set()
    ranked = sorted(
        phrases,
        key=lambda p: (
            0 if p.get("translation") else 1,
            0 if re.search(r"[。！？!?]", p["hanzi"]) else 1,
            p["hskLevel"],
            p.get("lesson") or 99,
        ),
    )
    per_level = {2: 0, 3: 0}
    for p in ranked:
        sent = p["hanzi"]
        if sent in seen_sent:
            continue
        if not is_good_sentence(re.sub(r"[。！？!?]$", "", sent)):
            continue
        if per_level[p["hskLevel"]] >= 100:
            continue
        head = pick_headword(sent, lemmas)
        if not head:
            continue
        cards.append(
            {
                "word": head,
                "pinyin": pinyin_word(head),
                "meaning": lemma_gloss[head],
                "section": f"HSK{p['hskLevel']} · L{p.get('lesson') or '?'}",
                "pattern": f"hsk{p['hskLevel']}",
                "sentence": sent,
                "sentencePinyin": p["pinyin"],
                "sentenceMeaning": p.get("translation")
                or f"HSK{p['hskLevel']} dialogue",
            }
        )
        seen_sent.add(sent)
        per_level[p["hskLevel"]] += 1

    deck = {
        "id": "hsk2_hsk3_contexts",
        "title": "HSK 2–3 · frases e contextos",
        "description": "Diálogos didáticos dos livros HSK标准教程 2 e 3 — mandarim para praticar no site.",
        "cards": cards,
    }
    DECK_DIR.mkdir(parents=True, exist_ok=True)
    (DECK_DIR / "hsk2_hsk3_contexts.json").write_text(
        json.dumps(deck, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    index_path = DECK_DIR / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    found = False
    for d in index.get("decks", []):
        if d["id"] == "hsk2_hsk3_contexts":
            d["title"] = deck["title"]
            d["description"] = deck["description"]
            d["cardCount"] = len(cards)
            found = True
    if not found:
        index.setdefault("decks", []).append(
            {
                "id": deck["id"],
                "title": deck["title"],
                "description": deck["description"],
                "cardCount": len(cards),
            }
        )
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"deck cards={len(cards)} (hsk2={per_level[2]} hsk3={per_level[3]})")


if __name__ == "__main__":
    main()
