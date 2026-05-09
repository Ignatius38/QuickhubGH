'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import { getSubscriptionStatus, type SubscriptionStatus as LibSubscriptionStatus } from '@/lib/subscription';

// Subscription tiers with prices in GHS
const SUBSCRIPTION_TIERS = {
  monthly: {
    name: 'Monthly',
    amount: 40, // GHS 40 per month
    amountInPesewas: 4000, // GHS 40 in pesewas (smallest unit)
    description: 'Full access for 30 days',
    features: [
      'Post unlimited job listings',
      'Apply to unlimited jobs',
      'Access to real-time job feed',
      'Profile visibility to all users',
      'Receive job applications'
    ]
  },
  quarterly: {
    name: 'Quarterly',
    amount: 108, // GHS 108 (10% discount: 40 * 3 * 0.9 = 108)
    amountInPesewas: 10800,
    description: '3 months access with 10% discount',
    features: [
      'All Monthly features',
      'Save GHS 12 compared to monthly',
      'Extended access for 90 days',
      'Priority support'
    ]
  },
  annual: {
    name: 'Annual',
    amount: 384, // GHS 384 (20% discount: 40 * 12 * 0.8 = 384)
    amountInPesewas: 38400,
    description: '12 months access with 20% discount',
    features: [
      'All Quarterly features',
      'Save GHS 96 compared to monthly',
      'Extended access for 365 days',
      'Premium badge on profile',
      'Dedicated account manager'
    ]
  }
};

type SubscriptionStatus = LibSubscriptionStatus | 'loading';

