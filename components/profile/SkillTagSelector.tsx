'use client';

import { useState, useEffect } from 'react';
import type { Tag } from '@/lib/types';

interface SkillTagSelectorProps {
  selectedTagIds: number[];
  onTagChange: (tagIds: number[]) => void;
  availableTags: Tag[];
}

export function SkillTagSelector({
  selectedTagIds,
  onTagChange,
  availableTags,
}: SkillTagSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedTagIds);

  useEffect(() => {
    setSelectedIds(selectedTagIds);
  }, [selectedTagIds]);

  const handleTagClick = (tagId: number) => {
    const newSelectedIds = selectedIds.includes(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    
    setSelectedIds(newSelectedIds);
    onTagChange(newSelectedIds);
  };

  // Group tags by category for better organization
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
      <div>
        <h3 className="text-sm font-medium text-[#F8FAFC] mb-2">Select Your Skills</h3>
        <p className="text-sm text-[#94A3B8] mb-4">
          Choose at least one skill tag that represents your expertise
        </p>
      </div>

      {Object.entries(tagsByCategory).map(([category, tags]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide">
            {category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagClick(tag.id)}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selectedIds.includes(tag.id)
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-gray-800 text-[#F8FAFC] border-gray-600 hover:bg-gray-700'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selectedIds.length > 0 && (
        <div className="pt-2">
          <p className="text-sm text-[#94A3B8]">
            Selected: {selectedIds.length} skill{selectedIds.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}