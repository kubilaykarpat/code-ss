// Small UI primitives — buttons, dropdown, icon strokes.
import React from 'react';

export const Icon = ({ name, size = 14 }) => {
  const common = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "plus": return <svg {...common}><path d="M8 3v10M3 8h10"/></svg>;
    case "minus": return <svg {...common}><path d="M3 8h10"/></svg>;
    case "x": return <svg {...common}><path d="M4 4l8 8M12 4l-8 8"/></svg>;
    case "chevron": return <svg {...common}><path d="M4 6l4 4 4-4"/></svg>;
    case "check": return <svg {...common}><path d="M3 8.5l3 3 7-7"/></svg>;
    case "copy": return <svg {...common}><rect x="5" y="5" width="8" height="8" rx="1"/><path d="M3 10V4a1 1 0 011-1h6"/></svg>;
    case "download": return <svg {...common}><path d="M8 2v9M4 7l4 4 4-4M3 14h10"/></svg>;
    case "drag": return <svg {...common}><circle cx="6" cy="4" r="0.6" fill="currentColor" stroke="none"/><circle cx="10" cy="4" r="0.6" fill="currentColor" stroke="none"/><circle cx="6" cy="8" r="0.6" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="0.6" fill="currentColor" stroke="none"/><circle cx="6" cy="12" r="0.6" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="0.6" fill="currentColor" stroke="none"/></svg>;
    case "wand": return <svg {...common}><path d="M3 13l8-8M10 3l1 1M12 5l1 1M4 11l1 1"/></svg>;
    case "highlight": return <svg {...common}><rect x="2" y="5" width="12" height="2" rx="0.5"/><rect x="2" y="9" width="8" height="2" rx="0.5"/></svg>;
    case "file": return <svg {...common}><path d="M4 2h5l3 3v9H4z"/><path d="M9 2v3h3"/></svg>;
    case "settings": return <svg {...common}><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>;
    case "lines": return <svg {...common}><path d="M2 4h12M2 8h12M2 12h8"/></svg>;
    case "code": return <svg {...common}><path d="M5 4l-3 4 3 4M11 4l3 4-3 4"/></svg>;
    default: return null;
  }
};

// Tiny dropdown — custom because native <select> can't be themed tight enough.
export const Dropdown = ({ value, options, onChange, align = "right", width = 160, label }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const selected = options.find((o) => o.id === value);
  return (
    <div className="dd" ref={ref}>
      <button className="dd-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        {label && <span className="dd-label">{label}</span>}
        <span className="dd-value">{selected?.label || "—"}</span>
        <Icon name="chevron" size={10} />
      </button>
      {open && (
        <div className={`dd-menu dd-${align}`} style={{ minWidth: width }}>
          {options.map((o) => (
            <button
              key={o.id}
              className={`dd-item ${o.id === value ? "is-selected" : ""}`}
              onClick={() => { onChange(o.id); setOpen(false); }}
            >
              {o.swatch && <span className="dd-swatch" style={{ background: o.swatch }} />}
              <span>{o.label}</span>
              {o.id === value && <Icon name="check" size={10} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Button with an optional leading icon. Variants: ghost, solid, hairline.
export const Btn = ({ icon, children, onClick, variant = "ghost", title, disabled, size = "md" }) => (
  <button
    className={`btn btn-${variant} btn-${size}`}
    onClick={onClick}
    title={title}
    disabled={disabled}
  >
    {icon && <Icon name={icon} size={size === "sm" ? 11 : 13} />}
    {children && <span>{children}</span>}
  </button>
);

// Inline toggle — used for showing/hiding features.
export const Toggle = ({ on, onChange, label }) => (
  <button className={`toggle ${on ? "is-on" : ""}`} onClick={() => onChange(!on)}>
    <span className="toggle-track"><span className="toggle-dot" /></span>
    {label && <span className="toggle-label">{label}</span>}
  </button>
);

// Slider with monospaced value readout.
export const Slider = ({ value, min, max, step = 1, onChange, unit = "", label }) => (
  <div className="slider-row">
    {label && <label className="slider-label">{label}</label>}
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    <span className="slider-value">{value}{unit}</span>
  </div>
);

// Segmented control — for picking among 2-4 options.
export const Segmented = ({ value, options, onChange }) => (
  <div className="segmented">
    {options.map((o) => (
      <button
        key={o.id}
        className={`seg-btn ${o.id === value ? "is-active" : ""}`}
        onClick={() => onChange(o.id)}
      >
        {o.label}
      </button>
    ))}
  </div>
);
