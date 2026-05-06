import { describe, it, expect } from 'vitest';
import { tokenize, detect, resolveLang, langList } from '../highlighter.jsx';

describe('highlighter', () => {
  describe('detect', () => {
    it('detects JavaScript', () => {
      const code = 'const foo = () => console.log("hi");';
      expect(detect(code)).toBe('javascript');
    });

    it('detects TypeScript via type annotations', () => {
      const code = 'const name: string = "John"; interface User { id: number }';
      expect(detect(code)).toBe('typescript');
    });

    it('detects Python', () => {
      const code = 'def hello():\n    print("world")\n\nimport os';
      expect(detect(code)).toBe('python');
    });

    it('detects SQL', () => {
      const code = 'SELECT id FROM users WHERE active = true';
      expect(detect(code)).toBe('sql');
    });

    it('detects JSON', () => {
      expect(detect('{"a": 1, "b": [1,2,3]}')).toBe('json');
    });

    it('detects Go', () => {
      const code = 'package main\nfunc main() { x := 1 }';
      expect(detect(code)).toBe('go');
    });

    it('returns plain for empty input', () => {
      expect(detect('')).toBe('plain');
      expect(detect('   ')).toBe('plain');
    });
  });

  describe('resolveLang', () => {
    it('resolves direct names', () => {
      expect(resolveLang('javascript')).toBe('javascript');
      expect(resolveLang('python')).toBe('python');
    });

    it('resolves aliases', () => {
      expect(resolveLang('js')).toBe('javascript');
      expect(resolveLang('ts')).toBe('typescript');
      expect(resolveLang('py')).toBe('python');
    });

    it('is case-insensitive', () => {
      expect(resolveLang('JavaScript')).toBe('javascript');
      expect(resolveLang('PY')).toBe('python');
    });

    it('returns null for unknown', () => {
      expect(resolveLang('unknownlang')).toBeNull();
      expect(resolveLang('')).toBeNull();
    });
  });

  describe('tokenize', () => {
    it('tokenizes JavaScript code', () => {
      const lines = tokenize('const x = 1;', 'javascript');
      expect(lines).toHaveLength(1);
      const types = lines[0].map((t) => t.type);
      expect(types).toContain('keyword');
      expect(types).toContain('number');
    });

    it('handles multiline code', () => {
      const lines = tokenize('let a = 1;\nlet b = 2;', 'javascript');
      expect(lines).toHaveLength(2);
    });
  });

  describe('langList', () => {
    it('returns array of lang options', () => {
      const list = langList();
      expect(list.length).toBeGreaterThan(5);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('label');
    });
  });
});
