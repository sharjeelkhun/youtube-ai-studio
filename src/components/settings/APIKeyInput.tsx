import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface APIKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  placeholder?: string;
}

export function APIKeyInput({ value, onChange, onSave, placeholder }: APIKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  
  return (
    <div className="relative">
      <input
        type={showKey ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onSave}
        placeholder={placeholder || 'Enter API key'}
        className="w-full px-4 py-2 pr-24 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      />
      <button
        type="button"
        onClick={() => setShowKey(!showKey)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
      >
        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}