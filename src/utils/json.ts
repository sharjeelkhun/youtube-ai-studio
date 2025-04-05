export function sanitizeJsonString(rawString: string): string {
  try {
    // Handle case where input is already an object
    if (typeof rawString === 'object') {
      return JSON.stringify(rawString);
    }

    // Clean up the raw string
    const cleanedString = rawString
      .replace(/[\n\r\t]/g, ' ')  // Replace newlines and tabs
      .replace(/\s+/g, ' ')      // Normalize spaces
      .trim();

    // Find first occurrence of { and last occurrence of }
    const start = cleanedString.indexOf('{');
    const end = cleanedString.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No JSON object found in string');
    }

    // Extract and validate JSON
    const jsonStr = cleanedString.slice(start, end + 1);
    JSON.parse(jsonStr); // Validate JSON structure
    return jsonStr;
  } catch (error) {
    console.error('Error sanitizing JSON:', error);
    console.debug('Raw input:', rawString);
    throw new Error('Failed to sanitize JSON string');
  }
}

export function tryParseJson<T>(jsonString: string, fallback: T): T {
  try {
    // Handle case where input is already parsed
    if (typeof jsonString === 'object') {
      return jsonString as T;
    }

    const sanitized = sanitizeJsonString(jsonString);
    const parsed = JSON.parse(sanitized);

    // Validate expected structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    return parsed as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    console.debug('Failed input:', jsonString);
    return fallback;
  }
}

export function validateSEOAnalysis(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.score === 'number' &&
    typeof data.titleAnalysis === 'object' &&
    typeof data.descriptionAnalysis === 'object' &&
    Array.isArray(data.titleAnalysis.suggestions) &&
    Array.isArray(data.descriptionAnalysis.suggestions)
  );
}