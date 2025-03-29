import { useAIProvider } from '../hooks/useAIProvider';
// ... rest of the imports

export function SEOAnalyzer() {
  const aiService = useAIProvider();
  // ... rest of the component code, but replace direct AI calls with aiService
  
  const handleAnalyze = async () => {
    try {
      const result = await aiService.analyzeSEO(
        title,
        description,
        tags.split(',').map(tag => tag.trim()).filter(Boolean)
      );
      setAnalysis(result);
      toast.success('Analysis completed successfully');
    } catch (error) {
      // Error handling remains the same
    }
  };
  
  // ... rest of the component
}