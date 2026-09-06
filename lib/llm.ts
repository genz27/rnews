export type ChatTextPart = { type: 'text'; text: string };
export type ChatImagePart = { type: 'image_url'; image_url: { url: string } };
export type ChatContent = string | Array<ChatTextPart | ChatImagePart>;

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: ChatContent;
  name?: string;
  tool_call_id?: string;
};

export function llmConfig() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROK2API_API_KEY || '';
  const baseUrl = (process.env.OPENAI_BASE_URL || process.env.GROK2API_BASE_URL || 'http://173.249.208.30:8000/v1').replace(
    /\/+$/,
    ''
  );
  const model = process.env.OPENAI_MODEL || process.env.GROK2API_MODEL || 'grok-chat-fast';
  return { apiKey, baseUrl, model };
}

export function llmReady() {
  return Boolean(llmConfig().apiKey);
}

export async function completeChat(options: {
  messages: ChatMessage[];
  stream?: false;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const { apiKey, baseUrl, model } = llmConfig();
  if (!apiKey) throw new Error('模型未配置');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream: false,
      max_completion_tokens: options.maxTokens ?? 1800,
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 55000),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.slice(0, 240) || `模型 HTTP ${response.status}`);
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function streamChat(options: {
  messages: ChatMessage[];
  maxTokens?: number;
  signal?: AbortSignal;
  extra?: Record<string, unknown>;
}): Promise<ReadableStream<Uint8Array>> {
  const { apiKey, baseUrl, model } = llmConfig();
  if (!apiKey) throw new Error('模型未配置');

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream: true,
      max_completion_tokens: options.maxTokens ?? 2200,
      ...options.extra,
    }),
    signal: options.signal,
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    throw new Error(text.slice(0, 240) || `模型 HTTP ${upstream.status}`);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let buffer = '';

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload) as {
            citations?: unknown;
            search_results?: unknown;
            choices?: Array<{
              delta?: { content?: string; citations?: unknown };
              message?: { content?: string };
            }>;
          };
          const text = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || '';
          if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`));
          const sources = citationSources(json.citations)
            .concat(citationSources(json.choices?.[0]?.delta?.citations))
            .concat(citationSources(json.search_results));
          if (sources.length) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'citations', sources, urls: sources.map((item) => item.href) })}\n\n`)
            );
          }
        } catch {
          /* skip malformed chunk */
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
}

function citationSources(value: unknown): Array<{ href: string; title?: string }> {
  if (!Array.isArray(value)) return [];
  const sources: Array<{ href: string; title?: string }> = [];
  for (const item of value) {
    if (typeof item === 'string' && item.startsWith('http')) {
      sources.push({ href: item });
      continue;
    }
    if (item && typeof item === 'object') {
      const record = item as { url?: unknown; uri?: unknown; title?: unknown; name?: unknown };
      const href = typeof record.url === 'string' ? record.url : typeof record.uri === 'string' ? record.uri : '';
      if (!href.startsWith('http')) continue;
      const title = typeof record.title === 'string' ? record.title : typeof record.name === 'string' ? record.name : '';
      sources.push({ href, title: title || undefined });
    }
  }
  return sources;
}

export function sseData(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export function sseError(message: string) {
  return sseData({ type: 'error', message });
}

export function prependSse(payload: unknown, stream: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(sseData(payload)));
      const reader = stream.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      void stream.cancel();
    },
  });
}
