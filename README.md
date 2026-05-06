# Code-SS — Screenshots from Code

A fast, fully client-side web app for turning code snippets into beautiful screenshots. No backend, no tracking, no data leaves your browser.

## Features

- **12 themes** (Mono, Ink, Slate, Dune, Mint, Cobalt, Paper, Vapor, Terminal, Porcelain, Carbon, Rose)
- **12 backgrounds** (solids and gradients)
- **6 fonts** (JetBrains Mono, Geist Mono, IBM Plex Mono, Fira Code, Source Code Pro, system mono)
- **Syntax highlighting** for JS/TS, Python, Rust, Go, Ruby, Java, C/C++, Swift, Kotlin, SQL, HTML, CSS, JSON, YAML, Shell, Markdown
- **Auto language detection** based on code content
- **Window chrome** (macOS, Windows, none) with optional drop shadow
- **Line numbers**, **filenames**, line **highlights**
- **Export to PNG or SVG** (2× scale for crisp output)
- **Multi-block** layout — stack multiple snippets in one session
- **Persistent state** via `localStorage`

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173/ in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run tests in watch mode |
| `npm run test:ui` | Run tests with the Vitest UI |
| `npm run deploy` | Build and deploy to Cloudflare Pages |

## Tech stack

- **React 18** — UI
- **Vite 5** — Dev server and bundler
- **Vitest** — Unit tests
- **Cloudflare Pages** — Hosting target

The app is 100% client-side — Cloudflare Pages just serves static files.

## Project structure

```
.
├── index.html              # Vite entry point
├── public/
│   └── _headers            # Cloudflare Pages security/cache headers
├── src/
│   ├── main.jsx            # ReactDOM bootstrap
│   ├── app.jsx             # Root App component
│   ├── block.jsx           # Code editor block (left column)
│   ├── preview.jsx         # Rendered screenshot preview (right column)
│   ├── tweaks.jsx          # Settings panel
│   ├── ui.jsx              # Shared UI primitives
│   ├── highlighter.jsx     # Tokenizer + language auto-detect
│   ├── themes.jsx          # Theme/background/font presets
│   ├── export.jsx          # SVG/PNG export logic
│   ├── styles.css          # Global styles
│   └── test/               # Vitest test files
├── vite.config.js
├── wrangler.toml           # Cloudflare Pages config
└── package.json
```

## Deploy to Cloudflare Pages

### Option A — Git integration (recommended)

1. Push the repo to GitHub.
2. Open https://dash.cloudflare.com/pages and connect the repo.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Every push deploys automatically; PRs get preview URLs.

### Option B — Direct CLI deploy

```bash
npx wrangler login
npm run deploy
```

## Browser support

Chromium, Firefox, and Safari (current and previous major versions). The export pipeline relies on `<foreignObject>` SVG rasterization through a canvas, with a `rasterSafe` fallback if the primary path fails (e.g. when web fonts taint the canvas).

## License

MIT
