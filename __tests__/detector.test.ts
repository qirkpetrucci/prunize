import { describe, it, expect } from 'vitest';
import { detectFormat } from '../src/detector';

describe('Format Detector', () => {
  describe('JSON Detection', () => {
    it('detects array of uniform objects for CSV', () => {
      const input = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const result = detectFormat(input);
      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('detects nested objects for TOON', () => {
      const input = {
        user: {
          profile: {
            name: 'Alice',
            age: 30
          }
        }
      };
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('detects simple objects for COMPACT', () => {
      const input = { name: 'Alice', age: 30, role: 'Admin' };
      const result = detectFormat(input);
      expect(result.format).toBe('compact');
    });
  });

  describe('String Detection', () => {
    it('detects JSON strings', () => {
      const input = '{"name": "Alice", "age": 30}';
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
      expect(result.reason).toContain('structured');
    });

    it('detects YAML strings', () => {
      const input = `
name: Alice
age: 30
roles:
  - admin
  - user
      `;
      const result = detectFormat(input);
      expect(['toon', 'compact']).toContain(result.format);
      expect(result.reason).toContain('structured');
    });

    it('detects XML strings', () => {
      const input = '<user><name>Alice</name><age>30</age></user>';
      const result = detectFormat(input);
      expect(['toon', 'compact']).toContain(result.format);
      expect(result.reason).toContain('structured');
    });

    it('detects HTML strings', () => {
      const input = '<html><body><h1>Hello</h1><p>World</p></body></html>';
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
      expect(result.reason).toContain('structured');
    });

    it('detects plain text for TOON (default)', () => {
      const input = 'This is just plain text with some words and spaces.';
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
      expect(result.reason).toContain('structured');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty array', () => {
      const input: any[] = [];
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
    });

    it('handles empty object', () => {
      const input = {};
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
    });

    it('handles null', () => {
      const input = null;
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
    });

    it('handles primitive values', () => {
      const input = 42;
      const result = detectFormat(input);
      expect(result.format).toBe('toon');
    });
  });

  describe('Confidence Scores', () => {
    it('returns high confidence for clear CSV case', () => {
      const input = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`
      }));
      const result = detectFormat(input);
      expect(result.format).toBe('csv');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('returns medium confidence for mixed content', () => {
      const input = {
        users: [{ id: 1 }],
        config: { timeout: 3000 },
        message: 'Hello world'
      };
      const result = detectFormat(input);
      expect(result.confidence).toBeLessThan(0.9);
    });
  });
});
