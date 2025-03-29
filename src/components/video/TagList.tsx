import React from 'react';
import { X } from 'lucide-react';

interface TagListProps {
  tags: string[];
  onRemove?: (index: number) => void;
  editable?: boolean;
  className?: string;
}

export function TagList({ tags, onRemove, editable = false, className = '' }: TagListProps) {
  if (!tags.length) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => (
        <div
          key={index}
          className={`px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600 flex items-center gap-1
            ${editable ? 'pr-1' : ''}`}
        >
          {tag}
          {editable && onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="p-0.5 hover:bg-gray-200 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}