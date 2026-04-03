import { NextResponse } from 'next/server';

const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:28471';
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;

type StructuredLine = {
  hanzi: string;
  pinyin: string;
  translation: Record<string, string>;
};

type ChatPayload = {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
};

async function callEduChat(payload: ChatPayload) {
  const response = await fetch(`${LLM_API_URL}/edu/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LLM_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: payload.message,
      history: payload.history,
      level: 'HSK1',
      language: 'zh-CN',
    }),
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
        hint: 'Set LLM_API_TOKEN in web/.env.local (repo includes web/.env with LLM_API_URL).',
      },
      { status: 500 }
    );
  }

  try {
    const { message, history } = await request.json();
    const safeHistory = Array.isArray(history)
      ? history
          .filter((turn) => turn && typeof turn === 'object')
          .map((turn) => ({
            role: turn.role === 'assistant' ? 'assistant' : 'user',
            content: typeof turn.content === 'string' ? turn.content : '',
          }))
      : [];

    const basePayload: ChatPayload = {
      message: typeof message === 'string' ? message : '',
      history: safeHistory,
    };

    const response = await callEduChat(basePayload);
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
    if (!structured) {
      didRetry = true;
      const retryResponse = await callEduChat({
        message: `${basePayload.message}\n\nResponda SOMENTE em JSON válido com reply_structured[] e, em cada frase, hanzi + pinyin com tons + translation.pt.`,
        history: basePayload.history,
      });

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        structured =
          normalizeStructured(retryData.reply_structured) ||
          extractStructuredFromReplyText(retryData.reply);
      }
    }

    const finalReply = typeof data.reply === 'string' && data.reply.trim() ? data.reply : 'Tudo bem! Vamos praticar chinês com frases curtas.';

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
