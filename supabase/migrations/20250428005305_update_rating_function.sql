-- Migration: Update rating function to round to one decimal place
-- Created: 2025-04-28 00:53:05

-- Update the recalculate_user_rating function to round to one decimal place
CREATE OR REPLACE FUNCTION public.recalculate_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET 
        avg_rating = (
            SELECT ROUND(AVG(score::numeric), 1)
            FROM public.ratings 
            WHERE ratee_id = NEW.ratee_id
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM public.ratings 
            WHERE ratee_id = NEW.ratee_id
        )
    WHERE id = NEW.ratee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;