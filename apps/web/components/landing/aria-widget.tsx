'use client';

import * as React from 'react';

const MESSAGES = [
  { role: 'user', text: "What's your return policy?" },
  {
    role: 'ai',
    text: 'Returns are accepted within 30 days, no questions asked. Refunds are processed within 48 hours.',
  },
  { role: 'user', text: 'Do you ship internationally?' },
  {
    role: 'ai',
    text: 'Yes — we ship to 45+ countries at a $9.99 flat rate. Delivery takes 7–14 business days.',
  },
];

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

function Bubble({ role, text }: { role: string; text: string }) {
  const user = role === 'user';
  return (
    <div className={user ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          user
            ? 'max-w-[80%] rounded-2xl rounded-tr-sm bg-text-base px-3.5 py-2.5 text-[13px] leading-relaxed text-surface'
            : 'max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-[#F1EDE2] px-3.5 py-2.5 text-[13px] leading-relaxed text-text-base'
        }
      >
        {text}
      </div>
    </div>
  );
}

export function AriaWidget() {
  const [open, setOpen] = React.useState(false);
  const [stage, setStage] = React.useState(0);
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  function openDemo() {
    timersRef.current.forEach(clearTimeout);
    setStage(0);
    const timings: [number, number][] = [
      [400, 1],
      [1100, 2],
      [2400, 3],
      [3800, 4],
      [4600, 5],
      [5900, 6],
    ];
    timersRef.current = timings.map(([delay, s]) =>
      setTimeout(() => setStage(s), delay),
    );
  }

  React.useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) openDemo();
    else timersRef.current.forEach(clearTimeout);
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
            <span className="text-[13px] font-semibold">Aria assistant</span>
            <span className="ml-auto font-mono text-[10px] tracking-[0.12em] text-faint">
              LIVE DEMO
            </span>
          </div>
          <div className="flex min-h-[170px] flex-col gap-2.5 p-4">
            {stage >= 1 && <Bubble role="user" text={MESSAGES[0].text} />}
            {stage === 2 && <Typing />}
            {stage >= 3 && <Bubble role="ai" text={MESSAGES[1].text} />}
            {stage >= 4 && <Bubble role="user" text={MESSAGES[2].text} />}
            {stage === 5 && <Typing />}
            {stage >= 6 && <Bubble role="ai" text={MESSAGES[3].text} />}
          </div>
          <div className="flex items-center gap-2.5 border-t border-border px-4 py-3">
            <div className="flex-1 rounded-full border border-border bg-white px-3.5 py-2 text-xs text-faint">
              Ask a question…
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-surface">
              ↑
            </div>
          </div>
        </div>
      )}

      <div style={{ animation: 'ariaPop .7s cubic-bezier(.34,1.56,.64,1) .4s both' }}>
        <button
          type="button"
          onClick={toggle}
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
