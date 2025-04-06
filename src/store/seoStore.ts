import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEOAnalysis } from '../types/seo';

interface SEOStore {
  scores: Record<string, SEOAnalysis>;
  setScore: (videoId: string, analysis: SEOAnalysis) => void;
  getScore: (videoId: string) => SEOAnalysis | null;
}

export const useSEOStore = create<SEOStore>()(
  persist(
    (set, get) => ({
      scores: {},
      setScore: (videoId, analysis) => {
        set((state) => ({
          scores: {
            ...state.scores,
            [videoId]: analysis,
          },
        }));
      },
      getScore: (videoId) => {
        return get().scores[videoId] || null;
      },
    }),
    {
      name: 'youtube-ai-seo-storage',
    }
  )
);
