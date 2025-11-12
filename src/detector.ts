export type FormatType = "csv" | "toon" | "compact" | "strip";

export interface StructureAnalysis {
  format: FormatType;
  confidence: number;
  reason: string;
}

/**
 * Detects if input is a YAML string
 */
export function isYAMLString(input: string): boolean {
  if (typeof input !== "string") {
    return false;
  }

  // YAML patterns
  const yamlPatterns = [
    /^[\w-]+:\s*$/m,           // Key with no value (nested object)
    /^  [\w-]+:/m,             // Indented keys (2 spaces)
    /^\s*-\s+[\w-]+:/m,        // Array of objects
    /^---$/m,                  // Document separator
    /^\w+:\s+[^\n]+$/m,        // Simple key-value
  ];

  // Must match at least 2 patterns to avoid false positives
  const matchCount = yamlPatterns.filter(pattern => pattern.test(input)).length;
  
  // Additional checks: no XML/HTML tags, no JSON braces
  const hasXMLTags = /<\/?[\w-]+[^>]*>/m.test(input);
  const hasJSONBraces = /^\s*[{[]/.test(input.trim());
  
  return matchCount >= 2 && !hasXMLTags && !hasJSONBraces;
}

/**
 * Detects if input is an XML string
 */
export function isXMLString(input: string): boolean {
  if (typeof input !== "string") {
    return false;
  }

  // XML patterns
  const xmlPatterns = [
    /^\s*<\?xml/i,                    // XML declaration
    /^\s*<[\w-]+[^>]*>/,              // Opening tag
    /<\/[\w-]+>/,                     // Closing tag
    /<[\w-]+[^>]*\/>/,                // Self-closing tag
  ];

  // Must have at least opening and closing tags
  const hasOpenTag = xmlPatterns[1].test(input) || xmlPatterns[0].test(input);
  const hasCloseTag = xmlPatterns[2].test(input) || xmlPatterns[3].test(input);
  
  return hasOpenTag && hasCloseTag;
}

/**
 * Detects if input is an HTML string
 */
export function isHTMLString(input: string): boolean {
  if (typeof input !== "string") {
    return false;
  }

  // Common HTML patterns
  const htmlPatterns = [
    /<!DOCTYPE\s+html/i,              // HTML5 doctype
    /<html[^>]*>/i,                   // HTML tag
    /<(div|span|p|form|input|button|a|table|select|label|h[1-6])[^>]*>/i,  // Common HTML tags
    /<(head|body|meta|link|script|style)[^>]*>/i,  // Document structure tags
  ];

  // Must match at least one HTML pattern
  const matchCount = htmlPatterns.filter(pattern => pattern.test(input)).length;
  
  // Check for HTML-specific attributes
  const hasHTMLAttrs = /\s(class|id|href|src|type|name|placeholder|value)=/i.test(input);
  
  return matchCount >= 1 || hasHTMLAttrs;
}

/**
 * Checks if input is a flat array of uniform objects (suitable for CSV)
 */
function isFlatArrayOfObjects(value: any): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  // Check if all items are plain objects
  const allObjects = value.every(
    item => item !== null && typeof item === "object" && !Array.isArray(item)
  );

  if (!allObjects) {
    return false;
  }

  // Check for uniform structure (similar keys)
  const firstKeys = new Set(Object.keys(value[0]));
  const uniformKeys = value.every(item => {
    const itemKeys = new Set(Object.keys(item));
    return itemKeys.size === firstKeys.size &&
           [...itemKeys].every(key => firstKeys.has(key));
  });

  // Check for nested structures
  const hasNestedStructures = value.some(item =>
    Object.values(item).some(val =>
      typeof val === "object" && val !== null
    )
  );

  return uniformKeys && !hasNestedStructures;
}

/**
 * Checks if input has nested structures (suitable for TOON)
 */
function hasNestedStructure(value: any): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    // Check if array contains objects with nested properties
    return value.some(item => {
      if (typeof item === "object" && item !== null) {
        return Object.values(item).some(val =>
          (typeof val === "object" && val !== null) ||
          Array.isArray(val)
        );
      }
      return false;
    });
  }

  // Check if object has nested objects or arrays
  return Object.values(value).some(val =>
    (typeof val === "object" && val !== null) || Array.isArray(val)
  );
}

