import * as React from 'react';

/**
 * The Ariaay "A" mark: terracotta A with a chat bubble and a growth-arrow
 * swooping through it. Sized in em so it scales with the surrounding
 * wordmark text. The arrow "cuts" the A via an SVG mask, so the gap shows
 * whatever is behind the logo (works on light and dark surfaces alike).
 */
export function AriaayMark({
  className,
  size = '1.1em',
}: {
  className?: string;
  size?: string | number;
}) {
  const id = React.useId();
  const maskId = `aria-mark-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="#fff" />
          {/* widened arrow band erases a channel through the A */}
          <path
            d="M4 84 C 34 78, 60 66, 74 40"
            stroke="#000"
            strokeWidth="14"
            strokeLinecap="round"
          />
        </mask>
      </defs>

      {/* the A (no crossbar — the bubble takes its place) */}
      <path
        d="M50 3 L95 97 H77.5 L50 34.5 L23 97 H5.5 Z"
        fill="var(--primary)"
        mask={`url(#${maskId})`}
      />

      {/* chat bubble */}
      <circle cx="50" cy="47" r="15" fill="#fff" />
      <path d="M42 58 L36.5 66 L47.5 60.5 Z" fill="#fff" />
      <circle cx="43" cy="47" r="3" fill="var(--primary)" />
      <circle cx="50" cy="47" r="3" fill="var(--primary)" />
      <circle cx="57" cy="47" r="3" fill="var(--primary)" />

      {/* growth arrow */}
      <path
        d="M4 84 C 34 78, 60 66, 74 40"
        stroke="var(--primary)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path d="M85 26 L83.6 42.9 L70.2 34.3 Z" fill="var(--primary)" />
    </svg>
  );
}

/** Mark + styled wordmark, inline. Inherits font size/weight from parent. */
export function AriaayLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.28em] ${className ?? ''}`}
    >
      <AriaayMark />
      <span>
        Ariaay<span className="text-primary">.</span>
      </span>
    </span>
  );
}
