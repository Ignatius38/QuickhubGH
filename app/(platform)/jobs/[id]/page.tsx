import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import JobDetailClient from './JobDetailClient';
import type { JobWithTags, User } from '@/lib/types';

async function getJobData(jobId: string): Promise<JobWithTags | null> {
  const supabase = createClient();

  try {
    // Fetch job with poster info and tags
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        poster:users!poster_id(*),
        job_tags(
          tag:tags(*)
        )
      `)
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error('Error fetching job:', jobError);
      return null;
    }

    // Transform the data
    const job: JobWithTags = {
      ...jobData,
      poster: jobData.poster as User,
      tags: jobData.job_tags.map((jt: any) => jt.tag)
    };

    return job;
  } catch (error) {
    console.error('Unexpected error fetching job:', error);
    return null;
  }
}

async function getApplicationsForJob(jobId: string, currentUserId?: string) {
  const supabase = createClient();
  
  if (!currentUserId) {
    return [];
  }

  try {
    // First check if current user is the job owner
    const { data: job } = await supabase
      .from('jobs')
      .select('poster_id')
      .eq('id', jobId)
      .single();

    if (!job || job.poster_id !== currentUserId) {
      return [];
    }

    // Fetch applications with seeker details and their tags
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        seeker:users!seeker_id(
          *,
          user_tags(
            tag:tags(*)
          ),
          portfolio_items(*)
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return [];
    }

    // Transform the data
    return applications.map((app: any) => ({
      ...app,
      seeker: {
        ...app.seeker,
        user_tags: app.seeker.user_tags.map((ut: any) => ut.tag)
      }
    }));
  } catch (error) {
    console.error('Unexpected error fetching applications:', error);
    return [];
  }
}

async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await getJobData(params.id);
  const currentUser = await getCurrentUser();

  if (!job) {
    notFound();
  }

  const isOwner = currentUser?.id === job.poster_id;
  const isAuthenticated = !!currentUser;
  const applications = isOwner ? await getApplicationsForJob(params.id, currentUser?.id) : [];

  return (
    <JobDetailClient 
      job={job} 
      isOwner={isOwner}
      isAuthenticated={isAuthenticated}
      currentUserId={currentUser?.id}
      applications={applications}
    />
  );
}