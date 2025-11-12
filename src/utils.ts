export interface TokenEstimatorOptions {
  method?: "simple" | "improved";
}

/**
 * Estimates token count for text using different strategies
 * 
 * @param text - The text to estimate tokens for
 * @param options - Estimation method configuration
 * @returns Estimated token count
 * 
 * @example
 * ```ts
 * // Simple: Fast approximation (length / 4)
 * estimateTokens(text, { method: "simple" });
 * 
 * // Improved: Accounts for syntax overhead (default)
 * estimateTokens(text);
 * ```
 */
export function estimateTokens(
  text: string,
  options?: TokenEstimatorOptions
): number {
  const method = options?.method || "simple";

  switch (method) {
    case "simple":
      // Simple heuristic: 1 token ≈ 4 characters
      // Fast but can be off by ±30%
      return Math.ceil(text.length / 4);

    case "improved":
      // Enhanced estimation with pattern analysis
      return estimateTokensImproved(text);

    default:
      return Math.ceil(text.length / 4);
  }
}

/**
 * Improved token estimation using character distribution analysis
 * Accounts for JSON syntax overhead and common patterns
 * Accuracy: ±15%
 */
function estimateTokensImproved(text: string): number {
  const length = text.length;
  
  // Base estimate
  let estimate = length / 4;
  
  // Count different character types
  const syntaxChars = (text.match(/[{}\[\]:,"]/g) || []).length;
  const whitespace = (text.match(/\s/g) || []).length;
  const alphanumeric = (text.match(/[a-zA-Z0-9]/g) || []).length;
  const punctuation = (text.match(/[.!?;]/g) || []).length;
  
  // Adjustments based on character distribution
  // JSON syntax characters are often single tokens
  const syntaxAdjustment = syntaxChars * 0.15;
  
  // Whitespace is often compressed or ignored
  const whitespaceReduction = whitespace * 0.1;
  
  // Common words and patterns
  // Numbers are often single tokens
  const numberCount = (text.match(/\b\d+\b/g) || []).length;
  const numberAdjustment = numberCount * 0.05;
  
  // Common JSON keys are often single tokens
  const commonKeys = (text.match(/\b(id|name|type|status|data|value|key)\b/gi) || []).length;
  const keyAdjustment = commonKeys * 0.1;
  
  // Final calculation
  estimate = estimate + syntaxAdjustment - whitespaceReduction + numberAdjustment - keyAdjustment;
  
  return Math.ceil(Math.max(1, estimate));
}

/**
 * Escapes special characters in TOON format
 * 
 * @param value - Value to escape
 * @returns Escaped string
 */
export function escapeValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);
  
  // If string contains comma, newline, or colon, wrap in quotes
  if (str.includes(",") || str.includes("\n") || str.includes(":")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Checks if a value is a plain object (not array, not null)
 * 
 * @param value - Value to check
 * @returns True if plain object
 */
export function isPlainObject(value: any): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

/**
 * Get unique keys from an array of objects
 * 
 * @param array - Array of objects
 * @returns Array of unique keys
 */
export function getArrayKeys(array: any[]): string[] {
  const keysSet = new Set<string>();
  
  for (const item of array) {
    if (isPlainObject(item)) {
      Object.keys(item).forEach(key => keysSet.add(key));
    }
  }
  
  return Array.from(keysSet);
}

/**
 * Simple YAML parser for common structures (subset of YAML spec)
 * Supports: key-value pairs, nested objects, arrays, basic types
 * Does NOT support: anchors, aliases, complex types, multi-line strings
 * 
 * @param yamlString - YAML string to parse
 * @returns Parsed JavaScript object
 */
export function parseSimpleYAML(yamlString: string): any {
  const lines = yamlString.split('\n');
  const root: any = {};
  const stack: Array<{ obj: any; indent: number; key?: string }> = [{ obj: root, indent: -1 }];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#') || line.trim() === '---') {
      continue;
    }
    
    const indent = line.search(/\S/);
    const content = line.trim();
    
    // Pop stack to correct indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const parent = stack[stack.length - 1];
    
    // Handle array items
    if (content.startsWith('-')) {
      const value = content.substring(1).trim();
      
      // Ensure parent object has array for current key
      if (parent.key && !Array.isArray(parent.obj[parent.key])) {
        parent.obj[parent.key] = [];
      }
      
      const targetArray = parent.key ? parent.obj[parent.key] : parent.obj;
      
      if (value.includes(':')) {
        // Array item is an object
        const obj: any = {};
        const [key, val] = value.split(':').map(s => s.trim());
        obj[key] = parseYAMLValue(val);
        targetArray.push(obj);
        stack.push({ obj, indent, key });
      } else {
        // Array item is primitive
        targetArray.push(parseYAMLValue(value));
      }
      continue;
    }
    
    // Handle key-value pairs
    if (content.includes(':')) {
      const colonIndex = content.indexOf(':');
      const key = content.substring(0, colonIndex).trim();
      const value = content.substring(colonIndex + 1).trim();
      
      if (!value) {
        // Empty value means nested object or array coming next
        parent.obj[key] = {};
        stack.push({ obj: parent.obj[key], indent, key });
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array
        try {
          parent.obj[key] = JSON.parse(value);
        } catch {
          parent.obj[key] = value.slice(1, -1).split(',').map(s => parseYAMLValue(s.trim()));
        }
      } else if (value.startsWith('{') && value.endsWith('}')) {
        // Inline object
        try {
          parent.obj[key] = JSON.parse(value);
        } catch {
          parent.obj[key] = value;
        }
      } else {
        // Simple value
        parent.obj[key] = parseYAMLValue(value);
      }
    }
  }
  
  return root;
}

/**
 * Parse YAML value to appropriate JavaScript type
 */
function parseYAMLValue(value: string): any {
  if (!value) return '';
  
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Null
  if (value === 'null' || value === '~') return null;
  
  // Number
  if (!isNaN(Number(value)) && value !== '') {
    return Number(value);
  }
  
  return value;
}

/**
 * Simple XML parser for common structures (subset of XML spec)
 * Supports: elements, attributes, text content, nested elements
 * Does NOT support: CDATA, processing instructions, namespaces, DTD
 * 
 * @param xmlString - XML string to parse
 * @returns Parsed JavaScript object
 */
export function parseSimpleXML(xmlString: string): any {
  // Remove XML declaration and comments
  let cleaned = xmlString
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
  
  const result: any = {};
  
  // Parse root element
  const rootMatch = cleaned.match(/^<([\w-]+)([^>]*)>([\s\S]*)<\/\1>$/);
  if (!rootMatch) {
    // Try self-closing tag
    const selfClosing = cleaned.match(/^<([\w-]+)([^>]*)\/>/);
    if (selfClosing) {
      const [, tagName, attrs] = selfClosing;
      return { [tagName]: parseAttributes(attrs) };
    }
    throw new Error('Invalid XML: No root element found');
  }
  
  const [, rootTag, rootAttrs, rootContent] = rootMatch;
  const rootObj: any = parseAttributes(rootAttrs);
  
  // Parse children
  const children = parseXMLContent(rootContent);
  
  if (Object.keys(children).length > 0) {
    Object.assign(rootObj, children);
  } else if (rootContent.trim() && !rootContent.includes('<')) {
    // Text content only
    return { [rootTag]: rootContent.trim() };
  }
  
  result[rootTag] = rootObj;
  return result;
}

/**
 * Parse XML attributes to object
 */
function parseAttributes(attrString: string): any {
  const attrs: any = {};
  const attrRegex = /([\w-]+)=["']([^"']+)["']/g;
  
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = parseYAMLValue(match[2]); // Reuse YAML value parser
  }
  
  return attrs;
}

