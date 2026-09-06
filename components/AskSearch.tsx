'use client';

import { MarkdownText } from '@/components/MarkdownText';
import { fallbackFollowups, parseAskAnswer, type AskSource } from '@/lib/ask-format';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type RefObject } from 'react';

export type AskTurn = {
  id: string;
  query: string;
  images: string[];
  answer: string;
  citations?: Array<string | { href: string; title?: string }>;
  error?: string;
};

const EXAMPLES = ['今天有什么重要新闻', 'AI 有什么新进展', '社区在聊什么'];
const OLD_THREAD_KEY = 'rnews-ask-thread';

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export function AskSearch({
  initialQuery = '',
  autoAsk = false,
  inputRef,
  onClearRef,
  onActiveChange,
}: {
  initialQuery?: string;
  autoAsk?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  onClearRef?: RefObject<(() => void) | null>;
  onActiveChange?: (active: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(autoAsk ? '' : initialQuery);
  const [images, setImages] = useState<string[]>([]);
  const [turns, setTurns] = useState<AskTurn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [focus, setFocus] = useState<{ turnId: string; index: number } | null>(null);
  const [openSources, setOpenSources] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const askedRef = useRef('');
  const localInputRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = inputRef || localInputRef;
  const pendingRef = useRef<Record<string, string>>({});
  const rafRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const resizeBox = () => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const flushPending = () => {
    rafRef.current = 0;
    const pending = pendingRef.current;
    pendingRef.current = {};
    const ids = Object.keys(pending);
    if (ids.length === 0) return;
    setTurns((current) =>
      current.map((turn) => (pending[turn.id] ? { ...turn, answer: turn.answer + pending[turn.id] } : turn))
    );
  };

  const appendDelta = (id: string, text: string) => {
    pendingRef.current[id] = (pendingRef.current[id] || '') + text;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flushPending);
  };

  const clearThread = () => {
    abortRef.current?.abort();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    pendingRef.current = {};
    setTurns([]);
    setQuery('');
    setImages([]);
    askedRef.current = '';
    setFocus(null);
    setOpenSources({});
    router.replace('/ask');
    window.setTimeout(() => boxRef.current?.focus(), 20);
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
      .slice(-6)
      .flatMap((turn) => [
        { role: 'user', content: turn.query },
        { role: 'assistant', content: turn.answer },
      ]);
    const first = turns.length === 0;
    setTurns((current) => [...current, { id, query: text, images: nextImages, answer: '' }]);
    setQuery('');
    setImages([]);
    setStreaming(true);
    if (first) router.replace(`/ask?q=${encodeURIComponent(text)}`);
    window.setTimeout(() => {
      resizeBox();
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 20);
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
              urls?: string[];
              sources?: Array<{ href?: string; title?: string }>;
            };
            if (event.type === 'delta' && event.text) {
              appendDelta(id, event.text);
            } else if (event.type === 'citations') {
              const incoming = (event.sources || []).filter((item) => item.href);
              const extras = (event.urls || []).map((href) => ({ href }));
              const batch = (incoming.length ? incoming : extras) as Array<{ href: string; title?: string }>;
              if (batch.length) {
                setTurns((current) =>
                  current.map((turn) => {
                    if (turn.id !== id) return turn;
                    const next = [...(turn.citations || [])];
                    const seen = new Set(next.map((item) => (typeof item === 'string' ? item : item.href)));
                    for (const source of batch) {
                      if (!seen.has(source.href)) {
                        seen.add(source.href);
                        next.push(source);
                      }
                    }
                    return { ...turn, citations: next };
                  })
                );
              }
            } else if (event.type === 'error') {
              flushPending();
              setTurns((current) =>
                current.map((turn) => (turn.id === id ? { ...turn, error: event.message || '搜索失败' } : turn))
              );
            }
          } catch {
            /* skip */
          }
        }
      }
      flushPending();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      flushPending();
      setTurns((current) =>
        current.map((turn) => (turn.id === id ? { ...turn, error: '搜索失败，请再试一次。' } : turn))
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setStreaming(false);
      window.setTimeout(() => boxRef.current?.focus(), 40);
    }
  };

  useEffect(() => {
    if (onClearRef) onClearRef.current = clearThread;
  });

  useEffect(() => {
    onActiveChange?.(turns.length > 0);
  }, [onActiveChange, turns.length]);

  useEffect(() => {
    try {
      localStorage.removeItem(OLD_THREAD_KEY);
    } catch {
      /* ignore */
    }
    boxRef.current?.focus();
  }, [boxRef]);

  useEffect(() => {
    const text = initialQuery.trim();
    if (!autoAsk || !text || askedRef.current === text) return;
    askedRef.current = text;
    void ask(text, []);
    // Ask when /ask?q= is passed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAsk, initialQuery]);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, 6 - images.length);
    const urls = await Promise.all(picked.map((file) => readImage(file)));
    setImages((current) => [...current, ...urls].slice(0, 6));
  };

  const empty = turns.length === 0;

  const composer = (
    <form
      className="rounded-2xl border border-zinc-200/80 bg-zinc-50 px-4 py-3 shadow-sm dark:border-white/[0.08] dark:bg-zinc-900/80"
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
              <img src={src} alt="" className="size-14 object-cover" />
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        ref={boxRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          window.requestAnimationFrame(resizeBox);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void ask();
          }
        }}
        rows={1}
        placeholder={empty ? '有问题就搜，比如今天 AI 有什么新闻' : '继续追问'}
        className="max-h-40 min-h-7 w-full resize-none bg-transparent text-[15px] leading-7 text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-600"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
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
          className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          图片
        </button>
        {streaming ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            停止
          </button>
        ) : (
          <button
            type="submit"
            disabled={!query.trim()}
            className="text-sm text-zinc-500 transition hover:text-zinc-800 disabled:opacity-40 dark:hover:text-zinc-200"
          >
            搜索
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div id="ask" className={empty ? 'flex min-h-[calc(100dvh-11rem)] flex-col justify-center lg:min-h-[calc(100dvh-10rem)]' : undefined}>
      {empty ? (
        <div className="mx-auto w-full max-w-2xl pb-10">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">AI 搜索</h1>
          <p className="mt-2 text-center text-sm text-zinc-500">先搜，再往下看来源和追问</p>
          <div className="mt-8">{composer}</div>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
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
        </div>
      ) : (
        <>
          <div className="mx-auto w-full max-w-2xl pb-36 lg:pb-28">
            {turns.map((turn, index) => {
              const last = index === turns.length - 1;
              const parsed = parseAskAnswer(turn.answer, turn.citations);
              const followups = parsed.followups.length ? parsed.followups : last && !streaming ? fallbackFollowups(turn.query) : [];
              return (
                <section key={turn.id} className="border-b border-zinc-200/80 py-8 last:border-b-0 dark:border-white/[0.06]">
                  <h2 className="text-xl font-semibold leading-8 tracking-tight text-zinc-900 dark:text-zinc-50">
                    {turn.query}
                  </h2>
                  {turn.images.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {turn.images.map((src, imageIndex) => (
                        <img key={imageIndex} src={src} alt="" className="size-14 rounded-md object-cover" />
                      ))}
                    </div>
                  ) : null}
                  {parsed.sources.length > 0 ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSources((current) => ({ ...current, [turn.id]: !current[turn.id] }))
                        }
                        className="mb-2 text-xs tracking-wide text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        {parsed.sources.length} 个来源
                      </button>
                      <div
                        className={
                          openSources[turn.id]
                            ? 'grid grid-cols-2 gap-2'
                            : '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide'
                        }
                      >
                        {parsed.sources.map((source, sourceIndex) => (
                          <SourceCard
                            key={source.href}
                            id={`ask-source-${turn.id}-${sourceIndex}`}
                            source={source}
                            index={sourceIndex}
                            active={focus?.turnId === turn.id && focus.index === sourceIndex}
                            wide={openSources[turn.id]}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {turn.error ? (
                    <p className="mt-5 text-sm leading-7 text-zinc-500">{turn.error}</p>
                  ) : parsed.body ? (
                    <div className="mt-5">
                      <MarkdownText
                        text={parsed.body}
                        sources={parsed.sources}
                        onCite={(sourceIndex) => {
                          setOpenSources((current) => ({ ...current, [turn.id]: true }));
                          setFocus({ turnId: turn.id, index: sourceIndex });
                          window.requestAnimationFrame(() => {
                            document
                              .getElementById(`ask-source-${turn.id}-${sourceIndex}`)
                              ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                          });
                        }}
                      />
                    </div>
                  ) : streaming && last ? (
                    <p className="loading-dots mt-5 text-sm text-zinc-500">
                      {parsed.sources.length ? '正在整理' : '正在搜索网页'}
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </p>
                  ) : null}
                  {last && !streaming && !turn.error && followups.length > 0 ? (
                    <div className="mt-6">
                      <p className="mb-2 text-xs tracking-wide text-zinc-400">追问</p>
                      <div className="flex flex-wrap gap-2">
                        {followups.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => void ask(item, [])}
                            className="rounded-full border border-zinc-200/80 px-3 py-1.5 text-[13px] text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800 dark:border-white/[0.08] dark:hover:border-white/20 dark:hover:text-zinc-200"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent px-4 pb-2 pt-8 dark:from-zinc-950 dark:via-zinc-950/90 lg:bottom-4 lg:px-8">
            <div className="pointer-events-auto mx-auto w-full max-w-2xl">{composer}</div>
          </div>
        </>
      )}
    </div>
  );
}

function SourceCard({
  id,
  source,
  index,
  active,
  wide,
}: {
  id: string;
  source: AskSource;
  index: number;
  active?: boolean;
  wide?: boolean;
}) {
  const title = source.title && source.title !== source.host ? source.title : source.host;
  return (
    <a
      id={id}
      href={source.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 transition ${wide ? 'w-full' : 'w-44 shrink-0'} ${
        active
          ? 'border-zinc-800 bg-zinc-100 dark:border-zinc-200 dark:bg-white/[0.08]'
          : 'border-zinc-200/80 hover:border-zinc-400 dark:border-white/[0.08] dark:hover:border-white/20'
      }`}
    >
      <span className="flex items-center gap-2 text-[11px] text-zinc-400">
        <img
          src={`https://icons.duckduckgo.com/ip3/${source.host}.ico`}
          alt=""
          className="size-3.5 rounded-sm"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
        <span>{index + 1}</span>
        <span className="truncate">{source.host}</span>
      </span>
      <span className="line-clamp-2 text-[13px] leading-5 text-zinc-700 dark:text-zinc-200">{title}</span>
    </a>
  );
}
