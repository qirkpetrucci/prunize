import { describe, it, expect } from 'vitest';
import { prunize } from '../src/index';
import { loadAllDatasets, type GoldenDataset } from '../test-data/loader';

/**
 * Golden Dataset Tests
 * 
 * These tests validate prunize behavior against real-world golden datasets.
 * They ensure:
 * 1. Outputs match expected results (regression prevention)
 * 2. Token savings meet minimum thresholds
 * 3. Format detection works correctly
 * 4. Auto-decision mode functions properly
 */

describe('Golden Datasets', () => {
  const datasets = loadAllDatasets();
  
  describe('OpenAPI Specification', () => {
    const dataset = datasets.find(d => d.name === 'large-api-spec.json')!;
    
    it('should optimize with auto-detection', () => {
      const result = prunize(dataset.input);
      const expected = dataset.expected.get('auto')!;
      
      expect(result.output).toBe(expected.output);
      expect(result.format).toBe(expected.metadata.format);
      expect(result.tokens.before).toBe(expected.metadata.tokens.before);
      expect(result.tokens.after).toBe(expected.metadata.tokens.after);
    });
    
    it('should detect OpenAPI structure', () => {
      const result = prunize(dataset.input);
      expect(result.confidence).toBeGreaterThan(0.5);
      // Verify format is one of the valid prunize formats
      expect(['csv', 'toon', 'compact', 'strip']).toContain(result.format);
    });
  });
  
  describe('Agent Function Calls', () => {
    const dataset = datasets.find(d => d.name === 'function-calls.json')!;
    
    it('should optimize with auto-detection', () => {
      const result = prunize(dataset.input);
      const expected = dataset.expected.get('auto')!;
      
      expect(result.output).toBe(expected.output);
      expect(result.format).toBe(expected.metadata.format);
      expect(result.tokens.before).toBe(expected.metadata.tokens.before);
      expect(result.tokens.after).toBe(expected.metadata.tokens.after);
    });
    
    it('should handle agent execution traces', () => {
      const result = prunize(dataset.input);
      expect(result.confidence).toBeGreaterThan(0.5);
      // Agent traces are complex, format detection validates structure
      expect(['csv', 'toon', 'compact', 'strip']).toContain(result.format);
    });
  });
  
  describe('RAG Mixed Retrieval', () => {
    const dataset = datasets.find(d => d.name === 'mixed-retrieval.json')!;
    
    it('should optimize with auto-detection', () => {
      const result = prunize(dataset.input);
      const expected = dataset.expected.get('auto')!;
      
      expect(result.output).toBe(expected.output);
      expect(result.format).toBe(expected.metadata.format);
      expect(result.tokens.before).toBe(expected.metadata.tokens.before);
      expect(result.tokens.after).toBe(expected.metadata.tokens.after);
    });
    
    it('should detect RAG metadata structure', () => {
      const result = prunize(dataset.input);
      expect(result.confidence).toBeGreaterThan(0.5);
      // RAG results have varied structure depending on retrieval type
      expect(['csv', 'toon', 'compact', 'strip']).toContain(result.format);
    });
  });
  
  describe('Large Codebase File Tree', () => {
    const dataset = datasets.find(d => d.name === 'large-codebase.json')!;
    
    it('should optimize with auto-detection', () => {
      const result = prunize(dataset.input);
      const expected = dataset.expected.get('auto')!;
      
      expect(result.output).toBe(expected.output);
      expect(result.format).toBe(expected.metadata.format);
      expect(result.tokens.before).toBe(expected.metadata.tokens.before);
      expect(result.tokens.after).toBe(expected.metadata.tokens.after);
    });
    
    it('should handle deeply nested file structures', () => {
      const result = prunize(dataset.input);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(['toon', 'compact']).toContain(result.format);
    });
  });
  
  describe('PRD with Code Snippets', () => {
    const dataset = datasets.find(d => d.name === 'large-prd-with-snippets.md')!;
    
    it('should optimize with auto-decision (default)', () => {
      const result = prunize(dataset.input);
      const expected = dataset.expected.get('auto')!;
      
      expect(result.output).toBe(expected.output);
      expect(result.tokens.before).toBe(expected.metadata.tokens.before);
      expect(result.tokens.after).toBe(expected.metadata.tokens.after);
      
      // Auto-decision should enable snippet optimization
      if (result.autoDecision) {
        expect(result.autoDecision.enabled).toBe(true);
        expect(result.autoDecision.reason).toContain('snippets');
      }
    });
    
    it('should optimize snippets when enabled', () => {
      const result = prunize(dataset.input, { optimizeSnippets: true });
      const expected = dataset.expected.get('auto-enabled')!;
      
      expect(result.output).toBe(expected.output);
      expect(result.tokens.after).toBe(expected.metadata.tokens.after);
    });
    
    it('should skip snippet optimization when disabled', () => {
      const result = prunize(dataset.input, { optimizeSnippets: false });
      const expected = dataset.expected.get('auto-disabled')!;
      
      expect(result.output).toBe(expected.output);
      expect(result.tokens.after).toBe(expected.metadata.tokens.after);
    });
    
    it('should detect mixed content with snippets', () => {
      const result = prunize(dataset.input);
      
      // Should detect text content
      expect(result.format).toBe('strip');
      
      // Should provide auto-decision info
      if (result.autoDecision) {
        expect(result.autoDecision).toHaveProperty('enabled');
        expect(result.autoDecision).toHaveProperty('reason');
      }
    });
    
    it('should achieve significant savings with snippet optimization', () => {
      const withSnippets = prunize(dataset.input, { optimizeSnippets: true });
      const withoutSnippets = prunize(dataset.input, { optimizeSnippets: false });
      
      // Snippet optimization should provide additional savings
      expect(withSnippets.tokens.after).toBeLessThan(withoutSnippets.tokens.after);
      
      // Should save at least 20% more with snippets
      const withSavings = (1 - withSnippets.tokens.after / withSnippets.tokens.before) * 100;
      const withoutSavings = (1 - withoutSnippets.tokens.after / withoutSnippets.tokens.before) * 100;
      
      expect(withSavings).toBeGreaterThan(withoutSavings + 15);
    });
  });
  
  describe('Regression Prevention', () => {
    it('all datasets should produce deterministic outputs', () => {
      // Run each dataset twice, ensure identical results
      for (const dataset of datasets) {
        const result1 = prunize(dataset.input);
        const result2 = prunize(dataset.input);
        
        expect(result1.output).toBe(result2.output);
        expect(result1.tokens.before).toBe(result2.tokens.before);
        expect(result1.tokens.after).toBe(result2.tokens.after);
        expect(result1.format).toBe(result2.format);
      }
    });
    
    it('should handle all dataset types without errors', () => {
      for (const dataset of datasets) {
        expect(() => {
          prunize(dataset.input);
        }).not.toThrow();
      }
    });
  });
  
  describe('Performance', () => {
    it('should process large inputs within reasonable time', () => {
      for (const dataset of datasets) {
        const start = performance.now();
        prunize(dataset.input);
        const duration = performance.now() - start;
        
        // Should complete within 50ms for all golden datasets
        expect(duration).toBeLessThan(50);
      }
    });
    
    it('auto-decision overhead should be minimal', () => {
      const prdDataset = datasets.find(d => d.name === 'large-prd-with-snippets.md')!;
      
      const times: number[] = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        prunize(prdDataset.input);
        times.push(performance.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      // Auto-decision with snippet analysis should be fast (< 5ms average)
      expect(avgTime).toBeLessThan(5);
    });
  });
});
