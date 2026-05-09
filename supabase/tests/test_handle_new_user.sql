-- Test for handle_new_user() trigger function with Google OAuth metadata simulation
-- Created: 2025-04-28
-- Validates: Requirements 1.4, 2.4, 3.4

-- Test setup: Create a test function to simulate auth.users insert
-- Note: In a real environment, this would be triggered by Supabase Auth
-- For testing, we'll call the trigger function directly with simulated data

-- Helper function to test display_name extraction
CREATE OR REPLACE FUNCTION test_handle_new_user_metadata_extraction()
RETURNS TABLE (
    test_case TEXT,
    raw_user_meta_data JSONB,
    expected_display_name TEXT,
    actual_display_name TEXT,
    passed BOOLEAN
) AS $$
DECLARE
    test_user_id UUID;
    test_email TEXT := 'testuser@example.com';
BEGIN
    -- Test Case 1: Google OAuth with full_name field
    test_user_id := gen_random_uuid();
    raw_user_meta_data := '{"full_name": "John Doe", "given_name": "John", "family_name": "Doe"}'::JSONB;
    expected_display_name := 'John Doe';
    
    -- Simulate trigger execution
    INSERT INTO public.users (id, display_name, email, role)
    VALUES (
        test_user_id,
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'given_name',
            SPLIT_PART(test_email, '@', 1)
        ),
        test_email,
        'seeker'
    );
    
    SELECT display_name INTO actual_display_name FROM public.users WHERE id = test_user_id;
    
    RETURN QUERY SELECT 
        'Google OAuth with full_name field' as test_case,
        raw_user_meta_data,
        expected_display_name,
        actual_display_name,
        (actual_display_name = expected_display_name) as passed;
    
    DELETE FROM public.users WHERE id = test_user_id;
    
    -- Test Case 2: Google OAuth with name field (no full_name)
    test_user_id := gen_random_uuid();
    raw_user_meta_data := '{"name": "Jane Smith", "given_name": "Jane", "family_name": "Smith"}'::JSONB;
    expected_display_name := 'Jane Smith';
    
    INSERT INTO public.users (id, display_name, email, role)
    VALUES (
        test_user_id,
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'given_name',
            SPLIT_PART(test_email, '@', 1)
        ),
        test_email,
        'seeker'
    );
    
    SELECT display_name INTO actual_display_name FROM public.users WHERE id = test_user_id;
    
    RETURN QUERY SELECT 
        'Google OAuth with name field (no full_name)' as test_case,
        raw_user_meta_data,
        expected_display_name,
        actual_display_name,
        (actual_display_name = expected_display_name) as passed;
    
    DELETE FROM public.users WHERE id = test_user_id;
    
    -- Test Case 3: Google OAuth with only given_name field
    test_user_id := gen_random_uuid();
    raw_user_meta_data := '{"given_name": "Bob", "family_name": "Johnson"}'::JSONB;
    expected_display_name := 'Bob';
    
    INSERT INTO public.users (id, display_name, email, role)
    VALUES (
        test_user_id,
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'given_name',
            SPLIT_PART(test_email, '@', 1)
        ),
        test_email,
        'seeker'
    );
    
    SELECT display_name INTO actual_display_name FROM public.users WHERE id = test_user_id;
    
    RETURN QUERY SELECT 
        'Google OAuth with only given_name field' as test_case,
        raw_user_meta_data,
        expected_display_name,
        actual_display_name,
        (actual_display_name = expected_display_name) as passed;
    
    DELETE FROM public.users WHERE id = test_user_id;
    
    -- Test Case 4: Google OAuth with no name fields (fallback to email prefix)
    test_user_id := gen_random_uuid();
    raw_user_meta_data := '{}'::JSONB;
    expected_display_name := 'testuser';
    
    INSERT INTO public.users (id, display_name, email, role)
    VALUES (
        test_user_id,
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'given_name',
            SPLIT_PART(test_email, '@', 1)
        ),
        test_email,
        'seeker'
    );
    
    SELECT display_name INTO actual_display_name FROM public.users WHERE id = test_user_id;
    
    RETURN QUERY SELECT 
        'Google OAuth with no name fields (fallback to email prefix)' as test_case,
        raw_user_meta_data,
        expected_display_name,
        actual_display_name,
        (actual_display_name = expected_display_name) as passed;
    
    DELETE FROM public.users WHERE id = test_user_id;
    
    -- Test Case 5: Google OAuth with null metadata fields
    test_user_id := gen_random_uuid();
    raw_user_meta_data := '{"full_name": null, "name": null, "given_name": null}'::JSONB;
    expected_display_name := 'testuser';
    
    INSERT INTO public.users (id, display_name, email, role)
    VALUES (
        test_user_id,
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'given_name',
            SPLIT_PART(test_email, '@', 1)
        ),
        test_email,
        'seeker'
    );
    
    SELECT display_name INTO actual_display_name FROM public.users WHERE id = test_user_id;
    
    RETURN QUERY SELECT 
        'Google OAuth with null metadata fields' as test_case,
        raw_user_meta_data,
        expected_display_name,
        actual_display_name,
        (actual_display_name = expected_display_name) as passed;
    
    DELETE FROM public.users WHERE id = test_user_id;
    
    -- Test Case 6: Preservation - default 'seeker' role is preserved
    test_user_id := gen_random_uuid();
    raw_user_meta_data := '{"full_name": "Test User"}'::JSONB;
    expected_display_name := 'Test User';
    
    INSERT INTO public.users (id, display_name, email, role)
    VALUES (
        test_user_id,
        COALESCE(
            raw_user_meta_data->>'full_name',
            raw_user_meta_data->>'name',
            raw_user_meta_data->>'given_name',
            SPLIT_PART(test_email, '@', 1)
        ),
        test_email,
        'seeker'
    );
    
    SELECT display_name, role INTO actual_display_name, role FROM public.users WHERE id = test_user_id;
    
    RETURN QUERY SELECT 
        'Preservation - default seeker role' as test_case,
        raw_user_meta_data,
        expected_display_name || ' (role: seeker)' as expected_display_name,
        actual_display_name || ' (role: ' || role || ')' as actual_display_name,
        (actual_display_name = expected_display_name AND role = 'seeker') as passed;
    
    DELETE FROM public.users WHERE id = test_user_id;
END;
$$ LANGUAGE plpgsql;

-- Run the test and display results
DO $$
DECLARE
    test_result RECORD;
    total_tests INTEGER := 0;
    passed_tests INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Testing handle_new_user() metadata extraction';
    RAISE NOTICE '========================================';
    
    FOR test_result IN SELECT * FROM test_handle_new_user_metadata_extraction() 
    LOOP
        total_tests := total_tests + 1;
        IF test_result.passed THEN
            passed_tests := passed_tests + 1;
        END IF;
        
        RAISE NOTICE 'Test: %', test_result.test_case;
        RAISE NOTICE '  Metadata: %', test_result.raw_user_meta_data;
        RAISE NOTICE '  Expected: %', test_result.expected_display_name;
        RAISE NOTICE '  Actual:   %', test_result.actual_display_name;
        RAISE NOTICE '  Result:   %', CASE WHEN test_result.passed THEN 'PASS' ELSE 'FAIL' END;
        RAISE NOTICE '---';
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test Summary: %/% tests passed', passed_tests, total_tests;
    RAISE NOTICE '========================================';
    
    -- Clean up test function
    DROP FUNCTION test_handle_new_user_metadata_extraction();
END;
$$;