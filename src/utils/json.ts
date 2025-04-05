export function sanitizeJsonString(rawString: string): string {
  try {
    // First try to find a JSON object in the string
    const jsonMatch = rawString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON object found, try to convert the text response to a structured format
      return JSON.stringify({
        score: 0,
        titleAnalysis: {
          score: 0,
          suggestions: rawString.split('\n').filter(line => line.trim().length > 0)
        },
        descriptionAnalysis: {
          score: 0,
          suggestions: []
        }
      });
    }
    return jsonMatch[0];
  } catch (error) {
    console.error('Error sanitizing JSON string:', error);
    throw new Error('Failed to sanitize JSON string');
  }
}

export function tryParseJson<T>(jsonString: string, fallback: T): T {
  try {
    if (typeof jsonString === 'object') {
      return jsonString as T;
    }
    
    // Try direct parse first
    try {
      return JSON.parse(jsonString);
    } catch {
      // If direct parse fails, try sanitizing
      const sanitized = sanitizeJsonString(jsonString);
      return JSON.parse(sanitized);
    }
  } catch (error) {
    console.error('JSON Parse Error:', error);
    return fallback;
  }
}