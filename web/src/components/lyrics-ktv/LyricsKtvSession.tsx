"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const PINYIN_SIZE_MIN = 22;
const PINYIN_SIZE_MAX = 72;
const PINYIN_SIZE_DEFAULT = 36;

type ViewMode = "home" | "cards" | "pinyin";
type GlossWord = { h?: string; p?: string; g?: string };
type LyricLine = {
  section?: string;
  hanzi?: string;
  pinyin?: string;
  words?: GlossWord[];
};
type SongPayload = {
  meta?: { titleHanzi?: string; titlePinyin?: string };
  lines?: LyricLine[];
};
type CatalogSong = { file: string; titleHanzi?: string };

function escapeHtml(s: string) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function fitHanzi(el: HTMLElement, zone: HTMLElement) {
  const max = Math.min(92, Math.max(48, Math.floor(zone.clientWidth * 0.2)));
  const min = Math.max(36, Math.min(44, Math.floor(zone.clientWidth * 0.09)));
  let size = max;
  el.style.fontSize = `${size}px`;
  while (size > min && el.scrollHeight > zone.clientHeight - 4) {
    size -= 2;
    el.style.fontSize = `${size}px`;
  }
}

type SectionBlock = { section: string; lines: LyricLine[] };

function groupBySection(lines: LyricLine[]): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  for (const line of lines) {
    const section = line.section || "";
    const last = blocks[blocks.length - 1];
    if (last && last.section === section) last.lines.push(line);
    else blocks.push({ section, lines: [line] });
  }
  return blocks;
}

