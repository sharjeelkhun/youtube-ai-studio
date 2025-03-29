export interface SEOAnalysis {
  score: number;
  titleAnalysis: {
    score: number;
    suggestions: string[];
  };
  descriptionAnalysis: {
    score: number;
    suggestions: string[];
  };
  tagsAnalysis: {
    score: number;
    suggestions: string[];
  };
  overallSuggestions: string[];
}

export interface SEOMetrics {
  titleLength: number;
  descriptionLength: number;
  tagCount: number;
  hasKeywords: boolean;
}