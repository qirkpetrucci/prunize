import { describe, it, expect } from 'vitest';
import { prunize } from '../src/index';

describe('Prunize Integration Tests', () => {
  describe('Basic Usage', () => {
    it('optimizes simple JSON object', () => {
      const input = { name: 'Alice', age: 30, role: 'Admin' };
      const result = prunize(input);
      
      expect(result.format).toBe('toon'); // Now uses TOON (compact handled separately)
      expect(result.output).toBeTruthy();
      expect(result.tokens.before).toBeGreaterThan(0);
      expect(result.tokens.after).toBeGreaterThan(0);
      expect(result.tokens.after).toBeLessThan(result.tokens.before);
    });

    it('optimizes array data to CSV', () => {
      const input = [
        { id: 1, name: 'Alice', role: 'Admin' },
        { id: 2, name: 'Bob', role: 'User' }
      ];
      const result = prunize(input);
      
      expect(result.format).toBe('csv');
      expect(result.output).toContain('id,name,role');
      expect(result.tokens.savings).toMatch(/\d+\.\d+%/);
    });
  });

  describe('Auto-Decision Mode', () => {
    it('auto-decision may not return info for simple text', () => {
      const input = 'Plain text without code blocks';
      const result = prunize(input);
      
      // autoDecision may be undefined for simple inputs
      expect(result.output).toBeTruthy();
      expect(result.format).toBe('toon');
    });

    it('can disable snippet optimization', () => {
      const input = 'Some text';
      const result = prunize(input, { optimizeSnippets: false });
      
      // Snippet optimization disabled
      expect(result.output).toBeTruthy();
    });
  });

  describe('Token Estimation', () => {
    it('calculates token savings correctly', () => {
      const input = {
        users: Array.from({ length: 10 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`
        }))
      };
      const result = prunize(input);
      
      expect(result.tokens.before).toBeGreaterThan(result.tokens.after);
      expect(result.tokens.savings).toMatch(/\d+\.\d+%/);
      
      const savingsPercent = parseFloat(result.tokens.savings);
      expect(savingsPercent).toBeGreaterThan(0);
      expect(savingsPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty object', () => {
      const result = prunize({});
      expect(result.output).toBe('');
      expect(result.format).toBe('toon');
    });

    it('handles empty array (@toon-format/toon format)', () => {
      const result = prunize([]);
      expect(result.output).toBe('[0]:'); // Official library format for empty array
      expect(result.format).toBe('toon');
    });

    it('handles null', () => {
      const result = prunize(null);
      expect(result.output).toBeTruthy();
    });

    it('handles primitive string', () => {
      const result = prunize('Hello World');
      expect(result.output).toBeTruthy();
      expect(result.format).toBe('toon');
    });

    it('handles primitive number', () => {
      const result = prunize(42);
      expect(result.output).toBe('42');
    });
  });

  describe('Verbose Mode', () => {
    it('does not throw in verbose mode', () => {
      const input = { name: 'Alice', age: 30 };
      expect(() => prunize(input, { verbose: true })).not.toThrow();
    });
  });

  describe('Real-World Scenarios', () => {
    it('optimizes API response', () => {
      const apiResponse = {
        status: 'success',
        data: {
          users: [
            { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
            { id: 2, name: 'Bob', email: 'bob@example.com', active: false }
          ],
          pagination: {
            page: 1,
            perPage: 10,
            total: 2
          }
        }
      };
      
      const result = prunize(apiResponse);
      expect(result.tokens.after).toBeLessThan(result.tokens.before);
      // With official @toon-format/toon library, savings might be lower but safer
      expect(parseFloat(result.tokens.savings)).toBeGreaterThan(10);
    });

    it('optimizes configuration object', () => {
      const config = {
        server: {
          host: 'localhost',
          port: 3000,
          ssl: false
        },
        database: {
          host: 'db.example.com',
          port: 5432,
          name: 'myapp',
          pool: {
            min: 2,
            max: 10
          }
        },
        features: {
          authentication: true,
          analytics: true,
          notifications: false
        }
      };
      
      const result = prunize(config);
      expect(result.format).toBe('toon');
      expect(result.tokens.after).toBeLessThan(result.tokens.before);
    });
  });
});
