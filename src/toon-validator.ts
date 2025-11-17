/**
 * Pre-validation for @toon-format/toon encoding
 * Ensures data is safe and compatible with TOON format
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates data before passing to @toon-format/toon
 * Checks for unsupported types, invalid structures, and potential issues
 */
export function validateForTOON(data: any, path: string = 'root'): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  function checkValue(obj: any, currentPath: string): void {
    // Null and undefined are acceptable
    if (obj === null || obj === undefined) {
      if (obj === undefined) {
        warnings.push(`${currentPath}: undefined value (will be omitted)`);
      }
      return;
    }

    // Check primitive types
    const type = typeof obj;

    // Unsupported types
    if (type === 'function') {
      errors.push(`${currentPath}: Functions are not serializable`);
      return;
    }

    if (type === 'symbol') {
      errors.push(`${currentPath}: Symbols are not serializable`);
      return;
    }

    if (type === 'bigint') {
      errors.push(`${currentPath}: BigInt not supported (convert to string first)`);
      return;
    }

    // Number validation
    if (type === 'number') {
      if (!Number.isFinite(obj)) {
        errors.push(`${currentPath}: Non-finite number (Infinity or NaN) not supported`);
        return;
      }
      
      // Warn about precision issues
      if (Math.abs(obj) > Number.MAX_SAFE_INTEGER) {
        warnings.push(`${currentPath}: Number exceeds MAX_SAFE_INTEGER, precision loss possible`);
      }
      
      // Check for -0
      if (Object.is(obj, -0)) {
        warnings.push(`${currentPath}: -0 will be normalized to 0`);
      }
      
      return;
    }

    // String validation
    if (type === 'string') {
      // Check for control characters
      if (/[\x00-\x1F]/.test(obj)) {
        warnings.push(`${currentPath}: Contains control characters (will be escaped)`);
      }
      
      // Check for leading/trailing whitespace
      if (/^\s|\s$/.test(obj)) {
        warnings.push(`${currentPath}: Has leading/trailing whitespace (will be quoted)`);
      }
      
      // Check for comment-like patterns
      if (obj.startsWith('//') || obj.startsWith('/*')) {
        warnings.push(`${currentPath}: Looks like comment (will be quoted)`);
      }
      
      // Check for reserved characters
      if (/[#|:\[\]{}]/.test(obj)) {
        warnings.push(`${currentPath}: Contains reserved TOON characters (will be quoted)`);
      }
      
      return;
    }

    // Check special object types
    if (obj instanceof Date) {
      warnings.push(`${currentPath}: Date object (will be converted to ISO string)`);
      return;
    }

    if (obj instanceof RegExp) {
      errors.push(`${currentPath}: RegExp not supported (convert to string first)`);
      return;
    }

    if (obj instanceof Map) {
      errors.push(`${currentPath}: Map not supported (convert to plain object first)`);
      return;
    }

    if (obj instanceof Set) {
      errors.push(`${currentPath}: Set not supported (convert to array first)`);
      return;
    }

    if (obj instanceof WeakMap || obj instanceof WeakSet) {
      errors.push(`${currentPath}: WeakMap/WeakSet not supported`);
      return;
    }

    if (obj instanceof Promise) {
      errors.push(`${currentPath}: Promise not supported`);
      return;
    }

    // Check for binary data
    if (ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer) {
      errors.push(`${currentPath}: Binary data not supported (encode to base64 first)`);
      return;
    }

    // Array validation
    if (Array.isArray(obj)) {
      // Check array homogeneity for objects
      if (obj.length > 0 && obj.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
        const firstKeys = Object.keys(obj[0]).sort();
        const allSame = obj.every((item, index) => {
          const keys = Object.keys(item).sort();
          const same = keys.length === firstKeys.length &&
                      keys.every((k, i) => k === firstKeys[i]);
          if (!same) {
            warnings.push(
              `${currentPath}[${index}]: Inconsistent keys (expected: [${firstKeys.join(', ')}], got: [${keys.join(', ')}])`
            );
          }
          return same;
        });
        
        if (!allSame) {
          warnings.push(`${currentPath}: Non-homogeneous array of objects (will use expanded format)`);
        }
      }

      // Recurse into array items
      obj.forEach((item, index) => {
        checkValue(item, `${currentPath}[${index}]`);
      });
      
      return;
    }

    // Object validation
    if (type === 'object') {
      // Check for circular references (basic check)
      // Note: @toon-format/toon has its own circular reference detection
      
      // Validate keys
      for (const key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

        // Empty key check
        if (key === '') {
          errors.push(`${currentPath}: Empty string key not allowed`);
          continue;
        }

        // Key starting with digit
        if (/^\d/.test(key)) {
          errors.push(`${currentPath}.${key}: Keys cannot start with digit`);
          continue;
        }

        // Key with reserved patterns
        if (key.startsWith('//') || key.startsWith('/*')) {
          errors.push(`${currentPath}.${key}: Key looks like comment`);
          continue;
        }

        // Recurse into value
        const value = obj[key];
        checkValue(value, `${currentPath}.${key}`);
      }
      
      return;
    }
  }

  checkValue(data, path);

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Preprocesses data to make it compatible with TOON encoding
 * Auto-fixes common issues when possible
 */
export function preprocessForTOON(data: any): any {
  function process(obj: any): any {
    // Handle null/undefined
    if (obj === null) return null;
    if (obj === undefined) return null;

    // Handle special types
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof RegExp) return obj.toString();
    if (typeof obj === 'bigint') return obj.toString();
    if (typeof obj === 'symbol') return obj.toString();

    // Handle non-finite numbers
    if (typeof obj === 'number' && !Number.isFinite(obj)) {
      return String(obj); // "Infinity", "-Infinity", "NaN"
    }

    // Handle Map/Set
    if (obj instanceof Map) {
      return Object.fromEntries(obj);
    }
    if (obj instanceof Set) {
      return Array.from(obj);
    }

    // Handle binary data
    if (ArrayBuffer.isView(obj)) {
      return btoa(String.fromCharCode(...new Uint8Array(obj.buffer)));
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(process);
    }

    // Handle plain objects
    if (typeof obj === 'object') {
      const result: any = {};
      
      for (let [key, value] of Object.entries(obj)) {
        // Skip functions
        if (typeof value === 'function') continue;

        // Fix invalid keys
        if (key === '') key = '_empty_';
        if (/^\d/.test(key)) key = `_${key}`;
        if (key.startsWith('//') || key.startsWith('/*')) key = `_${key}`;

        result[key] = process(value);
      }
      
      return result;
    }

    return obj;
  }

  return process(data);
}
