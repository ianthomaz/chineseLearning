"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import type { RevealState } from "@/lib/phrase-game/display";
import type { DisplaySettings, Piece } from "@/lib/phrase-game/types";
import { PieceContent } from "./PieceCard";

export type BoardValue = { bank: Piece[]; answer: Piece[] };
type ZoneId = "bank" | "answer";

type Props = {
  value: BoardValue;
  onChange: (next: BoardValue) => void;
  settings: DisplaySettings;
  reveal: RevealState;
  /** Disable all interaction (after submit). */
  disabled?: boolean;
  /** Per-piece state for answer pieces after a submit. */
  answerState?: "neutral" | "correct" | "wrong";
  labels: { bank: string; answer: string; answerEmpty: string; moveLeft: string; moveRight: string };
  /** Optional control in the bank zone header (e.g. listen). */
  bankAction?: ReactNode;
};

function SortablePiece({
  piece,
  zone,
  settings,
  reveal,
  disabled,
  state,
  onActivate,
  onNudge,
  nudgeLabels,
}: {
  piece: Piece;
  zone: ZoneId;
  settings: DisplaySettings;
  reveal: RevealState;
  disabled?: boolean;
  state: "neutral" | "correct" | "wrong";
  onActivate: () => void;
  onNudge?: (dir: -1 | 1) => void;
  nudgeLabels: { left: string; right: string };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: piece.id, disabled });

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          touchAction: "none",
        }}
        {...attributes}
        {...listeners}
        onClick={() => !disabled && onActivate()}
        disabled={disabled}
        className="cursor-grab rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:cursor-grabbing"
        aria-label={`${piece.hanzi}${piece.pinyin ? ` (${piece.pinyin})` : ""}`}
      >
        <PieceContent piece={piece} settings={settings} reveal={reveal} inAnswer={zone === "answer"} state={state} />
      </button>
      {zone === "answer" && !disabled && onNudge ? (
        <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          <button
            type="button"
            onClick={() => onNudge(-1)}
            className="flex h-5 w-5 items-center justify-center rounded-full border bg-paper text-[0.6rem] text-ink/60 hover:bg-ink/5"
            style={{ borderColor: "var(--border)" }}
            aria-label={nudgeLabels.left}
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => onNudge(1)}
            className="flex h-5 w-5 items-center justify-center rounded-full border bg-paper text-[0.6rem] text-ink/60 hover:bg-ink/5"
            style={{ borderColor: "var(--border)" }}
            aria-label={nudgeLabels.right}
          >
            ▶
          </button>
        </span>
      ) : null}
    </span>
  );
}

function Zone({
  id,
  title,
  emptyHint,
  headerAction,
  children,
}: {
  id: ZoneId;
  title: string;
  emptyHint?: string;
  headerAction?: ReactNode;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p
          className="text-xs font-medium uppercase tracking-wide text-ink/40"
          style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        >
          {title}
        </p>
        {headerAction}
      </div>
      <div
        ref={setNodeRef}
        className="flex min-h-[4.5rem] flex-wrap items-center gap-2 gap-y-4 rounded-2xl border border-dashed p-3 transition-colors"
        style={{
          borderColor: isOver ? "var(--accent)" : "var(--border)",
          backgroundColor: isOver ? "rgba(45,90,140,0.04)" : "transparent",
        }}
      >
        {children}
        {emptyHint ? <span className="text-sm text-ink/30">{emptyHint}</span> : null}
      </div>
    </div>
  );
}

export function Board({
  value,
  onChange,
  settings,
  reveal,
  disabled,
  answerState = "neutral",
  labels,
  bankAction,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const findZone = (id: string): ZoneId | null => {
    if (id === "bank" || id === "answer") return id;
    if (value.bank.some((p) => p.id === id)) return "bank";
    if (value.answer.some((p) => p.id === id)) return "answer";
    return null;
  };

  const activePiece =
    value.bank.find((p) => p.id === activeId) ??
    value.answer.find((p) => p.id === activeId) ??
    null;

  /** Click / keyboard: move a piece to the other zone (appended at the end). */
  function activate(pieceId: string) {
    const from = findZone(pieceId);
    if (!from) return;
    if (from === "bank") {
      const piece = value.bank.find((p) => p.id === pieceId);
      if (!piece) return;
      onChange({
        bank: value.bank.filter((p) => p.id !== pieceId),
        answer: [...value.answer, piece],
      });
    } else {
      const piece = value.answer.find((p) => p.id === pieceId);
      if (!piece) return;
      onChange({
        answer: value.answer.filter((p) => p.id !== pieceId),
        bank: [...value.bank, piece],
      });
    }
  }

  function nudge(pieceId: string, dir: -1 | 1) {
    const idx = value.answer.findIndex((p) => p.id === pieceId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= value.answer.length) return;
    onChange({ ...value, answer: arrayMove(value.answer, idx, next) });
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findZone(String(active.id));
    const to = findZone(String(over.id));
    if (!from || !to || from === to) return;

    const piece =
      value[from].find((p) => p.id === active.id) ?? null;
    if (!piece) return;

    const fromList = value[from].filter((p) => p.id !== active.id);
    const toList = [...value[to]];
    const overIdx = toList.findIndex((p) => p.id === over.id);
    const insertAt = overIdx >= 0 ? overIdx : toList.length;
    toList.splice(insertAt, 0, piece);

    onChange({
      bank: from === "bank" ? fromList : to === "bank" ? toList : value.bank,
      answer: from === "answer" ? fromList : to === "answer" ? toList : value.answer,
    } as BoardValue);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const from = findZone(String(active.id));
    const to = findZone(String(over.id));
    if (!from || !to || from !== to || active.id === over.id) return;
    const list = value[from];
    const oldIdx = list.findIndex((p) => p.id === active.id);
    const newIdx = list.findIndex((p) => p.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onChange({ ...value, [from]: arrayMove(list, oldIdx, newIdx) } as BoardValue);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="space-y-5">
        <Zone id="bank" title={labels.bank} headerAction={bankAction}>
          <SortableContext items={value.bank.map((p) => p.id)} strategy={rectSortingStrategy}>
            {value.bank.map((piece) => (
              <SortablePiece
                key={piece.id}
                piece={piece}
                zone="bank"
                settings={settings}
                reveal={reveal}
                disabled={disabled}
                state="neutral"
                onActivate={() => activate(piece.id)}
                nudgeLabels={{ left: labels.moveLeft, right: labels.moveRight }}
              />
            ))}
          </SortableContext>
        </Zone>

        <Zone id="answer" title={labels.answer} emptyHint={value.answer.length === 0 ? labels.answerEmpty : undefined}>
          <SortableContext items={value.answer.map((p) => p.id)} strategy={rectSortingStrategy}>
            {value.answer.map((piece) => (
              <SortablePiece
                key={piece.id}
                piece={piece}
                zone="answer"
                settings={settings}
                reveal={reveal}
                disabled={disabled}
                state={answerState}
                onActivate={() => activate(piece.id)}
                onNudge={(dir) => nudge(piece.id, dir)}
                nudgeLabels={{ left: labels.moveLeft, right: labels.moveRight }}
              />
            ))}
          </SortableContext>
        </Zone>
      </div>

      <DragOverlay>
        {activePiece ? (
          <PieceContent piece={activePiece} settings={settings} reveal={reveal} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
