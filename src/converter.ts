import { isPlainObject, getArrayKeys } from "./utils.js";

interface ConversionContext {
  seen: WeakSet<object>;
  throwOnCircular: boolean;
}

/**
 * Escapes a string value per TOON spec §7.1
 * Only these escapes are valid: \\ \" \n \r \t
 */
function escapeString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Checks if a string value needs quoting per TOON spec §7.2
 */
function needsQuoting(value: string): boolean {
  // Empty string
  if (value === "") return true;
  
  // Leading or trailing whitespace
  if (value !== value.trim()) return true;
  
  // Reserved literals (case-sensitive)
  if (value === "true" || value === "false" || value === "null") return true;
  
  // Numeric-like
  if (/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) return true;
  if (/^0\d+$/.test(value)) return true; // Leading-zero decimals
  
  // Contains special chars
  if (value.includes(":") || value.includes('"') || value.includes("\\")) return true;
  if (value.includes("[") || value.includes("]") || value.includes("{") || value.includes("}")) return true;
  
  // Control characters
  if (value.includes("\n") || value.includes("\r") || value.includes("\t")) return true;
  
  // Starts with hyphen (list marker)
  if (value.startsWith("-")) return true;
  
  // Contains comma (default delimiter)
  if (value.includes(",")) return true;
  
  return false;
}

/**
 * Formats a primitive value per TOON spec
 */
function formatPrimitive(value: any): string {
  // Null → "-" per spec §2
  if (value === null || value === undefined) {
    return "-";
  }
  
  // Boolean → lowercase per spec §2
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  
  // Number → canonical decimal form per spec §2
  if (typeof value === "number") {
    // NaN, Infinity → null → "-"
    if (!isFinite(value)) return "-";
    
    // -0 → 0
    if (Object.is(value, -0)) return "0";
    
    // Canonical decimal form
    return String(value);
  }
  
  // String → quote if needed
  if (typeof value === "string") {
    if (needsQuoting(value)) {
      return `"${escapeString(value)}"`;
    }
    return value;
  }
  
  // Fallback
  return String(value);
}

/**
 * Checks if a key needs quoting per TOON spec §7.3
 */
function needsKeyQuoting(key: string): boolean {
  // Keys matching ^[A-Za-z_][A-Za-z0-9_.]*$ don't need quoting
  return !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(key);
}

/**
 * Formats a key (for object keys and field names)
 */
function formatKey(key: string): string {
  if (needsKeyQuoting(key)) {
    return `"${escapeString(key)}"`;
  }
  return key;
}

/**
 * Converts a value to TOON format with circular reference detection
 * 
 * @param value - The value to convert
 * @param context - Conversion context with circular reference tracking
 * @param indent - Current indentation level
 * @returns TOON formatted string
 */
function convertToTOON(
  value: any,
  context: ConversionContext,
  indent: number = 0
): string {
  const indentStr = "  ".repeat(indent);

  // Handle primitives
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value !== "object") {
    return formatPrimitive(value);
  }

  // Circular reference detection
  if (typeof value === "object" && value !== null) {
    if (context.seen.has(value)) {
      if (context.throwOnCircular) {
        throw new Error("Circular reference detected");
      }
      return "[Circular]";
    }
    context.seen.add(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "|";  // Empty array per spec §9.1
    }

    // Check if all items are objects with same keys (tabular form §9.3)
    const allObjects = value.every(item => isPlainObject(item));

    if (allObjects && value.length > 0) {
      return convertArrayOfObjects(value, context, indent);
    } else {
      // Simple array of primitives (inline form §9.1)
      const items = value.map(v => formatPrimitive(v));
      return `|${items.join(",")}`;
    }
  }

  // Handle plain objects
  if (isPlainObject(value)) {
    return convertObject(value, context, indent);
  }

  // Fallback for other types (Date, RegExp, etc.)
  return formatPrimitive(value);
}

/**
 * Converts an array of objects to TOON tabular format per spec §9.3
 * 
 * @param array - Array of objects
 * @param context - Conversion context
 * @param indent - Current indentation level
 * @returns TOON formatted string
 */
