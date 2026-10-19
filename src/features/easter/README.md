# Easter egg slot

1. Paste your component into `index.tsx` (default export, `"use client"` first line).
2. Set `FEATURES.easter` to `true` in `src/config.ts`.
3. Fire it with `window.dispatchEvent(new Event('void:easter'))` from any trigger you like (a Konami code, a hidden tap, etc.).
It is mounted once in `AppChrome`, above every page, and renders nothing until you add code.
