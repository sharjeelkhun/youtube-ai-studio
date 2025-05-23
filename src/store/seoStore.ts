import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEOAnalysis } from '../types/seo';

interface SEOStore {
  scores: Record<string, SEOAnalysis>;
  setScore: (videoId: string, analysis: SEOAnalysis) => void;
  getScore: (videoId: string) => SEOAnalysis | null;
  clearScores: () => void;
}

export const useSEOStore = create<SEOStore>()(
  persist(
    (set, get) => ({
      scores: {},
      setScore: (videoId, analysis) => {
        // Ensure score is normalized before storing
        const normalizedAnalysis = {
          ...analysis,
          score: Math.round(analysis.score < 1 ? analysis.score * 100 : analysis.score),
          timestamp: Date.now()
        };
        
        set((state) => ({
          scores: {
            ...state.scores,
            [videoId]: normalizedAnalysis
          }
        }));

        // Store in localStorage
        try {
          localStorage.setItem(`seo_score_${videoId}`, JSON.stringify(normalizedAnalysis));
        } catch (error) {
          console.error('Error storing SEO score:', error);
        }
      },
      getScore: (videoId) => {
        // Try to get from state first
        const stateScore = get().scores[videoId];
        if (stateScore) return stateScore;

        // Try to get from localStorage as backup
        try {
          const savedScore = localStorage.getItem(`seo_score_${videoId}`);
          if (savedScore) {
            const parsed = JSON.parse(savedScore);
            // Update state with saved score
            set((state) => ({
              scores: {
                ...state.scores,
                [videoId]: parsed
              }
            }));
            return parsed;
          }
        } catch (error) {
          console.error('Error reading SEO score:', error);
        }
        return null;
      },
      clearScores: () => {
        set({ scores: {} });
        // Clear localStorage scores
        try {
          Object.keys(localStorage)
            .filter(key => key.startsWith('seo_score_'))
            .forEach(key => localStorage.removeItem(key));
        } catch (error) {
          console.error('Error clearing SEO scores:', error);
        }
      }
    }),
    {
      name: 'youtube-ai-seo-storage',
      version: 1,
    }
  )
);
