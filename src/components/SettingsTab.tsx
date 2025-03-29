import React, { useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
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
];

export function SettingsTab() {
  const { setKey, getKey } = useAPIKeyStore();
  const [selectedProvider, setSelectedProvider] = useState<string>(aiService.getCurrentProvider() || 'cohere');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    cohere: getKey('cohere') || '',
    openai: getKey('openai') || '',
    huggingface: getKey('huggingface') || '',
  });

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

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const handleKeySave = (provider: string) => {
    const key = apiKeys[provider as keyof typeof apiKeys];
    if (!key) {
      toast.error(`Please enter a valid API key for ${provider}`);
      return;
    }

    setKey(provider, key);
    if (aiService.setProvider(provider as 'cohere' | 'openai' | 'huggingface')) {
      setSelectedProvider(provider);
      toast.success(`${provider} API key saved successfully`);
    } else {
      toast.error(`Failed to set ${provider} as the active AI provider`);
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
            <strong>Important:</strong> A Cohere API key is required for SEO analysis and content optimization features.
            Please configure your API key below to enable all functionality.
          </p>
        </div>

        <div className="space-y-8">
          {aiProviders.map((provider) => (
            <div key={provider.id} className="border-b pb-8 last:border-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{provider.icon}</span>
                    <h3 className="text-lg font-semibold">{provider.name}</h3>
                  </div>
                  <p className="text-gray-600 mt-1">{provider.description}</p>
                  <p className="text-sm text-green-600 font-medium mt-2">{provider.freeTier}</p>
                </div>
                <a
                  href={provider.setupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Get API Key
                </a>
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