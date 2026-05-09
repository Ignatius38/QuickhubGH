'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TestCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const reference = searchParams.get('reference');
    const amount = searchParams.get('amount');
    const tier = searchParams.get('tier');

    // Redirect to callback page with success status
    // This simulates a successful Paystack callback
    setTimeout(() => {
      router.push(`/subscribe/callback?reference=${reference}&status=success&message=Test+payment+successful`);
    }, 2000);
  }, [router, searchParams]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <svg className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">Test Payment Processing</h1>
        <p className="text-gray-600 mb-8">
          Simulating payment processing in test mode...
        </p>
        <div className="animate-pulse">
          <div className="h-2 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded mb-2"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}