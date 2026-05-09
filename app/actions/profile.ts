'use server';

import { createClientWithAsyncCookies } from '@/lib/supabase';
import type { ProfileUpdateInput } from '@/lib/types';
import { saveTags, deleteEntityTags } from '@/lib/tag-helpers';

export async function updateProfile(data: ProfileUpdateInput) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Validate bio length
    if (data.bio && data.bio.length > 500) {
      return { error: 'Bio must be 500 characters or less' };
    }

    // First, check if user exists in public.users table
    // If not, create it first (handles the Google OAuth bug case)
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist in public.users - create it
      console.log('User not found in public.users, creating profile...');
      
      // Extract display_name from user metadata
      const displayName = data.display_name || 
        user.user_metadata?.full_name || 
        user.user_metadata?.name || 
        user.user_metadata?.given_name ||
        (user.email ? user.email.split('@')[0] : 'User');

      // Insert user record - use service role client to bypass RLS if needed
      let insertError;
      
      // First try with regular client
      const { error: regularInsertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          display_name: displayName,
          email: user.email || '',
          role: data.role || 'seeker',
          bio: data.bio || null,
          location: data.location || null,
          avg_rating: null,
          rating_count: 0
        });

      insertError = regularInsertError;
      
      // If regular insert fails with RLS error, try with service role client
      if (insertError && insertError.code === '42501') { // RLS violation error code
        console.log('RLS violation detected, trying service role client...');
        try {
          const { createServiceRoleClient } = await import('@/lib/supabase');
          const serviceRoleClient = createServiceRoleClient();
          
          const { error: serviceInsertError } = await serviceRoleClient
            .from('users')
            .insert({
              id: user.id,
              display_name: displayName,
              email: user.email || '',
              role: data.role || 'seeker',
              bio: data.bio || null,
              location: data.location || null,
              avg_rating: null,
              rating_count: 0
            });
            
          insertError = serviceInsertError;
        } catch (serviceClientError) {
          console.error('Failed to create service role client:', serviceClientError);
        }
      }

      if (insertError) {
        console.error('Failed to create user profile:', insertError);
        return { error: 'Failed to create user profile' };
      }
    } else if (userCheckError) {
      // Some other error checking for user
      console.error('Error checking user existence:', userCheckError);
      return { error: 'Failed to check user profile' };
    }

    // Update users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        display_name: data.display_name,
        bio: data.bio || null,
        location: data.location || null,
        role: data.role || 'seeker',
      })
      .eq('id', user.id);

    if (updateError) {
      return { error: 'Failed to update profile' };
    }

    // Update user tags if provided and user is a seeker
    // Posters don't need skill tags
    if (data.tag_ids !== undefined && data.role === 'seeker') {
      try {
        // Use the saveTags helper function
        const tagResult = await saveTags(
          supabase,
          user.id,
          data.tag_ids,
          'user_tags',
          'user_id'
        );

        if (tagResult.error) {
          return { error: tagResult.error };
        }
      } catch (error) {
        console.error('Tag update error:', error);
        return { error: 'Failed to update tags' };
      }
    } else if (data.role === 'poster') {
      // If user is switching to poster role, remove any existing tags
      try {
        const deleteResult = await deleteEntityTags(
          supabase,
          user.id,
          'user_tags',
          'user_id'
        );

        if (deleteResult.error) {
          console.error('Failed to delete tags when switching to poster:', deleteResult.error);
          // Don't fail the entire update if tag deletion fails for poster
          // Just log it and continue
        }
      } catch (error) {
        console.error('Error removing tags for poster:', error);
        // Don't fail the entire update
      }
    }

    return { success: true, redirectTo: '/profile' };
  } catch (error) {
    console.error('Update profile error:', error);
    return { error: 'Internal server error' };
  }
}

export async function addPortfolioItem(data: {
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
}) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Check portfolio item count (20-item cap)
    const { count } = await supabase
      .from('portfolio_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= 20) {
      return { error: 'Portfolio item limit reached (maximum 20 items)' };
    }

    if (!data.title) {
      return { error: 'Title is required' };
    }

    if (data.description && data.description.length > 300) {
      return { error: 'Description must be 300 characters or less' };
    }

    // Insert portfolio item
    const { data: itemData, error: itemError } = await supabase
      .from('portfolio_items')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        image_url: data.image_url || null,
        link_url: data.link_url || null,
      })
      .select()
      .single();

    if (itemError || !itemData) {
      return { error: 'Failed to add portfolio item' };
    }

    return { itemId: itemData.id };
  } catch (error) {
    console.error('Add portfolio item error:', error);
    return { error: 'Internal server error' };
  }
}