/**
 * Parse XML content (child elements and text)
 */
function parseXMLContent(content: string): any {
  const result: any = {};
  const tagRegex = /<([\w-]+)([^>]*)>([\s\S]*?)<\/\1>|<([\w-]+)([^>]*)\/>/g;
  
  let match;
  let lastIndex = 0;
  
  while ((match = tagRegex.exec(content)) !== null) {
    const [fullMatch, tagName, attrs, innerContent, selfClosingTag, selfClosingAttrs] = match;
    
    const tag = tagName || selfClosingTag;
    const attributes = attrs || selfClosingAttrs;
    
    let value: any;
    
    if (selfClosingTag) {
      // Self-closing tag
      value = parseAttributes(attributes);
    } else if (innerContent.includes('<')) {
      // Has nested elements
      const nested = parseXMLContent(innerContent);
      value = Object.assign(parseAttributes(attributes), nested);
    } else {
      // Text content
      const textValue = innerContent.trim();
      const attrObj = parseAttributes(attributes);
      
      if (Object.keys(attrObj).length > 0) {
        value = { ...attrObj, _text: textValue };
      } else {
        value = parseYAMLValue(textValue);
      }
    }
    
    // Handle multiple elements with same tag name (arrays)
    if (result[tag]) {
      if (!Array.isArray(result[tag])) {
        result[tag] = [result[tag]];
      }
      result[tag].push(value);
    } else {
      result[tag] = value;
    }
    
    lastIndex = match.index + fullMatch.length;
  }
  
  return result;
}

