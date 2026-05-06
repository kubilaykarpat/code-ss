import { describe, it, expect } from 'vitest';
import { THEMES, BACKGROUNDS, FONT_OPTIONS } from '../themes.jsx';

describe('themes', () => {
  it('exports THEMES object with required theme structure', () => {
    expect(THEMES).toBeDefined();
    expect(THEMES.mono).toBeDefined();
    expect(THEMES.mono.label).toBe('Mono');
    expect(THEMES.mono.colors).toBeDefined();
    expect(THEMES.mono.colors.keyword).toBeDefined();
  });

  it('all themes have consistent color tokens', () => {
    const requiredColors = [
      'comment', 'keyword', 'string', 'number', 'function',
      'type', 'builtin', 'variable', 'operator', 'punct',
      'tag', 'attr', 'regex', 'text',
    ];
    for (const [id, theme] of Object.entries(THEMES)) {
      for (const color of requiredColors) {
        expect(theme.colors[color], `${id}.colors.${color}`).toBeDefined();
      }
    }
  });

  it('exports BACKGROUNDS with css/swatch', () => {
    expect(BACKGROUNDS.ash).toBeDefined();
    expect(BACKGROUNDS.ash.css).toBeDefined();
    expect(BACKGROUNDS.ash.swatch).toBeDefined();
  });

  it('exports FONT_OPTIONS array', () => {
    expect(Array.isArray(FONT_OPTIONS)).toBe(true);
    expect(FONT_OPTIONS.length).toBeGreaterThan(0);
    expect(FONT_OPTIONS[0]).toHaveProperty('id');
    expect(FONT_OPTIONS[0]).toHaveProperty('label');
    expect(FONT_OPTIONS[0]).toHaveProperty('stack');
  });
});
