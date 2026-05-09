'use client';

import { useState } from 'react';
import { updateApplicationStatus } from '@/app/actions/applications';
import type { ApplicationWithSeeker, SeekerProfile } from '@/lib/types';

interface ApplicationListProps {
  applications: ApplicationWithSeeker[];
  isOwner: boolean;
  jobId: string;
}

export default function ApplicationList({ applications, isOwner, jobId }: ApplicationListProps) {
  // Handle null/undefined applications
  const safeApplications = applications || [];
  const [localApplications, setLocalApplications] = useState(safeApplications);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStatusUpdate = async (applicationId: string, newStatus: 'pending' | 'viewed' | 'engaged') => {
    if (!isOwner) return;

    setUpdatingId(applicationId);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateApplicationStatus(applicationId, newStatus);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Application status updated successfully!');
        // Update local state
        setLocalApplications(prev =>
          prev.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Update status error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      case 'viewed':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'engaged':
        return 'bg-green-500/20 text-green-300 border border-green-500/30';
      default:
        return 'bg-[#334155] text-[#94A3B8] border border-[#475569]';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  if (localApplications.length === 0) {
    return (
      <div className="bg-[#1E293B] rounded-lg border border-[#334155] p-6">
        <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Applications</h2>
        <p className="text-[#94A3B8]">No applications yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] rounded-lg border border-[#334155] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-[#F8FAFC]">Applications ({localApplications.length})</h2>
        {isOwner && (
          <div className="text-sm text-[#94A3B8]">
            You can update application status
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-300">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {localApplications.map((application) => (
          <div key={application.id} className="border border-[#334155] rounded-lg p-4 bg-[#1E293B]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* Applicant Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-[#F8FAFC]">
                      {application.seeker?.display_name || 'Unknown User'}
                    </h3>
                    <p className="text-[#94A3B8] text-sm">{application.seeker?.role || 'User'}</p>
                    {application.seeker?.location && (
                      <p className="text-[#94A3B8] text-sm mt-1">📍 {application.seeker.location}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                    {isOwner && (
                      <span className="text-xs text-[#94A3B8]">
                        {formatDate(application.applied_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                {application.seeker?.avg_rating !== null && application.seeker?.avg_rating !== undefined ? (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-yellow-400">★</span>
                    <span className="text-[#F8FAFC] font-medium">
                      {application.seeker.avg_rating.toFixed(1)}
                    </span>
                    <span className="text-[#94A3B8] text-sm">
                      ({application.seeker.rating_count || 0} rating{(application.seeker.rating_count || 0) !== 1 ? 's' : ''})
                    </span>
                  </div>
                ) : (
                  <p className="text-[#94A3B8] text-sm mb-3">No ratings yet</p>
                )}

                {/* Skill Tags */}
                {application.seeker?.user_tags && application.seeker.user_tags.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-[#F8FAFC] mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.seeker.user_tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 bg-[#0F172A] text-[#F59E0B] text-xs rounded-full border border-[#334155]"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {application.seeker?.bio && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-[#F8FAFC] mb-1">About</h4>
                    <p className="text-[#94A3B8] text-sm line-clamp-2">
                      {application.seeker.bio}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <a
                    href={`/profile/${application.seeker?.id || '#'}`}
                    className="px-3 py-1.5 border border-[#334155] text-[#F8FAFC] rounded-lg hover:bg-[#0F172A] transition-colors text-sm"
                  >
                    View Full Profile
                  </a>
                  {isOwner && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(application.id, 'viewed')}
                        disabled={updatingId === application.id || application.status === 'viewed'}
                        className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                          application.status === 'viewed'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10'
                        } ${updatingId === application.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updatingId === application.id && application.status !== 'viewed' ? 'Updating...' : 'Mark as Viewed'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(application.id, 'engaged')}
                        disabled={updatingId === application.id || application.status === 'engaged'}
                        className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                          application.status === 'engaged'
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : 'border-green-500/30 text-green-300 hover:bg-green-500/10'
                        } ${updatingId === application.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updatingId === application.id && application.status !== 'engaged' ? 'Updating...' : 'Mark as Engaged'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}