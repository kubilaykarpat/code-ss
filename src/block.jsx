// Unified block: edit code directly inside the themed canvas that is exported.
// The textarea is overlaid on the highlighted view — what you see is what you get.

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Icon, Btn, Dropdown } from './ui.jsx';
import { tokenize, detect, LANGS } from './highlighter.jsx';
import { exportNode, copyPng } from './export.jsx';

export const WIDTH_MIN = 320;
export const WIDTH_MAX = 1200;

const clampWidth = (w) => Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, Math.round(w)));

function mixBorder(bg) {
  const hex = bg && bg.startsWith("#") ? bg : "#000000";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
}

export const Block = ({
  block,
  index,
  total,
  theme,
  background,
  font,
  fontSize,
  padding,
  chrome,
  showLineNumbers,
  dropShadow,
  aspectRatio,
  exportFormat,
  showFilename,
  globalWidth,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  const taRef = useRef(null);
  const frameRef = useRef(null);
  const hostRef = useRef(null);
  const gutterRef = useRef(null);
  const hlRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [flash, setFlash] = useState(null);
  const [dragWidth, setDragWidth] = useState(null);

  const hasLocalWidth = block.width != null;
  const effectiveWidth = dragWidth ?? (hasLocalWidth ? block.width : globalWidth);

  const startResize = (side) => (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = effectiveWidth;
    let latest = startWidth;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const next = clampWidth(side === 'r' ? startWidth + dx * 2 : startWidth - dx * 2);
      latest = next;
      setDragWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDragWidth(null);
      onChange({ ...block, width: latest });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const resetWidth = () => {
    const { width, ...rest } = block;
    onChange(rest);
  };

  const resolvedLangId = useMemo(() => {
    if (block.lang === "auto") return detect(block.code);
    return block.lang;
  }, [block.lang, block.code]);

  const resolvedLangLabel = useMemo(() => {
    const l = LANGS[resolvedLangId];
    return l ? l.label : "Plain";
  }, [resolvedLangId]);

  const tokenLines = useMemo(
    () => tokenize(block.code, resolvedLangId),
    [block.code, resolvedLangId]
  );

  const langOptions = useMemo(() => {
    return [
      { id: "auto", label: `Auto (${resolvedLangLabel})` },
      ...Object.entries(LANGS).map(([id, l]) => ({ id, label: l.label })),
    ];
  }, [resolvedLangLabel]);

  const toggleHighlight = (lineIdx) => {
    const set = new Set(block.highlights || []);
    if (set.has(lineIdx)) set.delete(lineIdx);
    else set.add(lineIdx);
    onChange({ ...block, highlights: [...set].sort((a, b) => a - b) });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = ta.value.slice(0, start) + "  " + ta.value.slice(end);
      onChange({ ...block, code: next });
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  }, [block.code, fontSize, font]);

  useEffect(() => {
    if (!showLineNumbers) return;
    const gutter = gutterRef.current;
    const hl = hlRef.current;
    if (!gutter || !hl) return;
    const sync = () => {
      const lineEls = hl.children;
      const btnEls = gutter.children;
      for (let i = 0; i < lineEls.length && i < btnEls.length; i++) {
        btnEls[i].style.height = lineEls[i].offsetHeight + 'px';
      }
    };
    const ro = new ResizeObserver(sync);
    Array.from(hl.children).forEach(el => ro.observe(el));
    sync();
    return () => ro.disconnect();
  }, [block.code, showLineNumbers, fontSize, font.stack]);

  const lines = block.code.split("\n");

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      const name = (block.filename || `block-${index + 1}`).replace(/[^\w.-]+/g, "_");
      await exportNode(frameRef.current, fmt, name);
      setFlash(`${fmt.toUpperCase()} downloaded`);
    } catch (e) {
      console.error(e);
      setFlash("Export failed");
    } finally {
      setExporting(false);
      setTimeout(() => setFlash(null), 1800);
    }
  };

  const handleCopyImage = async () => {
    setExporting(true);
    try {
      await copyPng(frameRef.current);
      setFlash("Copied to clipboard");
    } catch (e) {
      setFlash("Copy failed");
    } finally {
      setExporting(false);
      setTimeout(() => setFlash(null), 1800);
    }
  };

  const aspectStyle = useMemo(() => {
    if (aspectRatio === "auto") return {};
    const [w, h] = aspectRatio.split(":").map(Number);
    return { aspectRatio: `${w} / ${h}` };
  }, [aspectRatio]);

  const borderColor = mixBorder(theme.bg);

  return (
    <div className="bk" style={{ width: effectiveWidth, maxWidth: '100%' }}>
      <div className="bk-toolbar">
        <div className="bk-toolbar-l">
          <span className="bk-index">{String(index + 1).padStart(2, "0")}</span>
          {showFilename ? (
            <input
              className="bk-filename"
              value={block.filename}
              onChange={(e) => onChange({ ...block, filename: e.target.value })}
              placeholder="untitled"
            />
          ) : (
            <span className="bk-placeholder">Block {index + 1}</span>
          )}
        </div>
        <div className="bk-toolbar-r">
          {flash && <span className="bk-flash">{flash}</span>}
          {block.highlights?.length > 0 && (
            <button
              className="bk-hl-pill"
              onClick={() => onChange({ ...block, highlights: [] })}
              title="Clear highlighted lines"
            >
              <Icon name="highlight" size={10} />
              <span>{block.highlights.length}</span>
              <Icon name="x" size={10} />
            </button>
          )}
          <Dropdown
            value={block.lang}
            options={langOptions}
            onChange={(id) => onChange({ ...block, lang: id })}
            align="right"
            width={200}
          />
          <span className="bk-toolbar-sep" />
          <button className="icon-btn" title="Move up" onClick={onMoveUp} disabled={index === 0}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4-4 4 4"/></svg>
          </button>
          <button className="icon-btn" title="Move down" onClick={onMoveDown} disabled={index === total - 1}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4"/></svg>
          </button>
          <button className="icon-btn icon-btn-danger" title="Remove block" onClick={onRemove} disabled={total <= 1}>
            <Icon name="x" size={12} />
          </button>
          <span className="bk-toolbar-sep" />
          <Btn icon="copy" size="sm" onClick={handleCopyImage} disabled={exporting} title="Copy image">
            Copy
          </Btn>
          <Btn icon="download" size="sm" variant="solid" onClick={() => handleExport(exportFormat)} disabled={exporting}>
            {exportFormat.toUpperCase()}
          </Btn>
        </div>
      </div>

      <div ref={hostRef} className="bk-frame-host">
        <button
          type="button"
          className={`bk-handle bk-handle-l ${dragWidth != null ? 'is-dragging' : ''}`}
          onMouseDown={startResize('l')}
          aria-label="Resize block width"
          title={`${effectiveWidth}px${hasLocalWidth ? '' : ' (global)'}`}
        />
        <button
          type="button"
          className={`bk-handle bk-handle-r ${dragWidth != null ? 'is-dragging' : ''}`}
          onMouseDown={startResize('r')}
          aria-label="Resize block width"
          title={`${effectiveWidth}px${hasLocalWidth ? '' : ' (global)'}`}
        />
        {dragWidth != null && (
          <span className="bk-width-readout">{dragWidth}px</span>
        )}
        {hasLocalWidth && dragWidth == null && (
          <button
            type="button"
            className="bk-width-reset"
            onClick={resetWidth}
            title="Reset to global width"
          >
            {block.width}px · reset
          </button>
        )}
      <div
        ref={frameRef}
        className={`bk-frame ${background.borderless ? "is-borderless" : ""}`}
        style={{ background: background.css, padding, ...aspectStyle }}
        data-export-node="true"
        data-tour={index === 0 ? "block-frame" : undefined}
      >
        <div
          className={`bk-window ${dropShadow ? "has-shadow" : ""}`}
          style={{
            background: theme.bg,
            color: theme.fg,
            fontFamily: font.stack,
            fontSize,
          }}
        >
          {chrome === "macos" && (
            <div className="bk-chrome" style={{ borderColor }}>
              <span className="bk-dot" style={{ background: "#ff5f57" }} />
              <span className="bk-dot" style={{ background: "#febc2e" }} />
              <span className="bk-dot" style={{ background: "#28c840" }} />
              {showFilename && block.filename && (
                <span className="bk-chrome-name" style={{ color: theme.muted }}>
                  {block.filename}
                </span>
              )}
            </div>
          )}
          {chrome === "minimal" && showFilename && block.filename && (
            <div className="bk-chrome bk-chrome-min" style={{ borderColor, color: theme.muted }}>
              <Icon name="file" size={11} />
              <span className="bk-chrome-name">{block.filename}</span>
            </div>
          )}

          <div className="bk-code">
            {showLineNumbers && (
              <div
                ref={gutterRef}
                className="bk-gutter"
                style={{ color: theme.muted, borderColor }}
                data-tour={index === 0 ? "line-numbers" : undefined}
              >
                {lines.map((_, i) => (
                  <button
                    key={i}
                    className={`bk-line-no ${block.highlights?.includes(i) ? "is-hl" : ""}`}
                    onClick={() => toggleHighlight(i)}
                    title={block.highlights?.includes(i) ? "Unhighlight" : "Highlight"}
                    style={block.highlights?.includes(i) ? { color: theme.accent || theme.fg } : undefined}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="bk-editor">
              <pre ref={hlRef} className="bk-hl" aria-hidden="true">
                {tokenLines.map((tokens, i) => (
                  <div
                    key={i}
                    className={`bk-line ${block.highlights?.includes(i) ? "is-hl" : ""}`}
                    style={block.highlights?.includes(i) ? { background: theme.selection } : undefined}
                  >
                    {tokens.length === 0
                      ? " "
                      : tokens.map((t, j) => (
                          <span
                            key={j}
                            style={{
                              color: t.type === "ws" ? undefined : (theme.colors[t.type] || theme.fg),
                            }}
                          >
                            {t.text}
                          </span>
                        ))}
                  </div>
                ))}
              </pre>
              <textarea
                ref={taRef}
                className="bk-textarea"
                value={block.code}
                onChange={(e) => onChange({ ...block, code: e.target.value })}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                style={{
                  fontFamily: font.stack,
                  fontSize,
                  caretColor: theme.fg,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