export async function deletePortfolioItem(itemId: string) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership before deleting
    const { data: item, error: fetchError } = await supabase
      .from('portfolio_items')
      .select('user_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return { error: 'Portfolio item not found' };
    }

    if (item.user_id !== user.id) {
      return { error: 'Unauthorized to delete this item' };
    }

    // Delete the item
    const { error: deleteError } = await supabase
      .from('portfolio_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      return { error: 'Failed to delete portfolio item' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    return { error: 'Internal server error' };
  }
}

export async function upsertUserProfile(
  userId: string, 
  authUserData: { 
    email?: string; 
    user_metadata?: { 
      full_name?: string; 
      name?: string; 
      given_name?: string 
    } 
  }
) {
  try {
    console.log(`Attempting to upsert user profile for: ${userId}`);
    console.log('Auth user data:', { 
      email: authUserData.email, 
      hasMetadata: !!authUserData.user_metadata 
    });
    
    // Create service role client to bypass RLS
    // Use dynamic import to avoid issues with server actions
    const { createServiceRoleClient } = await import('@/lib/supabase');
    const supabase = createServiceRoleClient();
    
    console.log('Service role client created');
    
    // First, check if user already exists in public.users
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('User fetch result:', { 
      hasExistingUser: !!existingUser, 
      errorCode: fetchError?.code,
      errorMessage: fetchError?.message 
    });

    // If user exists (no error or error is not "no rows found"), return the existing user
    if (existingUser) {
      console.log('User already exists in public.users, returning existing user');
      return { success: true, user: existingUser, wasCreated: false };
    }
    
    // Check if the error is "no rows found" (PGRST116) - this is expected for missing users
    // If it's a different error, we should report it
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for existing user:', fetchError);
      return { error: 'Failed to check user profile', details: fetchError.message };
    }

    console.log('User not found in public.users, creating new profile...');
    
    // Extract display_name using the same logic as handle_new_user() trigger
    // COALESCE with multiple metadata fields, then email prefix as fallback
    // Use the utility function for consistency with PostgreSQL logic
    const { extractDisplayName } = await import('@/lib/extract-display-name');
    const displayName = extractDisplayName(
      authUserData.user_metadata,
      authUserData.email || ''
    );
    
    console.log('Extracted display name:', displayName);

    // Validate required email field
    if (!authUserData.email) {
      console.error('Missing email in auth user data');
      return { error: 'User email is required' };
    }

    // Insert new user record
    console.log('Inserting user with data:', {
      id: userId,
      display_name: displayName,
      email: authUserData.email,
      role: 'seeker'
    });
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        display_name: displayName,
        email: authUserData.email,
        role: 'seeker', // Default role
        bio: null,
        location: null,
        avg_rating: null,
        rating_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to upsert user profile:', insertError);
      console.error('Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return { error: 'Failed to create user profile', details: insertError.message };
    }

    console.log('User profile created successfully:', newUser);
    return { success: true, user: newUser, wasCreated: true };
  } catch (error) {
    console.error('Upsert user profile error:', error);
    return { error: 'Internal server error', details: String(error) };
  }
}

/**
 * Update user avatar URL in database
 */
export async function updateAvatarUrl(userId: string, avatarUrl: string) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update avatar URL:', error);
      return { error: 'Failed to update profile picture' };
    }

    return { success: true };
  } catch (error) {
    console.error('Update avatar URL error:', error);
    return { error: 'Internal server error' };
  }
}

/**
 * Update user resume URL in database
 */
export async function updateResumeUrl(userId: string, resumeUrl: string) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const { error } = await supabase
      .from('users')
      .update({ resume_url: resumeUrl })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update resume URL:', error);
      return { error: 'Failed to update resume' };
    }

    return { success: true };
  } catch (error) {
    console.error('Update resume URL error:', error);
    return { error: 'Internal server error' };
  }
}

/**
 * Delete user resume from storage and database
 */
export async function deleteResume(userId: string, resumeUrl: string) {
  try {
    const supabase = await createClientWithAsyncCookies();

    // Extract file path from URL
    const urlParts = resumeUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `resumes/${fileName}`;

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('quickhub_assets')
      .remove([filePath]);

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError);
      return { error: 'Failed to delete file from storage' };
    }

    // Clear resume_url in database
    const { error: dbError } = await supabase
      .from('users')
      .update({ resume_url: null })
      .eq('id', userId);

    if (dbError) {
      console.error('Failed to clear resume URL:', dbError);
      return { error: 'Failed to update database' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete resume error:', error);
    return { error: 'Internal server error' };
  }
}