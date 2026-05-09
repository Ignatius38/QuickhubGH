# Requirements Document

## Introduction

QuickHubGH is a social-media-style gig economy platform built for the Ghanaian market. It operates on a no-commission model — users pay a flat subscription fee to unlock the ability to post jobs or apply for them. The platform is built on Next.js, Tailwind CSS, and Supabase (PostgreSQL + Auth), with a mobile-first design philosophy and real-time job feed capabilities.

The platform serves two primary user types: Job Seekers (individuals offering skills) and Job Posters (individuals or businesses looking to hire). Both must hold an active subscription to participate. Authentication is handled exclusively via Google OAuth through Supabase.

Three companion specification documents are also required:
- `database_schema.md` — tables for users, jobs, tags, and subscriptions
- `payment_flow.md` — subscription gate logic and payment provider integration
- `ui_component_map.md` — mobile-first component inventory

---

## Glossary

- **Platform**: The QuickHubGH web application
- **Seeker**: A registered user who offers skills and applies for jobs
- **Poster**: A registered user who creates job listings
- **Subscription**: A paid, time-limited access grant that allows a user to post or apply for jobs
- **Skill_Tag**: A predefined category label (e.g., Tech, Cooking, Cleaning, Handiwork) attached to a Seeker's profile or a job listing
- **Feed**: The real-time, filterable job board visible to authenticated users
- **Job_Card**: A UI component representing a single job listing in the Feed
- **Tag_Cloud**: A UI component displaying all available Skill_Tags as interactive filter buttons
- **Bottom_Nav**: A mobile-first navigation bar fixed to the bottom of the screen
- **Portfolio**: A collection of past work items (images, descriptions, links) attached to a Seeker's profile
- **Rating**: A numeric score (1–5) left by a Poster after a job is completed
- **Auth_Provider**: Supabase Auth configured with Google OAuth as the sole sign-in method
- **Payment_Provider**: A Paystack or Flutterwave API integration handling MoMo and card payments
- **Subscription_Gate**: The enforcement layer that blocks posting or applying until a valid Subscription exists
- **MoMo**: Mobile Money, a common payment method in Ghana

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a visitor, I want to sign in with my Google account, so that I can access the platform securely without managing a separate password.

#### Acceptance Criteria

1. THE Auth_Provider SHALL support Google OAuth as the sole authentication method — no email/password or other OAuth providers shall be offered.
2. WHEN a visitor initiates sign-in, THE Auth_Provider SHALL redirect the visitor to Google's OAuth consent screen.
3. WHEN Google returns a successful OAuth callback, THE Auth_Provider SHALL create or retrieve the user's account and establish an authenticated session.
4. IF Google returns an OAuth error or the user denies consent, THEN THE Platform SHALL display a descriptive error message and return the user to the sign-in page.
5. WHEN an authenticated session expires, THE Platform SHALL redirect the user to the sign-in page before allowing any further action.
6. WHEN a user signs out, THE Auth_Provider SHALL invalidate the session and redirect the user to the public landing page.

---

### Requirement 2: User Profile — Seeker

**User Story:** As a Seeker, I want a social-media-style profile with my skills, bio, ratings, and portfolio, so that Posters can evaluate my suitability for a job.

#### Acceptance Criteria

1. THE Platform SHALL require every Seeker profile to include at least one Skill_Tag selected from the predefined tag list.
2. THE Platform SHALL allow a Seeker to add a plain-text bio of up to 500 characters.
3. THE Platform SHALL display a Seeker's aggregate Rating as the mean of all received ratings, rounded to one decimal place.
4. WHEN a Seeker has received no ratings, THE Platform SHALL display "No ratings yet" in place of a numeric score.
5. THE Platform SHALL allow a Seeker to add Portfolio items, where each item contains a title (required), a description (up to 300 characters, optional), and an image or URL (optional).
6. THE Platform SHALL allow a Seeker to add up to 20 Portfolio items.
7. WHEN a Seeker's profile is viewed by another authenticated user, THE Platform SHALL display the Seeker's Skill_Tags, bio, Rating, and Portfolio items.
8. THE Platform SHALL allow a Seeker to edit their own profile at any time.

---

### Requirement 3: User Profile — Poster

**User Story:** As a Poster, I want a profile that shows my posting history and ratings, so that Seekers can assess my credibility before applying.

#### Acceptance Criteria

