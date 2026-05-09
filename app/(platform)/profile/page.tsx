import { createClientWithAsyncCookies } from '@/lib/supabase';
import Link from 'next/link';
import { Edit, FileText, MapPin, Mail, Star, Briefcase, Download } from 'lucide-react';
import LogoutButton from '@/components/profile/LogoutButton';
import type { User, PortfolioItem as PortfolioItemType, Tag } from '@/lib/types';

export default async function ProfileOverviewPage() {
  const supabase = await createClientWithAsyncCookies();
  
  try {
    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6 text-white">Unauthorized</h1>
          <p className="text-gray-400">Please sign in to view your profile.</p>
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
          <h1 className="text-2xl font-bold mb-6 text-white">Profile Not Found</h1>
          <p className="text-gray-400">Your profile could not be found.</p>
        </div>
      );
    }

    // Fetch user's tags
    const { data: userTags } = user.role === 'seeker'
      ? await supabase
          .from('user_tags')
          .select('tag_id')
          .eq('user_id', authUser.id)
      : { data: [] };

    const tagIds = userTags?.map(ut => ut.tag_id) || [];
    
    const { data: tags } = tagIds.length > 0
      ? await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds)
      : { data: [] as Tag[] };

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
        {/* Header with Edit button */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-gray-400">View and manage your professional profile</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <Link
              href="/profile/edit"
              className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#1E293B] rounded-lg font-medium hover:bg-[#D97706] transition"
            >
              <Edit size={18} />
              Edit Profile
            </Link>
            <div className="mt-2 md:mt-0">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center md:items-start">
              {user.avatar_url ? (
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-[#F59E0B]">
                  <img 
                    src={user.avatar_url} 
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-[#1E293B] rounded-full flex items-center justify-center mb-4 border-2 border-[#334155]">
                  <span className="text-4xl font-bold text-[#F59E0B]">
                    {user.display_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              
              {/* Role Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                user.role === 'seeker' 
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' 
                  : 'bg-purple-900/30 text-purple-300 border border-purple-700/50'
              }`}>
                {user.role === 'seeker' ? 'Job Seeker' : 'Job Poster'}
              </div>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">{user.display_name}</h2>
              
              {/* Rating */}
              {user.avg_rating !== null && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        className={i < Math.floor(user.avg_rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-600"} 
                      />
                    ))}
                  </div>
                  <span className="text-white font-medium">{user.avg_rating?.toFixed(1)}</span>
                  <span className="text-gray-400">({user.rating_count} ratings)</span>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {user.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <span className="text-gray-300">{user.email}</span>
                  </div>
                )}
                
                {user.location && (
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-gray-400" />
                    <span className="text-gray-300">{user.location}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">About Me</h3>
                  <p className="text-gray-300 whitespace-pre-line">{user.bio}</p>
                </div>
              )}

              {/* Skills/Tags */}
              {tags && tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 bg-[#1E293B] text-blue-300 text-sm rounded-full border border-[#334155]"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume Section */}
              {user.resume_url && (
                <div className="mt-6 pt-6 border-t border-[#334155]">
                  <h3 className="text-lg font-semibold text-white mb-3">Resume</h3>
                  <div className="flex items-center justify-between p-3 bg-[#1E293B] rounded-lg border border-[#334155]">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-gray-400" />
                      <div>
                        <p className="text-white font-medium">Resume.pdf</p>
                        <p className="text-gray-400 text-sm">Click to download</p>
                      </div>
                    </div>
                    <a 
                      href={user.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-[#F59E0B] text-[#1E293B] rounded-lg font-medium hover:bg-[#D97706] transition"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>
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

        {/* Portfolio Section (for seekers only) */}
        {user.role === 'seeker' && portfolioItems && portfolioItems.length > 0 && (
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Portfolio</h2>
              <span className="text-gray-400">{portfolioItems.length} projects</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 hover:border-[#475569] transition"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  
                  {item.description && (
                    <p className="text-gray-300 mb-3 line-clamp-3">{item.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {item.image_url && (
                      <a 
                        href={item.image_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        View Image
                      </a>
                    )}
                    
                    {item.link_url && (
                      <a 
                        href={item.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Visit Project
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Profile Stats</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Briefcase size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Role</p>
                  <p className="text-white font-medium">
                    {user.role === 'seeker' ? 'Job Seeker' : 'Job Poster'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Star size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Average Rating</p>
                  <p className="text-white font-medium">
                    {user.avg_rating ? user.avg_rating.toFixed(1) : 'No ratings yet'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Portfolio Items</p>
                  <p className="text-white font-medium">
                    {user.role === 'seeker' ? portfolioItems?.length || 0 : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading profile overview page:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Error Loading Page</h1>
        <p className="text-gray-400">An error occurred while loading the page.</p>
      </div>
    );
  }
}