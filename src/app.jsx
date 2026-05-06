// Main App — two-column layout with stacked blocks on the left and stacked
// previews on the right. Global settings live in one state object; the Tweaks
// panel mutates it and we persist to localStorage.

import React from 'react';
import { Icon, Btn } from './ui.jsx';
import { THEMES, BACKGROUNDS, FONT_OPTIONS } from './themes.jsx';
import { exportAll } from './export.jsx';
import { CodeBlock } from './block.jsx';
import { Preview } from './preview.jsx';
import { TweaksPanel } from './tweaks.jsx';

const DEFAULT_SETTINGS = /*EDITMODE-BEGIN*/{
  "theme": "mono",
  "background": "ash",
  "chrome": "macos",
  "font": "jetbrains",
  "fontSize": 14,
  "padding": 48,
  "aspectRatio": "auto",
  "showLineNumbers": true,
  "dropShadow": true,
  "showFilename": true,
  "exportFormat": "png"
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
  // Blocks
  const [blocks, setBlocks] = React.useState(() => {
    try {
      const saved = localStorage.getItem("codess.blocks");
      if (saved) return JSON.parse(saved);
    } catch {}
    return STARTER_BLOCKS;
  });

  // Global settings (theme, bg, tweaks, etc.)
  const [settings, setSettings] = React.useState(() => {
    try {
      const saved = localStorage.getItem("codess.settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return { ...DEFAULT_SETTINGS };
  });

  const [tweakOpen, setTweakOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  // Persist
  React.useEffect(() => {
    localStorage.setItem("codess.blocks", JSON.stringify(blocks));
  }, [blocks]);
  React.useEffect(() => {
    localStorage.setItem("codess.settings", JSON.stringify(settings));
  }, [settings]);

  // Tweaks integration with the host
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

  // Resolved theme / bg / font
  const theme = THEMES[settings.theme] || THEMES.mono;
  const background = BACKGROUNDS[settings.background] || BACKGROUNDS.ash;
  const font = FONT_OPTIONS.find((f) => f.id === settings.font) || FONT_OPTIONS[0];

  // Block actions
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
      await exportAll(nodes, settings.exportFormat, "codess");
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  // Keyboard
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
    <div className="app" data-screen-label="Code-SS main">
      <TopBar
        count={blocks.length}
        onAddBlock={addBlock}
        onExportAll={exportAllBlocks}
        exporting={exporting}
        exportFormat={settings.exportFormat}
        onOpenTweaks={() => setTweakOpen(true)}
        tweakOpen={tweakOpen}
      />

      <div className="page-scroll">
        <div className="col-heads">
          <div className="col-head">
            <span className="col-title">Source</span>
            <span className="col-sub">{blocks.length} {blocks.length === 1 ? "block" : "blocks"}</span>
          </div>
          <div className="col-head col-head-r">
            <span className="col-title">Preview</span>
            <span className="col-sub">{THEMES[settings.theme].label} · {BACKGROUNDS[settings.background].label}</span>
          </div>
        </div>
        <div className="rows">
          {blocks.map((b, i) => (
            <div className="row" key={b.id} data-block-id={b.id}>
              <div className="row-l">
                <CodeBlock
                  block={b}
                  index={i}
                  total={blocks.length}
                  theme={theme}
                  font={font}
                  fontSize={settings.fontSize}
                  onChange={(next) => updateBlock(b.id, next)}
                  onRemove={() => removeBlock(b.id)}
                  onMoveUp={() => moveBlock(b.id, -1)}
                  onMoveDown={() => moveBlock(b.id, 1)}
                  showFilename={settings.showFilename}
                  globalShowLineNumbers={settings.showLineNumbers}
                />
              </div>
              <div className="row-r">
                <Preview
                  block={b}
                  index={i}
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
                />
              </div>
            </div>
          ))}
          <div className="row row-add">
            <button className="add-block" onClick={addBlock}>
              <Icon name="plus" size={12} />
              <span>Add code block</span>
              <span className="add-kbd">⌘B</span>
            </button>
          </div>
        </div>
      </div>

      {tweakOpen && (
        <TweaksPanel
          settings={settings}
          setSettings={(s) => {
            setSettings(s);
            // Persist to host disk for tweak-mode
            window.parent.postMessage({ type: "__edit_mode_set_keys", edits: s }, "*");
          }}
          onClose={() => setTweakOpen(false)}
        />
      )}
    </div>
  );
};

export const TopBar = ({ count, onAddBlock, onExportAll, exporting, exportFormat, onOpenTweaks, tweakOpen }) => (
  <header className="topbar">
    <div className="topbar-l">
      <div className="brand">
        <span className="brand-mark">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M6 7l-2 2 2 2M12 7l2 2-2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="brand-name">Code-SS</span>
        <span className="brand-sub">/ screenshots from code</span>
      </div>
    </div>
    <div className="topbar-r">
      <span className="kbd-hint"><span className="kbd">⌘B</span> add block</span>
      <Btn icon="plus" onClick={onAddBlock}>New block</Btn>
      <Btn icon="download" variant="solid" onClick={onExportAll} disabled={exporting || count === 0}>
        {exporting ? "Exporting…" : `Export all ${exportFormat.toUpperCase()}`}
      </Btn>
      <button
        className={`icon-btn tweaks-btn ${tweakOpen ? "is-active" : ""}`}
        onClick={onOpenTweaks}
        title="Open tweaks"
      >
        <Icon name="settings" size={14} />
      </button>
    </div>
  </header>
);
