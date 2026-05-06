# Code-SS — guidance for Claude Code

A 100% client-side React app that turns code snippets into PNG/SVG screenshots. Vite for build tooling, Vitest for tests, Cloudflare Pages for hosting.

## Architecture

Two-column layout: source blocks on the left, rendered previews on the right. Each block is independent — its own filename, language, code, and per-line highlights. Global settings (theme, background, font, padding, chrome) live in a single `settings` object and apply to all previews uniformly.

State persistence: `blocks` and `settings` are mirrored to `localStorage` on every change. There is no backend.

## Module map

- `src/main.jsx` — entry point, mounts `<App />`.
- `src/app.jsx` — root component. Owns `blocks` and `settings` state; persists to localStorage; coordinates export.
- `src/block.jsx` — editable code card (left column). Textarea stacked under a transparent highlighted overlay so colors update live as you type.
- `src/preview.jsx` — non-editable rendered screenshot (right column). The DOM node here is what `export.jsx` rasterizes — keep it self-contained (no parent-only styling).
- `src/tweaks.jsx` — floating settings panel.
- `src/ui.jsx` — shared primitives: `Icon`, `Btn`, `Dropdown`, `Toggle`, `Slider`, `Segmented`.
- `src/highlighter.jsx` — purpose-built tokenizer. Per-language `rules` arrays of regex + token type. `detect()` is heuristic, not perfect — adjust scores carefully if you touch it.
- `src/themes.jsx` — `THEMES`, `BACKGROUNDS`, `FONT_OPTIONS` data.
- `src/export.jsx` — SVG/PNG export. Uses `<foreignObject>` + canvas. Has a `rasterSafe` fallback that swaps web fonts for system fonts when the primary path taints the canvas.

## Conventions

- All source files are ES modules (`export` / `import`). No IIFEs, no `window.X = ...` globals.
- `.jsx` extension for everything React-touched, even if a file has no JSX, so esbuild applies the right loader.
- Keep `Preview` self-contained — anything visible inside its `data-export-node="true"` root must have its computed styles serializable. Avoid CSS variables defined far up the tree; inline them on or near the preview root.

## Commands

- `npm run dev` — Vite dev server (port 5173, HMR).
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve `dist/` locally on 4173 to sanity-check the prod bundle.
- `npm test` — Vitest in watch mode.
- `npx vitest run` — Vitest single-shot (use this in CI / one-off checks).
- `npm run deploy` — `npm run build && wrangler pages deploy dist`.

## Testing

Vitest + jsdom. Setup at `src/test/setup.js` (just imports `@testing-library/jest-dom`). Pure-logic modules (`highlighter`, `themes`) have direct unit tests under `src/test/`. React component tests can use `@testing-library/react` — already a dependency.

When adding a new language to `highlighter.jsx`, add a corresponding `detect()` test case so a regression in detection scoring is caught immediately.

## Export gotchas

The export path is fragile by design — rasterizing live DOM into a PNG via SVG `<foreignObject>` has a long list of browser quirks. Three things in `export.jsx` work together to keep PNG export from tainting the canvas:

1. **Web fonts are embedded as base64 data URIs at export time.** `embedFonts()` walks the preview subtree to find which `font-family` names are actually used, then collects matching `@font-face` rules from `document.styleSheets`. Cross-origin sheets (Google Fonts) can't be read via `cssRules` — those are re-fetched as text and parsed with a regex. Each `url(...)` inside a matched rule is fetched and replaced with a `data:font/woff2;base64,...` URI.
2. **The `<style>` tag is injected inside the cloned node**, as the first child of the HTML root inside `<foreignObject>`. It is *not* placed in the outer SVG `<defs>` block — those styles do not reliably cascade into HTML inside `<foreignObject>` across browsers.
3. **The SVG is loaded as a `data:` URL with `img.crossOrigin = "anonymous"`.** Blob URLs without `crossOrigin` set will produce a tainted canvas in Chrome even when all referenced resources are inline data URIs. The `data:` URL is built with `encodeURIComponent` so special characters (`#`, `&`, etc.) are safe.

Other gotchas:

- **Don't load remote images into the preview tree** — `<img>` tags or CSS `url()` background images pointing to external origins will taint the canvas. SVG export still works in those cases.
- **`rasterSafe` fallback** — if anything in the primary path throws, `cloneWithInlineStyles({ rasterSafe: true })` swaps every `font-family` for a system mono stack and nulls out any external `background-image: url()` references. This is a safety net for unknown taint sources, not the main path.
- **Computed-style whitelist** in `cloneWithInlineStyles` — only the listed CSS properties survive into the SVG. Add to the list if you introduce new visual styling that must export.

## Deployment

Cloudflare Pages, static files only. `wrangler.toml` points `pages_build_output_dir = "dist"`. Security headers (`X-Frame-Options`, `Permissions-Policy`, etc.) live in `public/_headers` and are copied into the build automatically.
