interface AnalysisSection {
  score: number;
  suggestions: string[];
}

export interface SEOAnalysis {
  score: number;
  titleAnalysis: AnalysisSection;
  descriptionAnalysis: AnalysisSection;
  tagsAnalysis: AnalysisSection;
  overallSuggestions: string[];
  timestamp?: number;
}

export const DEFAULT_SEO_ANALYSIS: SEOAnalysis = {
  score: 0,
  titleAnalysis: { score: 0, suggestions: [] },
  descriptionAnalysis: { score: 0, suggestions: [] },
  tagsAnalysis: { score: 0, suggestions: [] },
  overallSuggestions: []
};

export interface SEOMetrics {
  titleLength: number;
  descriptionLength: number;
  tagCount: number;
  hasKeywords: boolean;
}