import { createClient } from '@/lib/supabase';
import FeedClient from '@/components/feed/FeedClient';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import type { JobWithTags, Tag } from '@/lib/types';

interface PageProps {
  searchParams?: {
    tags?: string;
  };
}

async function getInitialJobs(selectedTagIds: number[] = []): Promise<JobWithTags[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        poster:users!poster_id(*),
        job_tags(
          tag:tags(*)
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20);

    // Apply tag filter if tags are selected
    if (selectedTagIds.length > 0) {
      // First get job IDs that have the selected tags
      const { data: jobIdsData } = await supabase
        .from('job_tags')
        .select('job_id')
        .in('tag_id', selectedTagIds);
      
      if (jobIdsData && jobIdsData.length > 0) {
        const jobIds = jobIdsData.map(item => item.job_id);
        query = query.in('id', jobIds);
      } else {
        // If no jobs have the selected tags, return empty array
        return [];
      }
    }

    const { data: jobsData, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }

    return (jobsData || []).map((job: any) => ({
      ...job,
      poster: job.poster,
      tags: (job.job_tags || []).map((jt: any) => jt.tag).filter((tag: any) => tag !== null)
    })) as JobWithTags[];
  } catch (error) {
    console.error('Unexpected error fetching jobs:', error);
    return [];
  }
}

async function getAvailableTags(): Promise<Tag[]> {
  const supabase = createClient();

  try {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return tags || [];
  } catch (error) {
    console.error('Unexpected error fetching tags:', error);
    return [];
  }
}

async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function FeedPage({ searchParams }: PageProps) {
  // Parse tag IDs from query parameters
  const tagParam = searchParams?.tags;
  const selectedTagIds: number[] = tagParam 
    ? tagParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
    : [];

  const [initialJobs, availableTags, currentUser] = await Promise.all([
    getInitialJobs(selectedTagIds),
    getAvailableTags(),
    getCurrentUser()
  ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <SubscriptionBanner />
      <FeedClient 
        initialJobs={initialJobs}
        availableTags={availableTags}
        userId={currentUser?.id}
      />
    </div>
  );
}