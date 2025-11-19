import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prunize } from '../src/index';

describe('Compact Option (v0.3.0)', () => {
  describe('Backward Compatibility', () => {
    let consoleWarnSpy: any;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      delete process.env.NODE_ENV;
    });

    it('should accept deprecated format: "compact" and show warning in dev mode', () => {
      const input = { name: 'Alice', age: 30 };
      const result = prunize(input, { format: 'compact' as any });

      // Should still work
      expect(result.output).toBeTruthy();
      expect(result.tokens.before).toBeGreaterThan(0);
      expect(result.tokens.after).toBeLessThan(result.tokens.before);

      // Should show deprecation warning in dev mode
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION: format: "compact" is deprecated')
      );
    });

    it('should NOT show warning in production mode', () => {
      process.env.NODE_ENV = 'production';
      
      const input = { name: 'Alice', age: 30 };
      const result = prunize(input, { format: 'compact' as any });

      // Should still work
      expect(result.output).toBeTruthy();

      // Should NOT show warning in production
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should show warning when verbose: true regardless of NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      
      const input = { name: 'Alice', age: 30 };
      const result = prunize(input, { format: 'compact' as any, verbose: true });

      // Should show warning when verbose is true
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION: format: "compact" is deprecated')
      );
    });
  });

  describe('New Compact Option', () => {
    it('should apply compaction by default (compact: true)', () => {
      const input = { name: 'Alice', age: 30, role: 'Admin' };
      const result = prunize(input);

      // Output should not have newlines (compacted)
      expect(result.output).not.toContain('\n');
    });

    it('should allow readable output with compact: false', () => {
      const input = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const resultCompact = prunize(input, { compact: true });
      const resultReadable = prunize(input, { compact: false });

      // Compact should use semicolons instead of newlines
      expect(resultCompact.output).toContain(';');
      expect(resultCompact.output).not.toContain('\n');

      // Readable should have newlines
      expect(resultReadable.output).toContain('\n');

      // Both should have same format
      expect(resultCompact.format).toBe(resultReadable.format);
    });

    it('should work with format forcing and compaction', () => {
      const input = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];

      // Force TOON + compact
      const toonCompact = prunize(input, { format: 'toon', compact: true });
      expect(toonCompact.format).toBe('toon');
      expect(toonCompact.output).not.toContain('\n');

      // Force CSV + readable
      const csvReadable = prunize(input, { format: 'csv', compact: false });
      expect(csvReadable.format).toBe('csv');
      expect(csvReadable.output).toContain('\n');

      // Force CSV + compact
      const csvCompact = prunize(input, { format: 'csv', compact: true });
      expect(csvCompact.format).toBe('csv');
      expect(csvCompact.output).toContain(';'); // Newlines replaced with semicolons
    });
  });

  describe('Compaction Logic', () => {
    it('should compact TOON format correctly', () => {
      const input = { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] };
      const result = prunize(input, { format: 'toon', compact: true });

      expect(result.output).not.toContain('\n');
      expect(result.output).toContain(';'); // Semicolon separator
    });

    it('should compact CSV format correctly', () => {
      const input = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];
      const result = prunize(input, { format: 'csv', compact: true });

      expect(result.output).not.toContain('\n');
      expect(result.output).toMatch(/^id,name;1,Alice;2,Bob$/);
    });

    it('should compact Strip format correctly', () => {
      const input = `Line 1
      
      Line 2    with   spaces
      
      Line 3`;
      const result = prunize(input, { format: 'strip', compact: true });

      // Should collapse newlines and multiple spaces
      expect(result.output).not.toContain('\n');
      expect(result.output).toMatch(/^Line 1 Line 2 with spaces Line 3$/);
    });
  });

  describe('Token Savings', () => {
    it('should save more tokens with compact: true', () => {
      const input = [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
        { id: 3, name: 'Charlie', email: 'charlie@example.com' }
      ];

      const compact = prunize(input, { compact: true });
      const readable = prunize(input, { compact: false });

      // Compact should have fewer or equal tokens (CSV may have same count)
      expect(compact.tokens.after).toBeLessThanOrEqual(readable.tokens.after);

      // Compact should have higher or equal savings percentage
      const compactSavings = parseFloat(compact.tokens.savings);
      const readableSavings = parseFloat(readable.tokens.savings);
      expect(compactSavings).toBeGreaterThanOrEqual(readableSavings);
    });
  });
});
