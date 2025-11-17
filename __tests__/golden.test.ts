import { describe, it, expect } from 'vitest';
import { prunize } from '../src/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Golden Tests', () => {
  const testDataDir = path.join(__dirname, '../test-data');
  
  const datasets = [
    {
      name: 'OpenAPI Pet Store',
      input: path.join(testDataDir, 'openapi/petstore-api.json'),
      expected: path.join(testDataDir, 'openapi/expected/auto.txt'),
      meta: path.join(testDataDir, 'openapi/expected/auto.meta.json')
    },
    {
      name: 'Agent Multi-Tool Trace',
      input: path.join(testDataDir, 'agent/multi-tool-trace.json'),
      expected: path.join(testDataDir, 'agent/expected/auto.txt'),
      meta: path.join(testDataDir, 'agent/expected/auto.meta.json')
    },
    {
      name: 'PRD with Code Snippets',
      input: path.join(testDataDir, 'prd/realtime-collab-platform.md'),
      expected: path.join(testDataDir, 'prd/expected/auto.txt'),
      meta: path.join(testDataDir, 'prd/expected/auto.meta.json')
    },
    {
      name: 'Large Nested JSON',
      input: path.join(testDataDir, 'nested/ecommerce-config.json'),
      expected: path.join(testDataDir, 'nested/expected/auto.txt'),
      meta: path.join(testDataDir, 'nested/expected/auto.meta.json')
    }
  ];

  datasets.forEach(dataset => {
    describe(dataset.name, () => {
      it('should match expected output', () => {
        const input = fs.readFileSync(dataset.input, 'utf8');
        const expectedOutput = fs.readFileSync(dataset.expected, 'utf8');
        const expectedMeta = JSON.parse(fs.readFileSync(dataset.meta, 'utf8'));

        const result = prunize(input);

        expect(result.output).toBe(expectedOutput);
        expect(result.format).toBe(expectedMeta.format);
        expect(result.tokens.before).toBe(expectedMeta.tokens.before);
        expect(result.tokens.after).toBe(expectedMeta.tokens.after);
        expect(result.tokens.savings).toBe(expectedMeta.tokens.savings);
      });

      it('should produce positive token savings', () => {
        const input = fs.readFileSync(dataset.input, 'utf8');
        const result = prunize(input);
        
        const savingsPercent = parseFloat(result.tokens.savings);
        
        expect(savingsPercent).toBeGreaterThan(0);
        expect(result.tokens.after).toBeLessThan(result.tokens.before);
      });

      it('should detect appropriate format', () => {
        const input = fs.readFileSync(dataset.input, 'utf8');
        const result = prunize(input);
        
        expect(['csv', 'toon', 'compact', 'strip']).toContain(result.format);
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.confidence).toBeLessThanOrEqual(1.0);
      });

      it('should execute within reasonable time', () => {
        const input = fs.readFileSync(dataset.input, 'utf8');
        
        const startTime = performance.now();
        prunize(input);
        const endTime = performance.now();
        
        const executionTime = endTime - startTime;
        
        expect(executionTime).toBeLessThan(100);
      });
    });
  });
});
