import { createClientWithAsyncCookies } from '@/lib/supabase';
import { ProfileCard } from '@/components/profile/ProfileCard';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import type { User, Tag, PortfolioItem as PortfolioItemType } from '@/lib/types';
import { upsertUserProfile } from '@/app/actions/profile';

interface PublicProfilePageProps {
  params: { id: string };
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const supabase = await createClientWithAsyncCookies();
  
  try {
    let userData: User | null = null;
    let userWasUpserted = false;
    
    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single();

    // If user doesn't exist in public.users but exists in auth.users, upsert the record
    if (userError?.code === 'PGRST116' || !user) {
      console.log(`User ${params.id} not found in public.users, checking auth.users...`);
      
      // Check if user exists in auth.users
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Auth user check result:', { 
        hasAuthUser: !!authUser, 
        authUserId: authUser?.id,
        targetId: params.id 
      });
      
      if (authUser?.id === params.id) {
        console.log('This is the current user, attempting to upsert profile...');
        // This is the current user - upsert their profile
        const result = await upsertUserProfile(params.id, {
          email: authUser.email,
          user_metadata: authUser.user_metadata
        });
        
        console.log('Upsert result:', result);
        
        if (result.error) {
          console.error('Failed to upsert user profile:', result.error);
          console.error('Error details:', result.details);
          
          // Try one more time with a simpler approach - direct insert
          console.log('Attempting direct insert as fallback...');
          try {
            const { createServiceRoleClient } = await import('@/lib/supabase');
            const serviceClient = createServiceRoleClient();
            
            const { extractDisplayName } = await import('@/lib/extract-display-name');
            const displayName = extractDisplayName(
              authUser.user_metadata,
              authUser.email || ''
            );
            
            const { data: directInsertResult, error: directError } = await serviceClient
              .from('users')
              .insert({
                id: params.id,
                display_name: displayName,
                email: authUser.email || '',
                role: 'seeker',
                bio: null,
                location: null,
                avg_rating: null,
                rating_count: 0
              })
              .select()
              .single();
              
            if (directError) {
              console.error('Direct insert also failed:', directError);
              // Fall back to temporary object for backward compatibility
              userData = {
                id: params.id,
                display_name: displayName,
                email: authUser.email || '',
                role: 'seeker', // Default role
                bio: null,
                location: null,
                avg_rating: null,
                rating_count: 0,
                created_at: new Date().toISOString()
              } as User;
            } else {
              console.log('Direct insert succeeded!');
              userData = directInsertResult;
              userWasUpserted = true;
            }
          } catch (fallbackError) {
            console.error('Fallback insert failed:', fallbackError);
            // Final fallback to temporary object
            const { extractDisplayName } = await import('@/lib/extract-display-name');
            const displayName = extractDisplayName(
              authUser.user_metadata,
              authUser.email || ''
            );
            
            userData = {
              id: params.id,
              display_name: displayName,
              email: authUser.email || '',
              role: 'seeker', // Default role
              bio: null,
              location: null,
              avg_rating: null,
              rating_count: 0,
              created_at: new Date().toISOString()
            } as User;
          }
        } else if (result.user) {
          // Successfully upserted, use the database record
          console.log('Upsert successful, using database record');
          userData = result.user;
          userWasUpserted = result.wasCreated || false;
        }
      } else {
        // User doesn't exist at all
        console.log(`User ${params.id} not found in auth.users either`);
        return (
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6 text-[#F8FAFC]">Profile Not Found</h1>
            <p className="text-[#94A3B8]">The requested profile could not be found.</p>
            <p className="text-[#94A3B8] text-sm mt-2">User ID: {params.id}</p>
            <p className="text-[#94A3B8] text-sm">Auth User ID: {authUser?.id || 'Not authenticated'}</p>
          </div>
        );
      }
    } else {
      userData = user;
    }

    // If we still don't have user data, return error
    if (!userData) {
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6 text-[#F8FAFC]">Profile Not Found</h1>
          <p className="text-[#94A3B8]">The requested profile could not be found.</p>
        </div>
      );
    }

    // Fetch user's tags (only if user exists in database or was just upserted)
    let tags: Tag[] = [];
    let portfolioItems: PortfolioItemType[] = [];
    
    if (userError?.code !== 'PGRST116' || userWasUpserted) {
      const { data: userTags } = await supabase
        .from('user_tags')
        .select('tag_id')
        .eq('user_id', params.id);

      const tagIds = userTags?.map(ut => ut.tag_id) || [];
      
      const { data: fetchedTags } = tagIds.length > 0 
        ? await supabase
            .from('tags')
            .select('*')
            .in('id', tagIds)
        : { data: [] as Tag[] };
      
      tags = fetchedTags || [];

      // Fetch user's portfolio items (for seekers)
      if (userData.role === 'seeker') {
        const { data: fetchedPortfolioItems } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('user_id', params.id)
          .order('created_at', { ascending: false });
        
        portfolioItems = fetchedPortfolioItems || [];
      }
    }

    // Check if this is the current user's own profile
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const isOwnProfile = currentUser?.id === params.id;

    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl bg-[#0F172A]">
        {isOwnProfile && <SubscriptionBanner />}
        <ProfileCard
          user={userData}
          tags={tags}
          portfolioItems={portfolioItems}
          isOwnProfile={isOwnProfile}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    return (
      <div className="container mx-auto px-4 py-6 bg-[#0F172A]">
        <h1 className="text-2xl font-bold mb-6 text-[#F8FAFC]">Error Loading Profile</h1>
        <p className="text-[#94A3B8]">An error occurred while loading the profile.</p>
      </div>
    );
  }
}
