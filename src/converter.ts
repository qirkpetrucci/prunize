import { escapeValue, isPlainObject, getArrayKeys } from "./utils.js";

interface ConversionContext {
  seen: WeakSet<object>;
  throwOnCircular: boolean;
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
    return "";
  }

  if (typeof value !== "object") {
    return escapeValue(value);
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
      return "[]";
    }

    // Check if all items are objects with similar structure
    const allObjects = value.every(item => isPlainObject(item));

    if (allObjects && value.length > 0) {
      return convertArrayOfObjects(value, context, indent);
    } else {
      // Simple array of primitives
      return `[${value.map(v => escapeValue(v)).join(",")}]`;
    }
  }

  // Handle plain objects
  if (isPlainObject(value)) {
    return convertObject(value, context, indent);
  }

  // Fallback for other types (Date, RegExp, etc.)
  return escapeValue(value);
}

/**
 * Converts an array of objects to TOON format
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
  const indentStr = "  ".repeat(indent);
  
  // Build header: [count]{key1,key2,key3}:
  const header = `[${array.length}]{${buildKeySchema(keys, array)}}:`;
  
  // Build rows
  const rows: string[] = [];
  for (const item of array) {
    const values = keys.map(key => {
      const val = item[key];
      
      // Handle nested objects inline
      if (isPlainObject(val)) {
        // Check for circular reference in nested object
        if (context.seen.has(val)) {
          if (context.throwOnCircular) {
            throw new Error("Circular reference detected");
          }
          return "[Circular]";
        }
        context.seen.add(val);
        
        const nestedKeys = Object.keys(val);
        return nestedKeys.map(k => {
          const nestedVal = val[k];
          // Check nested values too
          if (typeof nestedVal === "object" && nestedVal !== null) {
            if (context.seen.has(nestedVal)) {
              if (context.throwOnCircular) {
                throw new Error("Circular reference detected");
              }
              return "[Circular]";
            }
            context.seen.add(nestedVal);
          }
          return escapeValue(nestedVal);
        }).join(",");
      }
      
      // Handle nested arrays
      if (Array.isArray(val)) {
        if (val.every(v => !isPlainObject(v) && !Array.isArray(v))) {
          return `[${val.map(v => escapeValue(v)).join(",")}]`;
        }
        // Complex nested arrays - convert recursively
        return convertToTOON(val, context, 0).replace(/\n/g, " ");
      }
      
      return escapeValue(val);
    });
    
    rows.push(`${indentStr}  ${values.join(",")}`);
  }
  
  return `${header}\n${rows.join("\n")}`;
}

/**
 * Builds key schema showing nested structure
 * 
 * @param keys - Array of keys
 * @param array - Source array to detect nested structures
 * @returns Schema string like "id,name,address{street,city}"
 */
function buildKeySchema(keys: string[], array: any[]): string {
  return keys.map(key => {
    // Check if this key contains nested objects
    const sampleValue = array.find(item => item[key] !== undefined)?.[key];
    
    if (isPlainObject(sampleValue)) {
      const nestedKeys = Object.keys(sampleValue);
      return `${key}{${nestedKeys.join(",")}}`;
    }
    
    return key;
  }).join(",");
}

/**
 * Converts a plain object to TOON format
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
    // Handle arrays specially
    if (Array.isArray(value)) {
      const arrayTOON = convertToTOON(value, context, indent + 1);
      lines.push(`${indentStr}${key}${arrayTOON}`);
    }
    // Handle nested objects
    else if (isPlainObject(value)) {
      // Check for circular reference
      if (context.seen.has(value)) {
        if (context.throwOnCircular) {
          throw new Error("Circular reference detected");
        }
        lines.push(`${indentStr}${key}:[Circular]`);
        continue;
      }
      context.seen.add(value);
      
      const nestedKeys = Object.keys(value);
      const nestedValues = nestedKeys.map(k => {
        const nestedVal = value[k];
        // Check nested values for circular refs
        if (typeof nestedVal === "object" && nestedVal !== null && context.seen.has(nestedVal)) {
          if (context.throwOnCircular) {
            throw new Error("Circular reference detected");
          }
          return "[Circular]";
        }
        return escapeValue(nestedVal);
      });
      lines.push(`${indentStr}${key}{${nestedKeys.join(",")}}:`);
      lines.push(`${indentStr}  ${nestedValues.join(",")}`);
    }
    // Handle primitives
    else {
      lines.push(`${indentStr}${key}:${escapeValue(value)}`);
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
