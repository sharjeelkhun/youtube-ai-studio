export function sanitizeJsonString(rawString: string): string {
  try {
    // Replace common control characters
    const sanitized = rawString
      .replace(/[\n\r\t]/g, ' ') // Replace newlines, carriage returns and tabs with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\\"/g, '"') // Fix escaped quotes
      .trim();

    // Find the first valid JSON object
    const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON object found');
    }

    // Try to parse and re-stringify to ensure valid JSON
    const parsed = JSON.parse(jsonMatch[0]);
    return JSON.stringify(parsed);
  } catch (error) {
    console.error('Error sanitizing JSON string:', error);
    console.error('Raw string:', rawString);
    throw new Error('Failed to sanitize JSON string');
  }
}

export function tryParseJson<T>(jsonString: string, fallback: T): T {
  try {
    if (typeof jsonString === 'object') {
      return jsonString as T;
    }

    // Clean the string before parsing
    const cleaned = typeof jsonString === 'string' 
      ? sanitizeJsonString(jsonString)
      : JSON.stringify(jsonString);

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    console.error('Failed string:', jsonString);
    return fallback;
  }
}