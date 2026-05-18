// Main App — single-column stacked blocks. Global settings live in one state
// object; the Tweaks panel mutates it and we persist to localStorage.

import React from 'react';
import { Icon, Btn } from './ui.jsx';
import { THEMES, BACKGROUNDS, FONT_OPTIONS } from './themes.jsx';
import { exportAll } from './export.jsx';
import { Block } from './block.jsx';
import { TweaksPanel } from './tweaks.jsx';
import { Tutorial, TUTORIAL_SEEN_KEY } from './tutorial.jsx';

const DEFAULT_SETTINGS = /*EDITMODE-BEGIN*/{
  "theme": "porcelain",
  "background": "violet",
  "chrome": "macos",
  "font": "jetbrains",
  "fontSize": 14,
  "padding": 48,
  "aspectRatio": "auto",
  "showLineNumbers": true,
  "dropShadow": true,
  "showFilename": true,
  "exportFormat": "png",
  "darkMode": false
}/*EDITMODE-END*/;

const STARTER_BLOCKS = [
  {
    id: "b1",
    filename: "fetch.ts",
    lang: "auto",
    code: `// Narrow, typed fetch wrapper
export async function json<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(\`\${res.status} \${res.statusText}\`);
  return res.json() as Promise<T>;
}`,
    highlights: [2, 3],
  },
  {
    id: "b2",
    filename: "primes.py",
    lang: "auto",
    code: `def primes_below(n: int) -> list[int]:
    """Sieve of Eratosthenes, returning primes strictly below n."""
    sieve = [True] * n
    sieve[:2] = [False, False]
    for i in range(2, int(n ** 0.5) + 1):
        if sieve[i]:
            for j in range(i * i, n, i):
                sieve[j] = False
    return [i for i, is_p in enumerate(sieve) if is_p]`,
    highlights: [],
  },
  {
    id: "b3",
    filename: "query.sql",
    lang: "auto",
    code: `SELECT u.id, u.email, COUNT(o.id) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email
ORDER BY orders DESC
LIMIT 25;`,
    highlights: [],
  },
];