1. THE Platform SHALL require every Poster profile to include a display name and a location (free-text, e.g., "Accra, Ghana").
2. THE Platform SHALL display a Poster's aggregate Rating as the mean of all received ratings, rounded to one decimal place.
3. WHEN a Poster has received no ratings, THE Platform SHALL display "No ratings yet" in place of a numeric score.
4. THE Platform SHALL display the total count of jobs a Poster has previously listed on the Poster's public profile.
5. THE Platform SHALL allow a Poster to edit their own profile at any time.

---

### Requirement 4: Subscription Model

**User Story:** As a user, I want to pay a flat subscription fee, so that I can post or apply for jobs without paying per-transaction commissions.

#### Acceptance Criteria

1. THE Subscription_Gate SHALL prevent any user without an active Subscription from posting a job listing.
2. THE Subscription_Gate SHALL prevent any user without an active Subscription from submitting a job application.
3. THE Platform SHALL offer at least one subscription tier with a clearly stated price in Ghanaian Cedis (GHS).
4. WHEN a user attempts a gated action without an active Subscription, THE Platform SHALL redirect the user to the subscription purchase page with a contextual message explaining why access was blocked.
5. WHEN a Subscription expires, THE Subscription_Gate SHALL immediately block gated actions until a new Subscription is purchased.
6. THE Platform SHALL display the user's current subscription status (active, expired, or none) on their profile dashboard.
7. WHEN a Subscription is successfully purchased, THE Platform SHALL record the subscription start date, end date, tier, and payment reference in the database.

---

### Requirement 5: Payment Integration

**User Story:** As a user in Ghana, I want to pay via Mobile Money or card, so that I can subscribe using the payment methods available to me locally.

#### Acceptance Criteria

1. THE Payment_Provider integration SHALL support MoMo payments via the Paystack or Flutterwave API.
2. THE Payment_Provider integration SHALL support card payments via the Paystack or Flutterwave API.
3. WHEN a user initiates a subscription payment, THE Platform SHALL redirect or present a payment modal from the Payment_Provider with the correct amount in GHS.
4. WHEN the Payment_Provider returns a successful payment callback, THE Platform SHALL activate the user's Subscription and record the payment reference.
5. IF the Payment_Provider returns a failed or cancelled payment callback, THEN THE Platform SHALL display a descriptive error message and leave the user's Subscription status unchanged.
6. THE Platform SHALL treat the Payment_Provider API keys as environment variables and SHALL NOT expose them in client-side code.
7. WHERE the live Payment_Provider API is unavailable, THE Platform SHALL support a placeholder/test-mode configuration that simulates successful and failed payment responses.

---

### Requirement 6: Job Listing Creation

**User Story:** As a Poster with an active Subscription, I want to create a job listing with relevant tags, so that the right Seekers can find and apply for it.

#### Acceptance Criteria

1. THE Platform SHALL require a job listing to include a title (up to 100 characters), a description (up to 1000 characters), at least one Skill_Tag, a location (free-text), and a budget or rate (numeric, in GHS).
2. WHEN a Poster submits a valid job listing, THE Platform SHALL publish it to the Feed in real time.
3. IF a Poster submits a job listing with missing required fields, THEN THE Platform SHALL display inline validation errors identifying each missing field without clearing the form.
4. THE Platform SHALL allow a Poster to mark a job listing as closed, which removes it from the active Feed.
5. THE Platform SHALL allow a Poster to edit a job listing's details after publication, provided the listing is still open.
6. WHEN a job listing is edited, THE Platform SHALL update the listing in the Feed within 5 seconds of the edit being saved.

---

### Requirement 7: The Feed (Job Board)

**User Story:** As an authenticated user, I want a real-time, tag-filtered job board that works on mobile and desktop, so that I can quickly find relevant opportunities or candidates.

#### Acceptance Criteria

1. THE Feed SHALL display all active job listings in reverse-chronological order by default.
2. WHEN a user selects one or more Skill_Tags in the Tag_Cloud, THE Feed SHALL display only job listings that match at least one of the selected tags.
3. WHEN a new job listing is published, THE Feed SHALL update to include it without requiring a full page reload.
4. THE Feed SHALL render correctly and be fully usable on viewport widths from 320px to 1440px.
5. THE Platform SHALL render each job listing in the Feed as a Job_Card displaying the job title, Poster's display name, location, budget, Skill_Tags, and time since posting.
6. WHEN the Feed contains more than 20 listings, THE Platform SHALL paginate or infinitely scroll results, loading 20 listings per page or batch.
7. WHILE a Feed update is loading, THE Platform SHALL display a loading indicator to the user.

---

### Requirement 8: Job Application

**User Story:** As a Seeker with an active Subscription, I want to apply for a job, so that I can connect with Posters who need my skills.

#### Acceptance Criteria

