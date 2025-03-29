export function parseSEOAnalysis(rawData: string | object) {
  try {
    // If rawData is already an object, return it directly
    if (typeof rawData === 'object') {
      return rawData;
    }

    // Extract JSON object from the raw string
    const jsonStart = rawData.indexOf('{');
    const jsonEnd = rawData.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in the input string.');
    }

    const jsonString = rawData.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing SEO analysis JSON:', error);
    return null; // Return null or a default value on error
  }
}