export default function SubscribePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');
  const [selectedTier, setSelectedTier] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'momo' | 'card'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for redirect messages
  const redirectReason = searchParams.get('reason');
  const paymentStatus = searchParams.get('status');
  const paymentError = searchParams.get('error');

  useEffect(() => {
    // Check authentication and fetch subscription status
    const checkAuthAndSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      setUserId(user.id);

      // Get subscription status
      const { status } = await getSubscriptionStatus(supabase, user.id);
      setSubscriptionStatus(status);
    };

    checkAuthAndSubscription();
  }, [supabase, router]);

  useEffect(() => {
    // Handle redirect messages
    if (redirectReason === 'post') {
      setErrorMessage('You need an active subscription to post a job. Please subscribe below.');
    }

    if (paymentStatus === 'success') {
      setSuccessMessage('Payment successful! Your subscription is now active.');
      // Clear success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        // Remove query params
        router.replace('/subscribe');
      }, 5000);
      return () => clearTimeout(timer);
    }

    if (paymentError) {
      setErrorMessage(`Payment failed: ${paymentError}. Please try again.`);
      // Clear error message after 5 seconds
      const timer = setTimeout(() => {
        setErrorMessage(null);
        // Remove query params
        router.replace('/subscribe');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [redirectReason, paymentStatus, paymentError, router]);

  const handleSubscribe = async () => {
    if (!userId) {
      setErrorMessage('Please sign in to subscribe.');
      return;
    }

    if (subscriptionStatus === 'active') {
      setErrorMessage('You already have an active subscription.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/subscriptions/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: selectedTier,
          paymentMethod: paymentMethod
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      if (data.status && data.data.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  const getStatusMessage = () => {
    switch (subscriptionStatus) {
      case 'active':
        return (
          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-300">Active Subscription</h3>
                <div className="mt-2 text-sm text-green-200">
                  <p>You currently have an active subscription. You can post jobs and apply to opportunities.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'expired':
        return (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-300">Subscription Expired</h3>
                <div className="mt-2 text-sm text-yellow-200">
                  <p>Your subscription has expired. Renew now to continue posting jobs and applying to opportunities.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'none':
        return (
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-300">No Active Subscription</h3>
                <div className="mt-2 text-sm text-blue-200">
                  <p>You need a subscription to post jobs or apply to opportunities. Choose a plan below to get started.</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'loading':
        return (
          <div className="bg-gray-900/20 border border-gray-700/50 rounded-lg p-4 mb-6">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-700 h-5 w-5"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  const selectedTierData = SUBSCRIPTION_TIERS[selectedTier];

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-white">Subscribe to QuickHubGH</h1>
      <p className="text-gray-400 mb-8">Choose a subscription plan to unlock job posting and application features</p>

      {/* Status Message */}
      {getStatusMessage()}

      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-300">Error</h3>
              <div className="mt-2 text-sm text-red-200">
                <p>{errorMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-300">Success</h3>
              <div className="mt-2 text-sm text-green-200">
                <p>{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => (
          <div
            key={key}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedTier === key
                ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-700/50'
                : 'border-[#334155] bg-[#0F172A] hover:border-[#475569] hover:bg-[#1E293B]'
            }`}
            onClick={() => setSelectedTier(key as any)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                <p className="text-gray-400 text-sm">{tier.description}</p>
              </div>
              {selectedTier === key && (
                <div className="bg-blue-500 text-white rounded-full p-1">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-bold text-white">GHS {tier.amount}</div>
              {key === 'quarterly' && (
                <div className="text-sm text-green-400 mt-1">Save GHS 12 (10% discount)</div>
              )}
              {key === 'annual' && (
                <div className="text-sm text-green-400 mt-1">Save GHS 96 (20% discount)</div>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-300">
                  <svg className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Payment Method Selection */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-white">Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            className={`border rounded-lg p-4 text-center transition-all ${
              paymentMethod === 'all'
                ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-700/50'
                : 'border-[#334155] bg-[#1E293B] hover:border-[#475569] hover:bg-[#0F172A]'
            }`}
            onClick={() => setPaymentMethod('all')}
          >
            <div className="font-medium mb-1 text-white">All Methods</div>
            <div className="text-sm text-gray-400">Card & Mobile Money</div>
          </button>
          
          <button
            type="button"
            className={`border rounded-lg p-4 text-center transition-all ${
              paymentMethod === 'momo'
                ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-700/50'
                : 'border-[#334155] bg-[#1E293B] hover:border-[#475569] hover:bg-[#0F172A]'
            }`}
            onClick={() => setPaymentMethod('momo')}
          >
            <div className="font-medium mb-1 text-white">Mobile Money</div>
            <div className="text-sm text-gray-400">MTN, Vodafone, AirtelTigo</div>
          </button>
          
          <button
            type="button"
            className={`border rounded-lg p-4 text-center transition-all ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-900/20 ring-2 ring-blue-700/50'
                : 'border-[#334155] bg-[#1E293B] hover:border-[#475569] hover:bg-[#0F172A]'
            }`}
            onClick={() => setPaymentMethod('card')}
          >
            <div className="font-medium mb-1 text-white">Card</div>
            <div className="text-sm text-gray-400">Visa, Mastercard</div>
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-[#0F172A] border border-[#334155] rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-white">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Plan</span>
            <span className="font-medium text-white">{selectedTierData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Price</span>
            <span className="font-medium text-white">GHS {selectedTierData.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Payment Method</span>
            <span className="font-medium text-white capitalize">{paymentMethod}</span>
          </div>
          <div className="border-t border-[#334155] pt-3 mt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-white">Total</span>
              <span className="text-2xl font-bold text-white">GHS {selectedTierData.amount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubscribe}
          disabled={isProcessing || subscriptionStatus === 'active'}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
            isProcessing || subscriptionStatus === 'active'
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B]'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-[#1E293B]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </div>
          ) : subscriptionStatus === 'active' ? (
            'Already Subscribed'
          ) : (
            `Subscribe Now - GHS ${selectedTierData.amount}`
          )}
        </button>
      </div>



      {/* Payment Security Notice */}
      <div className="mt-8 text-center text-sm text-gray-400">
        <p>All payments are securely processed by Paystack. Your payment information is encrypted and never stored on our servers.</p>
      </div>
    </div>
  );
}