1. WHEN a Seeker submits an application for a job listing, THE Platform SHALL record the application with a timestamp and associate it with the Seeker's profile and the job listing.
2. THE Platform SHALL prevent a Seeker from submitting more than one application per job listing.
3. IF a Seeker attempts to apply to the same job listing a second time, THEN THE Platform SHALL display an informational message stating the Seeker has already applied.
4. WHEN an application is submitted, THE Platform SHALL notify the Poster via an in-platform notification.
5. THE Platform SHALL allow a Poster to view all applications received for a specific job listing, including each applicant's profile link, Skill_Tags, and Rating.

---

### Requirement 9: Ratings

**User Story:** As a Poster, I want to rate a Seeker after a job is completed, so that the community can identify reliable workers.

#### Acceptance Criteria

1. WHEN a job listing is marked as closed by the Poster, THE Platform SHALL allow the Poster to submit a rating (integer 1–5) for each Seeker who was engaged for that job.
2. IF a Poster attempts to submit a rating outside the range of 1 to 5, THEN THE Platform SHALL reject the input and display a validation error.
3. THE Platform SHALL allow a Seeker to submit a rating (integer 1–5) for a Poster after a job is completed.
4. THE Platform SHALL prevent a user from rating the same counterpart more than once per job listing.
5. WHEN a new rating is submitted, THE Platform SHALL recalculate and update the recipient's aggregate Rating immediately.

---

### Requirement 10: Mobile-First UI Navigation

**User Story:** As a mobile user, I want intuitive bottom navigation, so that I can move between key sections of the platform with one thumb.

#### Acceptance Criteria

1. THE Bottom_Nav SHALL be visible and fixed to the bottom of the viewport on screen widths below 768px.
2. THE Bottom_Nav SHALL contain navigation items for: Feed, Post a Job, My Profile, and Notifications.
3. WHEN a Bottom_Nav item is tapped, THE Platform SHALL navigate to the corresponding page without a full page reload.
4. WHILE a user is on a page corresponding to a Bottom_Nav item, THE Platform SHALL highlight that item as active.
5. THE Platform SHALL replace the Bottom_Nav with a top horizontal navigation bar on screen widths of 768px and above.

---

### Requirement 11: Notifications

**User Story:** As a user, I want in-platform notifications, so that I am informed of activity relevant to my listings or applications.

#### Acceptance Criteria

1. THE Platform SHALL generate a notification for a Poster when a Seeker applies to one of their job listings.
2. THE Platform SHALL generate a notification for a Seeker when a Poster views their application.
3. THE Platform SHALL display an unread notification count badge on the Notifications navigation item.
4. WHEN a user views the Notifications page, THE Platform SHALL mark all displayed notifications as read and remove the unread badge.
5. THE Platform SHALL retain notifications for a minimum of 30 days before deletion.

---

### Requirement 12: Database Schema Specification Document

**User Story:** As a developer, I want a formal database schema document, so that I can implement the Supabase PostgreSQL tables correctly.

#### Acceptance Criteria

1. THE Platform's `database_schema.md` SHALL define tables for: `users`, `jobs`, `tags`, `job_tags`, `subscriptions`, `applications`, `ratings`, and `notifications`.
2. THE `database_schema.md` SHALL specify column names, data types, nullability, primary keys, and foreign key relationships for each table.
3. THE `database_schema.md` SHALL include Row Level Security (RLS) policy descriptions for each table.

---

### Requirement 13: Payment Flow Specification Document

**User Story:** As a developer, I want a formal payment flow document, so that I can implement the subscription gate and Payment_Provider integration correctly.

#### Acceptance Criteria

1. THE Platform's `payment_flow.md` SHALL describe the end-to-end subscription purchase flow from user intent to Subscription activation.
2. THE `payment_flow.md` SHALL describe how the Subscription_Gate checks subscription status before allowing gated actions.
3. THE `payment_flow.md` SHALL describe the webhook or callback handling logic for successful and failed payment events from the Payment_Provider.

---

### Requirement 14: UI Component Map Specification Document

**User Story:** As a developer, I want a formal UI component map, so that I can build the mobile-first interface consistently.

#### Acceptance Criteria

1. THE Platform's `ui_component_map.md` SHALL list all major UI components including: Bottom_Nav, Job_Card, Tag_Cloud, Profile_Card, Portfolio_Item, Subscription_Banner, Notification_Badge, and Application_List.
2. THE `ui_component_map.md` SHALL describe each component's props, responsive behaviour, and the page(s) it appears on.
3. THE `ui_component_map.md` SHALL specify which components are client-side interactive (requiring React state or real-time subscriptions) versus static server-rendered.
