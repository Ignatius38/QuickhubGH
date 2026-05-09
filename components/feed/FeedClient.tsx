'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';
import JobCard from './JobCard';
import TagCloud from './TagCloud';
import type { JobWithTags, Tag } from '@/lib/types';

interface FeedClientProps {
  initialJobs: JobWithTags[];
  availableTags: Tag[];
  userId?: string;
}

export default function FeedClient({ initialJobs, availableTags, userId }: FeedClientProps) {
  // userId is passed from parent but not currently used in this component
  // It's kept for future enhancements like user-specific filtering
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [jobs, setJobs] = useState<JobWithTags[]>(initialJobs);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() => {
    // Initialize from URL search params
    const tagParam = searchParams.get('tags');
    return tagParam 
      ? tagParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id))
      : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // Update URL when tags change
  const handleTagChange = useCallback((newTagIds: number[]) => {
    setSelectedTagIds(newTagIds);
    
    // Update URL with tag filters
    const params = new URLSearchParams(searchParams.toString());
    if (newTagIds.length > 0) {
      params.set('tags', newTagIds.join(','));
    } else {
      params.delete('tags');
    }
    
    // Update URL without page reload
    router.replace(`/feed?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Filter jobs client-side based on selected tags
  const filteredJobs = selectedTagIds.length === 0 
    ? jobs 
    : jobs.filter(job => 
        job.tags.some(tag => selectedTagIds.includes(tag.id))
      );

  // Fetch more jobs (cursor-based pagination)
  const fetchMoreJobs = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    const offset = nextPage * 20;

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
        .range(offset, offset + 19);

      // Apply tag filter server-side if tags are selected
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
          // If no jobs have the selected tags, return empty result
          setHasMore(false);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching more jobs:', error);
        return;
      }

      if (data && data.length > 0) {
        const newJobs = data.map((job) => ({
          ...job,
          poster: job.poster,
          tags: (job.job_tags || []).map((jt: { tag: Tag }) => jt.tag).filter((tag: Tag) => tag !== null)
        })) as JobWithTags[];

        setJobs(prev => [...prev, ...newJobs]);
        setPage(nextPage);
        setHasMore(newJobs.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore, selectedTagIds, supabase]);

  // Subscribe to real-time job inserts
  useEffect(() => {
    if (isSubscribed) return;

    const channel = supabase
      .channel('public:jobs')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'jobs',
          filter: 'status=eq.open'
        },
        async (payload) => {
          // Fetch the complete job data with poster and tags
          const { data: newJobData, error } = await supabase
            .from('jobs')
            .select(`
              *,
              poster:users!poster_id(*),
              job_tags(
                tag:tags(*)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && newJobData) {
            const newJob: JobWithTags = {
              ...newJobData,
              poster: newJobData.poster,
              tags: (newJobData.job_tags || []).map((jt: { tag: Tag }) => jt.tag).filter((tag: Tag) => tag !== null)
            };

            // Prepend new job to the list
            setJobs(prev => [newJob, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isSubscribed]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 100 &&
        !isLoading &&
        hasMore
      ) {
        fetchMoreJobs();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, fetchMoreJobs]);

  // Reset pagination when tags change
  useEffect(() => {
    setJobs(initialJobs);
    setPage(0);
    setHasMore(true);
  }, [selectedTagIds, initialJobs]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main feed */}
      <div className="lg:flex-1">
        {/* Feed header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Feed</h1>
              <p className="text-gray-600">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} available
                {selectedTagIds.length > 0 && ` (filtered by ${selectedTagIds.length} skill${selectedTagIds.length !== 1 ? 's' : ''})`}
              </p>
            </div>
            <a
              href="/jobs/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Post a Job
            </a>
          </div>

          {/* Mobile tag cloud */}
          <div className="lg:hidden mb-6">
            <TagCloud
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onTagChange={handleTagChange}
            />
          </div>
        </div>

        {/* Jobs grid */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">
              {selectedTagIds.length > 0 
                ? 'Try changing your skill filters or check back later.'
                : 'Be the first to post a job!'}
            </p>
            {selectedTagIds.length > 0 && (
              <button
                onClick={() => handleTagChange([])}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading more jobs...</p>
              </div>
            )}

            {/* End of results */}
            {!hasMore && filteredJobs.length > 0 && (
              <div className="text-center py-8 border-t border-gray-200 mt-8">
                <p className="text-gray-600">You have reached the end of the job feed.</p>
                <p className="text-gray-500 text-sm mt-1">Check back later for new opportunities!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop sidebar with tag cloud */}
      <div className="lg:w-80">
        <div className="sticky top-6">
          <div className="hidden lg:block mb-6">
            <TagCloud
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onTagChange={handleTagChange}
            />
          </div>

          {/* Stats card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Feed Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Jobs</span>
                <span className="font-medium">{jobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Filtered Jobs</span>
                <span className="font-medium">{filteredJobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Skills Selected</span>
                <span className="font-medium">{selectedTagIds.length}</span>
              </div>
            </div>
          </div>

          {/* Real-time status */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-sm font-medium text-gray-900">
                {isSubscribed ? 'Live updates active' : 'Connecting...'}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              New jobs appear instantly. You will see a notification when a new job is posted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}