export const App = () => {
  const [blocks, setBlocks] = React.useState(() => {
    try {
      const saved = localStorage.getItem("codess.blocks");
      if (saved) return JSON.parse(saved);
    } catch {}
    return STARTER_BLOCKS;
  });

  const [settings, setSettings] = React.useState(() => {
    try {
      const saved = localStorage.getItem("codess.settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return { ...DEFAULT_SETTINGS, darkMode: !!prefersDark };
  });

  const [tweakOpen, setTweakOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [whyOpen, setWhyOpen] = React.useState(false);
  const [tourOpen, setTourOpen] = React.useState(() => {
    try {
      return !localStorage.getItem(TUTORIAL_SEEN_KEY);
    } catch {
      return true;
    }
  });

  const closeTour = React.useCallback(() => {
    setTourOpen(false);
    try { localStorage.setItem(TUTORIAL_SEEN_KEY, '1'); } catch {}
  }, []);
  const replayTour = React.useCallback(() => {
    setWhyOpen(false);
    setTourOpen(true);
  }, []);

  React.useEffect(() => {
    localStorage.setItem("codess.blocks", JSON.stringify(blocks));
  }, [blocks]);
  React.useEffect(() => {
    localStorage.setItem("codess.settings", JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      settings.darkMode ? "dark" : "light",
    );
  }, [settings.darkMode]);

  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data) return;
      if (e.data.type === "__activate_edit_mode") setTweakOpen(true);
      if (e.data.type === "__deactivate_edit_mode") setTweakOpen(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const theme = THEMES[settings.theme] || THEMES.mono;
  const background = BACKGROUNDS[settings.background] || BACKGROUNDS.ash;
  const font = FONT_OPTIONS.find((f) => f.id === settings.font) || FONT_OPTIONS[0];

  const addBlock = () => {
    const id = `b${Date.now()}`;
    setBlocks([...blocks, { id, filename: "untitled", lang: "auto", code: "// Start typing…\n", highlights: [] }]);
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${id}"]`);
      el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }, 50);
  };
  const updateBlock = (id, next) => setBlocks(blocks.map((b) => (b.id === id ? next : b)));
  const removeBlock = (id) => setBlocks(blocks.filter((b) => b.id !== id));
  const moveBlock = (id, dir) => {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };

  const exportAllBlocks = async () => {
    setExporting(true);
    try {
      const nodes = [...document.querySelectorAll("[data-export-node='true']")];
      await exportAll(nodes, settings.exportFormat, "snap");
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        addBlock();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocks]);

  return (
    <div className="app" data-screen-label="SNAP main">
      <TopBar
        count={blocks.length}
        onAddBlock={addBlock}
        onExportAll={exportAllBlocks}
        exporting={exporting}
        exportFormat={settings.exportFormat}
        onToggleTweaks={() => setTweakOpen((v) => !v)}
        tweakOpen={tweakOpen}
        onOpenWhy={() => setWhyOpen(true)}
        darkMode={settings.darkMode}
        onToggleDarkMode={() =>
          setSettings({ ...settings, darkMode: !settings.darkMode })
        }
      />

      <div className="page-scroll">
        <div className="rows">
          {blocks.map((b, i) => (
            <div className="row" key={b.id} data-block-id={b.id}>
              <Block
                block={b}
                index={i}
                total={blocks.length}
                theme={theme}
                background={background}
                font={font}
                fontSize={settings.fontSize}
                padding={settings.padding}
                chrome={settings.chrome}
                showLineNumbers={settings.showLineNumbers}
                dropShadow={settings.dropShadow}
                aspectRatio={settings.aspectRatio}
                exportFormat={settings.exportFormat}
                showFilename={settings.showFilename}
                onChange={(next) => updateBlock(b.id, next)}
                onRemove={() => removeBlock(b.id)}
                onMoveUp={() => moveBlock(b.id, -1)}
                onMoveDown={() => moveBlock(b.id, 1)}
              />
            </div>
          ))}
          <div className="row row-add">
            <button className="add-block" onClick={addBlock}>
              <Icon name="plus" size={12} />
              <span>Add code block</span>
              <span className="add-kbd">⌘B</span>
            </button>
          </div>
          <footer className="page-foot">
            <span>
              🦜 pair-programmed with a statistical parrot by{" "}
              <a href="https://kubilaykarpat.com" target="_blank" rel="noreferrer noopener">
                Kubilay Karpat
              </a>
              .
            </span>
          </footer>
        </div>
      </div>

      {tweakOpen && (
        <TweaksPanel
          settings={settings}
          setSettings={(s) => {
            setSettings(s);
            window.parent.postMessage({ type: "__edit_mode_set_keys", edits: s }, "*");
          }}
          onClose={() => setTweakOpen(false)}
        />
      )}

      {whyOpen && <WhyModal onClose={() => setWhyOpen(false)} onReplayTour={replayTour} />}
      {tourOpen && <Tutorial onClose={closeTour} />}
    </div>
  );
};

export const TopBar = ({ count, onAddBlock, onExportAll, exporting, exportFormat, onToggleTweaks, tweakOpen, onOpenWhy, darkMode, onToggleDarkMode }) => (
  <header className="topbar">
    <div className="topbar-l">
      <div className="brand">
        <span className="brand-mark">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M6 7l-2 2 2 2M12 7l2 2-2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="brand-name">SNAP</span>
        <span className="brand-sub">/ screenshots from code</span>
        <button className="why-link" onClick={onOpenWhy} title="Why this tool exists">
          why?
        </button>
      </div>
    </div>
    <div className="topbar-r">
      <span data-tour="add-block">
        <Btn icon="plus" onClick={onAddBlock}>
          New block <span className="btn-kbd">⌘B</span>
        </Btn>
      </span>
      <span data-tour="export-all">
        <Btn icon="download" variant="solid" onClick={onExportAll} disabled={exporting || count === 0}>
          {exporting ? "Exporting…" : `Export all ${exportFormat.toUpperCase()}`}
        </Btn>
      </span>
      <button
        className="icon-btn theme-btn"
        onClick={onToggleDarkMode}
        title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <Icon name={darkMode ? "sun" : "moon"} size={14} />
      </button>
      <button
        className={`icon-btn tweaks-btn ${tweakOpen ? "is-active" : ""}`}
        onClick={onToggleTweaks}
        title="Appearance"
        data-tour="tweaks"
      >
        <Icon name="settings" size={14} />
      </button>
    </div>
  </header>
);

const WhyModal = ({ onClose, onReplayTour }) => {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="why-backdrop" onClick={onClose}>
      <div className="why-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Why SNAP">
        <button className="why-close" onClick={onClose} aria-label="Close">
          <Icon name="x" size={14} />
        </button>
        <div className="why-eyebrow">why this exists</div>
        <h2 className="why-title">Built for technical presentations.</h2>

        <div className="why-body">
          <p>
            PowerPoint and Keynote can't paste formatted, syntax-highlighted code. The
            only honest way to put code into a slide is to paste a <em>screenshot</em>.
          </p>
          <p>
            Plenty of tools render one block beautifully — but a real technical talk
            has a dozen. With those tools, every typo, every renamed variable, every
            theme tweak means: open the tool, paste, configure, screenshot, drag into
            the deck. Repeat ten times.
          </p>

          <div className="why-callout">
            <span className="why-callout-label">SNAP</span>
            <p>
              All your code blocks live on one page. Edit them inline. Export the
              one you changed, or all of them at once. No round-tripping.
            </p>
          </div>

          <ul className="why-list">
            <li>
              <span className="why-li-mark">→</span>
              <div>
                <strong>Edit in place.</strong> The block you see is the screenshot you get.
              </div>
            </li>
            <li>
              <span className="why-li-mark">→</span>
              <div>
                <strong>Many blocks, one tab.</strong> Stack them, reorder them, theme them all together.
              </div>
            </li>
            <li>
              <span className="why-li-mark">→</span>
              <div>
                <strong>Export per block or all at once.</strong> PNG or SVG, ready to drop into a slide.
              </div>
            </li>
            <li>
              <span className="why-li-mark">→</span>
              <div>
                <strong>Highlight lines.</strong> Click any line number to call it out — perfect for walking through code on stage.
              </div>
            </li>
          </ul>
        </div>

        <div className="why-foot">
          {onReplayTour && (
            <button className="why-replay" onClick={onReplayTour}>Replay tour</button>
          )}
          <button className="why-cta" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
};