/**
 * Checks if input is shallow key-value pairs (suitable for Compact)
 */
function isShallowObject(value: any): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const values = Object.values(value);
  
  // All values should be primitives
  const allPrimitives = values.every(val =>
    typeof val !== "object" || val === null
  );

  // Should have reasonable number of keys (not too many for compact format)
  const keyCount = Object.keys(value).length;

  return allPrimitives && keyCount > 0 && keyCount < 20;
}

/**
 * Checks if input is text-heavy (suitable for Strip)
 */
function isTextHeavy(value: any): boolean {
  if (typeof value === "string") {
    return value.length > 100;
  }

  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Calculate text content ratio
  const jsonStr = JSON.stringify(value);
  const textContent = JSON.stringify(value, null, 0);
  
  // Count string content vs structural characters
  let stringContentLength = 0;
  let structureLength = 0;

  const traverse = (obj: any) => {
    if (typeof obj === "string") {
      stringContentLength += obj.length;
    } else if (Array.isArray(obj)) {
      structureLength += 2; // []
      obj.forEach(traverse);
    } else if (typeof obj === "object" && obj !== null) {
      structureLength += Object.keys(obj).length * 3; // {, :, }
      Object.values(obj).forEach(traverse);
    }
  };

  traverse(value);

  // If string content is more than 70% of total, it's text-heavy
  const textRatio = stringContentLength / (stringContentLength + structureLength);
  
  return textRatio > 0.7 && stringContentLength > 200;
}

/**
 * Analyzes input structure and determines the best format
 * 
 * @param input - Input value to analyze
 * @returns Structure analysis with format recommendation
 */
export function detectFormat(input: any): StructureAnalysis {
  // Priority 1: Check for flat array of objects (CSV)
  if (isFlatArrayOfObjects(input)) {
    return {
      format: "csv",
      confidence: 0.9,
      reason: "Flat array of uniform objects detected - ideal for CSV format"
    };
  }

  // Priority 2: Check for text-heavy content (Strip)
  if (isTextHeavy(input)) {
    return {
      format: "strip",
      confidence: 0.85,
      reason: "Text-heavy content detected - using minimal formatting"
    };
  }

  // Priority 3: Check for nested structures (TOON)
  if (hasNestedStructure(input)) {
    return {
      format: "toon",
      confidence: 0.8,
      reason: "Nested structure detected - TOON format preserves hierarchy efficiently"
    };
  }

  // Priority 4: Check for shallow objects (Compact)
  if (isShallowObject(input)) {
    return {
      format: "compact",
      confidence: 0.75,
      reason: "Shallow key-value structure - compact format is optimal"
    };
  }

  // Default: Use TOON for general structured data
  return {
    format: "toon",
    confidence: 0.6,
    reason: "Default to TOON format for structured data"
  };
}

/**
 * Calculates complexity score for input structure
 * Higher score = more complex, better suited for TOON
 */
export function calculateComplexity(input: any): number {
  let score = 0;

  const traverse = (obj: any, depth: number = 0) => {
    if (depth > 3) {
      score += 10; // Deep nesting
    }

    if (Array.isArray(obj)) {
      score += obj.length > 10 ? 5 : 2;
      obj.forEach(item => traverse(item, depth + 1));
    } else if (typeof obj === "object" && obj !== null) {
      const keyCount = Object.keys(obj).length;
      score += keyCount > 10 ? 5 : keyCount;
      Object.values(obj).forEach(val => traverse(val, depth + 1));
    }
  };

  traverse(input);
  return score;
}
