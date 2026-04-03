import { NextResponse } from 'next/server';

/** Dev fallback: API on localhost. Production: set LLM_API_URL (e.g. https://llm.webplace.cc) — see ITCS/featureLLM docs/MANUAL_INTEGRACAO.md § 1.1. */
const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:28471';
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;

type StructuredLine = {
  hanzi: string;
  pinyin: string;
  translation: Record<string, string>;
};

type ChatHistoryTurn = { role: 'user' | 'assistant'; content: string };

type ChatPayload = {
  message: string;
  history: ChatHistoryTurn[];
};

type EduChatKind = 'primary' | 'retry';

/**
 * Model alias for POST /edu/chat (see ITCS/featureLLM docs/EDU_API_CONTRACT.md).
 * - Unset / empty: omit `model` → API uses its default (typically `fast`, shorter JSON replies).
 * - `smart`: larger / slower model for quality.
 * - Any other string: full Ollama model name if the API supports it.
 */
function resolveEduChatModel(kind: EduChatKind): string | undefined {
  const retryOverride = process.env.LLM_EDU_CHAT_MODEL_RETRY?.trim();
  if (kind === 'retry' && retryOverride) return retryOverride;
  const primary = process.env.LLM_EDU_CHAT_MODEL?.trim();
  if (!primary) return undefined;
  return primary;
}

function buildEduChatBody(payload: ChatPayload, kind: EduChatKind): Record<string, unknown> {
  const body: Record<string, unknown> = {
    message: payload.message,
    history: payload.history,
    level: 'HSK1',
    language: 'zh-CN',
  };
  const model = resolveEduChatModel(kind);
  if (model) body.model = model;
  return body;
}

async function callEduChat(payload: ChatPayload, kind: EduChatKind) {
  const response = await fetch(`${LLM_API_URL}/edu/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LLM_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEduChatBody(payload, kind)),
  });

  return response;
}

function normalizeStructured(input: unknown): StructuredLine[] | null {
  if (!Array.isArray(input)) return null;

  const rows = input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as {
        hanzi?: unknown;
        pinyin?: unknown;
        translation?: unknown;
      };

      if (typeof candidate.hanzi !== 'string' || typeof candidate.pinyin !== 'string') {
        return null;
      }

      const rawTranslation = candidate.translation;
      if (!rawTranslation || typeof rawTranslation !== 'object' || Array.isArray(rawTranslation)) {
        return null;
      }

      const translationEntries = Object.entries(rawTranslation).filter(
        ([, value]) => typeof value === 'string' && value.trim().length > 0
      );

      if (translationEntries.length === 0) return null;

      const translation = Object.fromEntries(translationEntries) as Record<string, string>;
      if (!translation.pt) return null;

      return {
        hanzi: candidate.hanzi.trim(),
        pinyin: candidate.pinyin.trim(),
        translation,
      };
    })
    .filter((line): line is StructuredLine => Boolean(line));

  return rows.length > 0 ? rows : null;
}

function extractStructuredFromReplyText(reply: unknown): StructuredLine[] | null {
  if (typeof reply !== 'string') return null;

  try {
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return normalizeStructured(parsed.reply_structured || parsed);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  if (!LLM_API_TOKEN) {
    return NextResponse.json(
      {
        error: 'LLM_API_TOKEN not configured',
        hint: 'Set LLM_API_TOKEN in web/.env.local. Optional LLM_API_URL there: http://127.0.0.1:28471 (Docker) or https://llm.webplace.cc.',
      },
      { status: 500 }
    );
  }

  try {
    const { message, history } = await request.json();
    const safeHistory: ChatHistoryTurn[] = Array.isArray(history)
      ? history
          .filter((turn) => turn && typeof turn === 'object')
          .map((turn): ChatHistoryTurn => ({
            role: turn.role === 'assistant' ? 'assistant' : 'user',
            content: typeof turn.content === 'string' ? turn.content : '',
          }))
      : [];

    const basePayload: ChatPayload = {
      message: typeof message === 'string' ? message : '',
      history: safeHistory,
    };

    const response = await callEduChat(basePayload, 'primary');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to communicate with LLM API', detail: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    let structured =
      normalizeStructured(data.reply_structured) ||
      extractStructuredFromReplyText(data.reply);

    let didRetry = false;
    /** Prefer `reply` / `full_reply_text` from the response that supplied `structured`. */
    let replySource: Record<string, unknown> = data;
    if (!structured) {
      didRetry = true;
      const retryResponse = await callEduChat(
        {
          message: `${basePayload.message}\n\nResponda SOMENTE em JSON válido com reply_structured[] e, em cada frase, hanzi + pinyin com tons + translation.pt.`,
          history: basePayload.history,
        },
        'retry'
      );

      if (retryResponse.ok) {
        const retryData = (await retryResponse.json()) as Record<string, unknown>;
        const fromRetry =
          normalizeStructured(retryData.reply_structured) ||
          extractStructuredFromReplyText(retryData.reply);
        if (fromRetry) {
          structured = fromRetry;
          replySource = retryData;
        }
      }
    }

    const rawReply = replySource.reply;
    const rawFull = replySource.full_reply_text;
    const finalReply =
      typeof rawReply === 'string' && rawReply.trim()
        ? rawReply.trim()
        : typeof rawFull === 'string' && rawFull.trim()
          ? rawFull.trim()
          : 'Tudo bem! Vamos praticar chinês com frases curtas.';

    return NextResponse.json({
      reply: finalReply,
      structured,
      metadata: {
        didRetryForStructured: didRetry,
        hasStructured: Boolean(structured),
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
