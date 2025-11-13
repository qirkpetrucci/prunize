import { describe, it, expect } from 'vitest';
import { prunize } from '../src/index';

describe('Circular Reference Detection - Bug Reproduction', () => {
  describe('YAML nested objects should NOT produce [Circular]', () => {
    it('should handle architecture YAML without false positive circular detection', () => {
      const input = `architecture:
  frontend:
    framework: Next.js 14
    rendering: Server-side + Static Generation
    cdn: CloudFront
    
  backend:
    api: Node.js + Express
    database:
      primary: PostgreSQL 15
      cache: Redis 7.x
      search: Elasticsearch 8.x
      
  infrastructure:
    hosting: AWS
    regions:
      - us-east-1
      - eu-west-1
      - ap-southeast-1
    containers: ECS with Fargate
    
  monitoring:
    apm: DataDog
    logging: CloudWatch
    errors: Sentry`;

      const result = prunize(input, { verbose: true });
      
      console.log('Format detected:', result.format);
      console.log('Full output:', result.output);
      console.log('Output length:', result.output.length);
      
      // Should NOT contain [Circular] in output
      expect(result.output).not.toContain('[Circular]');
      expect(result.output).not.toContain('Circular');
    });

    it('should handle testing_strategy YAML without false positive circular detection', () => {
      const input = `testing_strategy:
  unit_tests:
    coverage_target: 80%
    framework: Jest
    
  integration_tests:
    coverage_target: 70%
    framework: Supertest
    
  e2e_tests:
    framework: Playwright
    scenarios:
      - user_registration
      - product_search
      - add_to_cart
      - checkout_flow
      - order_tracking
      
  performance_tests:
    tool: k6
    scenarios:
      - load_test: 1000 concurrent users
      - stress_test: 5000 concurrent users
      - spike_test: 0 to 10000 users in 1 minute`;

      const result = prunize(input);
      
      console.log('Format detected:', result.format);
      console.log('Output preview:', result.output.substring(0, 200));
      
      // Should NOT contain [Circular] in output
      expect(result.output).not.toContain('[Circular]');
      expect(result.output).not.toContain('Circular');
    });

    it('should handle nested YAML without false positive', () => {
      const input = `architecture:
  frontend:
    framework: Next.js 14
    rendering: Server-side + Static Generation
    cdn: CloudFront`;

      const result = prunize(input);
      
      console.log('Format detected:', result.format);
      console.log('Output:', result.output);
      
      expect(result.output).not.toContain('[Circular]');
      expect(result.output).not.toContain('Circular');
    });

    it('should handle PRD document with embedded YAML snippets', () => {
      const input = `# Product Requirements Document: E-Commerce Platform v2.0

## 1. Executive Summary

This document outlines the requirements for the next major version of our e-commerce platform.

**Timeline**: Q1 2025 - Q3 2025

\`\`\`yaml
architecture:
  frontend:
    framework: Next.js 14
    rendering: Server-side + Static Generation
    cdn: CloudFront
    
  backend:
    api: Node.js + Express
    database:
      primary: PostgreSQL 15
      cache: Redis 7.x
\`\`\`

## 2. Business Objectives

1. Increase conversion rate by 25%`;

      const result = prunize(input, { optimizeSnippets: 'auto' });
      
      console.log('Format detected:', result.format);
      console.log('Snippets optimized:', result.autoDecision?.enabled);
      console.log('Output preview:', result.output.substring(0, 300));
      
      // Should NOT contain [Circular] in output
      expect(result.output).not.toContain('[Circular]');
      expect(result.output).not.toContain('Circular');
    });
  });

  describe('Real circular references should be detected', () => {
    it('should detect and reject actual circular references', () => {
      const obj: any = { name: 'parent' };
      obj.self = obj; // Real circular reference
      
      // Real circular references should be caught early and throw an error
      expect(() => {
        prunize(obj);
      }).toThrow(/circular/i);
    });
  });
});
