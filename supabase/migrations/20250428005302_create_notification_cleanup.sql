-- Migration: Create notification cleanup function for QuickHubGH Platform
-- Created: 2025-04-28 00:53:02

-- Create function to delete notifications older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To schedule this function to run daily using pg_cron:
-- SELECT cron.schedule('cleanup-notifications', '0 0 * * *', 'SELECT public.cleanup_old_notifications()');
-- 
-- You need to enable the pg_cron extension first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 
-- And grant permissions:
-- GRANT USAGE ON SCHEMA cron TO postgres;
-- ALTER FUNCTION public.cleanup_old_notifications() SECURITY DEFINER;