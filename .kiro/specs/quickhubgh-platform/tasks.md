# Implementation Plan: QuickHubGH Platform

## Overview

This implementation plan breaks down the QuickHubGH platform into discrete coding steps following the requirements-first workflow. The platform is built with Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL + Auth + Realtime), and integrates Paystack for Ghana-local payments. Implementation will proceed incrementally with checkpoints to ensure each layer works before moving to the next.

## Tasks

- [x] 1. Set up project structure and core dependencies
  - Initialize Next.js project with TypeScript and Tailwind CSS
  - Install Supabase dependencies (@supabase/supabase-js, @supabase/ssr)
  - Configure environment variables template (.env.local.example)
  - Set up ESLint and Prettier for code quality
  - _Requirements: N/A (infrastructure)_

- [x] 2. Create database schema and RLS policies
  - [x] 2.1 Create Supabase SQL migration files
    - Create `users` table extending auth.users
    - Create `tags` table with predefined skill categories
    - Create `jobs`, `job_tags`, `subscriptions`, `applications`, `ratings`, `notifications`, `portfolio_items` tables
    - Implement all foreign key relationships and constraints
    - _Requirements: 12.1, 12.2_
  
  - [x] 2.2 Implement Row Level Security (RLS) policies
    - Enable RLS on all tables
    - Create policies for SELECT, INSERT, UPDATE, DELETE based on user roles
    - Implement subscription check policy for job creation
    - _Requirements: 12.3_
  
  - [x] 2.3 Write unit tests for database schema
    - Test table creation and constraints
    - Test RLS policy behavior with different user roles
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 3. Implement authentication with Google OAuth
  - [x] 3.1 Configure Supabase Auth with Google OAuth
    - Set up Google OAuth provider in Supabase dashboard
    - Configure callback URLs and environment variables
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Implement Next.js middleware for session management
    - Create middleware.ts with @supabase/ssr session refresh
    - Protect (platform) routes with authentication check
    - Handle auth errors and redirects
    - _Requirements: 1.5, 1.6_
  
  - [x] 3.3 Create auth callback and error pages
    - Implement /auth/callback/route.ts for OAuth callback handling
    - Create /auth/error/page.tsx for auth error display
    - _Requirements: 1.3, 1.4_
  
  - [x] 3.4 Build landing page with Google login button
    - Create landing page UI with branding and value proposition
    - Implement Google OAuth sign-in button using Supabase Auth
    - Test manually by clicking the button
    - _Requirements: 1.1-1.4_

- [x] 4. Checkpoint - Core infrastructure
  - Manual testing of auth flow complete

- [x] 5. Implement user profile system
  - [x] 5.1 Create users table trigger and profile types
    - Create Postgres trigger to auto-create users row on auth.users insert
    - Define TypeScript interfaces for Seeker and Poster profiles
    - _Requirements: 2.1, 3.1_
  
  - [x] 5.2 Implement profile editing functionality
    - Create /profile/edit/page.tsx with form components
    - Implement updateProfile Server Action with validation
    - Add Skill_Tag selection component with tag management
    - _Requirements: 2.2, 2.8, 3.5_
  
  - [x] 5.3 Create public profile view
    - Implement /profile/[id]/page.tsx with ProfileCard component
    - Display bio, Skill_Tags, ratings, and portfolio items
    - Show role-specific information (Seeker vs Poster)
    - _Requirements: 2.7, 3.4_
  
  - [x] 5.4 Implement portfolio management
    - Create PortfolioItem component
    - Implement addPortfolioItem Server Action with 20-item cap
    - Add portfolio grid to profile page
    - _Requirements: 2.5, 2.6_
  
  - [x] 5.5 Write unit tests for profile system (SKIPPED - MVP focus)

- [x] 6. Implement subscription gate and payment integration
  - [x] 6.1 Create subscription status check helper
    - Implement hasActiveSubscription function
    - Use in middleware for route-level protection
    - Use in Server Actions for mutation-level protection
    - _Requirements: 4.1, 4.2, 4.4_
  
  - [x] 6.2 Implement Paystack payment flow
    - Create /api/subscriptions/initialize/route.ts for transaction initialization
    - Integrate Paystack API with MoMo and card support
    - Handle test mode with mock responses
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 5.7_
  
  - [x] 6.3 Create subscription purchase page
    - Implement /subscribe/page.tsx with tier selection
    - Display current subscription status
    - Handle payment success/failure redirects
    - _Requirements: 4.6, 5.5_
  
  - [x] 6.4 Implement Paystack webhook handler
    - Create /api/webhooks/paystack/route.ts with HMAC signature verification
    - Handle charge.success events to activate subscriptions
    - Insert subscription rows with service role client
    - _Requirements: 5.4_
  
  - [x] 6.5 Write unit tests for payment integration (SKIPPED - MVP focus)

- [x] 7. Checkpoint - Authentication and payments
  - Manual testing of payment flow complete

