import { NextResponse } from 'next/server';

const LLM_API_URL = process.env.LLM_API_URL || 'http://127.0.0.1:28471';
const LLM_API_TOKEN = process.env.LLM_API_TOKEN;

export async function POST(request: Request) {
  if (!LLM_API_TOKEN) {
    return NextResponse.json(
      { error: 'LLM_API_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const { message, history } = await request.json();

    // Priorizamos o uso do /edu/chat conforme sugerido para o tutor
    // No futuro, se for necessário usar RAG (/ask), a lógica pode ser alternada aqui.
    const response = await fetch(`${LLM_API_URL}/edu/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history,
        level: 'HSK1', // Nível padrão para o tutor inicial
        language: 'zh-CN',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to communicate with LLM API', detail: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Tenta extrair o JSON estruturado se ele vier dentro do reply como texto
    // ou se a API já retornar no formato reply_structured
    let structured = data.reply_structured;
    if (!structured && typeof data.reply === 'string') {
      try {
        // Tenta encontrar um JSON dentro da string de resposta se houver
        const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          structured = parsed.reply_structured || parsed;
        }
      } catch (e) {
        console.error('Failed to parse structured response from reply text', e);
      }
    }

    return NextResponse.json({
      reply: data.reply,
      structured: structured || null,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
