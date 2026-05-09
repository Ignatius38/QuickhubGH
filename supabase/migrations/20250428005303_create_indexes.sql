-- Migration: Create performance indexes for QuickHubGH Platform
-- Created: 2025-04-28 00:53:03

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_category ON public.tags(category);

-- Indexes for user_tags table
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON public.user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_id ON public.user_tags(tag_id);

-- Indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_poster_id ON public.jobs(poster_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_budget_ghs ON public.jobs(budget_ghs);

-- Indexes for job_tags table
CREATE INDEX IF NOT EXISTS idx_job_tags_job_id ON public.job_tags(job_id);
CREATE INDEX IF NOT EXISTS idx_job_tags_tag_id ON public.job_tags(tag_id);

-- Indexes for subscriptions table
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ends_at ON public.subscriptions(ends_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status_ends ON public.subscriptions(user_id, status, ends_at);

-- Indexes for applications table
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_seeker_id ON public.applications(seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON public.applications(applied_at);

-- Indexes for ratings table
CREATE INDEX IF NOT EXISTS idx_ratings_job_id ON public.ratings(job_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON public.ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON public.ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON public.ratings(created_at);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Indexes for portfolio_items table
CREATE INDEX IF NOT EXISTS idx_portfolio_items_user_id ON public.portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_created_at ON public.portfolio_items(created_at);