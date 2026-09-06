import { NextRequest } from 'next/server';
import { ChatContent, ChatMessage, llmReady, sseError, streamChat } from '@/lib/llm';
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

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是资讯搜索助手。请使用你自带的实时搜索能力查找并回答。先给结论，再分点；分点可用「・」。正文里用 [1](真实url) 编号引用，不要把长链接裸写在句子中间。不要寒暄，不要编造搜不到的新闻，不要自称其他产品。答完后另起两段，严格如下（不要再加别的总标题）：\n\n来源\n1. 来源名 | https://...\n\n追问\n- 基于刚才内容的具体问题\n- 另一个具体问题\n- 第三个具体问题',
    },
  ];

  for (const turn of history) {
    if ((turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string' && turn.content.trim()) {
      messages.push({ role: turn.role, content: turn.content.trim().slice(0, 6000) });
    }
  }

  messages.push({ role: 'user', content: userContent(query, images) });

  try {
    const stream = await streamChat({
      messages,
      signal: request.signal,
      extra: { search_parameters: { mode: 'auto', return_citations: true } },
    });
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