export function LyricsKtvSession() {
  const [songs, setSongs] = useState<CatalogSong[]>([]);
  const [songFile, setSongFile] = useState("");
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [songTitle, setSongTitle] = useState("");
  const [songTitlePinyin, setSongTitlePinyin] = useState("");
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState<ViewMode>("home");
  const [pinyinSize, setPinyinSize] = useState(PINYIN_SIZE_DEFAULT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hanziRef = useRef<HTMLDivElement>(null);
  const hanziZoneRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragCurrentX = useRef(0);
  const wheelLock = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const sections = useMemo(() => groupBySection(lines), [lines]);

  const go = useCallback(
    (dir: number) => {
      setIdx((cur) => {
        const next = cur + dir;
        if (next < 0 || next >= lines.length) return cur;
        return next;
      });
    },
    [lines.length],
  );

  const bumpPinyinSize = useCallback((delta: number) => {
    setPinyinSize((s) =>
      Math.min(PINYIN_SIZE_MAX, Math.max(PINYIN_SIZE_MIN, s + delta)),
    );
  }, []);

  const startMode = useCallback((mode: Exclude<ViewMode, "home">) => {
    setIdx(0);
    setView(mode);
  }, []);

  const backHome = useCallback(() => setView("home"), []);

  useEffect(() => {
    const id = "ktv-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BASE_PATH}/ktv/catalog.json`);
        if (!res.ok) throw new Error("catalog");
        const catalog = (await res.json()) as { songs?: CatalogSong[] };
        const list = catalog.songs ?? [];
        if (cancelled) return;
        setSongs(list);
        if (!list.length) {
          setError("Nenhuma música no catálogo.");
          setLoading(false);
          return;
        }
        setSongFile(list[0]!.file);
      } catch {
        if (!cancelled) {
          setError("Não carregou o catálogo.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!songFile) return;
    let cancelled = false;
    setLoading(true);
    setView("home");
    (async () => {
      try {
        const res = await fetch(`${BASE_PATH}/ktv/${songFile}`);
        if (!res.ok) throw new Error("song");
        const parsed = (await res.json()) as SongPayload | LyricLine[];
        if (cancelled) return;
        if (Array.isArray(parsed)) {
          setSongTitle("");
          setSongTitlePinyin("");
          setLines(parsed);
        } else {
          setSongTitle(parsed.meta?.titleHanzi ?? "");
          setSongTitlePinyin(parsed.meta?.titlePinyin ?? "");
          setLines(parsed.lines ?? []);
        }
        setIdx(0);
        setError(null);
      } catch {
        if (!cancelled) {
          setLines([]);
          setError(`Falha ao carregar: ${songFile}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [songFile]);

  useEffect(() => {
    if (view !== "cards") return;
    const hz = hanziRef.current;
    const zone = hanziZoneRef.current;
    if (!hz || !zone || !lines.length) return;
    const id = requestAnimationFrame(() => fitHanzi(hz, zone));
    return () => cancelAnimationFrame(id);
  }, [idx, lines, songFile, view]);

  useEffect(() => {
    if (view !== "cards") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowUp") go(1);
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, view]);

  useEffect(() => {
    if (view !== "cards") return;
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      if (!lines.length) return;
      const gloss = (e.target as Element | null)?.closest?.(".ktv-gloss");
      if (gloss instanceof HTMLElement) {
        const canScroll = gloss.scrollHeight > gloss.clientHeight + 2;
        const atTop = gloss.scrollTop <= 0;
        const atBottom =
          gloss.scrollTop + gloss.clientHeight >= gloss.scrollHeight - 1;
        if (
          canScroll &&
          !((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))
        ) {
          return;
        }
      }
      e.preventDefault();
      if (wheelLock.current || Math.abs(e.deltaY) < 8) return;
      wheelLock.current = true;
      go(e.deltaY < 0 ? 1 : -1);
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 320);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [go, lines.length, view]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as Element).closest(".ktv-gloss")) return;
    if ((e.target as Element).closest("button")) return;
    dragStartX.current = e.clientX;
    dragCurrentX.current = 0;
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = "none";
    card.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null || !cardRef.current) return;
    dragCurrentX.current = e.clientX - dragStartX.current;
    const rot = dragCurrentX.current / 22;
    cardRef.current.style.transform = `translateX(${dragCurrentX.current}px) rotate(${rot}deg)`;
    cardRef.current.style.opacity = String(
      1 - Math.min(Math.abs(dragCurrentX.current) / 500, 0.4),
    );
  };

  const onPointerUp = () => {
    if (dragStartX.current === null || !cardRef.current) return;
    const card = cardRef.current;
    card.style.transition = "transform 0.28s ease, opacity 0.28s ease";
    const threshold = 90;
    const dx = dragCurrentX.current;
    if (dx < -threshold && idx < lines.length - 1) {
      card.style.transform = "translateX(-600px) rotate(-18deg)";
      card.style.opacity = "0";
      window.setTimeout(() => go(1), 180);
    } else if (dx > threshold && idx > 0) {
      card.style.transform = "translateX(600px) rotate(18deg)";
      card.style.opacity = "0";
      window.setTimeout(() => go(-1), 180);
    } else {
      card.style.transform = "translateX(0) rotate(0)";
      card.style.opacity = "1";
    }
    dragStartX.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as Element).closest(".ktv-gloss")) return;
    if ((e.target as Element).closest("button")) return;
    const t = e.changedTouches[0];
    if (!t) return;
    touchStartY.current = t.clientY;
    touchStartX.current = t.clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    if ((e.target as Element).closest(".ktv-gloss")) {
      touchStartY.current = null;
      touchStartX.current = null;
      return;
    }
    if ((e.target as Element).closest("button")) {
      touchStartY.current = null;
      touchStartX.current = null;
      return;
    }
    const t = e.changedTouches[0];
    if (!t) return;
    const dy = t.clientY - touchStartY.current;
    const dx = t.clientX - touchStartX.current;
    touchStartY.current = null;
    touchStartX.current = null;
    if (Math.abs(dy) < 48 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
    go(dy < 0 ? 1 : -1);
  };

  const item = lines[idx];
  const progress = lines.length ? ((idx + 1) / lines.length) * 100 : 0;
  const sectionBit = item?.section || "";
  const metaLeft = songTitle
    ? sectionBit
      ? `${songTitle} · ${sectionBit}`
      : songTitle
    : sectionBit || "—";
  const canPrev = idx > 0;
  const canNext = idx < lines.length - 1;

  return (
    <div className="ktv-root">
      <style>{KTV_CSS}</style>

      <div className="ktv-topbar">
        {view === "home" ? (
          <Link href="/" className="ktv-back" prefetch={false}>
            ← Site
          </Link>
        ) : (
          <button type="button" className="ktv-back" onClick={backHome}>
            ← Início
          </button>
        )}

        <div className="ktv-brand">
          <span className="ktv-chop">詞</span>
          <span className="ktv-brand-text">
            {view === "home" ? "Lyric Cards" : songTitle || "Lyric Cards"}
          </span>
        </div>

        {view === "pinyin" ? (
          <div className="ktv-size-controls" aria-label="Tamanho do pinyin">
            <button
              type="button"
              className="ktv-size-btn"
              onClick={() => bumpPinyinSize(-4)}
              aria-label="Diminuir fonte"
            >
              −
            </button>
            <span className="ktv-size-label">{pinyinSize}</span>
            <button
              type="button"
              className="ktv-size-btn"
              onClick={() => bumpPinyinSize(4)}
              aria-label="Aumentar fonte"
            >
              +
            </button>
          </div>
        ) : view === "home" ? (
          <select
            className="ktv-select"
            aria-label="Escolher música"
            value={songFile}
            onChange={(e) => setSongFile(e.target.value)}
          >
            {songs.map((s) => (
              <option key={s.file} value={s.file}>
                {s.titleHanzi || s.file}
              </option>
            ))}
          </select>
        ) : (
          <span className="ktv-mode-pill">Hanzi + Pinyin</span>
        )}
      </div>

      {view === "home" ? (
        <div className="ktv-home">
          {error || loading ? (
            <div className="ktv-empty">
              <div className="ktv-empty-glyph">詞</div>
              <div>{error ?? "Carregando…"}</div>
            </div>
          ) : (
            <>
              <div className="ktv-home-hero">
                <div className="ktv-home-chop">詞</div>
                <h1 className="ktv-home-title">{songTitle || "—"}</h1>
                {songTitlePinyin ? (
                  <p className="ktv-home-pinyin">{songTitlePinyin}</p>
                ) : null}
              </div>

              <div className="ktv-home-actions">
                <button
                  type="button"
                  className="ktv-mode-btn ktv-mode-btn-primary"
                  onClick={() => startMode("cards")}
                  disabled={!lines.length}
                >
                  <span className="ktv-mode-btn-title">Hanzi + Pinyin</span>
                </button>
                <button
                  type="button"
                  className="ktv-mode-btn"
                  onClick={() => startMode("pinyin")}
                  disabled={!lines.length}
                >
                  <span className="ktv-mode-btn-title">Só pinyin</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {view === "cards" ? (
        <>
          <div className="ktv-progress-wrap">
            <div className="ktv-progress-track">
              <div
                className="ktv-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="ktv-progress-meta">
              <span>{metaLeft}</span>
              <span>
                {lines.length ? `${idx + 1} / ${lines.length}` : "0 / 0"}
              </span>
            </div>
          </div>

          <div
            className="ktv-stage"
            ref={stageRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {!item ? (
              <div className="ktv-empty">
                <div className="ktv-empty-glyph">詞</div>
                <div>Sem linhas.</div>
              </div>
            ) : (
              <div
                className="ktv-card"
                ref={cardRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <div className="ktv-card-tag">
                  <span className="ktv-section-chop">
                    {item.section || songTitle || ""}
                  </span>
                  <span className="ktv-line-index">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="ktv-hanzi-zone" ref={hanziZoneRef}>
                  <div className="ktv-hanzi" ref={hanziRef}>
                    {item.hanzi || ""}
                  </div>
                </div>

                <div className="ktv-pinyin-zone">
                  <div className="ktv-pinyin">{item.pinyin || ""}</div>
                </div>

                {item.words && item.words.length > 0 ? (
                  <>
                    <div className="ktv-divider" />
                    <div className="ktv-gloss">
                      <div className="ktv-gloss-label">PALAVRA POR PALAVRA</div>
                      <div className="ktv-gloss-row">
                        {item.words.map((w, i) => (
                          <div
                            className="ktv-gloss-chip"
                            key={`${w.h ?? ""}-${i}`}
                            dangerouslySetInnerHTML={{
                              __html: `<div class="h">${escapeHtml(w.h || "")}</div><div class="p">${escapeHtml(w.p || "")}</div><div class="g">${escapeHtml(w.g || "")}</div>`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="ktv-card-nav">
            <button
              type="button"
              className="ktv-nav-btn"
              disabled={!canPrev}
              onClick={() => go(-1)}
            >
              ‹ Anterior
            </button>
            <button
              type="button"
              className="ktv-nav-btn ktv-nav-btn-next"
              disabled={!canNext}
              onClick={() => go(1)}
            >
              Próxima ›
            </button>
          </div>
        </>
      ) : null}

      {view === "pinyin" ? (
        <div className="ktv-pinyin-scroll">
          {sections.map((block, bi) => (
            <section key={`${block.section}-${bi}`} className="ktv-pinyin-block">
              {block.section ? (
                <h2 className="ktv-pinyin-section">{block.section}</h2>
              ) : null}
              {block.lines.map((line, li) => (
                <p
                  key={`${bi}-${li}`}
                  className="ktv-pinyin-line"
                  style={{ fontSize: `${pinyinSize}px` }}
                >
                  {line.pinyin || "—"}
                </p>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const KTV_CSS = `
.ktv-root{
  --ink:#181614;
  --paper:#f6f1e6;
  --paper-dim:#ece4d2;
  --seal:#a13d2d;
  --seal-dim:#c17a68;
  --gray:#8c8574;
  --line: rgba(24,22,20,0.12);
  box-sizing:border-box;
  display:flex;
  flex-direction:column;
  flex:1 1 auto;
  height:100%;
  min-height:0;
  background:var(--ink);
  color:var(--paper);
  font-family:'Noto Sans SC', system-ui, sans-serif;
  overflow:hidden;
  padding:
    env(safe-area-inset-top, 0px)
    env(safe-area-inset-right, 0px)
    env(safe-area-inset-bottom, 0px)
    env(safe-area-inset-left, 0px);
  overscroll-behavior:none;
}
.ktv-root *, .ktv-root *::before, .ktv-root *::after{ box-sizing:border-box; }
.ktv-topbar{
  display:grid;
  grid-template-columns: auto 1fr auto;
  align-items:center;
  gap:8px;
  padding:10px 12px 8px;
  flex-shrink:0;
}
.ktv-back{
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:11px;
  letter-spacing:0.04em;
  color:rgba(246,241,230,0.55);
  text-decoration:none;
  padding:8px 10px;
  min-height:44px;
  display:inline-flex;
  align-items:center;
  border-radius:8px;
  border:1px solid rgba(246,241,230,0.14);
  background:transparent;
  cursor:pointer;
}
.ktv-back:hover{ color:var(--paper); border-color:var(--seal-dim); }
.ktv-brand{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:8px;
  font-family:'Noto Serif SC', 'Noto Sans SC', serif;
  font-weight:700;
  font-size:14px;
  letter-spacing:0.04em;
  opacity:0.85;
  min-width:0;
}
.ktv-brand-text{
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.ktv-chop{
  width:20px;height:20px;flex-shrink:0;
  border:1.5px solid var(--seal-dim);
  border-radius:4px;
  display:flex;align-items:center;justify-content:center;
  font-size:11px;
  color:var(--seal-dim);
}
.ktv-select{
  font-family:'Noto Serif SC', 'Noto Sans SC', serif;
  font-size:13px;
  letter-spacing:0.03em;
  background:rgba(246,241,230,0.06);
  border:1px solid rgba(246,241,230,0.25);
  color:var(--paper);
  padding:8px 28px 8px 10px;
  border-radius:8px;
  cursor:pointer;
  max-width:min(46vw, 200px);
  min-height:44px;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23c17a68' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat:no-repeat;
  background-position:right 10px center;
}
.ktv-select option{ background:#181614; color:var(--paper); }
.ktv-mode-pill{
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:10px;
  letter-spacing:0.04em;
  color:rgba(246,241,230,0.45);
  border:1px solid rgba(246,241,230,0.14);
  border-radius:999px;
  padding:8px 10px;
  white-space:nowrap;
}
.ktv-size-controls{
  display:flex;
  align-items:center;
  gap:4px;
}
.ktv-size-btn{
  width:44px;
  height:44px;
  border-radius:10px;
  border:1px solid rgba(246,241,230,0.22);
  background:rgba(246,241,230,0.08);
  color:var(--paper);
  font-size:22px;
  line-height:1;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
}
.ktv-size-btn:active{ background:rgba(246,241,230,0.16); }
.ktv-size-label{
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:11px;
  color:rgba(246,241,230,0.45);
  min-width:2ch;
  text-align:center;
}

/* ---------- home ---------- */
.ktv-home{
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
  justify-content:center;
  padding: 12px 18px 28px;
  gap:28px;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
}
.ktv-home-hero{ text-align:center; }
.ktv-home-chop{
  font-family:'Noto Serif SC', serif;
  font-size:42px;
  color:var(--seal-dim);
  line-height:1;
  margin-bottom:14px;
}
.ktv-home-title{
  margin:0;
  font-family:'Noto Serif SC', 'Noto Sans SC', serif;
  font-weight:700;
  font-size:clamp(28px, 8vw, 48px);
  line-height:1.2;
  letter-spacing:0.04em;
}
.ktv-home-pinyin{
  margin:10px 0 0;
  font-size:clamp(16px, 4.2vw, 22px);
  color:var(--seal-dim);
  letter-spacing:0.02em;
}
.ktv-home-actions{
  display:flex;
  flex-direction:column;
  gap:12px;
  max-width:420px;
  width:100%;
  margin:0 auto;
}
.ktv-mode-btn{
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  justify-content:center;
  gap:4px;
  width:100%;
  text-align:left;
  padding:18px 18px;
  min-height:64px;
  border-radius:16px;
  border:1px solid rgba(246,241,230,0.18);
  background:rgba(246,241,230,0.06);
  color:var(--paper);
  cursor:pointer;
}
.ktv-mode-btn:disabled{ opacity:0.4; cursor:not-allowed; }
.ktv-mode-btn-primary{
  background:var(--paper);
  color:var(--ink);
  border-color:transparent;
}
.ktv-mode-btn-title{
  font-family:'Noto Serif SC', 'Noto Sans SC', serif;
  font-weight:700;
  font-size:18px;
  letter-spacing:0.02em;
}

/* ---------- cards ---------- */
.ktv-progress-wrap{ padding:2px 14px 8px; flex-shrink:0; }
.ktv-progress-track{
  height:2px;
  background:rgba(246,241,230,0.14);
  border-radius:2px;
  overflow:hidden;
}
.ktv-progress-fill{
  height:100%;
  background:var(--seal-dim);
  transition:width 0.25s ease;
}
.ktv-progress-meta{
  display:flex;
  justify-content:space-between;
  gap:8px;
  margin-top:8px;
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:10px;
  color:rgba(246,241,230,0.45);
  letter-spacing:0.03em;
}
.ktv-progress-meta span:first-child{
  min-width:0;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.ktv-stage{
  flex:1;
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 2px 10px 4px;
  min-height:0;
  touch-action:none;
}
.ktv-empty{
  text-align:center;
  color:rgba(246,241,230,0.55);
  max-width:320px;
  font-size:14px;
  line-height:1.7;
  padding:0 16px;
  margin:auto;
}
.ktv-empty-glyph{
  font-family:'Noto Serif SC', serif;
  font-size:56px;
  color:var(--seal-dim);
  margin-bottom:14px;
  line-height:1;
}
.ktv-card{
  position:absolute;
  inset: 2px 8px 4px;
  width:auto;
  max-width:720px;
  margin:0 auto;
  left:8px; right:8px;
  background:var(--paper);
  border-radius:18px;
  color:var(--ink);
  display:flex;
  flex-direction:column;
  box-shadow: 0 24px 48px -18px rgba(0,0,0,0.55);
  will-change:transform, opacity;
  touch-action:none;
}
.ktv-card-tag{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:14px 16px 0;
  flex-shrink:0;
}
.ktv-section-chop{
  font-family:'Noto Serif SC', serif;
  font-weight:700;
  font-size:11px;
  letter-spacing:0.06em;
  color:var(--seal);
  border:1.3px solid var(--seal);
  padding:4px 9px;
  border-radius:3px;
}
.ktv-line-index{
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:11px;
  color:var(--gray);
}
.ktv-hanzi-zone{
  flex:1 1 auto;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 8px 14px 4px;
  min-height:0;
  width:100%;
}
.ktv-hanzi{
  font-family:'Noto Serif SC', 'Noto Sans SC', serif;
  font-weight:700;
  text-align:center;
  line-height:1.22;
  letter-spacing:0.04em;
  color:var(--ink);
  width:100%;
  white-space:normal;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.ktv-pinyin-zone{
  flex-shrink:0;
  width:100%;
  text-align:center;
  padding: 8px 14px 12px;
}
.ktv-pinyin{
  font-family:'Noto Sans SC', sans-serif;
  font-weight:600;
  font-size:clamp(22px, 5.8vw, 34px);
  line-height:1.4;
  color:var(--seal);
  letter-spacing:0.03em;
  width:100%;
  white-space:normal;
  overflow-wrap:anywhere;
}
.ktv-divider{
  margin:4px 16px 0;
  height:1px;
  background:var(--line);
  flex-shrink:0;
}
.ktv-gloss{
  flex-shrink:0;
  max-height:26%;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
  padding: 10px 14px 14px;
  overscroll-behavior:contain;
}
.ktv-gloss-label{
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:9px;
  letter-spacing:0.12em;
  color:var(--gray);
  text-transform:uppercase;
  padding:0 2px 8px;
}
.ktv-gloss-row{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
}
.ktv-gloss-chip{
  background:var(--paper-dim);
  border:1px solid var(--line);
  border-radius:10px;
  padding:6px 9px 7px;
  text-align:center;
  min-width:42px;
}
.ktv-gloss-chip .h{
  font-family:'Noto Serif SC', serif;
  font-weight:600;
  font-size:16px;
  color:var(--ink);
  line-height:1.15;
}
.ktv-gloss-chip .p{
  font-family:'JetBrains Mono', ui-monospace, monospace;
  font-size:9px;
  color:var(--gray);
  margin-top:2px;
}
.ktv-gloss-chip .g{
  font-size:10px;
  color:var(--seal);
  margin-top:3px;
  font-weight:500;
  line-height:1.25;
}
.ktv-card-nav{
  flex-shrink:0;
  display:grid;
  grid-template-columns: 1fr 1.35fr;
  gap:10px;
  padding: 8px 12px 14px;
}
.ktv-nav-btn{
  min-height:56px;
  border-radius:14px;
  border:1px solid rgba(246,241,230,0.2);
  background:rgba(246,241,230,0.08);
  color:var(--paper);
  font-family:'Noto Sans SC', sans-serif;
  font-size:16px;
  font-weight:600;
  letter-spacing:0.02em;
  cursor:pointer;
  padding:12px 14px;
}
.ktv-nav-btn:disabled{
  opacity:0.28;
  cursor:default;
}
.ktv-nav-btn-next{
  background:var(--seal);
  border-color:transparent;
  color:#f6f1e6;
  font-size:18px;
}

/* ---------- pinyin scroll ---------- */
.ktv-pinyin-scroll{
  flex:1;
  min-height:0;
  overflow-y:auto;
  -webkit-overflow-scrolling:touch;
  padding: 8px 18px 32px;
  overscroll-behavior:contain;
}
.ktv-pinyin-block{ margin-bottom:28px; }
.ktv-pinyin-section{
  margin:0 0 14px;
  font-family:'Noto Serif SC', serif;
  font-size:12px;
  font-weight:700;
  letter-spacing:0.08em;
  color:var(--seal-dim);
  border-bottom:1px solid rgba(246,241,230,0.12);
  padding-bottom:8px;
}
.ktv-pinyin-line{
  margin:0 0 0.7em;
  font-family:'Noto Sans SC', sans-serif;
  font-weight:500;
  line-height:1.45;
  letter-spacing:0.02em;
  color:var(--paper);
  text-align:left;
}

@media (max-width: 420px){
  .ktv-brand-text{ max-width:28vw; }
  .ktv-select{ max-width:none; }
  .ktv-card{ inset: 0 4px 2px; border-radius:14px; left:4px; right:4px; }
  .ktv-pinyin{ font-size:clamp(20px, 6vw, 30px); }
  .ktv-gloss{ max-height:24%; }
  .ktv-card-nav{ grid-template-columns: 0.9fr 1.4fr; }
  .ktv-nav-btn{ min-height:54px; font-size:15px; }
  .ktv-nav-btn-next{ font-size:17px; }
}
@media (min-width: 640px){
  .ktv-topbar{ padding:14px 18px 8px; }
  .ktv-card-tag{ padding:18px 22px 0; }
  .ktv-hanzi-zone{ padding: 12px 22px 8px; }
  .ktv-pinyin-zone{ padding: 10px 22px 14px; }
  .ktv-gloss{ padding: 12px 20px 18px; max-height:28%; }
  .ktv-card-nav{ max-width:720px; margin:0 auto; width:100%; padding: 10px 18px 18px; }
  .ktv-pinyin-scroll{ padding: 12px 32px 40px; max-width:820px; margin:0 auto; width:100%; }
}
`;
