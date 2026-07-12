'use client';

import * as React from 'react';

/**
 * Landing intro splash: the brand mark assembles itself — the A rises, the
 * growth arrow draws in, the chat bubble pops with its typing dots, the
 * wordmark slides up — then the whole screen lifts away like a curtain.
 * Runs once per browser session, skips entirely for reduced-motion users,
 * and a click anywhere dismisses it early.
 */
export function Splash() {
  const [phase, setPhase] = React.useState<'show' | 'leaving' | 'gone'>(
    'show',
  );
  const leaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (
      sessionStorage.getItem('ariaay-splash') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setPhase('gone');
      sessionStorage.setItem('ariaay-splash', '1');
      return;
    }
    sessionStorage.setItem('ariaay-splash', '1');
    const t1 = setTimeout(() => setPhase('leaving'), 2350);
    return () => {
      clearTimeout(t1);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (phase !== 'leaving') return;
    leaveTimer.current = setTimeout(() => setPhase('gone'), 650);
  }, [phase]);

  if (phase === 'gone') return null;

  const part = (delay: string, name = 'splashPop', dur = '0.4s') =>
    ({
      animation: `${name} ${dur} cubic-bezier(.34,1.56,.64,1) ${delay} both`,
      transformBox: 'fill-box',
      transformOrigin: 'center',
    }) as React.CSSProperties;

  return (
    <div
      onClick={() => phase === 'show' && setPhase('leaving')}
      aria-hidden="true"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg"
      style={
        phase === 'leaving'
          ? { animation: 'splashCurtain .65s cubic-bezier(.76,0,.24,1) both' }
          : undefined
      }
    >
      <svg
        width="180"
        height="180"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <mask id="splash-mask" maskUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="#fff" />
            <path
              d="M4 84 C 34 78, 60 66, 74 40"
              stroke="#000"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </mask>
        </defs>

        {/* the A rises in */}
        <path
          d="M50 3 L95 97 H77.5 L50 34.5 L23 97 H5.5 Z"
          fill="var(--primary)"
          mask="url(#splash-mask)"
          style={part('.05s', 'splashA', '.5s')}
        />

        {/* arrow draws itself, then the head pops */}
        <path
          d="M4 84 C 34 78, 60 66, 74 40"
          stroke="var(--primary)"
          strokeWidth="8"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
          style={{ animation: 'splashDraw .55s ease-out .55s both' }}
        />
        <path
          d="M85 26 L83.6 42.9 L70.2 34.3 Z"
          fill="var(--primary)"
          style={part('1.05s')}
        />

        {/* bubble pops, dots type in */}
        <g style={part('1.2s', 'splashPop', '.45s')}>
          <circle cx="50" cy="47" r="15" fill="#fff" />
          <path d="M42 58 L36.5 66 L47.5 60.5 Z" fill="#fff" />
        </g>
        <circle
          cx="43"
          cy="47"
          r="3"
          fill="var(--primary)"
          opacity={0}
          style={{ animation: 'splashFadeIn .18s ease 1.5s both' }}
        />
        <circle
          cx="50"
          cy="47"
          r="3"
          fill="var(--primary)"
          opacity={0}
          style={{ animation: 'splashFadeIn .18s ease 1.64s both' }}
        />
        <circle
          cx="57"
          cy="47"
          r="3"
          fill="var(--primary)"
          opacity={0}
          style={{ animation: 'splashFadeIn .18s ease 1.78s both' }}
        />
      </svg>

      <div
        className="mt-6 font-display text-[42px] font-bold tracking-[-0.03em] text-text-base"
        style={{ animation: 'splashWord .5s ease 1.7s both' }}
      >
        Ariaay<span className="text-primary">.</span>
      </div>
    </div>
  );
}
