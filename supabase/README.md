# Supabase Migrations for QuickHubGH

This directory contains SQL migration files for setting up the QuickHubGH database schema in Supabase.

## Migration Files

1. **`20250428005300_create_initial_schema.sql`**
   - Creates all tables: `users`, `tags`, `user_tags`, `jobs`, `job_tags`, `subscriptions`, `applications`, `ratings`, `notifications`, `portfolio_items`
   - Sets up foreign key relationships and constraints
   - Creates triggers for:
     - Auto-creating user profile when auth user is created
     - Updating `updated_at` timestamp on jobs table
     - Recalculating user rating averages when new ratings are added
   - Enables Row Level Security (RLS) on all tables

2. **`20250428005301_seed_tags.sql`**
   - Seeds the `tags` table with predefined skill categories
   - Includes categories like Tech, Cooking, Cleaning, Handiwork, Education, Beauty, Events, Logistics, Health, and Creative

## How to Apply Migrations

### Option 1: Supabase Dashboard SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of each migration file in order
4. Run each SQL script

### Option 2: Supabase CLI
If you have the Supabase CLI installed:
```bash
# Apply all migrations
supabase db push

# Or apply specific migration
supabase migration up 20250428005300_create_initial_schema.sql
```

### Option 3: Programmatically via API
You can also apply migrations programmatically using the Supabase Management API.

## Schema Overview

The database schema follows the design document specifications:

- **users**: Extends `auth.users` with platform-specific fields
- **tags**: Predefined skill categories (not user-editable)
- **user_tags**: Junction table linking users to their skill tags
- **jobs**: Job listings with budget in GHS
- **job_tags**: Junction table linking jobs to skill tags
- **subscriptions**: Active subscriptions for users
- **applications**: Job applications with status tracking
- **ratings**: User ratings (1-5) with duplicate prevention
- **notifications**: User notifications with read status
- **portfolio_items**: Portfolio items for seekers

## Notes

- All tables have RLS enabled (policies need to be created separately)
- The `users` table is automatically populated via trigger when auth users are created
- Foreign key constraints ensure data integrity
- Check constraints enforce business rules (e.g., rating scores 1-5, status values)