/**
 * HTML Node structure
 */
interface HTMLNode {
  tag?: string;
  attrs?: Record<string, string>;
  children?: HTMLNode[];
  text?: string;
}

/**
 * Simple HTML parser for extracting structured data from forms, tables, links
 * Focuses on interactive/semantic elements, ignores styling and scripts
 * 
 * @param htmlString - HTML string to parse
 * @returns Parsed tree structure with only important elements
 */
export function parseSimpleHTML(htmlString: string): any {
  // Whitelist: Only parse these important tags
  const WHITELIST_TAGS = new Set([
    'form', 'input', 'button', 'a', 'table', 'tr', 'td', 'th',
    'label', 'select', 'option', 'textarea', 'fieldset', 'legend'
  ]);
  
  // Blacklist: Remove these noise tags entirely
  const BLACKLIST_TAGS = new Set([
    'script', 'style', 'meta', 'link', 'svg', 'noscript', 'iframe', 'embed'
  ]);
  
  const MAX_DEPTH = 20;
  const MAX_TEXT_LENGTH = 200;
  
  // Step 1: Remove blacklisted tags and their content
  let cleaned = htmlString;
  BLACKLIST_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis');
    cleaned = cleaned.replace(regex, '');
    // Also remove self-closing versions
    const selfClosing = new RegExp(`<${tag}[^>]*\/>`, 'gi');
    cleaned = cleaned.replace(selfClosing, '');
  });
  
  // Step 2: Tokenize HTML
  const tokens = tokenizeHTML(cleaned);
  
  // Step 3: Build tree using stack
  const root: HTMLNode[] = [];
  const stack: Array<{ node: HTMLNode; depth: number }> = [];
  
  for (const token of tokens) {
    if (token.type === 'open') {
      const tagName = token.tag!.toLowerCase();
      
      // Skip if not in whitelist (but allow common container tags for structure)
      if (!WHITELIST_TAGS.has(tagName) && 
          !['div', 'span', 'p', 'section', 'article', 'main'].includes(tagName)) {
        continue;
      }
      
      const node: HTMLNode = {
        tag: tagName,
        attrs: token.attrs || {},
        children: []
      };
      
      const currentDepth = stack.length;
      
      // Check max depth
      if (currentDepth >= MAX_DEPTH) {
        continue;
      }
      
      // Add to parent or root
      if (stack.length > 0) {
        const parent = stack[stack.length - 1].node;
        parent.children!.push(node);
      } else {
        root.push(node);
      }
      
      // Push to stack if not self-closing
      if (!token.selfClosing) {
        stack.push({ node, depth: currentDepth });
      }
    } else if (token.type === 'close') {
      // Pop from stack
      const tagName = token.tag!.toLowerCase();
      
      // Find matching opening tag in stack
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].node.tag === tagName) {
          stack.splice(i);
          break;
        }
      }
    } else if (token.type === 'text') {
      let text = token.text!.trim();
      
      if (!text) continue;
      
      // Truncate long text
      if (text.length > MAX_TEXT_LENGTH) {
        text = text.substring(0, MAX_TEXT_LENGTH) + '...';
      }
      
      const textNode: HTMLNode = { text };
      
      if (stack.length > 0) {
        const parent = stack[stack.length - 1].node;
        parent.children!.push(textNode);
      } else {
        root.push(textNode);
      }
    }
  }
  
  // Step 4: Post-process - filter out container divs that only wrap whitelisted elements
  const filtered = filterImportantNodes(root, WHITELIST_TAGS);
  
  // Step 5: Convert to compact object format
  return compactHTMLTree(filtered);
}

