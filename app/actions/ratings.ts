'use server';

import { createClientWithAsyncCookies } from '@/lib/supabase';

export async function submitRating(
  jobId: string,
  rateeId: string,
  score: number
) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Validate score
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      return { error: 'Score must be an integer between 1 and 5' };
    }

    // Check for duplicate rating
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('job_id', jobId)
      .eq('rater_id', user.id)
      .eq('ratee_id', rateeId)
      .single();

    if (existingRating) {
      return { error: 'You have already rated this user for this job' };
    }

    // Insert rating - database trigger will handle recalculating avg_rating
    const { data: ratingData, error: ratingError } = await supabase
      .from('ratings')
      .insert({
        job_id: jobId,
        rater_id: user.id,
        ratee_id: rateeId,
        score,
      })
      .select()
      .single();

    if (ratingError || !ratingData) {
      return { error: 'Failed to submit rating' };
    }

    // Create notification for the rated user
    await supabase.from('notifications').insert({
      user_id: rateeId,
      type: 'new_rating',
      payload: {
        job_id: jobId,
        rater_id: user.id,
        score: score,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Submit rating error:', error);
    return { error: 'Internal server error' };
  }
}
