-- Migration: Seed predefined skill categories for QuickHubGH Platform
-- Created: 2025-04-28 00:53:01

-- Insert predefined skill categories
INSERT INTO public.tags (name, category) VALUES
    -- Tech category
    ('Web Development', 'Tech'),
    ('Mobile App Development', 'Tech'),
    ('Graphic Design', 'Tech'),
    ('Data Analysis', 'Tech'),
    ('IT Support', 'Tech'),
    ('Digital Marketing', 'Tech'),
    ('Video Editing', 'Tech'),
    ('Photography', 'Tech'),
    
    -- Cooking category
    ('Home Cooking', 'Cooking'),
    ('Catering', 'Cooking'),
    ('Baking', 'Cooking'),
    ('Pastry Chef', 'Cooking'),
    ('Food Delivery', 'Cooking'),
    
    -- Cleaning category
    ('Home Cleaning', 'Cleaning'),
    ('Office Cleaning', 'Cleaning'),
    ('Laundry Services', 'Cleaning'),
    ('Carpet Cleaning', 'Cleaning'),
    ('Window Cleaning', 'Cleaning'),
    
    -- Handiwork category
    ('Plumbing', 'Handiwork'),
    ('Electrical Work', 'Handiwork'),
    ('Carpentry', 'Handiwork'),
    ('Painting', 'Handiwork'),
    ('Masonry', 'Handiwork'),
    ('Gardening', 'Handiwork'),
    ('Furniture Assembly', 'Handiwork'),
    
    -- Other categories
    ('Tutoring', 'Education'),
    ('Language Teaching', 'Education'),
    ('Music Lessons', 'Education'),
    ('Driving Lessons', 'Education'),
    
    ('Hair Styling', 'Beauty'),
    ('Makeup Artistry', 'Beauty'),
    ('Nail Technician', 'Beauty'),
    ('Barbering', 'Beauty'),
    
    ('Event Planning', 'Events'),
    ('MC Services', 'Events'),
    ('DJ Services', 'Events'),
    ('Decorations', 'Events'),
    
    ('Delivery Services', 'Logistics'),
    ('Moving Services', 'Logistics'),
    ('Errand Running', 'Logistics'),
    
    ('Fitness Training', 'Health'),
    ('Massage Therapy', 'Health'),
    ('Yoga Instruction', 'Health'),
    
    ('Writing', 'Creative'),
    ('Translation', 'Creative'),
    ('Voice Over', 'Creative'),
    ('Acting', 'Creative')
ON CONFLICT (name) DO NOTHING;