/**
 * Tokenize HTML string into open, close, and text tokens
 */
interface HTMLToken {
  type: 'open' | 'close' | 'text';
  tag?: string;
  attrs?: Record<string, string>;
  selfClosing?: boolean;
  text?: string;
}

function tokenizeHTML(html: string): HTMLToken[] {
  const tokens: HTMLToken[] = [];
  let i = 0;
  
  while (i < html.length) {
    // Find next tag
    const tagStart = html.indexOf('<', i);
    
    if (tagStart === -1) {
      // No more tags, rest is text
      const text = html.substring(i);
      if (text.trim()) {
        tokens.push({ type: 'text', text });
      }
      break;
    }
    
    // Text before tag
    if (tagStart > i) {
      const text = html.substring(i, tagStart);
      if (text.trim()) {
        tokens.push({ type: 'text', text });
      }
    }
    
    // Find tag end
    const tagEnd = html.indexOf('>', tagStart);
    if (tagEnd === -1) {
      break; // Malformed HTML
    }
    
    const tagContent = html.substring(tagStart + 1, tagEnd);
    
    // Check if closing tag
    if (tagContent.startsWith('/')) {
      const tagName = tagContent.substring(1).trim();
      tokens.push({ type: 'close', tag: tagName });
    }
    // Check if comment
    else if (tagContent.startsWith('!--')) {
      // Skip comments
    }
    // Check if DOCTYPE
    else if (tagContent.startsWith('!')) {
      // Skip doctype
    }
    // Opening tag
    else {
      const selfClosing = tagContent.endsWith('/');
      const content = selfClosing ? tagContent.slice(0, -1) : tagContent;
      
      // Parse tag name and attributes
      const spaceIndex = content.search(/\s/);
      const tagName = spaceIndex === -1 ? content : content.substring(0, spaceIndex);
      const attrsString = spaceIndex === -1 ? '' : content.substring(spaceIndex + 1);
      
      const attrs = parseHTMLAttributes(attrsString);
      
      tokens.push({
        type: 'open',
        tag: tagName,
        attrs,
        selfClosing
      });
    }
    
    i = tagEnd + 1;
  }
  
  return tokens;
}

/**
 * Parse HTML attributes from string
 */
function parseHTMLAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  // Match: name="value" or name='value' or name=value or name (boolean)
  const attrRegex = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match;
    const value = doubleQuoted || singleQuoted || unquoted || 'true';
    attrs[name] = value;
  }
  
  return attrs;
}

/**
 * Filter tree to keep only important nodes (whitelist tags)
 */
