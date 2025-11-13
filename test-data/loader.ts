import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Test Data Loader Utility
 * 
 * Helper functions to load golden dataset inputs and expected outputs
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DATA_DIR = path.join(__dirname, '../test-data');

export interface GoldenDataset {
  name: string;
  input: any;
  inputPath: string;
  expected: Map<string, ExpectedOutput>;
}

export interface ExpectedOutput {
  output: string;
  metadata: {
    format: string;
    tokens: {
      before: number;
      after: number;
      savings: string;
    };
    confidence: number;
    autoDecision?: any;
    generatedAt: string;
    inputFile: string;
    options: any;
  };
}

/**
 * Load a golden dataset with all its expected outputs
 */
export function loadDataset(category: string, filename: string): GoldenDataset {
  const inputPath = path.join(TEST_DATA_DIR, category, filename);
  const expectedDir = path.join(TEST_DATA_DIR, category, 'expected');
  
  // Read input
  let input: any;
  const content = fs.readFileSync(inputPath, 'utf8');
  
  if (filename.endsWith('.json')) {
    input = JSON.parse(content);
  } else {
    input = content;
  }
  
  // Read all expected outputs
  const expected = new Map<string, ExpectedOutput>();
  
  if (fs.existsSync(expectedDir)) {
    const files = fs.readdirSync(expectedDir);
    const outputFiles = files.filter((f: string) => f.endsWith('.txt'));
    
    for (const file of outputFiles) {
      const optionName = file.replace('.txt', '');
      const outputPath = path.join(expectedDir, file);
      const metaPath = path.join(expectedDir, `${optionName}.meta.json`);
      
      const output = fs.readFileSync(outputPath, 'utf8');
      const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      
      expected.set(optionName, { output, metadata });
    }
  }
  
  return {
    name: filename,
    input,
    inputPath,
    expected
  };
}

/**
 * Load all golden datasets
 */
export function loadAllDatasets(): GoldenDataset[] {
  return [
    loadDataset('openapi', 'large-api-spec.json'),
    loadDataset('agent-traces', 'function-calls.json'),
    loadDataset('rag-metadata', 'mixed-retrieval.json'),
    loadDataset('file-trees', 'large-codebase.json'),
    loadDataset('documents', 'large-prd-with-snippets.md')
  ];
}

/**
 * Load specific test input
 */
export function loadInput(category: string, filename: string): any {
  const inputPath = path.join(TEST_DATA_DIR, category, filename);
  const content = fs.readFileSync(inputPath, 'utf8');
  
  if (filename.endsWith('.json')) {
    return JSON.parse(content);
  }
  return content;
}

/**
 * Load expected output for specific option
 */
export function loadExpected(
  category: string,
  optionName: string
): ExpectedOutput {
  const expectedDir = path.join(TEST_DATA_DIR, category, 'expected');
  const outputPath = path.join(expectedDir, `${optionName}.txt`);
  const metaPath = path.join(expectedDir, `${optionName}.meta.json`);
  
  const output = fs.readFileSync(outputPath, 'utf8');
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  
  return { output, metadata };
}
