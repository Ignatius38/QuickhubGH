-- Migration: Create Row Level Security (RLS) policies for QuickHubGH Platform
-- Created: 2025-04-28 00:53:04
-- Validates: Requirements 12.3

-- Drop existing policies if they exist (for idempotency)
DO $ 
BEGIN
    -- Drop policies for users table
    DROP POLICY IF EXISTS "users_select_policy" ON public.users;
    DROP POLICY IF EXISTS "users_update_policy" ON public.users;
    DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
    
    -- Drop policies for tags table
    DROP POLICY IF EXISTS "tags_select_policy" ON public.tags;
    
    -- Drop policies for user_tags table
    DROP POLICY IF EXISTS "user_tags_select_policy" ON public.user_tags;
    DROP POLICY IF EXISTS "user_tags_insert_policy" ON public.user_tags;
    DROP POLICY IF EXISTS "user_tags_delete_policy" ON public.user_tags;
    
    -- Drop policies for jobs table
    DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
    DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
    DROP POLICY IF EXISTS "jobs_update_policy" ON public.jobs;
    DROP POLICY IF EXISTS "jobs_delete_policy" ON public.jobs;
    
    -- Drop policies for job_tags table
    DROP POLICY IF EXISTS "job_tags_select_policy" ON public.job_tags;
    DROP POLICY IF EXISTS "job_tags_insert_policy" ON public.job_tags;
    DROP POLICY IF EXISTS "job_tags_delete_policy" ON public.job_tags;
    
    -- Drop policies for subscriptions table
    DROP POLICY IF EXISTS "subscriptions_select_policy" ON public.subscriptions;
    DROP POLICY IF EXISTS "subscriptions_insert_policy" ON public.subscriptions;
    DROP POLICY IF EXISTS "subscriptions_update_policy" ON public.subscriptions;
    
    -- Drop policies for applications table
    DROP POLICY IF EXISTS "applications_select_policy" ON public.applications;
    DROP POLICY IF EXISTS "applications_insert_policy" ON public.applications;
    DROP POLICY IF EXISTS "applications_update_policy" ON public.applications;
    
    -- Drop policies for ratings table
    DROP POLICY IF EXISTS "ratings_select_policy" ON public.ratings;
    DROP POLICY IF EXISTS "ratings_insert_policy" ON public.ratings;
    
    -- Drop policies for notifications table
    DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
    DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
    
    -- Drop policies for portfolio_items table
    DROP POLICY IF EXISTS "portfolio_items_select_policy" ON public.portfolio_items;
    DROP POLICY IF EXISTS "portfolio_items_insert_policy" ON public.portfolio_items;
    DROP POLICY IF EXISTS "portfolio_items_update_policy" ON public.portfolio_items;
    DROP POLICY IF EXISTS "portfolio_items_delete_policy" ON public.portfolio_items;
END $;

-- Helper function to check if user has active subscription (including 30-day free trial)
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $
DECLARE
    user_created_at TIMESTAMPTZ;
BEGIN
    -- First check for active paid subscription
    IF EXISTS (
        SELECT 1 
        FROM public.subscriptions 
        WHERE user_id = user_uuid 
        AND status = 'active' 
        AND ends_at > NOW()
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check for 30-day free trial based on user creation date
    SELECT created_at INTO user_created_at
    FROM public.users 
    WHERE id = user_uuid;
    
    IF user_created_at IS NOT NULL THEN
        -- If user was created within the last 30 days, they get free trial
        IF user_created_at >= (NOW() - INTERVAL '30 days') THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is job poster
CREATE OR REPLACE FUNCTION public.is_job_poster(job_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.jobs 
        WHERE id = job_uuid 
        AND poster_id = user_uuid
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is application seeker
CREATE OR REPLACE FUNCTION public.is_application_seeker(application_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.applications 
        WHERE id = application_uuid 
        AND seeker_id = user_uuid
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is job poster for application
CREATE OR REPLACE FUNCTION public.is_job_poster_for_application(application_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.applications a
        JOIN public.jobs j ON a.job_id = j.id
        WHERE a.id = application_uuid 
        AND j.poster_id = user_uuid
    );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for users table
-- SELECT: authenticated users can read all rows (public profiles)
CREATE POLICY "users_select_policy" ON public.users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- UPDATE: a user can only update their own row
CREATE POLICY "users_update_policy" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- INSERT: allow trigger function to insert user profiles (system/trigger context)
CREATE POLICY "users_insert_policy" ON public.users
    FOR INSERT WITH CHECK (true);

-- Create policies for tags table
-- SELECT: public (anon + authenticated). Tags are read-only reference data.
CREATE POLICY "tags_select_policy" ON public.tags
    FOR SELECT USING (true);

-- Create policies for user_tags table
-- SELECT: authenticated users can read all rows
CREATE POLICY "user_tags_select_policy" ON public.user_tags
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT / DELETE: user can only modify their own rows
CREATE POLICY "user_tags_insert_policy" ON public.user_tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_tags_delete_policy" ON public.user_tags
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for jobs table
-- SELECT: authenticated users can read all open jobs; poster can read their own closed jobs
CREATE POLICY "jobs_select_policy" ON public.jobs
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            status = 'open' 
            OR poster_id = auth.uid()
        )
    );

-- INSERT: authenticated users with an active subscription
CREATE POLICY "jobs_insert_policy" ON public.jobs
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND public.has_active_subscription(auth.uid())
        AND poster_id = auth.uid()
    );