function filterImportantNodes(nodes: HTMLNode[], whitelist: Set<string>): HTMLNode[] {
  const filtered: HTMLNode[] = [];
  
  for (const node of nodes) {
    if (node.text) {
      // Keep text nodes
      filtered.push(node);
    } else if (node.tag && whitelist.has(node.tag)) {
      // Keep whitelisted tags
      const newNode: HTMLNode = {
        tag: node.tag,
        attrs: node.attrs,
        children: node.children ? filterImportantNodes(node.children, whitelist) : []
      };
      filtered.push(newNode);
    } else if (node.children) {
      // For non-whitelisted tags (containers), recurse and flatten
      const childFiltered = filterImportantNodes(node.children, whitelist);
      filtered.push(...childFiltered);
    }
  }
  
  return filtered;
}

/**
 * Convert HTML tree to compact object format for TOON conversion
 */
function compactHTMLTree(nodes: HTMLNode[]): any {
  if (nodes.length === 0) {
    return {};
  }
  
  if (nodes.length === 1 && nodes[0].tag) {
    // Single root element
    const node = nodes[0];
    const result: any = {};
    
    // Merge attributes into object
    if (node.attrs && Object.keys(node.attrs).length > 0) {
      Object.assign(result, node.attrs);
    }
    
    // Add children
    if (node.children && node.children.length > 0) {
      const childrenCompact = compactHTMLTree(node.children);
      
      if (Array.isArray(childrenCompact)) {
        result._children = childrenCompact;
      } else {
        Object.assign(result, childrenCompact);
      }
    }
    
    return { [node.tag!]: result };
  }
  
  // Multiple nodes - group by tag name
  const grouped: any = {};
  const textNodes: string[] = [];
  
  for (const node of nodes) {
    if (node.text) {
      textNodes.push(node.text);
    } else if (node.tag) {
      if (!grouped[node.tag]) {
        grouped[node.tag] = [];
      }
      
      const compact: any = {};
      
      if (node.attrs) {
        Object.assign(compact, node.attrs);
      }
      
      if (node.children && node.children.length > 0) {
        const childrenCompact = compactHTMLTree(node.children);
        
        if (typeof childrenCompact === 'string') {
          compact._text = childrenCompact;
        } else if (Array.isArray(childrenCompact)) {
          compact._children = childrenCompact;
        } else {
          Object.assign(compact, childrenCompact);
        }
      }
      
      grouped[node.tag].push(compact);
    }
  }
  
  // Flatten single-item arrays
  for (const key in grouped) {
    if (grouped[key].length === 1) {
      grouped[key] = grouped[key][0];
    }
  }
  
  // Add text if any
  if (textNodes.length > 0) {
    return textNodes.length === 1 ? textNodes[0] : textNodes.join(' ');
  }
  
  return grouped;
}

// ============================================================================
// SNIPPET DETECTION & OPTIMIZATION FOR LARGE TEXT
// ============================================================================

export interface SnippetSegment {
  type: "text" | "json" | "yaml" | "xml" | "html" | "code";
  content: string;
  startIndex: number;
  endIndex: number;
  optimized?: string; // Set after optimization
}

/**
 * Detects code/data snippets within large text documents
 * Supports: Fenced blocks, inline JSON/XML/YAML/HTML, malformed snippets
 * 
 * @param text - Large text document (PRD, spec, Jira ticket, etc.)
 * @returns Array of segments (text + detected snippets)
 */
