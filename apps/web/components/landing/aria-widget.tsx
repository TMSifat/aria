'use client';

import * as React from 'react';

const GREETING =
  'Hi! I’m the Ariaay assistant. Ask me anything — what Ariaay does, pricing, or how to put an assistant like me on your own site.';

interface Msg {
  role: 'user' | 'ai';
  text: string;
}

function Typing() {
  return (
    <div className="flex">
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-[#F1EDE2] px-3.5 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-faint"
            style={{ animation: `blink 1.4s ease ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  );
}

function Bubble({ role, text }: Msg) {
  const user = role === 'user';
  return (
    <div className={user ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          user
            ? 'max-w-[80%] rounded-2xl rounded-tr-sm bg-text-base px-3.5 py-2.5 text-[13px] leading-relaxed text-surface'
            : 'max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-border bg-[#F1EDE2] px-3.5 py-2.5 text-[13px] leading-relaxed text-text-base'
        }
      >
        {text}
      </div>
    </div>
  );
}

export function AriaWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Msg[]>([
    { role: 'ai', text: GREETING },
  ]);
  const [typing, setTyping] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  async function send() {
    const question = input.trim();
    if (!question || sending) return;
    setInput('');
    setSending(true);
    setTyping(true);

    // History for the model = everything currently on screen.
    const history = messages.map((m) => ({
      role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
      content: m.text,
    }));

    setMessages((prev) => [...prev, { role: 'user', text: question }]);

    try {
      const res = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
      });

      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? 'The chat hit a snag — please try again.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let started = false;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          const line = event.trim();
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          const parsed = JSON.parse(payload) as {
            text?: string;
            error?: string;
          };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            if (!started) {
              started = true;
              setTyping(false);
              setMessages((prev) => [...prev, { role: 'ai', text: parsed.text! }]);
            } else {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                next[next.length - 1] = {
                  ...last,
                  text: last.text + parsed.text!,
                };
                return next;
              });
            }
          }
        }
      }

      if (!started) {
        throw new Error('The chat hit a snag — please try again.');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text:
            err instanceof Error
              ? err.message
              : 'The chat hit a snag — please try again.',
        },
      ]);
    } finally {
      setTyping(false);
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="fixed bottom-7 right-7 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[340px] overflow-hidden rounded-[18px] border border-border bg-[#FBF8F1] shadow-[0_24px_56px_rgba(22,21,15,0.24)]">
          <div className="flex items-center gap-2.5 bg-text-base px-[18px] py-[13px] text-surface">
            <span
              className="h-[7px] w-[7px] rounded-full bg-success-dark"
              style={{ animation: 'pulseDot 2s ease infinite' }}
            />
            <span className="text-[13px] font-semibold">Ariaay assistant</span>
          </div>
          <div
            ref={scrollRef}
            className="flex max-h-[340px] min-h-[170px] flex-col gap-2.5 overflow-y-auto p-4"
          >
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} />
            ))}
            {typing && <Typing />}
          </div>
          <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question…"
              maxLength={500}
              aria-label="Ask the Ariaay assistant a question"
              className="min-w-0 flex-1 rounded-full border border-border bg-white px-3.5 py-2 text-xs text-text-base outline-none placeholder:text-faint focus:border-primary"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-surface transition-opacity disabled:opacity-40"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      <div style={{ animation: 'ariaPop .7s cubic-bezier(.34,1.56,.64,1) .4s both' }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-[26px_26px_8px_26px] border-[1.5px] border-primary/55 bg-text-base py-4 pl-[18px] pr-[26px] font-mono text-xs tracking-[0.16em] text-surface transition-transform hover:scale-[1.06] hover:bg-primary"
          style={{
            animation:
              'ariaFloat 4.5s ease-in-out 1.2s infinite, ariaRing 3s ease-out 1.2s infinite',
          }}
        >
          <span
            className="h-2 w-2 rounded-full bg-success-dark shadow-[0_0_8px_#6FBF8E]"
            style={{ animation: 'pulseDot 2s ease infinite' }}
          />
          {open ? 'CLOSE' : 'ARIA'}
        </button>
      </div>
    </div>
  );
}