-- UPDATE / DELETE: only the poster
CREATE POLICY "jobs_update_policy" ON public.jobs
    FOR UPDATE USING (poster_id = auth.uid());

CREATE POLICY "jobs_delete_policy" ON public.jobs
    FOR DELETE USING (poster_id = auth.uid());

-- Create policies for job_tags table
-- SELECT: authenticated users
CREATE POLICY "job_tags_select_policy" ON public.job_tags
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT / DELETE: only the job's poster
CREATE POLICY "job_tags_insert_policy" ON public.job_tags
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND public.is_job_poster(job_id, auth.uid())
    );

CREATE POLICY "job_tags_delete_policy" ON public.job_tags
    FOR DELETE USING (
        auth.uid() IS NOT NULL 
        AND public.is_job_poster(job_id, auth.uid())
    );

-- Create policies for subscriptions table
-- SELECT: user can only read their own rows
CREATE POLICY "subscriptions_select_policy" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT / UPDATE: service role only (webhook handler). Users cannot self-grant subscriptions.
-- Note: These policies restrict all user-level operations. Service role bypasses RLS.
CREATE POLICY "subscriptions_insert_policy" ON public.subscriptions
    FOR INSERT WITH CHECK (false); -- No user can insert

CREATE POLICY "subscriptions_update_policy" ON public.subscriptions
    FOR UPDATE USING (false); -- No user can update

-- Create policies for applications table
-- SELECT: seeker can read their own applications; poster can read applications for their jobs
CREATE POLICY "applications_select_policy" ON public.applications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            seeker_id = auth.uid() 
            OR public.is_job_poster_for_application(id, auth.uid())
        )
    );

-- INSERT: authenticated seeker with active subscription; no duplicate (enforced by UNIQUE constraint)
CREATE POLICY "applications_insert_policy" ON public.applications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND public.has_active_subscription(auth.uid())
        AND seeker_id = auth.uid()
    );

-- UPDATE: poster can update status for applications on their jobs
CREATE POLICY "applications_update_policy" ON public.applications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL 
        AND public.is_job_poster_for_application(id, auth.uid())
    );

-- Create policies for ratings table
-- SELECT: authenticated users can read all ratings
CREATE POLICY "ratings_select_policy" ON public.ratings
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: authenticated user; score must be 1–5; no duplicate per (job_id, rater_id, ratee_id)
CREATE POLICY "ratings_insert_policy" ON public.ratings
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND rater_id = auth.uid()
        AND score BETWEEN 1 AND 5
    );

-- Create policies for notifications table
-- SELECT / UPDATE: user can only access their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- INSERT: service role only (server actions insert on behalf of users)
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT WITH CHECK (false); -- No user can insert

-- Create policies for portfolio_items table
-- SELECT: authenticated users can read all items
CREATE POLICY "portfolio_items_select_policy" ON public.portfolio_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT / UPDATE / DELETE: user can only modify their own items
CREATE POLICY "portfolio_items_insert_policy" ON public.portfolio_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolio_items_update_policy" ON public.portfolio_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "portfolio_items_delete_policy" ON public.portfolio_items
    FOR DELETE USING (auth.uid() = user_id);