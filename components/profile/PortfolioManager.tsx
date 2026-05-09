'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PortfolioItem } from './PortfolioItem';
import { addPortfolioItem, deletePortfolioItem } from '@/app/actions/profile';
import type { PortfolioItem as PortfolioItemType } from '@/lib/types';

interface PortfolioManagerProps {
  userId: string;
  initialItems: PortfolioItemType[];
}

export function PortfolioManager({ userId, initialItems }: PortfolioManagerProps) {
  const [items, setItems] = useState<PortfolioItemType[]>(initialItems);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await addPortfolioItem({
        title,
        description: description || null,
        image_url: imageUrl || null,
        link_url: linkUrl || null,
      });

      if (result.error) {
        setError(result.error);
      } else if (result.itemId) {
        // Reset form
        setTitle('');
        setDescription('');
        setImageUrl('');
        setLinkUrl('');
        setIsAdding(false);
        
        // Refresh items (in a real app, you'd fetch from server)
        // For now, we'll add a placeholder
        const newItem: PortfolioItemType = {
          id: result.itemId,
          user_id: userId,
          title,
          description: description || null,
          image_url: imageUrl || null,
          link_url: linkUrl || null,
          created_at: new Date().toISOString(),
        };
        
        setItems([newItem, ...items]);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Add portfolio item error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const result = await deletePortfolioItem(itemId);
    if (result.error) {
      setError(result.error);
    } else {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Portfolio</h2>
          <p className="text-sm text-[#94A3B8]">
            Showcase your work (max 20 items)
          </p>
        </div>
        
        {items.length < 20 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? 'Cancel' : 'Add Item'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Add Item Form */}
      {isAdding && (
        <form onSubmit={handleAddItem} className="bg-gray-800 p-4 rounded-lg space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[#F8FAFC] mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&:-webkit-autofill]:text-white"
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
              placeholder="Project title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[#F8FAFC] mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&:-webkit-autofill]:text-white"
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
              placeholder="Brief description of the project"
            />
            <p className="text-xs text-[#94A3B8] mt-1">
              {description.length}/300 characters
            </p>
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-[#F8FAFC] mb-1">
              Image URL
            </label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&:-webkit-autofill]:text-white"
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label htmlFor="linkUrl" className="block text-sm font-medium text-[#F8FAFC] mb-1">
              Project Link
            </label>
            <input
              type="url"
              id="linkUrl"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&:-webkit-autofill]:text-white"
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
              placeholder="https://example.com/project"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1"
            >
              {isLoading ? 'Adding...' : 'Add to Portfolio'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdding(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Portfolio Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <PortfolioItem
              key={item.id}
              item={item}
              onDelete={handleDeleteItem}
              isOwner={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
          <p className="text-[#94A3B8]">No portfolio items yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Add your work to showcase your skills
          </p>
        </div>
      )}

      {/* Item Count */}
      <div className="text-sm text-[#94A3B8]">
        {items.length}/20 items used
      </div>
    </div>
  );
}