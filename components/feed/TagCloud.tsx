'use client';

import { useState, useEffect } from 'react';
import type { Tag } from '@/lib/types';

interface TagCloudProps {
  availableTags: Tag[];
  selectedTagIds: number[];
  onTagChange: (tagIds: number[]) => void;
}

export default function TagCloud({ 
  availableTags, 
  selectedTagIds, 
  onTagChange 
}: TagCloudProps) {
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedTagIds);

  useEffect(() => {
    setLocalSelectedIds(selectedTagIds);
  }, [selectedTagIds]);

  const handleTagClick = (tagId: number) => {
    const newSelectedIds = localSelectedIds.includes(tagId)
      ? localSelectedIds.filter((id) => id !== tagId)
      : [...localSelectedIds, tagId];
    
    setLocalSelectedIds(newSelectedIds);
    onTagChange(newSelectedIds);
  };

  const clearSelection = () => {
    setLocalSelectedIds([]);
    onTagChange([]);
  };

  // Group tags by category
  const tagsByCategory = availableTags.reduce((acc, tag) => {
    const category = tag.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Filter by Skills</h3>
          <p className="text-sm text-gray-500">Select skills to filter jobs</p>
        </div>
        {localSelectedIds.length > 0 && (
          <button
            onClick={clearSelection}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Selected tags summary */}
      {localSelectedIds.length > 0 && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-2">
            {localSelectedIds.map(tagId => {
              const tag = availableTags.find(t => t.id === tagId);
              return tag ? (
                <span
                  key={tag.id}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full flex items-center gap-1"
                >
                  {tag.name}
                  <button
                    onClick={() => handleTagClick(tag.id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          <p className="text-xs text-blue-600">
            {localSelectedIds.length} skill{localSelectedIds.length !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Tag categories */}
      <div className="space-y-3">
        {Object.entries(tagsByCategory).map(([category, tags]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              {category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagClick(tag.id)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    localSelectedIds.includes(tag.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile scroll indicator */}
      <div className="md:hidden pt-2">
        <p className="text-xs text-gray-500 text-center">
          ← Scroll horizontally to see more tags →
        </p>
      </div>
    </div>
  );
}