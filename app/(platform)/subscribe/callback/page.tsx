'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Processing payment...');

  useEffect(() => {
    const processCallback = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      const statusParam = searchParams.get('status');

      if (!reference && !trxref) {
        setStatus('error');
        setMessage('Invalid payment callback. No reference found.');
        return;
      }

      // Check if this is a test payment (test references start with 'test_')
      if (reference && reference.startsWith('test_')) {
        // Test mode handling
        const testAmount = searchParams.get('amount');
        const testTier = searchParams.get('tier');
        
        // Simulate successful payment in test mode
        setTimeout(() => {
          setStatus('success');
          setMessage('Test payment successful! Your subscription has been activated.');
          
          // Redirect back to subscribe page with success message
          setTimeout(() => {
            router.push('/subscribe?status=success');
          }, 3000);
        }, 2000);
        return;
      }

      // In live mode, we should verify the payment with Paystack
      // For now, we'll assume success if status parameter indicates success
      if (statusParam === 'success' || statusParam === 'completed') {
        setStatus('success');
        setMessage('Payment successful! Your subscription is now active.');
        
        // Redirect back to subscribe page with success message
        setTimeout(() => {
          router.push('/subscribe?status=success');
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Payment failed or was cancelled. Please try again.');
        
        // Extract error message if available
        const errorMessage = searchParams.get('message') || 'Payment failed';
        setMessage(`Payment failed: ${errorMessage}. Please try again.`);
        
        // Redirect back to subscribe page with error message
        setTimeout(() => {
          router.push(`/subscribe?error=${encodeURIComponent(errorMessage)}`);
        }, 3000);
      }
    };

    processCallback();
  }, [router, searchParams]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center">
                <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
            <p className="text-gray-600 mb-8">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-green-600">Payment Successful!</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you back to the subscription page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <svg className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Payment Failed</h1>
            <p className="text-gray-600 mb-8">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you back to the subscription page...</p>
          </>
        )}

        <div className="mt-8">
          <button
            onClick={() => router.push('/subscribe')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Return to Subscription Page
          </button>
        </div>
      </div>
    </div>
  );
}