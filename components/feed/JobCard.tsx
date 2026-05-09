import Link from 'next/link';
import type { JobWithTags } from '@/lib/types';

interface JobCardProps {
  job: JobWithTags;
}

export default function JobCard({ job }: JobCardProps) {
  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
        {/* Header with title and time */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{job.title}</h3>
          <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
            {timeSince(job.created_at)}
          </span>
        </div>

        {/* Poster info */}
        <div className="flex items-center gap-2 mb-3">
          {job.poster?.avatar_url ? (
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={job.poster.avatar_url} 
                alt={job.poster.display_name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-blue-600">
                {job.poster?.display_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <span className="text-sm text-gray-700">{job.poster?.display_name || 'Anonymous User'}</span>
          {job.poster?.avg_rating !== null && job.poster?.avg_rating !== undefined && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-yellow-500 text-sm">★</span>
              <span className="text-xs font-medium text-gray-900">{job.poster.avg_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Location and budget */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-900 font-medium">
            <span>₵</span>
            <span>{job.budget_ghs.toFixed(2)}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {job.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {tag.name}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{job.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Description preview */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {job.description}
        </p>

        {/* Status badge */}
        <div className="flex justify-between items-center">
          <div className={`px-2 py-1 text-xs rounded-full ${
            job.status === 'open'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {job.status === 'open' ? 'Open' : 'Closed'}
          </div>
          <span className="text-blue-600 text-sm font-medium hover:text-blue-800">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}