import { convertToToon } from "./converter.js";
import { escapeValue, isPlainObject, getArrayKeys } from "./utils.js";

/**
 * Converts input to CSV format
 * Assumes input is an array of uniform objects
 */
export function toCSV(input: any): string {
  if (!Array.isArray(input) || input.length === 0) {
    return "";
  }

  // Get headers from first object
  const firstItem = input[0];
  if (typeof firstItem !== "object" || firstItem === null) {
    return "";
  }

  const headers = Object.keys(firstItem);
  
  // Build CSV header
  const headerRow = headers.join(",");
  
  // Build CSV rows
  const rows = input.map(item => {
    return headers.map(header => {
      const value = item[header];
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return "";
      }
      
      // Convert to string and escape if needed
      const str = String(value);
      
      // Escape values containing commas, quotes, or newlines
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      
      return str;
    }).join(",");
  });
  
  return [headerRow, ...rows].join("\n");
}

/**
 * Converts input to TOON format
 */
export function toTOON(input: any): string {
  return convertToToon(input);
}

/**
 * Converts input to Compact format
 * Uses semicolon-separated key:value pairs
 */
export function toCompact(input: any): string {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return String(input);
  }

  const pairs = Object.entries(input).map(([key, value]) => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return `${key}:`;
    }
    
    // Escape semicolons and colons in values
    let str = String(value);
    if (str.includes(";") || str.includes(":")) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    
    return `${key}:${str}`;
  });

  return pairs.join(";");
}

/**
 * Converts input to Strip format
 * Removes JSON formatting and presents as readable text
 */
export function toStrip(input: any): string {
  // Handle string input directly
  if (typeof input === "string") {
    return input;
  }

  // Handle primitives
  if (typeof input !== "object" || input === null) {
    return String(input);
  }

  // Track circular references
  const seen = new WeakSet<object>();
  const MAX_DEPTH = 50;

  // For objects/arrays, extract meaningful text content
  const extractText = (obj: any, depth: number = 0): string[] => {
    const lines: string[] = [];
    const indent = "  ".repeat(depth);

    // Check for max depth to prevent stack overflow
    if (depth > MAX_DEPTH) {
      return [`${indent}[Max Depth Exceeded]`];
    }

    // Check for circular reference
    if (typeof obj === "object" && obj !== null) {
      if (seen.has(obj)) {
        return [`${indent}[Circular Reference]`];
      }
      seen.add(obj);
    }

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        if (typeof item === "string" && item.length > 20) {
          // Long strings on their own line
          lines.push(`${indent}${item}`);
        } else if (typeof item === "object" && item !== null) {
          lines.push(...extractText(item, depth));
        } else {
          // Short values inline
          lines.push(`${indent}${item}`);
        }
      });
    } else if (typeof obj === "object" && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === "string" && value.length > 50) {
          // Long text content
          lines.push(`${indent}${key}:`);
          lines.push(`${indent}${value}`);
          lines.push(""); // Empty line for readability
        } else if (typeof value === "object" && value !== null) {
          lines.push(`${indent}${key}:`);
          lines.push(...extractText(value, depth + 1));
        } else {
          // Short key-value pairs
          lines.push(`${indent}${key}: ${value}`);
        }
      });
    }

    return lines;
  };

  const textLines = extractText(input);
  return textLines.join("\n");
}

/**
 * Format dispatcher - converts input to specified format
 */
export function formatAs(input: any, format: "csv" | "toon" | "strip"): string {
  switch (format) {
    case "csv":
      return toCSV(input);
    case "toon":
      return toTOON(input);
    case "strip":
      return toStrip(input);
    default:
      return toTOON(input);
  }
}
