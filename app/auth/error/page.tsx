'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown_error';
  const description = searchParams.get('description') || '';

  const errorMessages: Record<string, string> = {
    access_denied: 'You denied access to your Google account. Please try again.',
    server_error: 'An error occurred during authentication. Please try again.',
    exchange_failed: 'Failed to complete authentication. Please try again.',
    unknown_error: 'An unexpected error occurred. Please try again.',
  };

  const message = errorMessages[reason] || errorMessages.unknown_error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-4">{message}</p>
        {description && (
          <p className="text-sm text-gray-500 mb-6 break-words">{description}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Return to Home
          </Link>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Try Sign In Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
