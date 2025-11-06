import type { QueryResult } from "../interfaces/Query.js";

export function formatQueryResult(
  result: unknown,
  query: string,
  executionTime?: number,
  error?: string
): QueryResult {
  return {
    query,
    result: sanitizeResult(result),
    executionTime,
    error,
  };
}

function sanitizeResult(result: unknown): unknown {
  if (result === null || result === undefined) {
    return null;
  }

  // Handle arrays - check if it's an array of strings (like collection names)
  if (Array.isArray(result)) {
    // If all items are strings, return as-is (no need to sanitize objects)
    if (result.length > 0 && result.every((item) => typeof item === "string")) {
      return result;
    }
    // Otherwise, sanitize each item
    return result.map((item) => {
      if (typeof item === "string") {
        return item; // Keep strings as strings
      }
      // Check if item is a string-like object (converted string)
      if (item && typeof item === "object" && !Array.isArray(item) && isStringLikeObject(item)) {
        return reconstructString(item as Record<string, unknown>);
      }
      return sanitizeObject(item);
    });
  }

  // Handle strings directly
  if (typeof result === "string") {
    return result;
  }

  if (typeof result === "object") {
    return sanitizeObject(result as Record<string, unknown>);
  }

  return result;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip MongoDB internal fields
    if (key.startsWith("_") && key !== "_id") {
      continue;
    }
    
    // Handle strings - keep them as strings, don't convert to objects
    if (typeof value === "string") {
      sanitized[key] = value;
      continue;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      // If array of strings, keep as-is
      if (value.length > 0 && value.every((item) => typeof item === "string")) {
        sanitized[key] = value;
      } else {
        sanitized[key] = value.map((item) =>
          typeof item === "string"
            ? item
            : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
        );
      }
      continue;
    }
    
    // Handle nested objects
    if (value && typeof value === "object") {
      // Check if it's a string-like object (has numeric keys 0, 1, 2, etc.)
      // This can happen if a string was incorrectly converted to an object
      if (isStringLikeObject(value)) {
        sanitized[key] = reconstructString(value as Record<string, unknown>);
        continue;
      }
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Checks if an object appears to be a string that was converted to an object
 * (has numeric string keys like "0", "1", "2", etc.)
 */
function isStringLikeObject(obj: unknown): boolean {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  
  const keys = Object.keys(obj as Record<string, unknown>);
  if (keys.length === 0) {
    return false;
  }
  
  // Check if all keys are numeric strings in sequence
  const sortedKeys = keys.sort((a, b) => parseInt(a) - parseInt(b));
  const allNumeric = sortedKeys.every((key, index) => {
    const num = parseInt(key);
    return !isNaN(num) && num === index && typeof (obj as Record<string, unknown>)[key] === "string";
  });
  
  return allNumeric && sortedKeys.length > 0;
}

/**
 * Reconstructs a string from a string-like object
 */
function reconstructString(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort((a, b) => parseInt(a) - parseInt(b));
  return keys.map((key) => String(obj[key])).join("");
}



