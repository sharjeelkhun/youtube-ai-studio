export function sanitizeJsonString(rawString: string): string {
  try {
    const jsonStart = rawString.indexOf('{');
    const jsonEnd = rawString.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No valid JSON object found');
    }
    return rawString.slice(jsonStart, jsonEnd + 1);
  } catch (error) {
    console.error('Error sanitizing JSON string:', error);
    throw new Error('Failed to sanitize JSON string');
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