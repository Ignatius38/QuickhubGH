'use server';

import { createClientWithAsyncCookies } from '@/lib/supabase';
import { hasActiveSubscription } from '@/lib/subscription';

export async function applyToJob(jobId: string) {
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

    // Check for duplicate application
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('seeker_id', user.id)
      .single();

    if (existingApp) {
      return { error: 'already_applied' };
    }

    // Insert application
    const { data: appData, error: appError } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        seeker_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (appError || !appData) {
      return { error: 'Failed to submit application' };
    }

    // Get job poster ID for notification
    const { data: jobData } = await supabase
      .from('jobs')
      .select('poster_id')
      .eq('id', jobId)
      .single();

    if (jobData) {
      // Create notification for poster
      await supabase.from('notifications').insert({
        user_id: jobData.poster_id,
        type: 'new_application',
        payload: {
          job_id: jobId,
          applicant_id: user.id,
          application_id: appData.id,
        },
      });
    }

    return { applicationId: appData.id };
  } catch (error) {
    console.error('Apply to job error:', error);
    return { error: 'Internal server error' };
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'pending' | 'viewed' | 'engaged'
) {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership (user is the job poster)
    const { data: app } = await supabase
      .from('applications')
      .select('job_id')
      .eq('id', applicationId)
      .single();

    if (!app) {
      return { error: 'Application not found' };
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('poster_id')
      .eq('id', app.job_id)
      .single();

    if (!job || job.poster_id !== user.id) {
      return { error: 'Unauthorized' };
    }

    // Update status
    const { error: updateError } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId);

    if (updateError) {
      return { error: 'Failed to update application' };
    }

    // Create notification for seeker when application status is updated
    if (status === 'viewed' || status === 'engaged') {
      // Get application details to create notification
      const { data: application } = await supabase
        .from('applications')
        .select('seeker_id, job_id')
        .eq('id', applicationId)
        .single();

      if (application) {
        // Get job title for notification
        const { data: job } = await supabase
          .from('jobs')
          .select('title')
          .eq('id', application.job_id)
          .single();

        if (job) {
          await supabase.from('notifications').insert({
            user_id: application.seeker_id,
            type: 'application_viewed',
            payload: {
              job_id: application.job_id,
              job_title: job.title,
              status: status
            },
          });
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Update application status error:', error);
    return { error: 'Internal server error' };
  }
}
