'use client';

import * as React from 'react';

/**
 * Fades + rises elements marked `data-reveal` into view on first
 * intersection. Renders nothing — mount once anywhere on the page.
 */
export function ScrollReveal() {
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    ).filter((el) => el.getBoundingClientRect().top >= window.innerHeight * 0.85);

    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            const delay = (i * 0.08).toFixed(2) + 's';
            el.style.transition = `opacity .75s ease ${delay}, transform .75s cubic-bezier(.22,.61,.36,1) ${delay}`;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            io.unobserve(el);
          });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return null;
}
