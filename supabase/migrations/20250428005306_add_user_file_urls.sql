-- Migration: Add avatar_url and resume_url columns to users table
-- Created: 2025-04-28 00:53:06

-- Add avatar_url column to users table for profile pictures
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add resume_url column to users table for CV/resume documents
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- Add comment to explain the columns
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile picture in Supabase Storage';
COMMENT ON COLUMN public.users.resume_url IS 'URL to user resume/CV document in Supabase Storage';