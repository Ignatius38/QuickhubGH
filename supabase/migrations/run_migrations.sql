-- Run migrations in order for QuickHubGH Platform
-- Run this script in Supabase SQL Editor

-- 1. Create initial schema
\i 20250428005300_create_initial_schema.sql

-- 2. Seed tags with predefined categories
\i 20250428005301_seed_tags.sql

-- 3. Create notification cleanup function
\i 20250428005302_create_notification_cleanup.sql

-- 4. Create performance indexes
\i 20250428005303_create_indexes.sql

-- 5. Create RLS policies
\i 20250428005304_create_rls_policies.sql

-- 6. Update rating function
\i 20250428005305_update_rating_function.sql

-- 7. Add user file URLs
\i 20250428005306_add_user_file_urls.sql

-- 8. Test the schema
\i test_schema.sql