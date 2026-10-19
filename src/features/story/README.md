# Story slot

Paste your finished Story code into `index.tsx` in this folder. Nothing else needs to change:
`src/app/story/page.tsx` already imports it, and the navbar, footer, theme, sound and day/night are provided around it.

Rules
1. Default-export one React component. Put `"use client"` on the first line if it uses hooks or browser APIs.
2. Root element is a single `<section id="story-slot">`.
3. No navbar or footer of your own (the page shell adds them).
4. Style with Tailwind or a CSS module next to `index.tsx`. Do not edit `src/app/globals.css`.
5. Put images, video and fonts in `public/story/` and reference them as `/story/file.ext`.
6. At most one WebGL canvas (the page already runs the snow background and, on laptops, the pixel trail).
7. Handy hooks: `useAudio()` from `@/audio` (play, muted) and `useTheme()` from `@/theme/ThemeProvider`.
8. Colors are CSS variables: `var(--ink)`, `var(--paper)`, `var(--eye)`, `var(--butter)`, `var(--berry)`, `var(--sky-top)`, `var(--sky-bottom)`.
