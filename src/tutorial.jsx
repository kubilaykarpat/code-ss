// Skippable, multi-step product tour. Targets real DOM nodes via `data-tour="..."`
// markers and overlays a spotlight + tooltip card. State persists to localStorage
// so the tour auto-runs once on first visit and can be replayed from the Why modal.

import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Icon } from './ui.jsx';

export const TUTORIAL_SEEN_KEY = 'codess.tutorialSeen';

const STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to SNAP',
    body: 'A 30-second tour of how this works. You can skip anytime.',
    align: 'center',
  },
  {
    id: 'block',
    target: 'block-frame',
    title: 'The block is the screenshot',
    body: 'Edit code directly inside the themed canvas. What you see is exactly what gets exported.',
    align: 'right',
  },
  {
    id: 'line-numbers',
    target: 'line-numbers',
    title: 'Click line numbers to highlight',
    body: 'Tap any number in the gutter to call that line out. Perfect for walking through code on stage.',
    align: 'right',
  },
  {
    id: 'add-block',
    target: 'add-block',
    title: 'Stack multiple snippets',
    body: 'A real technical talk has a dozen code blocks. Add them all here — reorder, theme, export together. Shortcut: ⌘B.',
    align: 'bottom-end',
  },
  {
    id: 'tweaks',
    target: 'tweaks',
    title: 'Appearance',
    body: 'Theme, font, padding, window chrome, drop shadow — applied uniformly to every block.',
    align: 'bottom-end',
  },
  {
    id: 'export',
    target: 'export-all',
    title: 'Export per block, or all at once',
    body: 'Each block has its own Copy/Export buttons. Or grab the whole batch as PNG or SVG, ready to drop into a slide.',
    align: 'bottom-end',
  },
  {
    id: 'done',
    target: null,
    title: "You're set.",
    body: 'Everything saves to your browser automatically. Replay this tour anytime from the "why?" link in the top bar.',
    align: 'center',
  },
];

const PADDING = 8;
const CARD_W = 320;
const CARD_GAP = 14;

function measure(target) {
  if (!target) return null;
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function placeCard(rect, align) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!rect || align === 'center') {
    return {
      top: Math.max(24, vh / 2 - 140),
      left: vw / 2 - CARD_W / 2,
      arrow: null,
    };
  }

  if (align === 'right') {
    const left = Math.min(vw - CARD_W - 16, rect.left + rect.width + CARD_GAP);
    const top = Math.max(16, Math.min(vh - 240, rect.top + rect.height / 2 - 100));
    return { top, left, arrow: 'left' };
  }

  if (align === 'bottom-end') {
    const left = Math.max(16, Math.min(vw - CARD_W - 16, rect.left + rect.width - CARD_W));
    const top = Math.min(vh - 220, rect.top + rect.height + CARD_GAP);
    return { top, left, arrow: 'top' };
  }

  const left = Math.max(16, Math.min(vw - CARD_W - 16, rect.left + rect.width / 2 - CARD_W / 2));
  const top = Math.min(vh - 220, rect.top + rect.height + CARD_GAP);
  return { top, left, arrow: 'top' };
}

export const Tutorial = ({ onClose }) => {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [card, setCard] = useState({ top: 0, left: 0, arrow: null });

  const step = STEPS[i];
  const isFirst = i === 0;
  const isLast = i === STEPS.length - 1;

  useLayoutEffect(() => {
    const update = () => {
      const r = measure(step.target);
      setRect(r);
      setCard(placeCard(r, step.align));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const t = setTimeout(update, 60);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      clearTimeout(t);
    };
  }, [i, step.target, step.align]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (isLast) onClose();
        else setI((n) => Math.min(STEPS.length - 1, n + 1));
      } else if (e.key === 'ArrowLeft') {
        setI((n) => Math.max(0, n - 1));
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isLast, onClose]);

  const spotlight = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  return (
    <div className="tour-root" role="dialog" aria-label="Product tour">
      {spotlight ? (
        <div className="tour-spotlight" style={spotlight} />
      ) : (
        <div className="tour-dim" />
      )}

      <div
        className={`tour-card ${step.align === 'center' ? 'is-center' : ''}`}
        style={{ top: card.top, left: card.left, width: CARD_W }}
      >
        {card.arrow && <span className={`tour-arrow tour-arrow-${card.arrow}`} aria-hidden="true" />}

        <button className="tour-close" onClick={onClose} aria-label="Close tour">
          <Icon name="x" size={12} />
        </button>

        <div className="tour-eyebrow">
          <span className="tour-step">
            {String(i + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </span>
          <span className="tour-eyebrow-label">tour</span>
        </div>

        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>

        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((s, idx) => (
            <span key={s.id} className={`tour-dot ${idx === i ? 'is-active' : ''}`} />
          ))}
        </div>

        <div className="tour-foot">
          {!isLast ? (
            <button className="tour-skip" onClick={onClose}>Skip tour</button>
          ) : (
            <span />
          )}
          <div className="tour-nav">
            {!isFirst && (
              <button className="tour-btn" onClick={() => setI((n) => Math.max(0, n - 1))}>
                Back
              </button>
            )}
            {!isLast ? (
              <button className="tour-btn is-primary" onClick={() => setI((n) => Math.min(STEPS.length - 1, n + 1))}>
                Next
              </button>
            ) : (
              <button className="tour-btn is-primary" onClick={onClose}>
                Got it
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
