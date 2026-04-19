// Preview — the right-column rendered screenshot frame.
// One Preview per block. Exports rasterize this exact DOM into PNG or SVG.

const Preview = ({
  block,
  index,
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
  onExport,
  showFilename,
}) => {
  const frameRef = React.useRef(null);
  const [exporting, setExporting] = React.useState(false);
  const [flash, setFlash] = React.useState(null);

  const resolvedLangId = React.useMemo(() => {
    if (block.lang === "auto") return window.CodeSS_Highlighter.detect(block.code);
    return block.lang;
  }, [block.lang, block.code]);

  const tokenLines = React.useMemo(
    () => window.CodeSS_Highlighter.tokenize(block.code, resolvedLangId),
    [block.code, resolvedLangId]
  );

  const handleExport = async (fmt) => {
    setExporting(true);
    try {
      const name = (block.filename || `block-${index + 1}`).replace(/[^\w.-]+/g, "_");
      await window.CodeSS_Export.exportNode(frameRef.current, fmt, name);
      setFlash(`${fmt.toUpperCase()} downloaded`);
    } catch (e) {
      setFlash("Export failed");
      console.error(e);
    } finally {
      setExporting(false);
      setTimeout(() => setFlash(null), 1800);
    }
  };

  const handleCopyImage = async () => {
    setExporting(true);
    try {
      await window.CodeSS_Export.copyPng(frameRef.current);
      setFlash("Copied to clipboard");
    } catch (e) {
      setFlash("Copy failed");
    } finally {
      setExporting(false);
      setTimeout(() => setFlash(null), 1800);
    }
  };

  const aspectStyle = React.useMemo(() => {
    if (aspectRatio === "auto") return {};
    const [w, h] = aspectRatio.split(":").map(Number);
    return { aspectRatio: `${w} / ${h}` };
  }, [aspectRatio]);

  return (
    <div className="pv">
      <div className="pv-head">
        <div className="pv-head-l">
        </div>
        <div className="pv-head-r">
          {flash && <span className="pv-flash">{flash}</span>}
          <Btn icon="copy" size="sm" onClick={handleCopyImage} disabled={exporting} title="Copy image to clipboard">
            Copy
          </Btn>
          <Btn icon="download" size="sm" variant="solid" onClick={() => handleExport(exportFormat)} disabled={exporting}>
            {exportFormat.toUpperCase()}
          </Btn>
        </div>
      </div>

      <div className="pv-canvas-wrap">
        <div
          ref={frameRef}
          className={`pv-frame ${background.borderless ? "is-borderless" : ""}`}
          style={{
            background: background.css,
            padding,
            ...aspectStyle,
          }}
          data-export-node="true"
        >
          <div
            className={`pv-window ${dropShadow ? "has-shadow" : ""}`}
            style={{
              background: theme.bg,
              color: theme.fg,
              fontFamily: font.stack,
              fontSize,
            }}
          >
            {chrome === "macos" && (
              <div className="pv-chrome" style={{ borderColor: mixBorder(theme.bg) }}>
                <span className="pv-dot" style={{ background: "#ff5f57" }} />
                <span className="pv-dot" style={{ background: "#febc2e" }} />
                <span className="pv-dot" style={{ background: "#28c840" }} />
                {showFilename && block.filename && (
                  <span className="pv-chrome-name" style={{ color: theme.muted }}>
                    {block.filename}
                  </span>
                )}
              </div>
            )}
            {chrome === "minimal" && showFilename && block.filename && (
              <div className="pv-chrome pv-chrome-min" style={{ borderColor: mixBorder(theme.bg), color: theme.muted }}>
                <Icon name="file" size={11} />
                <span className="pv-chrome-name">{block.filename}</span>
              </div>
            )}

            <div className="pv-code">
              {showLineNumbers && (
                <div className="pv-gutter" style={{ color: theme.muted, borderColor: mixBorder(theme.bg) }}>
                  {tokenLines.map((_, i) => (
                    <div
                      key={i}
                      className={`pv-line-no ${block.highlights?.includes(i) ? "is-hl" : ""}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              )}
              <pre className="pv-pre" style={{ color: theme.fg }}>
                {tokenLines.map((tokens, i) => (
                  <div
                    key={i}
                    className={`pv-line ${block.highlights?.includes(i) ? "is-hl" : ""}`}
                    style={block.highlights?.includes(i) ? { background: theme.selection } : undefined}
                  >
                    {tokens.length === 0 ? "\u00A0" : tokens.map((t, j) => (
                      <span
                        key={j}
                        style={{ color: t.type === "ws" ? undefined : (theme.colors[t.type] || theme.fg) }}
                      >{t.text}</span>
                    ))}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// A border color that always sits just off the window bg — works on light and dark.
function mixBorder(bg) {
  // Not a real mix; returns a translucent white/black depending on bg luminance.
  const hex = bg.startsWith("#") ? bg : "#000000";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
}

Object.assign(window, { Preview });
