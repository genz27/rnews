'use client';

import { MarkdownText } from '@/components/MarkdownText';
import { useEffect, useRef, useState, type RefObject } from 'react';

export type AskTurn = {
  id: string;
  query: string;
  images: string[];
  answer: string;
  error?: string;
};

const EXAMPLES = ['今天有什么重要新闻', 'AI 有什么新进展', '社区在聊什么'];
const STORAGE_KEY = 'rnews-ask-thread';

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function loadTurns(): AskTurn[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AskTurn[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((turn) => turn && typeof turn.query === 'string')
      .slice(-24)
      .map((turn) => ({
        id: String(turn.id || `${Date.now()}`),
        query: turn.query,
        images: [],
        answer: typeof turn.answer === 'string' ? turn.answer : '',
        error: typeof turn.error === 'string' ? turn.error : undefined,
      }));
  } catch {
    return [];
  }
}

function saveTurns(turns: AskTurn[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(turns.slice(-24).map((turn) => ({ ...turn, images: [] })))
    );
  } catch {
    /* quota */
  }
}

export function AskSearch({
  initialQuery = '',
  autoAsk = false,
  persist = false,
  layout = 'embed',
  inputRef,
  onClearRef,
}: {
  initialQuery?: string;
  autoAsk?: boolean;
  persist?: boolean;
  layout?: 'embed' | 'page';
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  onClearRef?: RefObject<(() => void) | null>;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<string[]>([]);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [openThread, setOpenThread] = useState(!persist);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const askedRef = useRef('');
  const localInputRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = inputRef || localInputRef;
  const [ready, setReady] = useState(!persist);

  const clearThread = () => {
    abortRef.current?.abort();
    setTurns([]);
    setQuery('');
    setImages([]);
    askedRef.current = '';
    setOpenThread(false);
    if (persist) localStorage.removeItem(STORAGE_KEY);
  };

  const ask = async (nextQuery = query, nextImages = images) => {
    const text = nextQuery.trim();
    if (!text || streaming) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const id = `${Date.now()}`;
    const history = turns
      .filter((turn) => turn.answer && !turn.error)
      .slice(-8)
      .flatMap((turn) => [
        { role: 'user', content: turn.query },
        { role: 'assistant', content: turn.answer },
      ]);
    setOpenThread(true);
    setTurns((current) => [...current, { id, query: text, images: nextImages, answer: '' }]);
    setQuery('');
    setImages([]);
    setStreaming(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, images: nextImages, history }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const raw = await response.text();
        let message = '暂时答不出来，请稍后再试。';
        try {
          const parsed = JSON.parse(raw) as { error?: string };
          if (parsed.error) message = parsed.error;
        } catch {
          if (raw.trim()) message = raw.slice(0, 180);
        }
        setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, error: message } : turn)));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const payload = line.trim();
          if (!payload.startsWith('data:')) continue;
          const json = payload.slice(5).trim();
          if (!json) continue;
          try {
            const event = JSON.parse(json) as {
              type?: string;
              text?: string;
              message?: string;
            };
            if (event.type === 'delta' && event.text) {
              setTurns((current) =>
                current.map((turn) => (turn.id === id ? { ...turn, answer: turn.answer + event.text } : turn))
              );
            } else if (event.type === 'error') {
              setTurns((current) =>
                current.map((turn) => (turn.id === id ? { ...turn, error: event.message || '搜索失败' } : turn))
              );
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setTurns((current) =>
        current.map((turn) => (turn.id === id ? { ...turn, error: '搜索失败，请再试一次。' } : turn))
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setStreaming(false);
    }
  };

  useEffect(() => {
    if (onClearRef) onClearRef.current = clearThread;
  });

  useEffect(() => {
    if (!persist) return;
    setTurns(loadTurns());
    setReady(true);
  }, [persist]);

  useEffect(() => {
    if (!persist || !ready || streaming) return;
    saveTurns(turns);
  }, [persist, ready, streaming, turns]);

  useEffect(() => {
    if (!ready || !autoAsk) return;
    const text = initialQuery.trim();
    if (!text || askedRef.current === text) return;
    askedRef.current = text;
    setOpenThread(true);
    void ask(text, []);
    // Ask when /ask?q= is passed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAsk, initialQuery, ready]);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).filter((file) => file.type.startsWith('image/')).slice(0, 6 - images.length);
    const urls = await Promise.all(picked.map((file) => readImage(file)));
    setImages((current) => [...current, ...urls].slice(0, 6));
  };

  const composer = (
    <form
      className="border-b border-zinc-200/80 pb-2 transition-colors duration-200 focus-within:border-zinc-800 dark:border-white/[0.08] dark:focus-within:border-zinc-200"
      onSubmit={(event) => {
        event.preventDefault();
        void ask();
      }}
    >
      {images.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {images.map((src, index) => (
            <button
              key={`${index}-${src.slice(0, 24)}`}
              type="button"
              onClick={() => setImages((current) => current.filter((_, currentIndex) => currentIndex !== index))}
              className="overflow-hidden rounded-md border border-zinc-200/80 dark:border-white/[0.08]"
              title="移除图片"
            >
              <img src={src} alt="" className="size-16 object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-end gap-3">
        <textarea
          ref={boxRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void ask();
            }
          }}
          rows={2}
          placeholder="用 AI 搜索今日资讯"
          className="min-h-11 min-w-0 flex-1 resize-none bg-transparent text-sm leading-6 text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            void addImages(event.target.files);
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="shrink-0 pb-1 text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          图片
        </button>
        {streaming ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="shrink-0 pb-1 text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            停止
          </button>
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className="shrink-0 pb-1 text-sm text-zinc-500 transition hover:text-zinc-800 disabled:opacity-40 dark:hover:text-zinc-200"
          >
            搜索
          </button>
        )}
      </div>
    </form>
  );

  const examples = (
    <div className="mt-4 flex flex-wrap gap-2">
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => void ask(example, [])}
          className="rounded-full border border-zinc-200/80 px-3 py-1.5 text-[13px] text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-white/[0.08] dark:hover:border-white/20 dark:hover:text-zinc-200"
        >
          {example}
        </button>
      ))}
    </div>
  );

  const thread = (
    <div className="mt-2">
      {turns.map((turn, index) => (
        <section key={turn.id} className="border-b border-zinc-200/80 py-6 last:border-b-0 dark:border-white/[0.06]">
          <h2 className="text-base font-medium leading-7 tracking-tight text-zinc-900 lg:text-[17px] lg:leading-8 dark:text-zinc-50">
            {turn.query}
          </h2>
          {turn.images.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {turn.images.map((src, imageIndex) => (
                <img key={imageIndex} src={src} alt="" className="size-16 rounded-md object-cover" />
              ))}
            </div>
          ) : null}
          {turn.error ? (
            <p className="mt-4 text-sm leading-7 text-zinc-500">{turn.error}</p>
          ) : turn.answer ? (
            <div className="mt-4">
              <MarkdownText text={turn.answer} />
            </div>
          ) : streaming && index === turns.length - 1 ? (
            <p className="mt-4 text-sm text-zinc-500">正在搜索…</p>
          ) : null}
        </section>
      ))}
    </div>
  );

  return (
    <div id="ask" className={layout === 'page' ? 'lg:mt-6' : undefined}>
      {layout === 'page' ? null : (
        <h2 className="mb-3 text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-50">AI 搜索</h2>
      )}
      {composer}
      {!openThread && turns.length > 0 ? (
        <button
          type="button"
          onClick={() => setOpenThread(true)}
          className="mt-4 text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          继续上次对话（{turns.length}）
        </button>
      ) : null}
      {!openThread || turns.length === 0 ? examples : thread}
    </div>
  );
}
