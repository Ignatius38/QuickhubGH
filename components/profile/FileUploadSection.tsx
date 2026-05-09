'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ui/ImageUpload';
import { updateAvatarUrl, updateResumeUrl, deleteResume } from '@/app/actions/profile';

interface FileUploadSectionProps {
  userId: string;
  currentAvatarUrl: string | null;
  currentResumeUrl: string | null;
}

export default function FileUploadSection({
  userId,
  currentAvatarUrl,
  currentResumeUrl
}: FileUploadSectionProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [resumeUrl, setResumeUrl] = useState<string | null>(currentResumeUrl);

  const handleAvatarUpload = async (url: string) => {
    try {
      const result = await updateAvatarUrl(userId, url);
      if (result.error) {
        console.error('Failed to update avatar URL:', result.error);
        return;
      }
      setAvatarUrl(url);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      const result = await updateAvatarUrl(userId, '');
      if (result.error) {
        console.error('Failed to delete avatar:', result.error);
        return;
      }
      setAvatarUrl(null);
    } catch (error) {
      console.error('Error deleting avatar:', error);
    }
  };

  const handleResumeUpload = async (url: string) => {
    try {
      const result = await updateResumeUrl(userId, url);
      if (result.error) {
        console.error('Failed to update resume URL:', result.error);
        return;
      }
      setResumeUrl(url);
    } catch (error) {
      console.error('Error updating resume:', error);
    }
  };

  const handleResumeDelete = async () => {
    if (!resumeUrl) return;
    
    try {
      const result = await deleteResume(userId, resumeUrl);
      if (result.error) {
        console.error('Failed to delete resume:', result.error);
        return;
      }
      setResumeUrl(null);
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Picture Section */}
      <div className="bg-[#0F172A] rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Profile Picture</h2>
        <p className="text-gray-300 mb-6">
          Upload a profile picture to make your profile more recognizable. 
          Maximum file size is 2MB. Supported formats: JPG, PNG, GIF.
        </p>
        
        <ImageUpload
          userId={userId}
          currentUrl={avatarUrl}
          onUploadComplete={handleAvatarUpload}
          onDeleteComplete={handleAvatarDelete}
          bucketPath="avatars"
          accept="image/*"
          maxSizeMB={2}
          label="Profile Picture"
        />
      </div>

      {/* Documents Section */}
      <div className="bg-[#0F172A] rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Documents</h2>
        <p className="text-gray-300 mb-6">
          Upload your resume or CV to share with potential employers. 
          Maximum file size is 2MB. PDF format only.
        </p>
        
        <ImageUpload
          userId={userId}
          currentUrl={resumeUrl}
          onUploadComplete={handleResumeUpload}
          onDeleteComplete={handleResumeDelete}
          bucketPath="resumes"
          accept=".pdf"
          maxSizeMB={2}
          label="Resume/CV"
          description="Upload your resume or CV document"
        />

        {/* Document Tips */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h3 className="text-sm font-medium text-blue-300 mb-2">Tips for your resume:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Keep it under 2 pages for best results</li>
            <li>• Include your contact information</li>
            <li>• Highlight relevant skills and experience</li>
            <li>• Use clear, professional formatting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}