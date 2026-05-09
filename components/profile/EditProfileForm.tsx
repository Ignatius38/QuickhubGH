'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SkillTagSelector } from './SkillTagSelector';
import { updateProfile } from '@/app/actions/profile';
import type { User, Tag, ProfileUpdateInput } from '@/lib/types';

interface EditProfileFormProps {
  user: User;
  availableTags: Tag[];
  selectedTagIds: number[];
}

export function EditProfileForm({ user, availableTags, selectedTagIds: initialSelectedTagIds }: EditProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [role, setRole] = useState<'seeker' | 'poster'>(user.role);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(initialSelectedTagIds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const profileData: ProfileUpdateInput = {
        display_name: displayName,
        bio: bio || null,
        location: location || null,
        role,
        // Only send tag_ids for seekers
        tag_ids: role === 'seeker' ? selectedTagIds : undefined,
      };

      const result = await updateProfile(profileData);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Redirect to profile overview page after successful update
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#F8FAFC]">Edit Your Profile</h1>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-300">Profile updated successfully! Redirecting...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-[#F8FAFC] mb-1">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&:-webkit-autofill]:text-white"
                style={{ color: 'white !important', backgroundColor: '#0F172A' }}
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[#F8FAFC] mb-1">
                Role *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="seeker"
                    checked={role === 'seeker'}
                    onChange={() => setRole('seeker')}
                    className="mr-2"
                  />
                  <span className="text-[#F8FAFC]">Seeker (looking for work)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="poster"
                    checked={role === 'poster'}
                    onChange={() => setRole('poster')}
                    className="mr-2"
                  />
                  <span className="text-[#F8FAFC]">Poster (hiring)</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-[#F8FAFC] mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&:-webkit-autofill]:text-white"
                style={{ color: 'white !important', backgroundColor: '#0F172A' }}
                placeholder="e.g., Accra, Ghana"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-[#F8FAFC] mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [&:-webkit-autofill]:text-white"
                style={{ color: 'white !important', backgroundColor: '#0F172A' }}
                placeholder="Tell us about yourself (max 500 characters)"
              />
              <p className="text-xs text-[#94A3B8] mt-1">
                {bio.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Skill Tags (for Seekers) */}
        {role === 'seeker' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#F8FAFC]">Skills</h2>
            <SkillTagSelector
              selectedTagIds={selectedTagIds}
              onTagChange={setSelectedTagIds}
              availableTags={availableTags}
            />
            {selectedTagIds.length === 0 && (
              <p className="text-sm text-red-400">
                Please select at least one skill tag
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading || (role === 'seeker' && selectedTagIds.length === 0)}
            className="w-full"
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}