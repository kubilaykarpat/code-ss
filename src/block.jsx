// Code block editor — the left-column card.
// Textarea overlaid with a transparent highlighted view for live syntax colors.

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Icon, Dropdown, Btn } from './ui.jsx';
import { tokenize, detect, langList, LANGS } from './highlighter.jsx';

const LANG_OPTIONS = [
  { id: "auto", label: "Auto-detect" },
  ...langList(),
];

// Fixed editor palette — independent of preview theme so keywords stay legible
// on the always-white editor surface regardless of which preview theme is on.
const EDITOR_THEME = {
  fg: "#0e0e0c",
  muted: "#9a9a92",
  selection: "rgba(60,90,160,0.12)",
  colors: {
    comment: "#9a9a92",
    keyword: "#2b4c8c",
    string: "#5e7a3a",
    number: "#8a5a2a",
    function: "#2b4c8c",
    type: "#6a3a8c",
    builtin: "#8c3a5a",
    variable: "#1a1a18",
    operator: "#4a4a44",
    punct: "#9a9a92",
    tag: "#2b4c8c",
    attr: "#5e7a3a",
    regex: "#8a5a2a",
    text: "#1a1a18",
  },
};

export const CodeBlock = ({
  block,
  index,
  total,
  theme,
  font,
  fontSize,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onExport,
  showFilename,
  globalShowLineNumbers,
}) => {
  const taRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Resolve language: auto-detect if set to auto.
  const resolvedLangId = useMemo(() => {
    if (block.lang === "auto") {
      return detect(block.code);
    }
    return block.lang;
  }, [block.lang, block.code]);

  const resolvedLangLabel = useMemo(() => {
    const l = LANGS[resolvedLangId];
    return l ? l.label : "Plain";
  }, [resolvedLangId]);

  // Highlighted lines. Click the line-number gutter to toggle highlight.
  const toggleHighlight = (lineIdx) => {
    const set = new Set(block.highlights || []);
    if (set.has(lineIdx)) set.delete(lineIdx);
    else set.add(lineIdx);
    onChange({ ...block, highlights: [...set].sort((a, b) => a - b) });
  };

  // Handle Tab key to insert two spaces.
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);
      const next = before + "  " + after;
      onChange({ ...block, code: next });
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  // Autosize textarea to fit content.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [block.code, fontSize, font]);

  const lines = block.code.split("\n");

  return (
    <div className="cb-wrap">
      <div className="cb-head">
        <div className="cb-head-l">
          <span className="cb-index">{String(index + 1).padStart(2, "0")}</span>
          {showFilename ? (
            <input
              className="cb-filename"
              value={block.filename}
              onChange={(e) => onChange({ ...block, filename: e.target.value })}
              placeholder="untitled"
            />
          ) : (
            <span className="cb-placeholder">Block {index + 1}</span>
          )}
          <span className="cb-lang-hint">
            {block.lang === "auto" ? `auto · ${resolvedLangLabel.toLowerCase()}` : resolvedLangLabel.toLowerCase()}
          </span>
        </div>
        <div className="cb-head-r">
          <Dropdown
            value={block.lang}
            options={LANG_OPTIONS}
            onChange={(id) => onChange({ ...block, lang: id })}
            align="right"
            width={180}
          />
          <button className="icon-btn" title="Move up" onClick={onMoveUp} disabled={index === 0}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4-4 4 4"/></svg>
          </button>
          <button className="icon-btn" title="Move down" onClick={onMoveDown} disabled={index === total - 1}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4"/></svg>
          </button>
          <button className="icon-btn icon-btn-danger" title="Remove block" onClick={onRemove} disabled={total <= 1}>
            <Icon name="x" size={12} />
          </button>
        </div>
      </div>

      <div className="cb">
        <div
          className="cb-body"
          style={{ fontFamily: font.stack, fontSize }}
        >
        <div className="cb-editor-wrap">
          {globalShowLineNumbers && (
            <div className="cb-gutter" style={{ fontSize }}>
              {lines.map((_, i) => (
                <button
                  key={i}
                  className={`cb-line-no ${block.highlights?.includes(i) ? "is-hl" : ""}`}
                  onClick={() => toggleHighlight(i)}
                  title={block.highlights?.includes(i) ? "Unhighlight line" : "Highlight line"}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
          <div className="cb-editor">
            <HighlightedView
              code={block.code}
              langId={resolvedLangId}
              theme={EDITOR_THEME}
              highlights={block.highlights || []}
              fontSize={fontSize}
            />
            <textarea
              ref={taRef}
              className="cb-textarea"
              value={block.code}
              onChange={(e) => onChange({ ...block, code: e.target.value })}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              style={{ fontFamily: font.stack, fontSize, lineHeight: 1.55 }}
            />
          </div>
        </div>
      </div>

      <div className="cb-foot">
        <div className="cb-foot-l">
          {block.highlights?.length > 0 && (
            <button
              className="cb-hl-pill"
              onClick={() => onChange({ ...block, highlights: [] })}
              title="Clear highlighted lines"
            >
              <Icon name="highlight" size={10} />
              <span>{block.highlights.length} highlighted</span>
              <Icon name="x" size={10} />
            </button>
          )}
          <span className="cb-meta">{lines.length} lines · {block.code.length} chars</span>
        </div>
        <div className="cb-foot-r">
          <Btn icon="copy" size="sm" onClick={() => navigator.clipboard?.writeText(block.code)}>
            Copy code
          </Btn>
        </div>
      </div>
      </div>
    </div>
  );
};

// Highlighted view — renders tokens with theme colors.
export const HighlightedView = ({ code, langId, theme, highlights, fontSize }) => {
  const tokenLines = useMemo(
    () => tokenize(code, langId),
    [code, langId]
  );
  return (
    <pre className="cb-hl" aria-hidden="true" style={{ fontSize, lineHeight: 1.55 }}>
      {tokenLines.map((tokens, i) => (
        <div
          key={i}
          className={`cb-hl-line ${highlights.includes(i) ? "is-hl" : ""}`}
        >
          {tokens.length === 0 ? <span>{"\u200b"}</span> : tokens.map((t, j) => (
            <span
              key={j}
              style={{ color: t.type === "ws" ? undefined : (theme.colors[t.type] || theme.fg) }}
            >
              {t.text}
            </span>
          ))}
          {"\n"}
        </div>
      ))}
    </pre>
  );
};

export { LANG_OPTIONS };
