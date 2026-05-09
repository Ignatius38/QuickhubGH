-- Test script to verify schema creation
-- Run this after applying all migrations to verify everything works

-- Test 1: Check all tables exist
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.table_name) 
        THEN '✓' 
        ELSE '✗' 
    END as exists
FROM (VALUES 
    ('users'),
    ('tags'),
    ('user_tags'),
    ('jobs'),
    ('job_tags'),
    ('subscriptions'),
    ('applications'),
    ('ratings'),
    ('notifications'),
    ('portfolio_items')
) AS t(table_name);

-- Test 2: Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Test 3: Check triggers exist
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Test 4: Check tags seeding
SELECT COUNT(*) as tag_count FROM public.tags;
SELECT category, COUNT(*) as count FROM public.tags GROUP BY category ORDER BY count DESC;

-- Test 5: Check RLS is enabled
-- Note: row_security column doesn't exist in information_schema.tables
-- RLS status is checked via pg_tables instead
SELECT 
    tablename as table_name,
    rowsecurity as row_security_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;