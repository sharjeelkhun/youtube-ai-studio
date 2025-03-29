export function sanitizeJsonString(jsonString: string): string {
  try {
    // First try to find JSON object boundaries
    const start = jsonString.indexOf('{');
    const end = jsonString.lastIndexOf('}');
    
    if (start === -1 || end === -1) {
      throw new Error('No valid JSON object found');
    }

    // Extract potential JSON object
    let cleaned = jsonString.slice(start, end + 1);

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*|\s*```/g, '');

    // Remove line breaks and normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Ensure property names are properly quoted
    cleaned = cleaned.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

    // Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

    // Fix unescaped quotes in strings
    cleaned = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match) => {
      return match.replace(/(?<!\\)"/g, '\\"');
    });

    return cleaned;
  } catch (error) {
    console.error('Error sanitizing JSON string:', error);
    throw error;
  }
}

export function tryParseJson<T>(jsonString: string, fallback: T): T {
  try {
    // First attempt: direct parse
    return JSON.parse(jsonString);
  } catch (firstError) {
    try {
      // Second attempt: sanitize and parse
      const sanitized = sanitizeJsonString(jsonString);
      return JSON.parse(sanitized);
    } catch (secondError) {
      console.error('JSON Parse Error. Original:', jsonString);
      console.error('Parse Error:', secondError);
      throw secondError;
    }
  }
}