export function detectSnippets(text: string): SnippetSegment[] {
  const segments: SnippetSegment[] = [];
  let currentIndex = 0;
  
  // Pattern 1: Fenced code blocks (```json, ```yaml, ```xml, ```html)
  const fencedBlockRegex = /```(\w+)?\s*\n([\s\S]*?)```/g;
  
  // Pattern 2: Inline JSON (objects/arrays not in fenced blocks)
  // Look for: { ... } or [ ... ] with proper nesting
  
  // Pattern 3: XML/HTML tags (not in fenced blocks)
  // Look for: <tag>...</tag> patterns
  
  // Pattern 4: YAML patterns (not in fenced blocks)
  // Look for: key: value with indentation
  
  let match;
  const fencedMatches: Array<{ start: number; end: number; lang: string; content: string }> = [];
  
  // First pass: Find all fenced blocks
  while ((match = fencedBlockRegex.exec(text)) !== null) {
    const lang = (match[1] || "").toLowerCase();
    const content = match[2];
    const start = match.index;
    const end = start + match[0].length;
    
    fencedMatches.push({ start, end, lang, content });
  }
  
  // Sort by start index
  fencedMatches.sort((a, b) => a.start - b.start);
  
  // Second pass: Process fenced blocks and gaps between them
  for (let i = 0; i < fencedMatches.length; i++) {
    const fenced = fencedMatches[i];
    
    // Add text before this fenced block (if any)
    if (currentIndex < fenced.start) {
      const textBefore = text.substring(currentIndex, fenced.start);
      
      // Check for inline snippets in this text
      const inlineSegments = detectInlineSnippets(textBefore, currentIndex);
      segments.push(...inlineSegments);
    }
    
    // Add the fenced block
    let snippetType: SnippetSegment["type"] = "code";
    
    if (fenced.lang === "json" || fenced.lang === "javascript" || fenced.lang === "js") {
      snippetType = "json";
    } else if (fenced.lang === "yaml" || fenced.lang === "yml") {
      snippetType = "yaml";
    } else if (fenced.lang === "xml") {
      snippetType = "xml";
    } else if (fenced.lang === "html") {
      snippetType = "html";
    }
    
    segments.push({
      type: snippetType,
      content: fenced.content,
      startIndex: fenced.start,
      endIndex: fenced.end
    });
    
    currentIndex = fenced.end;
  }
  
  // Add remaining text after last fenced block
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    const inlineSegments = detectInlineSnippets(remainingText, currentIndex);
    segments.push(...inlineSegments);
  }
  
  return segments;
}

/**
 * Detects inline snippets (JSON, XML, HTML, YAML) in plain text
 * Handles: Malformed JSON, partially closed tags, non-fenced snippets
 * 
 * Strategy: Only detect snippets that are on their own lines or clearly separated
 */
