import { createClientWithAsyncCookies } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { PortfolioManager } from '@/components/profile/PortfolioManager';
import FileUploadSection from '@/components/profile/FileUploadSection';
import LogoutButton from '@/components/profile/LogoutButton';
import type { User, PortfolioItem as PortfolioItemType } from '@/lib/types';

export default async function EditProfilePage() {
  const supabase = await createClientWithAsyncCookies();
  
  try {
    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Unauthorized</h1>
          <p className="text-gray-600">Please sign in to edit your profile.</p>
        </div>
      );
    }

    // Fetch current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Profile Not Found</h1>
          <p className="text-gray-600">Your profile could not be found.</p>
        </div>
      );
    }

    // Fetch available tags
    const { data: availableTags } = await supabase
      .from('tags')
      .select('*')
      .order('category')
      .order('name');

    // Fetch user's current tags
    const { data: userTags } = await supabase
      .from('user_tags')
      .select('tag_id')
      .eq('user_id', authUser.id);

    const selectedTagIds = userTags?.map(ut => ut.tag_id) || [];

    // Fetch user's portfolio items
    const { data: portfolioItems } = user.role === 'seeker'
      ? await supabase
          .from('portfolio_items')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
      : { data: [] as PortfolioItemType[] };

    // Fetch user's active subscription
    const { data: activeSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .maybeSingle();

    // Calculate trial days remaining (30-day trial from created_at)
    const createdDate = new Date(user.created_at);
    const today = new Date();
    const daysSinceJoined = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysRemaining = Math.max(0, 30 - daysSinceJoined);

    // Determine account status
    const hasPremiumSubscription = !!activeSubscription;
    const accountStatus = hasPremiumSubscription ? 'Premium' : 'Free Trial';
    const statusColor = hasPremiumSubscription ? 'text-green-400' : 'text-yellow-400';
    const statusBg = hasPremiumSubscription ? 'bg-green-900/20' : 'bg-yellow-900/20';
    const statusBorder = hasPremiumSubscription ? 'border-green-700/50' : 'border-yellow-700/50';

    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with Back and Logout buttons */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link
              href="/profile"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-2"
            >
              <ArrowLeft size={18} />
              Back to Profile
            </Link>
            <h1 className="text-3xl font-bold text-white">Edit Your Profile</h1>
            <p className="text-gray-400">Update your professional information</p>
          </div>
          <div className="mt-2">
            <LogoutButton />
          </div>
        </div>

        {/* Account Status Card */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Account Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Card */}
            <div className={`${statusBg} border ${statusBorder} rounded-lg p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${hasPremiumSubscription ? 'bg-green-900/30' : 'bg-yellow-900/30'} rounded-lg flex items-center justify-center`}>
                  {hasPremiumSubscription ? (
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account Status</p>
                  <p className={`text-xl font-bold ${statusColor}`}>{accountStatus}</p>
                </div>
              </div>
              
              {hasPremiumSubscription ? (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    You have an active Premium subscription. Enjoy all features!
                  </p>
                  {activeSubscription && (
                    <div className="text-gray-400 text-xs">
                      <p>Tier: {activeSubscription.tier}</p>
                      <p>Expires: {new Date(activeSubscription.ends_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    You are currently on a 30-day free trial. Upgrade to Premium for full access.
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Expires in:</p>
                      <p className={`text-lg font-bold ${trialDaysRemaining <= 7 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Link
                      href="/subscribe"
                      className="px-4 py-2 bg-[#F59E0B] text-[#1E293B] rounded-lg font-medium hover:bg-[#D97706] transition text-sm"
                    >
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Membership Details */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-5">
              <h3 className="text-lg font-semibold text-white mb-4">Membership Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Member Since</p>
                  <p className="text-white font-medium">
                    {new Date(user.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Days as Member</p>
                  <p className="text-white font-medium">{daysSinceJoined} day{daysSinceJoined !== 1 ? 's' : ''}</p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Account Type</p>
                  <p className="text-white font-medium">
                    {user.role === 'seeker' ? 'Job Seeker Account' : 'Job Poster Account'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <EditProfileForm
            user={user as User}
            availableTags={availableTags || []}
            selectedTagIds={selectedTagIds}
          />
          
          <FileUploadSection
            userId={authUser.id}
            currentAvatarUrl={user.avatar_url}
            currentResumeUrl={user.resume_url}
          />
          
          {user.role === 'seeker' && (
            <PortfolioManager
              userId={authUser.id}
              initialItems={portfolioItems || []}
            />
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading edit profile page:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Error Loading Page</h1>
        <p className="text-gray-600">An error occurred while loading the page.</p>
      </div>
    );
  }
}
