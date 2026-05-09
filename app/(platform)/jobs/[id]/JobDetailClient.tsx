'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { editJob, closeJob } from '@/app/actions/jobs';
import { applyToJob } from '@/app/actions/applications';
import { SkillTagSelector } from '@/components/profile/SkillTagSelector';
import ApplicationList from '@/components/jobs/ApplicationList';
import { RatingForm } from '@/components/ui/rating-form';
import type { JobWithTags, Tag } from '@/lib/types';

interface JobDetailClientProps {
  job: JobWithTags;
  isOwner: boolean;
  isAuthenticated: boolean;
  currentUserId?: string;
  applications?: any[];
}

export default function JobDetailClient({
  job,
  isOwner,
  isAuthenticated,
  currentUserId,
  applications = [],
}: JobDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Hardcoded fallback tags for presentation (same as Create Job form)
  const fallbackTags = [
    { id: 1, name: 'Web Dev', category: 'Tech' },
    { id: 2, name: 'Design', category: 'Creative' },
    { id: 3, name: 'Marketing', category: 'Business' }
  ];
  
  const [availableTags, setAvailableTags] = useState<Tag[]>(job.tags.length > 0 ? job.tags : fallbackTags);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(job.tags.map(tag => tag.id));
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [applicantsToRate, setApplicantsToRate] = useState<any[]>([]);
  const [currentRatingIndex, setCurrentRatingIndex] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: job.title,
    description: job.description,
    location: job.location,
    budget: job.budget_ghs.toString(),
  });

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const tags = await response.json();
        // Only update if we get valid tags from API
        if (tags && tags.length > 0) {
          setAvailableTags(tags);
        }
      } else {
        console.error('Failed to fetch tags, keeping current tags');
      }
    } catch (error) {
      console.error('Error fetching tags, keeping current tags:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less';
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }

    if (!formData.budget.trim()) {
      errors.budget = 'Budget is required';
    } else {
      const budgetNum = parseFloat(formData.budget);
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const formDataObj = new FormData();
    formDataObj.append('title', formData.title);
    formDataObj.append('description', formData.description);
    formDataObj.append('location', formData.location);
    formDataObj.append('budget', formData.budget);
    
    // Add selected tags to form data
    selectedTagIds.forEach(tagId => {
      formDataObj.append('tags', tagId.toString());
    });

    try {
      const result = await editJob(job.id, formDataObj);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Job updated successfully!');
        setIsEditing(false);
        // Refresh the page to show updated data
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Job edit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseJob = async () => {
    if (!confirm('Are you sure you want to close this job? This will allow you to rate the seekers who applied.')) {
      return;
    }

    setIsClosing(true);
    setError(null);

    try {
      // First, close the job
      const result = await closeJob(job.id);

      if (result.error) {
        setError(result.error);
        setIsClosing(false);
        return;
      }

      // Get applicants for this job to rate them
      if (applications && applications.length > 0) {
        setApplicantsToRate(applications);
        setCurrentRatingIndex(0);
        setShowRatingModal(true);
      } else {
        setSuccess('Job closed successfully! No applicants to rate.');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Job close error:', err);
    } finally {
      setIsClosing(false);
    }
  };

  const handleRatingSuccess = () => {
    if (currentRatingIndex < applicantsToRate.length - 1) {
      // Move to next applicant
      setCurrentRatingIndex(currentRatingIndex + 1);
    } else {
      // All applicants rated
      setShowRatingModal(false);
      setApplicantsToRate([]);
      setCurrentRatingIndex(0);
      setSuccess('Job closed and all applicants rated successfully!');
      router.refresh();
    }
  };

  const handleRatingCancel = () => {
    setShowRatingModal(false);
    setApplicantsToRate([]);
    setCurrentRatingIndex(0);
    setSuccess('Job closed successfully!');
    router.refresh();
  };

  const handleApply = async () => {
    setIsApplying(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await applyToJob(job.id);

      if (result.error) {
        if (result.error === 'subscription_required') {
          setError('You need an active subscription to apply for jobs. Please subscribe first.');
        } else if (result.error === 'already_applied') {
          setError('You have already applied to this job.');
        } else {
          setError(result.error);
        }
      } else {
        setSuccess('Application submitted successfully!');
        // Refresh the page to show updated state
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Apply error:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  if (isEditing) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="mb-6">
          <button
            onClick={() => setIsEditing(false)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Job View
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Edit Job</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleEditSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
                formErrors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
            />
            <div className="flex justify-between mt-1">
              {formErrors.title && (
                <p className="text-sm text-red-600">{formErrors.title}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">Max 100 characters</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              maxLength={1000}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
                formErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
            />
            <div className="flex justify-between mt-1">
              {formErrors.description && (
                <p className="text-sm text-red-600">{formErrors.description}</p>
              )}
              <p className="text-sm text-gray-500 ml-auto">Max 1000 characters</p>
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
                formErrors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              style={{ color: 'white !important', backgroundColor: '#0F172A' }}
            />
            {formErrors.location && (
              <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
              Budget (GHS) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">₵</span>
              </div>
              <input
                type="number"
                id="budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&:-webkit-autofill]:text-white ${
                  formErrors.budget ? 'border-red-300' : 'border-gray-300'
                }`}
                style={{ color: 'white !important', backgroundColor: '#0F172A' }}
              />
            </div>
            {formErrors.budget && (
              <p className="mt-1 text-sm text-red-600">{formErrors.budget}</p>
            )}
          </div>

          {/* Skill Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Skills *
            </label>
            <SkillTagSelector
              selectedTagIds={selectedTagIds}
              onTagChange={setSelectedTagIds}
              availableTags={availableTags}
            />
            {formErrors.tags && (
              <p className="mt-2 text-sm text-red-600">{formErrors.tags}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
            >
              {isSubmitting ? 'Updating...' : 'Update Job'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-600">
            Posted by {job.poster?.display_name || 'User'} • {timeSince(job.created_at)}
          </p>
        </div>

        {isOwner && job.status === 'open' && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Edit Job
            </button>
            <button
              onClick={handleCloseJob}
              disabled={isClosing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isClosing ? 'Closing...' : 'Close Job'}
            </button>
          </div>
        )}

        {job.status === 'closed' && (
          <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
            <span className="font-medium">Job Closed</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Job Details Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{job.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
              <p className="text-gray-900">{job.location}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Budget</h3>
              <p className="text-2xl font-bold text-gray-900">₵{job.budget_ghs.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Ghanaian Cedis (GHS)</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  job.status === 'open' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-gray-900 font-medium capitalize">{job.status}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Posted</h3>
              <p className="text-gray-900">{formatDate(job.created_at)}</p>
              <p className="text-sm text-gray-500 mt-1">({timeSince(job.created_at)})</p>
            </div>

            {job.updated_at !== job.created_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Last Updated</h3>
                <p className="text-gray-900">{formatDate(job.updated_at)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Poster Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About the Poster</h2>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{job.poster?.display_name || 'User'}</h3>
            <p className="text-gray-600 text-sm">{job.poster?.role || 'Member'}</p>
            {job.poster?.location && (
              <p className="text-gray-600 text-sm mt-1">📍 {job.poster.location}</p>
            )}
            {job.poster?.avg_rating !== null && job.poster?.avg_rating !== undefined ? (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-yellow-500">★</span>
                <span className="text-gray-900 font-medium">{job.poster.avg_rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">
                  ({job.poster?.rating_count || 0} rating{job.poster?.rating_count !== 1 ? 's' : ''})
                </span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mt-2">No ratings yet</p>
            )}
          </div>
          <a
            href={`/profile/${job.poster?.id || '#'}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            View Profile
          </a>
        </div>
      </div>

      {/* Applications List (for job owner) */}
      {isOwner && job.status === 'open' && (
        <div className="mb-6">
          <ApplicationList 
            applications={applications} 
            isOwner={isOwner}
            jobId={job.id}
          />
        </div>
      )}

      {/* Application Section */}
      {isAuthenticated && !isOwner && job.status === 'open' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Apply for this Job</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApplying ? 'Applying...' : 'Apply Now'}
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="mt-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back to Feed
        </button>
      </div>

      {/* Rating Modal */}
      {showRatingModal && applicantsToRate.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="relative">
            <button
              onClick={handleRatingCancel}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              aria-label="Close rating modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <RatingForm
              jobId={job.id}
              rateeId={applicantsToRate[currentRatingIndex]?.seeker?.id || ''}
              rateeName={applicantsToRate[currentRatingIndex]?.seeker?.display_name || 'Applicant'}
              onSuccess={handleRatingSuccess}
              onCancel={handleRatingCancel}
            />
            {applicantsToRate.length > 1 && (
              <div className="mt-4 text-center text-gray-600 text-sm">
                Rating {currentRatingIndex + 1} of {applicantsToRate.length} applicants
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}