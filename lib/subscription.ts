import { SupabaseClient } from '@supabase/supabase-js';

export async function hasActiveSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  console.log(`Checking subscription for user: ${userId}`);
  
  // First check for active paid subscription
  const { data: paidSubscription } = await supabase
    .from('subscriptions')
    .select('id, ends_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString())
    .limit(1)
    .single();

  if (paidSubscription) {
    console.log(`User ${userId} has active paid subscription`);
    return true;
  }

  // Check for 30-day free trial period
  const { data: user } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle();

  // If user doesn't exist in public.users, treat them as a new user with trial
  if (!user) {
    console.log(`User ${userId} not found in public.users - granting default trial`);
    return true;
  }

  if (user?.created_at) {
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // If user was created within the last 30 days, they get free trial
    // userCreatedAt > thirtyDaysAgo means created more recently than 30 days ago
    if (userCreatedAt > thirtyDaysAgo) {
      console.log(`User ${userId} is within 30-day free trial period. Created at: ${userCreatedAt}, 30 days ago: ${thirtyDaysAgo}`);
      return true;
    } else {
      console.log(`User ${userId} is NOT within 30-day free trial period. Created at: ${userCreatedAt}, 30 days ago: ${thirtyDaysAgo}`);
    }
  }

  console.log(`User ${userId} has no active subscription or free trial`);
  return false;
}


export type SubscriptionStatus = 'active' | 'expired' | 'none' | 'trial';

export async function getSubscriptionStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{ status: SubscriptionStatus; endsAt?: string; isTrial?: boolean }> {
  // Check for paid subscription first
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('ends_at, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subscription) {
    const now = new Date().toISOString();
    
    if (subscription.status === 'active' && subscription.ends_at && subscription.ends_at > now) {
      return { status: 'active', endsAt: subscription.ends_at, isTrial: false };
    } else {
      return { status: 'expired', endsAt: subscription.ends_at, isTrial: false };
    }
  }

  // Check for free trial
  const { data: user } = await supabase
    .from('users')
    .select('created_at')
    .eq('id', userId)
    .maybeSingle();

  // If user doesn't exist in public.users, treat them as a new user with trial
  if (!user) {
    // New user - give them trial starting now
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    return { 
      status: 'trial', 
      endsAt: trialEndDate.toISOString(),
      isTrial: true 
    };
  }

  if (user?.created_at) {
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const trialEndDate = new Date(userCreatedAt);
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    if (now <= trialEndDate) {
      return { 
        status: 'trial', 
        endsAt: trialEndDate.toISOString(),
        isTrial: true 
      };
    }
  }

  return { status: 'none' };
}

// Helper to automatically grant free trial on user creation
export async function grantFreeTrial(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (!existingSubscription) {
      // Get user creation date
      const { data: user } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (user?.created_at) {
        const trialEndDate = new Date(user.created_at);
        trialEndDate.setDate(trialEndDate.getDate() + 30);

        // Insert trial subscription record
        await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            tier: 'pro_trial',
            starts_at: new Date().toISOString(),
            ends_at: trialEndDate.toISOString(),
            payment_reference: 'free_trial_30_days',
            status: 'active',
            created_at: new Date().toISOString()
          });
      }
    }
  } catch (error) {
    console.error('Error granting free trial:', error);
    // Don't throw - trial is a fallback, not critical
  }
}