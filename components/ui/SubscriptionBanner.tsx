import Link from 'next/link';
import { getSubscriptionStatus } from '@/lib/subscription';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type SubscriptionStatus = 'active' | 'expired' | 'none' | 'trial';

export default async function SubscriptionBanner() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const subscription = await getSubscriptionStatus(supabase, user.id);
  const status: SubscriptionStatus = subscription.status;
  const { endsAt } = subscription;

  if (status === 'active' || status === 'trial') {
    return null;
  }

  const getMessage = () => {
    switch (status) {
      case 'expired':
        return 'Your subscription has expired. Renew now to continue posting and applying for jobs.';
      case 'none':
        return 'Get a subscription to start posting jobs or applying for opportunities.';
      default:
        return 'Get a subscription to unlock all features.';
    }
  };

  const getCtaText = () => {
    switch (status) {
      case 'expired':
        return 'Renew Subscription';
      case 'none':
        return 'Subscribe Now';
      default:
        return 'Subscribe Now';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-700/50 rounded-lg p-4 md:p-6 mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-1">
            {status === 'expired' ? 'Subscription Expired' : 'Unlock Full Access'}
          </h3>
          <p className="text-gray-300 text-sm md:text-base">
            {getMessage()}
          </p>
          {status === 'expired' && endsAt && (
            <p className="text-gray-400 text-sm mt-1">
              Expired on {new Date(endsAt).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <Link
          href="/subscribe"
          className="bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-medium py-2 px-4 md:py-3 md:px-6 rounded-lg transition whitespace-nowrap text-sm md:text-base"
        >
          {getCtaText()}
        </Link>
      </div>
    </div>
  );
}