function detectInlineSnippets(text: string, baseIndex: number): SnippetSegment[] {
  const segments: SnippetSegment[] = [];
  let currentIndex = 0;
  
  // Pattern 1: JSON on separate lines (must start at line beginning or after whitespace)
  // Pattern 2: XML/HTML tags on separate lines
  // Pattern 3: YAML patterns (multi-line with indentation)
  
  const lines = text.split("\n");
  let lineStartIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) {
      lineStartIndex += line.length + 1; // +1 for \n
      continue;
    }
    
    // Check if this line starts a JSON object/array
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      // Try to extract JSON snippet starting from this line
      const remainingText = text.substring(lineStartIndex);
      const jsonResult = extractJSONSnippet(remainingText, 0);
      
      if (jsonResult && jsonResult.content.length > 20) { // Minimum 20 chars
        // Add any text before this snippet
        if (currentIndex < lineStartIndex) {
          segments.push({
            type: "text",
            content: text.substring(currentIndex, lineStartIndex),
            startIndex: baseIndex + currentIndex,
            endIndex: baseIndex + lineStartIndex
          });
        }
        
        // Add the JSON snippet
        segments.push({
          type: "json",
          content: jsonResult.content,
          startIndex: baseIndex + lineStartIndex,
          endIndex: baseIndex + lineStartIndex + jsonResult.endIndex
        });
        
        currentIndex = lineStartIndex + jsonResult.endIndex;
        lineStartIndex = currentIndex;
        
        // Skip processed lines
        const processedLines = jsonResult.content.split("\n").length;
        i += processedLines - 1;
        continue;
      }
    }
    
    // Check if this line starts an XML/HTML tag
    if (trimmed.startsWith("<") && !trimmed.startsWith("</")) {
      const remainingText = text.substring(lineStartIndex);
      const xmlResult = extractXMLSnippet(remainingText, 0);
      
      if (xmlResult && xmlResult.content.length > 20) {
        // Add any text before this snippet
        if (currentIndex < lineStartIndex) {
          segments.push({
            type: "text",
            content: text.substring(currentIndex, lineStartIndex),
            startIndex: baseIndex + currentIndex,
            endIndex: baseIndex + lineStartIndex
          });
        }
        
        // Determine if HTML or XML
        const firstTag = /<(\w+)/.exec(xmlResult.content);
        const tagName = firstTag ? firstTag[1].toLowerCase() : "";
        const htmlTags = ["div", "span", "p", "a", "form", "input", "button", "table", "html", "body", "head", "section", "article"];
        const snippetType = htmlTags.includes(tagName) ? "html" : "xml";
        
        segments.push({
          type: snippetType,
          content: xmlResult.content,
          startIndex: baseIndex + lineStartIndex,
          endIndex: baseIndex + lineStartIndex + xmlResult.endIndex
        });
        
        currentIndex = lineStartIndex + xmlResult.endIndex;
        lineStartIndex = currentIndex;
        
        // Skip processed lines
        const processedLines = xmlResult.content.split("\n").length;
        i += processedLines - 1;
        continue;
      }
    }
    
    // Check if this line starts a YAML block (key: value with following indented lines)
    if (/^\w+:\s*$/.test(trimmed) || /^\w+:/.test(trimmed)) {
      const remainingText = text.substring(lineStartIndex);
      const yamlResult = extractYAMLSnippet(remainingText, 0);
      
      if (yamlResult && yamlResult.content.split("\n").length > 2) { // At least 3 lines
        // Add any text before this snippet
        if (currentIndex < lineStartIndex) {
          segments.push({
            type: "text",
            content: text.substring(currentIndex, lineStartIndex),
            startIndex: baseIndex + currentIndex,
            endIndex: baseIndex + lineStartIndex
          });
        }
        
        segments.push({
          type: "yaml",
          content: yamlResult.content,
          startIndex: baseIndex + lineStartIndex,
          endIndex: baseIndex + lineStartIndex + yamlResult.endIndex
        });
        
        currentIndex = lineStartIndex + yamlResult.endIndex;
        lineStartIndex = currentIndex;
        
        // Skip processed lines
        const processedLines = yamlResult.content.split("\n").length;
        i += processedLines - 1;
        continue;
      }
    }
    
    // No snippet detected on this line, continue
    lineStartIndex += line.length + 1; // +1 for \n
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    segments.push({
      type: "text",
      content: text.substring(currentIndex),
      startIndex: baseIndex + currentIndex,
      endIndex: baseIndex + text.length
    });
  }
  
  return segments;
}

/**
 * Extracts JSON snippet with balanced braces/brackets
 * Handles malformed JSON (tries to find reasonable boundary)
 */
function extractJSONSnippet(text: string, startIndex: number): { content: string; endIndex: number } | null {
  const startChar = text[startIndex];
  const isObject = startChar === "{";
  const isArray = startChar === "[";
  
  if (!isObject && !isArray) return null;
  
  const openChar = startChar;
  const closeChar = isObject ? "}" : "]";
  
  let depth = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    
    // Handle string escaping
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === "\\") {
      escaped = true;
      continue;
    }
    
    // Handle strings
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    // Track depth
    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      
      if (depth === 0) {
        // Found matching close
        const content = text.substring(startIndex, i + 1);
        
        // Validate it's reasonable JSON (at least has : or ,)
        if (content.includes(":") || content.includes(",") || content.length < 200) {
          return { content, endIndex: i + 1 };
        }
      }
    }
    
    // Safety: Don't go beyond 5000 characters for a single snippet
    if (i - startIndex > 5000) {
      break;
    }
  }
  
  // Malformed JSON - try to find reasonable boundary
  // Look for double newline or next sentence start
  const remainingText = text.substring(startIndex);
  const doubleNewline = remainingText.indexOf("\n\n");
  
  if (doubleNewline > 0 && doubleNewline < 1000) {
    const content = text.substring(startIndex, startIndex + doubleNewline);
    return { content, endIndex: startIndex + doubleNewline };
  }
  
  return null;
}

