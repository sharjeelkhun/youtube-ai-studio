import React, { useState, useEffect } from 'react';
import { Wand2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { APIKeyInput } from './settings/APIKeyInput';
import { aiService } from '../services/ai/service';
import { useAPIKeyStore } from '../store/apiKeyStore';
import toast from 'react-hot-toast';

const aiProviders = [
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Primary provider for SEO analysis and content optimization',
    setupUrl: 'https://dashboard.cohere.ai/api-keys',
    freeTier: 'Free tier: 5M tokens per month',
    icon: '⚡',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Fallback provider for content generation',
    setupUrl: 'https://platform.openai.com/account/api-keys',
    freeTier: 'Free tier: 3M tokens per month',
    icon: '🤖',
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    description: 'Secondary fallback for content generation',
    setupUrl: 'https://huggingface.co/settings/tokens',
    freeTier: 'Free tier available',
    icon: '🤗',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Free alternative for AI-powered content generation',
    setupUrl: 'https://openrouter.ai/signup',
    freeTier: 'Free tier available',
    icon: '🌐',
  },
];

export function SettingsTab() {
  const { setKey, getKey } = useAPIKeyStore();
  const [selectedProvider, setSelectedProvider] = useState<string>('cohere'); // Default to cohere
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    cohere: getKey('cohere') || '',
    openai: getKey('openai') || '',
    huggingface: getKey('huggingface') || '',
    openrouter: getKey('openrouter') || '',
  });
  const [tokenLimits, setTokenLimits] = useState<Record<string, number | null>>({
    cohere: null,
    openai: null,
    huggingface: null,
    openrouter: null,
  });
  const [tokenLimit, setTokenLimit] = useState<number | null>(null);

  useEffect(() => {
    // Initialize with stored provider
    const provider = aiService.getCurrentProvider();
    if (provider) {
      setSelectedProvider(provider);
    }
  }, []);

  useEffect(() => {
    // Show a toast message if no API key is configured
    if (!getKey('cohere')) {
      toast('Please configure your Cohere API key to enable AI features', {
        icon: '⚠️',
        duration: 5000,
        id: 'api-key-required',
      });
    }
  }, [getKey]);

  useEffect(() => {
    async function fetchTokenLimits() {
      const limits: Record<string, number | null> = {};
      for (const provider of ['cohere', 'openai', 'huggingface', 'openrouter'] as const) {
        limits[provider] = await aiService.getTokenUsage(provider);
      }
      setTokenLimits(limits);
    }

    fetchTokenLimits();
  }, []);

  useEffect(() => {
    async function fetchTokenLimit() {
      if (selectedProvider) {
        try {
          const limit = await aiService.getTokenUsage(selectedProvider as 'cohere' | 'openai' | 'huggingface' | 'openrouter');
          setTokenLimit(limit);
        } catch (error) {
          console.error(`Error fetching token usage for ${selectedProvider}:`, error);
          setTokenLimit(null);
        }
      }
    }

    fetchTokenLimit();
  }, [selectedProvider]);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const handleKeySave = (provider: string) => {
    const key = apiKeys[provider];
    if (!key) {
      toast.error(`Please enter a valid API key for ${provider}`);
      return;
    }

    setKey(provider, key);
    if (aiService.setProvider(provider as 'cohere' | 'openai' | 'huggingface' | 'openrouter')) {
      setSelectedProvider(provider);
      toast.success(`${provider} API key saved successfully`);
    } else {
      toast.error(`Failed to set ${provider} as the active AI provider`);
    }
  };

  const handleSelectProvider = (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key) {
      toast.error(`Please enter a valid API key for ${providerId} first`);
      return;
    }

    try {
      if (aiService.setProvider(providerId as 'cohere' | 'openai' | 'huggingface' | 'openrouter')) {
        setSelectedProvider(providerId); // Update the selected provider in the state
        toast.success(`${providerId} set as active AI provider`);
      } else {
        toast.error(`Failed to set ${providerId} as active provider`);
      }
    } catch (error) {
      console.error('Error setting provider:', error);
      toast.error('Failed to switch AI provider');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-8 p-6"
    >
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Wand2 className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-semibold">AI Provider Configuration</h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-yellow-800">
            <strong>Important:</strong> Configure at least one AI provider to enable features.
            Multiple providers help avoid rate limits.
          </p>
        </div>

        {selectedProvider && tokenLimit !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800">
              <strong>Token Limit Remaining:</strong> {tokenLimit} tokens for {selectedProvider}.
            </p>
          </div>
        )}

        {selectedProvider && tokenLimit === null && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">
              Unable to fetch token usage for {selectedProvider}. Please check your API key or provider configuration.
            </p>
          </div>
        )}

        <div className="space-y-8">
          {aiProviders.map((provider) => (
            <div key={provider.id} className="border-b pb-8 last:border-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{provider.icon}</span>
                    <h3 className="text-lg font-semibold">{provider.name}</h3>
                    {selectedProvider === provider.id && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{provider.description}</p>
                  <p className="text-sm text-green-600 font-medium mt-2">{provider.freeTier}</p>
                  {tokenLimits[provider.id] !== null && (
                    <p className="text-sm text-blue-600 font-medium mt-2">
                      Tokens Remaining: {tokenLimits[provider.id]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={provider.setupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Get API Key
                  </a>
                  {apiKeys[provider.id] && selectedProvider !== provider.id && (
                    <button
                      onClick={() => handleSelectProvider(provider.id)}
                      className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                      Make Active
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <APIKeyInput
                  value={apiKeys[provider.id]}
                  onChange={(value) => handleKeyChange(provider.id, value)}
                  onSave={() => handleKeySave(provider.id)}
                  placeholder={`Enter your ${provider.name} API key`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}