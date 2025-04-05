export interface SEOAnalysis {
  score: number | null;
  titleAnalysis: {
    score: number | null;
    suggestions: string[];
  };
  descriptionAnalysis: {
    score: number | null;
    suggestions: string[];
  };
  tagsAnalysis: {
    score: number | null;
    suggestions: string[];
  };
  overallSuggestions: string[];
}

export const DEFAULT_SEO_ANALYSIS: SEOAnalysis = {
  score: null,
  titleAnalysis: {
    score: null,
    suggestions: []
  },
  descriptionAnalysis: {
    score: null,
    suggestions: []
  },
  tagsAnalysis: {
    score: null,
    suggestions: []
  },
  overallSuggestions: []
};

export interface SEOMetrics {
  titleLength: number;
  descriptionLength: number;
  tagCount: number;
  hasKeywords: boolean;
}