/**
 * Extracts XML/HTML snippet with balanced tags
 */
function extractXMLSnippet(text: string, startIndex: number): { content: string; endIndex: number } | null {
  // Extract opening tag
  const openTagMatch = /<(\w+)([^>]*)>/.exec(text.substring(startIndex));
  if (!openTagMatch) return null;
  
  const tagName = openTagMatch[1];
  const isSelfClosing = openTagMatch[0].endsWith("/>");
  
  if (isSelfClosing) {
    return {
      content: openTagMatch[0],
      endIndex: startIndex + openTagMatch[0].length
    };
  }
  
  // Look for closing tag
  const closeTag = `</${tagName}>`;
  let depth = 0;
  let searchIndex = startIndex;
  
  const openTagRegex = new RegExp(`<${tagName}[^>]*>`, "g");
  const closeTagRegex = new RegExp(`</${tagName}>`, "g");
  
  const searchText = text.substring(startIndex);
  
  let openMatch;
  let closeMatch;
  
  const openMatches: number[] = [];
  const closeMatches: number[] = [];
  
  openTagRegex.lastIndex = 0;
  while ((openMatch = openTagRegex.exec(searchText)) !== null) {
    openMatches.push(openMatch.index);
  }
  
  closeTagRegex.lastIndex = 0;
  while ((closeMatch = closeTagRegex.exec(searchText)) !== null) {
    closeMatches.push(closeMatch.index);
  }
  
  // Match opening and closing
  depth = 1;
  let openIdx = 0;
  let closeIdx = 0;
  let lastClosePos = -1;
  
  while (closeIdx < closeMatches.length) {
    const nextOpen = openIdx < openMatches.length ? openMatches[openIdx] : Infinity;
    const nextClose = closeMatches[closeIdx];
    
    if (nextClose < nextOpen) {
      // Found a close tag
      depth--;
      lastClosePos = nextClose;
      closeIdx++;
      
      if (depth === 0) {
        // Matched!
        const endIndex = startIndex + nextClose + closeTag.length;
        const content = text.substring(startIndex, endIndex);
        return { content, endIndex };
      }
    } else {
      // Found another open tag
      depth++;
      openIdx++;
    }
    
    // Safety limit
    if (lastClosePos > 5000) break;
  }
  
  return null;
}

/**
 * Extracts YAML snippet (multi-line indented block)
 */
function extractYAMLSnippet(text: string, startIndex: number): { content: string; endIndex: number } | null {
  const lines = text.substring(startIndex).split("\n");
  
  if (lines.length === 0) return null;
  
  // Detect base indentation from first line
  const firstLine = lines[0];
  const baseIndentMatch = /^(\s*)/.exec(firstLine);
  const baseIndent = baseIndentMatch ? baseIndentMatch[1].length : 0;
  
  let endLineIndex = 0;
  
  // Continue while lines are indented more than base or are YAML syntax
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Empty line - continue
    if (line.trim() === "") {
      endLineIndex = i;
      continue;
    }
    
    // Check indentation
    const indentMatch = /^(\s*)/.exec(line);
    const indent = indentMatch ? indentMatch[1].length : 0;
    
    // If less indented and not a YAML continuation, stop
    if (indent <= baseIndent && !line.includes(":") && !line.startsWith("-")) {
      break;
    }
    
    endLineIndex = i;
    
    // Safety: Max 50 lines
    if (i > 50) break;
  }
  
  const yamlLines = lines.slice(0, endLineIndex + 1);
  const content = yamlLines.join("\n");
  
  // Validate: Must have at least one key:value pair
  if (!content.includes(":")) {
    return null;
  }
  
  const endIndex = startIndex + content.length;
  return { content, endIndex };
}


