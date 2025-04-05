export function sanitizeJsonString(rawString: string): string {
  try {
    // Extract the first valid JSON object from the string
    const jsonMatch = rawString.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON object found');
    }
    return jsonMatch[0]; // Return the matched JSON object
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
      return fallback;
    }
  }
}