function convertArrayOfObjects(
  array: any[],
  context: ConversionContext,
  indent: number
): string {
  const keys = getArrayKeys(array);
  
  // Check if all values are primitives (tabular requirement §9.3)
  const allPrimitives = array.every(item => 
    keys.every(key => {
      const val = item[key];
      return val === null || val === undefined || 
             typeof val === "string" || typeof val === "number" || typeof val === "boolean";
    })
  );
  
  if (!allPrimitives || keys.length === 0) {
    // Fallback to expanded list form §9.4
    return convertExpandedArray(array, context, indent);
  }
  
  // Tabular form: [N]{field1,field2,...}:
  const fieldNames = keys.map(k => formatKey(k)).join(",");
  const header = `[${array.length}]{${fieldNames}}:`;
  
  // Build rows at depth +1
  const indentStr = "  ".repeat(indent + 1);
  const rows: string[] = [];
  
  for (const item of array) {
    const values = keys.map(key => formatPrimitive(item[key]));
    rows.push(`${indentStr}${values.join(",")}`);
  }
  
  return `${header}\n${rows.join("\n")}`;
}

/**
 * Converts array to expanded list form per spec §9.4
 */
function convertExpandedArray(
  array: any[],
  context: ConversionContext,
  indent: number
): string {
  const header = `[${array.length}]:`;
  const indentStr = "  ".repeat(indent + 1);
  const items: string[] = [];
  
  for (const item of array) {
    if (item === null || item === undefined) {
      items.push(`${indentStr}- -`);
    } else if (typeof item !== "object") {
      items.push(`${indentStr}- ${formatPrimitive(item)}`);
    } else if (Array.isArray(item)) {
      // Nested array
      const nestedToon = convertToTOON(item, context, 0);
      items.push(`${indentStr}- ${nestedToon}`);
    } else if (isPlainObject(item)) {
      // Object as list item per spec §10
      const entries = Object.entries(item);
      if (entries.length === 0) {
        items.push(`${indentStr}-`);
      } else {
        // First field on hyphen line
        const [firstKey, firstVal] = entries[0];
        const formattedKey = formatKey(firstKey);
        
        if (firstVal === null || firstVal === undefined || typeof firstVal !== "object") {
          items.push(`${indentStr}- ${formattedKey}: ${formatPrimitive(firstVal)}`);
        } else {
          items.push(`${indentStr}- ${formattedKey}:`);
          // Nested value at +1
          const nestedToon = convertToTOON(firstVal, context, indent + 2);
          items.push(nestedToon);
        }
        
        // Remaining fields at +1
        for (let i = 1; i < entries.length; i++) {
          const [key, val] = entries[i];
          const formattedKey = formatKey(key);
          const fieldIndent = "  ".repeat(indent + 2);
          
          if (val === null || val === undefined || typeof val !== "object") {
            items.push(`${fieldIndent}${formattedKey}: ${formatPrimitive(val)}`);
          } else {
            items.push(`${fieldIndent}${formattedKey}:`);
            const nestedToon = convertToTOON(val, context, indent + 3);
            items.push(nestedToon);
          }
        }
      }
    }
  }
  
  return `${header}\n${items.join("\n")}`;
}

/**
 * Converts a plain object to TOON format per spec §8
 * 
 * @param obj - Object to convert
 * @param context - Conversion context
 * @param indent - Current indentation level
 * @returns TOON formatted string
 */
