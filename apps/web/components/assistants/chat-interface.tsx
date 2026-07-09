'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, Check, Copy, Send, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  assistantId: string;
  name: string;
  persona: string | null;
  widgetKey: string;
  messageCount: number;
}

export function ChatInterface({
  assistantId,
  name,
  persona,
  widgetKey,
  messageCount,
}: ChatInterfaceProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [streaming, setStreaming] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  const embedCode = `<script src="https://cdn.aria.ai/widget.js"\n        data-key="${widgetKey}"\n        data-theme="light"></script>`;

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, streaming]);

  function autogrow() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [
      ...m,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ]);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setStreaming(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId, message: text, history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: err.error ?? 'Something went wrong.',
          };
          return copy;
        });
        toast.error(err.error ?? 'Request failed');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              toast.error(parsed.error);
              continue;
            }
            if (parsed.text) {
              setMessages((m) => {
                const copy = [...m];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: last.content + parsed.text,
                };
                return copy;
              });
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied');
    setTimeout(() => setCopied(false), 1600);
  }

  const lastIsPending =
    streaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'assistant' &&
    messages[messages.length - 1].content === '';

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left info panel */}
      <aside className="hidden w-[280px] shrink-0 flex-col gap-4 md:flex">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-teal bg-gradient-to-br from-surface-raised to-primary-dim">
              <Bot className="h-5 w-5 text-primary-text" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-bold text-text-base">{name}</div>
              <div className="truncate text-xs text-muted">
                {persona ?? 'AI assistant'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Badge>{messageCount} messages</Badge>
            <Badge variant="success">● Active</Badge>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full">
              <Copy className="h-4 w-4" />
              View Embed Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Embed on your site</DialogTitle>
              <DialogDescription>
                Paste this one-line script anywhere in your HTML.
              </DialogDescription>
            </DialogHeader>
            <pre className="overflow-x-auto rounded-lg border border-border-teal bg-surface-raised p-4 font-mono text-xs leading-relaxed text-primary-text">
              {embedCode}
            </pre>
            <Button onClick={copyEmbed}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? 'Copied' : 'Copy code'}
            </Button>
          </DialogContent>
        </Dialog>

        <Link href={`/assistants/${assistantId}/settings`}>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </Link>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border-teal bg-surface px-4 py-3">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          <span className="text-sm font-bold text-text-base">{name}</span>
          <span className="ml-auto rounded-full border border-border-teal bg-surface-raised px-2 py-0.5 text-[10px] font-medium text-muted">
            Live preview
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto bg-bg p-4"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Bot className="h-8 w-8 text-muted" />
              <p className="text-sm text-muted">
                Start chatting to test <strong>{name}</strong>.
              </p>
            </div>
          )}

          {messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            if (m.role === 'assistant' && m.content === '' && isLast) {
              // Typing indicator while the first token is pending.
              return lastIsPending ? (
                <div key={i} className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-surface-raised px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-faint"
                        style={{
                          animation: `blink 1.4s ease ${d * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null;
            }
            return (
              <div
                key={i}
                className={
                  m.role === 'user' ? 'flex justify-end' : 'flex justify-start'
                }
              >
                <div
                  className={cn(
                    'whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'max-w-[70%] rounded-2xl rounded-tr-sm bg-primary-dim text-text-base'
                      : 'max-w-[80%] rounded-2xl rounded-tl-sm bg-surface-raised text-text-base',
                  )}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-end gap-2 border-t border-border-teal bg-surface p-3">
          <textarea
            ref={taRef}
            value={input}
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              autogrow();
            }}
            onKeyDown={onKeyDown}
            placeholder={`Message ${name}…  (Enter to send, Shift+Enter for newline)`}
            className="max-h-[140px] flex-1 resize-none rounded-lg border border-border-teal bg-surface-raised px-3 py-2 text-sm text-text-base placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <Button
            size="icon"
            onClick={() => void send()}
            disabled={!input.trim() || streaming}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
