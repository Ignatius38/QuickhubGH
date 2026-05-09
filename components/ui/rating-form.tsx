'use client';

import { useState } from 'react';
import { submitRating } from '@/app/actions/ratings';

interface RatingFormProps {
  jobId: string;
  rateeId: string;
  rateeName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RatingForm({ jobId, rateeId, rateeName, onSuccess, onCancel }: RatingFormProps) {
  const [score, setScore] = useState<number>(0);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (score < 1 || score > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitRating(jobId, rateeId, score);
      
      if (result.error) {
        setError(result.error);
      } else {
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Rating submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setScore(i)}
          onMouseEnter={() => setHoverScore(i)}
          onMouseLeave={() => setHoverScore(0)}
          className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
          aria-label={`Rate ${i} star${i !== 1 ? 's' : ''}`}
        >
          <svg
            className={`w-10 h-10 ${i <= (hoverScore || score) ? 'text-yellow-500' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    }
    return stars;
  };

  const getRatingText = (score: number) => {
    switch (score) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Rate {rateeName}</h2>
      <p className="text-gray-600 mb-6">
        How would you rate your experience working with {rateeName} on this job?
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-4">
          <div className="flex justify-center space-x-2">
            {renderStars()}
          </div>
          <p className="text-center text-lg font-medium text-gray-900">
            {getRatingText(score || hoverScore)}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || score === 0}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
}