function convertObject(
  obj: Record<string, any>,
  context: ConversionContext,
  indent: number
): string {
  const entries = Object.entries(obj);
  const indentStr = "  ".repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of entries) {
    const formattedKey = formatKey(key);
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        // Empty array per spec §9.1
        lines.push(`${indentStr}${formattedKey}|`);
      } else {
        // Check if primitive array (inline)
        const allPrimitives = value.every(v => 
          v === null || v === undefined || typeof v !== "object"
        );
        
        if (allPrimitives) {
          // Inline primitive array: key[N]: v1,v2,...
          const items = value.map(v => formatPrimitive(v)).join(",");
          lines.push(`${indentStr}${formattedKey}[${value.length}]: ${items}`);
        } else {
          // Complex array - use header + items
          const allObjects = value.every(item => isPlainObject(item));
          
          if (allObjects && value.length > 0) {
            // Try tabular form
            const keys = getArrayKeys(value);
            const allPrimitiveValues = value.every(item => 
              keys.every(k => {
                const val = item[k];
                return val === null || val === undefined || typeof val !== "object";
              })
            );
            
            if (allPrimitiveValues) {
              // Tabular: key[N]{f1,f2}:
              const fieldNames = keys.map(k => formatKey(k)).join(",");
              lines.push(`${indentStr}${formattedKey}[${value.length}]{${fieldNames}}:`);
              
              // Rows at +1
              const rowIndent = "  ".repeat(indent + 1);
              for (const item of value) {
                const values = keys.map(k => formatPrimitive(item[k]));
                lines.push(`${rowIndent}${values.join(",")}`);
              }
            } else {
              // Expanded list
              lines.push(`${indentStr}${formattedKey}[${value.length}]:`);
              const listIndent = "  ".repeat(indent + 1);
              
              for (const item of value) {
                if (isPlainObject(item)) {
                  const itemEntries = Object.entries(item);
                  if (itemEntries.length === 0) {
                    lines.push(`${listIndent}-`);
                  } else {
                    const [firstKey, firstVal] = itemEntries[0];
                    const fKey = formatKey(firstKey);
                    
                    if (firstVal === null || firstVal === undefined || typeof firstVal !== "object") {
                      lines.push(`${listIndent}- ${fKey}: ${formatPrimitive(firstVal)}`);
                    } else {
                      lines.push(`${listIndent}- ${fKey}:`);
                      const nested = convertToTOON(firstVal, context, indent + 2);
                      lines.push(nested);
                    }
                    
                    // Remaining fields
                    for (let i = 1; i < itemEntries.length; i++) {
                      const [k, v] = itemEntries[i];
                      const fk = formatKey(k);
                      const fieldIndent = "  ".repeat(indent + 2);
                      
                      if (v === null || v === undefined || typeof v !== "object") {
                        lines.push(`${fieldIndent}${fk}: ${formatPrimitive(v)}`);
                      } else {
                        lines.push(`${fieldIndent}${fk}:`);
                        const nested = convertToTOON(v, context, indent + 3);
                        lines.push(nested);
                      }
                    }
                  }
                } else {
                  lines.push(`${listIndent}- ${formatPrimitive(item)}`);
                }
              }
            }
          } else {
            // Mixed array - expanded list
            lines.push(`${indentStr}${formattedKey}[${value.length}]:`);
            const listIndent = "  ".repeat(indent + 1);
            
            for (const item of value) {
              if (item === null || item === undefined || typeof item !== "object") {
                lines.push(`${listIndent}- ${formatPrimitive(item)}`);
              } else if (Array.isArray(item)) {
                const nested = convertToTOON(item, context, 0);
                lines.push(`${listIndent}- ${nested}`);
              } else if (isPlainObject(item)) {
                // Object item - handle per §10
                const itemEntries = Object.entries(item);
                if (itemEntries.length === 0) {
                  lines.push(`${listIndent}-`);
                } else {
                  const [firstKey, firstVal] = itemEntries[0];
                  const fKey = formatKey(firstKey);
                  
                  if (firstVal === null || firstVal === undefined || typeof firstVal !== "object") {
                    lines.push(`${listIndent}- ${fKey}: ${formatPrimitive(firstVal)}`);
                  } else {
                    lines.push(`${listIndent}- ${fKey}:`);
                    const nested = convertToTOON(firstVal, context, indent + 2);
                    lines.push(nested);
                  }
                  
                  for (let i = 1; i < itemEntries.length; i++) {
                    const [k, v] = itemEntries[i];
                    const fk = formatKey(k);
                    const fieldIndent = "  ".repeat(indent + 2);
                    
                    if (v === null || v === undefined || typeof v !== "object") {
                      lines.push(`${fieldIndent}${fk}: ${formatPrimitive(v)}`);
                    } else {
                      lines.push(`${fieldIndent}${fk}:`);
                      const nested = convertToTOON(v, context, indent + 3);
                      lines.push(nested);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    // Handle nested objects
    else if (isPlainObject(value)) {
      // Circular reference is already checked in convertToTOON main function
      // No need to check again here to avoid false positives
      
      const nestedEntries = Object.entries(value);
      if (nestedEntries.length === 0) {
        // Empty object
        lines.push(`${indentStr}${formattedKey}:`);
      } else {
        // Nested object per spec §8
        lines.push(`${indentStr}${formattedKey}:`);
        const nested = convertToTOON(value, context, indent + 1);
        lines.push(nested);
      }
    }
    // Handle primitives
    else {
      lines.push(`${indentStr}${formattedKey}: ${formatPrimitive(value)}`);
    }
  }

  return lines.join("\n");
}

/**
 * Main converter function from any value to TOON format
 * 
 * @param input - Input value to convert
 * @param throwOnCircular - Whether to throw on circular references (default: false)
 * @returns TOON formatted string
 */
export function convertToToon(input: any, throwOnCircular: boolean = false): string {
  const context: ConversionContext = {
    seen: new WeakSet(),
    throwOnCircular,
  };

  return convertToTOON(input, context, 0);
}
