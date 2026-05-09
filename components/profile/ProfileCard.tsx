import type { User, Tag, PortfolioItem as PortfolioItemType } from '@/lib/types';
import { PortfolioItem } from './PortfolioItem';

interface ProfileCardProps {
  user: User;
  tags: Tag[];
  portfolioItems: PortfolioItemType[];
  isOwnProfile?: boolean;
  jobCount?: number; // For posters: total jobs posted
}

export function ProfileCard({ 
  user, 
  tags, 
  portfolioItems, 
  isOwnProfile = false,
  jobCount = 0 
}: ProfileCardProps) {
  const ratingDisplay = user.avg_rating 
    ? `${user.avg_rating.toFixed(1)} ⭐ (${user.rating_count} rating${user.rating_count !== 1 ? 's' : ''})`
    : 'No ratings yet';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="space-y-3 md:space-y-4">
        <div className="flex flex-col xs:flex-row justify-between items-start gap-3">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{user.display_name}</h1>
            <p className="text-gray-600 text-sm md:text-base">{user.email}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
              user.role === 'seeker' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role === 'seeker' ? 'Seeker' : 'Poster'}
            </span>
            
            {isOwnProfile && (
              <a
                href="/profile/edit"
                className="text-xs md:text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Edit Profile
              </a>
            )}
          </div>
        </div>

        {user.location && (
          <p className="text-gray-700 text-sm md:text-base">
            📍 {user.location}
          </p>
        )}
      </div>

      {/* Bio Section */}
      {user.bio && (
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">About</h2>
          <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-base">{user.bio}</p>
        </div>
      )}

      {/* Ratings Section */}
      <div className="space-y-1 md:space-y-2">
        <h2 className="text-base md:text-lg font-semibold text-gray-900">Ratings</h2>
        <p className="text-gray-700 text-sm md:text-base">{ratingDisplay}</p>
      </div>

      {/* Skills Section (for Seekers) */}
      {user.role === 'seeker' && tags.length > 0 && (
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 md:px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs md:text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Section (for Seekers) */}
      {user.role === 'seeker' && portfolioItems.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Portfolio</h2>
            <span className="text-xs md:text-sm text-gray-500">
              {portfolioItems.length} item{portfolioItems.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {portfolioItems.map((item) => (
              <PortfolioItem
                key={item.id}
                item={item}
                isOwner={isOwnProfile}
              />
            ))}
          </div>
        </div>
      )}

      {/* Poster Stats Section */}
      {user.role === 'poster' && (
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Poster Information</h2>
          <div className="space-y-2">
            <p className="text-gray-700 text-sm md:text-base">
              This user posts job listings as a Poster.
            </p>
            {jobCount > 0 && (
              <p className="text-gray-700 text-sm md:text-base">
                Has posted {jobCount} job{jobCount !== 1 ? 's' : ''} in total.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}