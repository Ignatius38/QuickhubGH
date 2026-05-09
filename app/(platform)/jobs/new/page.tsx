'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createJob } from '@/app/actions/jobs';
import { SkillTagSelector } from '@/components/profile/SkillTagSelector';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import type { Tag } from '@/lib/types';

export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with empty array - will be populated from database
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Fetch available tags directly from Supabase
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true);
        const supabase = createBrowserSupabaseClient();
        
        const { data: tags, error } = await supabase
          .from('tags')
          .select('*')
          .order('category')
          .order('name');

        if (error) {
          console.error('Failed to fetch tags:', error);
          // Use a more comprehensive fallback with actual tag IDs from seed data
          const fallbackTags = [
            { id: 1, name: 'Web Development', category: 'Tech' },
            { id: 2, name: 'Mobile App Development', category: 'Tech' },
            { id: 3, name: 'Graphic Design', category: 'Tech' },
            { id: 4, name: 'Data Analysis', category: 'Tech' },
            { id: 5, name: 'IT Support', category: 'Tech' },
            { id: 6, name: 'Digital Marketing', category: 'Tech' },
            { id: 7, name: 'Video Editing', category: 'Tech' },
            { id: 8, name: 'Photography', category: 'Tech' },
            { id: 9, name: 'Home Cooking', category: 'Cooking' },
            { id: 10, name: 'Catering', category: 'Cooking' }
          ];
          setAvailableTags(fallbackTags);
        } else if (tags && tags.length > 0) {
          setAvailableTags(tags);
        } else {
          console.error('No tags found in database');
          // Use fallback tags
          const fallbackTags = [
            { id: 1, name: 'Web Development', category: 'Tech' },
            { id: 2, name: 'Mobile App Development', category: 'Tech' },
            { id: 3, name: 'Graphic Design', category: 'Tech' }
          ];
          setAvailableTags(fallbackTags);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  const validateForm = (formData: FormData): boolean => {
    const errors: Record<string, string> = {};
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const budget = formData.get('budget') as string;

    if (!title?.trim()) {
      errors.title = 'Title is required';
    } else if (title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    if (!description?.trim()) {
      errors.description = 'Description is required';
    } else if (description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less';
    }

    if (!location?.trim()) {
      errors.location = 'Location is required';
    }

    if (!budget?.trim()) {
      errors.budget = 'Budget is required';
    } else {
      const budgetNum = parseFloat(budget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        errors.budget = 'Budget must be a positive number';
      }
    }

    if (selectedTagIds.length === 0) {
      errors.tags = 'At least one skill tag is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    
    // Add selected tags to form data
    selectedTagIds.forEach(tagId => {
      formData.append('tags', tagId.toString());
    });

    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createJob(formData);

      if (result.error) {
        if (result.error === 'subscription_required') {
          setError('You need an active subscription to post jobs. Please subscribe first.');
        } else {
          setError(result.error);
        }
      } else if (result.jobId) {
        router.push(`/jobs/${result.jobId}`);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Job creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl bg-[#0F172A]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F8FAFC]">Post a New Job</h1>
        <p className="text-[#94A3B8] mt-2">
          Fill out the form below to create a new job listing. All fields are required.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[#F8FAFC] mb-1">
            Job Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            maxLength={100}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
              formErrors.title ? 'border-red-400' : 'border-gray-600'
            }`}
            style={{ color: 'white !important', backgroundColor: '#0F172A' }}
            placeholder="e.g., Need a web developer for e-commerce site"
          />
          <div className="flex justify-between mt-1">
            {formErrors.title && (
              <p className="text-sm text-red-400">{formErrors.title}</p>
            )}
            <p className="text-sm text-[#94A3B8] ml-auto">Max 100 characters</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-[#F8FAFC] mb-1">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={1000}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
              formErrors.description ? 'border-red-400' : 'border-gray-600'
            }`}
            style={{ color: 'white !important', backgroundColor: '#0F172A' }}
            placeholder="Describe the job requirements, deliverables, and any specific skills needed..."
          />
          <div className="flex justify-between mt-1">
            {formErrors.description && (
              <p className="text-sm text-red-400">{formErrors.description}</p>
            )}
            <p className="text-sm text-[#94A3B8] ml-auto">Max 1000 characters</p>
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-[#F8FAFC] mb-1">
            Location *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
              formErrors.location ? 'border-red-400' : 'border-gray-600'
            }`}
            style={{ color: 'white !important', backgroundColor: '#0F172A' }}
            placeholder="e.g., Accra, Ghana or Remote"
          />
          {formErrors.location && (
            <p className="mt-1 text-sm text-red-400">{formErrors.location}</p>
          )}
        </div>

        {/* Budget */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-[#F8FAFC] mb-1">
            Budget (GHS) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-[#94A3B8]">₵</span>
            </div>
            <input
              type="number"
              id="budget"
              name="budget"
              min="0"
              step="0.01"
              className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
                formErrors.budget ? 'border-red-400' : 'border-gray-600'
              }`}
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
              placeholder="0.00"
            />
          </div>
          {formErrors.budget && (
            <p className="mt-1 text-sm text-red-400">{formErrors.budget}</p>
          )}
          <p className="mt-1 text-sm text-[#94A3B8]">
            Enter the amount in Ghanaian Cedis (GHS)
          </p>
        </div>

        {/* Skill Tags */}
        <div>
          <label className="block text-sm font-medium text-[#F8FAFC] mb-1">
            Required Skills *
          </label>
          {availableTags.length > 0 ? (
            <>
              <SkillTagSelector
                selectedTagIds={selectedTagIds}
                onTagChange={setSelectedTagIds}
                availableTags={availableTags}
              />
              {formErrors.tags && (
                <p className="mt-2 text-sm text-red-400">{formErrors.tags}</p>
              )}
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-[#94A3B8]">Loading skills...</p>
            </div>
          )}
          <p className="mt-2 text-sm text-[#94A3B8]">
            Select at least one skill tag that matches the job requirements
          </p>
        </div>

        {/* Form Actions */}
        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-600 rounded-lg text-[#F8FAFC] hover:bg-gray-800 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
          >
            {isSubmitting ? 'Creating Job...' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
}