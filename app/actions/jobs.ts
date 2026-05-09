'use server';

import { createClientWithAsyncCookies } from '@/lib/supabase';
import { hasActiveSubscription } from '@/lib/subscription';
import { saveTags } from '@/lib/tag-helpers';

export async function createJob(formData: FormData) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Check subscription
    const hasSubscription = await hasActiveSubscription(supabase, user.id);
    if (!hasSubscription) {
      return { error: 'subscription_required' };
    }

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const budget = formData.get('budget') as string;
    const tags = formData.getAll('tags') as string[];

    // Validate required fields
    if (!title || !description || !location || !budget || tags.length === 0) {
      return { error: 'Missing required fields' };
    }

    // Validate field lengths
    if (title.length > 100) {
      return { error: 'Title must be 100 characters or less' };
    }
    if (description.length > 1000) {
      return { error: 'Description must be 1000 characters or less' };
    }

    // Validate budget
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      return { error: 'Budget must be a positive number' };
    }

    // Insert job
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .insert({
        poster_id: user.id,
        title,
        description,
        location,
        budget_ghs: budgetNum,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError || !jobData) {
      return { error: 'Failed to create job' };
    }

    // Insert job tags using the helper function
    try {
      // Validate tag IDs
      const tagIds = tags.map(tagId => parseInt(tagId)).filter(tagId => !isNaN(tagId));
      
      if (tagIds.length === 0) {
        return { error: 'No valid tags provided' };
      }

      // Use the saveTags helper function
      const tagResult = await saveTags(
        supabase,
        jobData.id,
        tagIds,
        'job_tags',
        'job_id'
      );

      if (tagResult.error) {
        return { error: tagResult.error };
      }
    } catch (error) {
      console.error('Job tag insertion error:', error);
      return { error: 'Failed to process job tags' };
    }

    return { jobId: jobData.id };
  } catch (error) {
    console.error('Create job error:', error);
    return { error: 'Internal server error' };
  }
}

export async function editJob(jobId: string, formData: FormData) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: job } = await supabase
      .from('jobs')
      .select('poster_id')
      .eq('id', jobId)
      .single();

    if (!job || job.poster_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const budget = formData.get('budget') as string;
    const tags = formData.getAll('tags') as string[];

    // Validate required fields
    if (!title || !description || !location || !budget) {
      return { error: 'Missing required fields' };
    }

    // Validate field lengths
    if (title.length > 100) {
      return { error: 'Title must be 100 characters or less' };
    }
    if (description.length > 1000) {
      return { error: 'Description must be 1000 characters or less' };
    }

    // Update job
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        title,
        description,
        location,
        budget_ghs: parseFloat(budget),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (updateError) {
      return { error: 'Failed to update job' };
    }

    // Update job tags if provided
    if (tags.length > 0) {
      try {
        // Validate tag IDs
        const tagIds = tags.map(tagId => parseInt(tagId)).filter(tagId => !isNaN(tagId));
        
        if (tagIds.length === 0) {
          return { error: 'No valid tags provided' };
        }

        // Use the saveTags helper function
        const tagResult = await saveTags(
          supabase,
          jobId,
          tagIds,
          'job_tags',
          'job_id'
        );

        if (tagResult.error) {
          return { error: tagResult.error };
        }
      } catch (error) {
        console.error('Job tag update error:', error);
        return { error: 'Failed to process job tags' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Edit job error:', error);
    return { error: 'Internal server error' };
  }
}

export async function closeJob(jobId: string) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: job } = await supabase
      .from('jobs')
      .select('poster_id')
      .eq('id', jobId)
      .single();

    if (!job || job.poster_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    // Close job
    const { error: closeError } = await supabase
      .from('jobs')
      .update({ status: 'closed' })
      .eq('id', jobId);

    if (closeError) {
      return { error: 'Failed to close job' };
    }

    return { success: true };
  } catch (error) {
    console.error('Close job error:', error);
    return { error: 'Internal server error' };
  }
}
