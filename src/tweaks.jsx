// Tweaks panel — floating panel bottom-right. Only visible when tweak mode is on.

import React from 'react';
import { Icon, Dropdown, Segmented, Slider, Toggle } from './ui.jsx';
import { THEMES, BACKGROUNDS, BRANDS, FONT_OPTIONS } from './themes.jsx';

export const TweaksPanel = ({ settings, setSettings, onClose }) => {

  const themeOpts = Object.entries(THEMES).map(([id, t]) => ({
    id, label: t.label, swatch: t.bg,
  }));
  const bgOpts = Object.entries(BACKGROUNDS).map(([id, b]) => ({
    id, label: b.label, swatch: b.swatch,
  }));
  const brandOpts = Object.entries(BRANDS).map(([id, b]) => ({
    id, label: b.label, swatch: b.swatch, logo: b.logo, logoColor: b.logoColor,
  }));
  const brandActive = settings.brand && settings.brand !== "none";
  const fontOpts = FONT_OPTIONS.map((f) => ({ id: f.id, label: f.label }));

  const update = (patch) => setSettings({ ...settings, ...patch });

  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <span className="tweaks-title">Appearance</span>
        <button className="icon-btn" onClick={onClose} title="Close"><Icon name="x" size={12} /></button>
      </div>
      <div className="tweaks-body">

        <section className="tw-sec">
          <div className="tw-label">Theme</div>
          <div className="swatch-grid">
            {themeOpts.map((t) => (
              <button
                key={t.id}
                className={`swatch ${settings.theme === t.id ? "is-active" : ""}`}
                onClick={() => update({ theme: t.id })}
                title={t.label}
              >
                <span className="swatch-chip" style={{ background: t.swatch }} />
                <span className="swatch-name">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="tw-sec">
          <div className="tw-label">Brand</div>
          <div className="swatch-grid">
            {brandOpts.map((b) => {
              const Logo = b.logo;
              return (
                <button
                  key={b.id}
                  className={`swatch ${settings.brand === b.id ? "is-active" : ""}`}
                  onClick={() => update({ brand: b.id })}
                  title={b.label}
                >
                  <span
                    className="swatch-chip swatch-bg swatch-brand"
                    style={{
                      background: b.swatch || "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 10px 10px",
                      color: b.logoColor || undefined,
                    }}
                  >
                    {Logo && <Logo width="22" height="10" />}
                  </span>
                  <span className="swatch-name">{b.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`tw-sec ${brandActive ? "is-disabled" : ""}`}>
          <div className="tw-label">
            Background
            {brandActive && <span className="tw-hint"> · locked by brand</span>}
          </div>
          <div className="swatch-grid">
            {bgOpts.map((b) => (
              <button
                key={b.id}
                className={`swatch ${settings.background === b.id ? "is-active" : ""}`}
                onClick={() => update({ background: b.id })}
                title={b.label}
                disabled={brandActive}
              >
                <span className="swatch-chip swatch-bg" style={{ background: b.swatch === "transparent" ? "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 10px 10px" : b.swatch }} />
                <span className="swatch-name">{b.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="tw-sec">
          <div className="tw-label">Window chrome</div>
          <Segmented
            value={settings.chrome}
            options={[
              { id: "macos", label: "macOS" },
              { id: "minimal", label: "Minimal" },
              { id: "none", label: "None" },
            ]}
            onChange={(v) => update({ chrome: v })}
          />
        </section>

        <section className="tw-sec">
          <div className="tw-label">Font family</div>
          <Dropdown
            value={settings.font}
            options={fontOpts}
            onChange={(v) => update({ font: v })}
            width={200}
          />
        </section>

        <section className="tw-sec">
          <Slider label="Font size" value={settings.fontSize} min={11} max={22} step={1} unit="px" onChange={(v) => update({ fontSize: v })} />
          <Slider label="Padding" value={settings.padding} min={0} max={96} step={4} unit="px" onChange={(v) => update({ padding: v })} />
        </section>

        <section className="tw-sec">
          <div className="tw-label">Aspect ratio</div>
          <Segmented
            value={settings.aspectRatio}
            options={[
              { id: "auto", label: "Auto" },
              { id: "16:9", label: "16:9" },
              { id: "4:3", label: "4:3" },
              { id: "1:1", label: "1:1" },
              { id: "3:4", label: "3:4" },
            ]}
            onChange={(v) => update({ aspectRatio: v })}
          />
        </section>

        <section className="tw-sec tw-row-toggles">
          <Toggle label="Line numbers" on={settings.showLineNumbers} onChange={(v) => update({ showLineNumbers: v })} />
          <Toggle label="Drop shadow" on={settings.dropShadow} onChange={(v) => update({ dropShadow: v })} />
          <Toggle label="Show filenames" on={settings.showFilename} onChange={(v) => update({ showFilename: v })} />
        </section>

        <section className="tw-sec">
          <div className="tw-label">Export format</div>
          <Segmented
            value={settings.exportFormat}
            options={[
              { id: "png", label: "PNG" },
              { id: "svg", label: "SVG" },
            ]}
            onChange={(v) => update({ exportFormat: v })}
          />
        </section>
      </div>
    </div>
  );
};
