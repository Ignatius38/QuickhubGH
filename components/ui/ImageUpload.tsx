'use client';

import { useState, useRef } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';

interface ImageUploadProps {
  userId: string;
  currentUrl: string | null;
  onUploadComplete: (url: string) => void;
  onDeleteComplete: () => void;
  bucketPath: string; // e.g., 'avatars' or 'resumes'
  accept: string; // e.g., 'image/*' or '.pdf'
  maxSizeMB: number;
  label: string;
  description?: string;
}

export default function ImageUpload({
  userId,
  currentUrl,
  onUploadComplete,
  onDeleteComplete,
  bucketPath,
  accept,
  maxSizeMB,
  label,
  description
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset messages
    setError(null);
    setSuccess(null);

    // Check file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File too large (Max ${maxSizeMB}MB)`);
      return;
    }

    // Check file type
    if (accept === 'image/*' && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (accept === '.pdf' && file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${bucketPath}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('quickhub_assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('quickhub_assets')
        .getPublicUrl(filePath);

      setSuccess('File uploaded successfully!');
      onUploadComplete(publicUrl);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUrl) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createBrowserSupabaseClient();
      
      // Extract file path from URL
      const urlParts = currentUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${bucketPath}/${fileName}`;

      // Delete from Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('quickhub_assets')
        .remove([filePath]);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      setSuccess('File deleted successfully!');
      onDeleteComplete();

    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to delete file');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-300 mb-2">{description}</p>
        )}
      </div>

      {/* Current file display */}
      {currentUrl && (
        <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {bucketPath === 'avatars' ? (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                  <img 
                    src={currentUrl} 
                    alt="Profile avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-red-900/20 flex items-center justify-center">
                  <span className="text-red-400 font-bold">PDF</span>
                </div>
              )}
              <div>
                <p className="text-white font-medium">
                  {bucketPath === 'avatars' ? 'Profile Picture' : 'Resume/CV'}
                </p>
                <p className="text-gray-400 text-sm">
                  {currentUrl.split('/').pop()}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : currentUrl ? 'Replace File' : 'Upload File'}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-sm text-gray-300">
          Max size: {maxSizeMB}MB • {accept === 'image/*' ? 'Images only' : 'PDF only'}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}