- [x] 8. Implement job listing system
  - [x] 8.1 Create job creation form and validation
    - Implement /jobs/new/page.tsx with form components
    - Create createJob Server Action with field validation
    - Add Skill_Tag selection for job listings
    - _Requirements: 6.1, 6.3_
  
  - [x] 8.2 Implement job editing and closing
    - Create editJob Server Action with ownership validation
    - Implement closeJob Server Action with status update
    - Add job detail page (/jobs/[id]/page.tsx)
    - _Requirements: 6.4, 6.5_
  
  - [x] 8.3 Create real-time feed with Supabase Realtime
    - Implement FeedClient component with WebSocket subscription
    - Subscribe to INSERT events on jobs table
    - Implement pagination (cursor-based, 20 items per batch)
    - _Requirements: 7.1, 7.3, 7.6, 7.7_
  
  - [x] 8.4 Implement tag filtering
    - Create TagCloud component with interactive tag buttons
    - Implement client-side filtering on fetched jobs
    - Add server-side filter for paginated fetches
    - _Requirements: 7.2_
  
  - [x] 8.5 Create JobCard component
    - Design responsive card displaying job details
    - Show poster info, location, budget, tags, and timestamp
    - Ensure mobile-first responsive layout
    - _Requirements: 7.5_
  
  - [x] 8.6 Write unit tests for job system (SKIPPED - MVP focus)

- [x] 9. Implement job application system
  - [x] 9.1 Create application submission
    - Implement applyToJob Server Action with duplicate prevention
    - Add subscription check for seekers
    - Create application button on job detail page
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 9.2 Implement application management for posters
    - Create ApplicationList component for job detail page
    - Display applicant profiles with Skill_Tags and ratings
    - Add status update functionality (pending → viewed → engaged)
    - _Requirements: 8.5_
  
  - [x] 9.3 Create notification system for applications
    - Generate notification on application submission
    - Create NotificationBadge component for nav
    - Implement markNotificationsRead Server Action
    - _Requirements: 8.4, 11.1, 11.2, 11.3, 11.4_
  
  - [x] 9.4 Write unit tests for application system (SKIPPED - MVP focus)

- [x] 10. Checkpoint - Core platform functionality
  - Manual testing of core features complete

- [x] 11. Implement rating system
  - [x] 11.1 Create rating submission flow
    - Implement submitRating Server Action with validation (1-5)
    - Prevent duplicate ratings per job
    - Show RatingForm modal when closing a job
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 11.2 Implement rating aggregation
    - Create database function to recalculate avg_rating
    - Update users.avg_rating and rating_count on new rating
    - Display "No ratings yet" for users with zero ratings
    - _Requirements: 2.3, 2.4, 3.2, 3.3, 9.5_
  
  - [x] 11.3 Write unit tests for rating system (SKIPPED - MVP focus)

- [x] 12. Implement mobile-first UI components
  - [x] 12.1 Create BottomNav and TopNav components
    - Implement BottomNav for mobile (<768px) with four items
    - Create TopNav for desktop (≥768px) replacement
    - Add active state highlighting and NotificationBadge integration
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [x] 12.2 Create ProfileCard and PortfolioItem components
    - Design ProfileCard for public profile display
    - Create PortfolioItem for portfolio grid
    - Ensure responsive layout across viewports
    - _Requirements: 2.7, 2.5, 14.1, 14.2_
  
  - [x] 12.3 Create SubscriptionBanner component
    - Display when user has no active subscription
    - Show contextual CTA to /subscribe
    - Server-rendered with subscription status check
    - _Requirements: 4.4, 4.6_
  
  - [x] 12.4 Implement responsive layout system
    - Configure Tailwind for 320px → 1440px viewports
    - Implement single-column mobile, two-column tablet, sidebar desktop
    - Ensure all components render correctly across breakpoints
    - _Requirements: 7.4_
  
  - [x] 12.5 Write unit tests for UI components (SKIPPED - MVP focus)

- [x] 13. Create companion specification documents
  - [x] 13.1 Create database_schema.md
    - Define all table schemas with columns, types, constraints
    - Document RLS policies for each table
    - Include entity relationship diagram
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 13.2 Create payment_flow.md
    - Document end-to-end subscription purchase flow
    - Describe subscription gate implementation
    - Detail webhook handling logic for payment events
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [x] 13.3 Create ui_component_map.md
    - List all major UI components with props and behavior
    - Specify client-side vs server-rendered components
    - Document responsive behavior and page locations
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 14. Final integration and testing
  - [x] 14.1 Wire all components together
    - Connect authentication to profile system
    - Integrate subscription gate with job and application systems
    - Wire real-time feed with notification updates
    - _Requirements: All integration points_
  
  - [x] 14.2 Manual end-to-end testing
    - Test complete user flows: signup → subscribe → post → apply → rate
    - Test payment flow with test mode
    - Test real-time updates across multiple users
    - _Requirements: Cross-cutting requirements_
  
  - [x] 14.3 Perform accessibility audit (OPTIONAL - post-MVP)

- [x] 15. Final checkpoint - MVP ready
  - Manual testing complete, platform functional

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Unit tests validate specific examples and edge cases
- The design document uses TypeScript/JavaScript, so all implementation will be in TypeScript
- Companion documents (database_schema.md, payment_flow.md, ui_component_map.md) are created as part of task 13
