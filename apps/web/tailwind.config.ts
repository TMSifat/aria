import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS v4 is CSS-first: the design tokens and theme live in
 * `app/globals.css` via `@theme inline` (see the `--color-*` mappings there),
 * and content is auto-detected. This file exists for editor/tooling familiarity
 * and to pin the content globs explicitly; the theme is NOT configured here.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
};

export default config;
