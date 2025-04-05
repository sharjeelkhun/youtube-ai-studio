export function parseSEOAnalysis(rawData: string | object): any {
  try {
    // If rawData is already an object, validate and return it
    if (typeof rawData === 'object' && rawData !== null) {
      return validateSEOData(rawData);
    }

    // Handle string input
    if (typeof rawData !== 'string') {
      throw new Error('Invalid input type');
    }

    // Extract JSON object from the raw string
    const jsonStart = rawData.indexOf('{');
    const jsonEnd = rawData.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON object found in the input string');
    }

    const jsonString = rawData.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);
    return validateSEOData(parsed);
  } catch (error) {
    console.error('Error parsing SEO analysis:', error);
    console.debug('Raw data:', rawData);
    return {
      score: 50, // Default score instead of null
      titleAnalysis: { score: 50, suggestions: [] },
      descriptionAnalysis: { score: 50, suggestions: [] },
      tagsAnalysis: { score: 50, suggestions: [] },
      error: 'Failed to parse SEO analysis data'
    };
  }
}

function validateSEOData(data: any): any {
  // Ensure score exists and is a number
  if (typeof data.score !== 'number' && data.score !== null) {
    data.score = 50; // Default score
  }

  // Ensure analysis sections exist
  const sections = ['titleAnalysis', 'descriptionAnalysis', 'tagsAnalysis'];
  for (const section of sections) {
    if (!data[section] || typeof data[section] !== 'object') {
      data[section] = { score: 50, suggestions: [] };
    } else {
      if (typeof data[section].score !== 'number' && data[section].score !== null) {
        data[section].score = 50;
      }
      if (!Array.isArray(data[section].suggestions)) {
        data[section].suggestions = [];
      }
    }
  }

  return data;
}
