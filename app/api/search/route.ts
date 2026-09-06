import { NextRequest } from 'next/server';
import { ChatContent, ChatMessage, llmReady, prependSse, sseError, streamChat } from '@/lib/llm';
import { formatNewsContext, looksLikeNewsQuery, searchNews } from '@/lib/news-search';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type HistoryTurn = { role?: string; content?: string };

function asImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string' && entry.startsWith('data:image/'))
    .slice(0, 6);
}

function userContent(query: string, images: string[]): ChatContent {
  if (images.length === 0) return query;
  return [
    { type: 'text', text: query },
    ...images.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
  ];
}

export async function POST(request: NextRequest) {
  const blocked = rateLimit(request, { limit: 20, name: 'search' });
  if (blocked) return blocked;

  if (!llmReady()) {
    return Response.json({ error: '搜索暂不可用' }, { status: 503 });
  }

  let body: { query?: string; images?: unknown; history?: HistoryTurn[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: '请求无效' }, { status: 400 });
  }

  const query = (body.query || '').trim();
  if (!query) return Response.json({ error: '请输入问题' }, { status: 400 });
  if (query.length > 4000) return Response.json({ error: '问题太长' }, { status: 400 });

  const images = asImages(body.images);
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

  const news = await searchNews(query, looksLikeNewsQuery(query) ? 18 : 10);
  const context = formatNewsContext(news);

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是 Rnews 的资讯助手。用简洁中文回答，不要自称其他产品。涉及新闻时只依据提供的条目，并用 [标题](链接) 引用；不要编造条目里没有的新闻。一般知识问题可以直接答。',
    },
  ];

  if (context) {
    messages.push({
      role: 'system',
      content: `后台检索到的相关资讯：\n${context}`,
    });
  }

  for (const turn of history) {
    if ((turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string' && turn.content.trim()) {
      messages.push({ role: turn.role, content: turn.content.trim().slice(0, 6000) });
    }
  }

  messages.push({ role: 'user', content: userContent(query, images) });

  try {
    const stream = prependSse({ type: 'related', items: news }, await streamChat({ messages, signal: request.signal }));
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '搜索失败';
    return new Response(sseError(message), {
      status: 502,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}
