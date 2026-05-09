# UI Component Map Specification

## Overview

This document provides a comprehensive inventory of all major UI components in the QuickHubGH platform. It describes each component's props, behavior, rendering strategy (client-side vs server-rendered), responsive behavior, and page locations. The platform follows a mobile-first design philosophy with components optimized for viewport widths from 320px to 1440px.

## Component Inventory

### Navigation Components

#### `BottomNav`
**Description**: Mobile-first navigation bar fixed to the bottom of the viewport. Replaced by `TopNav` on desktop.

**File Location**: `components/navigation/BottomNav.tsx`

**Props**:
```typescript
interface BottomNavProps {
  currentPath: string; // Current route path for active state
  unreadCount?: number; // Number of unread notifications
}
```

**Behavior**:
- Fixed to `bottom-0` with `z-50` for overlay priority
- Four navigation items: Feed (home icon), Post Job (plus icon), My Profile (person icon), Notifications (bell icon + badge)
- Active item highlighted with brand color using `currentPath` prop
- Hidden on screens ≥768px (`hidden md:hidden`)

**Rendering Strategy**: Client component (requires `usePathname` for active state)

**Responsive Behavior**:
- **Mobile (<768px)**: Visible, full-width bottom navigation
- **Tablet/Desktop (≥768px)**: Hidden, replaced by `TopNav`

**Page Locations**: All `(platform)` layout pages (`/feed`, `/jobs/*`, `/profile/*`, `/notifications`)

---

#### `TopNav`
**Description**: Desktop navigation bar displayed at the top of the viewport. Replaces `BottomNav` on larger screens.

**File Location**: `components/navigation/TopNav.tsx`

**Props**:
```typescript
interface TopNavProps {
  currentPath: string; // Current route path for active state
  unreadCount?: number; // Number of unread notifications
  user?: UserProfile; // Optional user profile data
}
```

**Behavior**:
- Horizontal bar at top of viewport
- Contains logo, same four navigation items as `BottomNav`, and user profile dropdown
- Active state highlighting based on `currentPath`
- Hidden on screens <768px (`hidden md:flex`)

**Rendering Strategy**: Server-rendered shell with client-side hydration for interactive elements

**Responsive Behavior**:
- **Mobile (<768px)**: Hidden
- **Tablet/Desktop (≥768px)**: Visible horizontal navigation

**Page Locations**: All `(platform)` layout pages

---

#### `NotificationBadge`
**Description**: Red circle badge displaying unread notification count, overlaid on navigation bell icon.

**File Location**: `components/navigation/NotificationBadge.tsx`

**Props**:
```typescript
interface NotificationBadgeProps {
  count: number; // Number of unread notifications
  className?: string; // Additional CSS classes
}
```

**Behavior**:
- Displays count if >0, empty circle if 0
- Subscribes to Supabase Realtime `notifications` table for `INSERT` events filtered by `user_id = auth.uid()`
- Auto-updates when new notifications arrive
- Used within both `BottomNav` and `TopNav`

**Rendering Strategy**: Client component (requires real-time WebSocket subscription)

**Responsive Behavior**: Consistent appearance across all viewports

**Page Locations**: Embedded in `BottomNav` and `TopNav` components

---

### Feed Components

#### `FeedClient`
**Description**: Main feed component displaying real-time job listings with WebSocket subscription.

**File Location**: `components/feed/FeedClient.tsx`

**Props**:
```typescript
interface FeedClientProps {
  initialJobs: Job[]; // Initial batch of jobs from server
  initialTags: Tag[]; // Available tags for filtering
  userId?: string; // Current user ID for subscription checks
}
```

**Behavior**:
- Subscribes to Supabase Realtime channel for `INSERT` events on `jobs` table with `status='open'`
- Implements cursor-based pagination (loads 20 jobs per batch)
- Manages selected tags state for filtering
- Prepend new jobs to list in real-time without page reload
- Shows loading indicator during pagination

**Rendering Strategy**: Client component (requires WebSocket connection and client-side state)

**Responsive Behavior**:
- **Mobile (<768px)**: Single-column, full-width cards
- **Tablet (768px-1024px)**: Two-column grid
- **Desktop (≥1024px)**: Two-column grid with sidebar for `TagCloud`

**Page Locations**: `/feed` page

---

#### `JobCard`
**Description**: UI card component representing a single job listing in the feed.

**File Location**: `components/feed/JobCard.tsx`

**Props**:
```typescript
interface JobCardProps {
  job: Job; // Job data including title, poster, location, budget, tags
  onClick?: () => void; // Optional click handler
  compact?: boolean; // Compact mode for lists
}
```

**Behavior**:
- Displays: job title, poster display name, location, budget (GHS), Skill_Tags as pill badges, time since posting
- Formats `created_at` as relative time (e.g., "2h ago")
- Navigates to `/jobs/[id]` on click
- Tag pills are non-interactive display elements

**Rendering Strategy**: Server component (static data display)

**Responsive Behavior**:
- **Mobile (<768px)**: Full-width card with stacked layout
- **Tablet/Desktop (≥768px)**: Fixed-height card with horizontal layout

**Page Locations**: `FeedClient`, application lists, user profile pages

---

#### `TagCloud`
**Description**: Interactive component displaying available Skill_Tags as toggle buttons for filtering.

**File Location**: `components/feed/TagCloud.tsx`

**Props**:
```typescript
interface TagCloudProps {
  tags: Tag[]; // Available tags
  selectedTags: number[]; // Array of selected tag IDs
  onFilterChange: (selectedTagIds: number[]) => void; // Callback when selection changes
  className?: string; // Additional CSS classes
}
```

**Behavior**:
- Displays tags as interactive toggle buttons
- Selected tags highlighted with brand color
- Emits `onFilterChange` callback when selection changes
- Supports both client-side filtering (instant) and server-side filtering (for pagination)

**Rendering Strategy**: Client component (manages selected tag state)

**Responsive Behavior**:
- **Mobile (<768px)**: Horizontal scrollable row
- **Tablet/Desktop (≥768px)**: Wrapping grid layout
- **Desktop (≥1024px)**: Displayed in sidebar on feed page

**Page Locations**: `/feed` page (sidebar on desktop), profile editing page

---

### Profile Components

#### `ProfileCard`
**Description**: Component displaying user profile information for public viewing.

**File Location**: `components/profile/ProfileCard.tsx`

**Props**:
```typescript
interface ProfileCardProps {
  user: UserProfile; // Complete user profile data
  showActions?: boolean; // Whether to show edit/action buttons
  isOwnProfile?: boolean; // Whether this is the current user's profile
  compact?: boolean; // Compact mode for lists
}
```

**Behavior**:
- Displays: display name, role badge (Seeker/Poster), location, avg_rating (or "No ratings yet"), bio, Skill_Tags
- Shows edit button if `isOwnProfile=true` and `showActions=true`
- Role-specific information display (Seeker vs Poster)
- Used in public profile pages and application lists

**Rendering Strategy**: Server component (static data display)

**Responsive Behavior**:
- **Mobile (<768px)**: Full-width card with stacked layout
- **Tablet/Desktop (≥768px)**: Fixed-width card with grid layout

**Page Locations**: `/profile/[id]` page, `ApplicationList` component

---

#### `EditProfileForm`
**Description**: Form component for editing user profile information.

**File Location**: `components/profile/EditProfileForm.tsx`

**Props**:
```typescript
interface EditProfileFormProps {
  initialData: UserProfile; // Current user profile data
  availableTags: Tag[]; // Available Skill_Tags for selection
  onSubmit: (data: ProfileUpdateData) => Promise<void>; // Form submission handler
  onCancel?: () => void; // Optional cancel handler
}
```

**Behavior**:
- Pre-fills form with `initialData`
- Validates bio length (max 500 characters)
- Integrates `SkillTagSelector` for tag management
- Shows validation errors inline
- Disables submit button during submission

**Rendering Strategy**: Client component (form state management)

**Responsive Behavior**: Full-width form on all viewports

**Page Locations**: `/profile/edit` page

---

#### `SkillTagSelector`
**Description**: Component for selecting Skill_Tags with search and multi-select capabilities.

**File Location**: `components/profile/SkillTagSelector.tsx`

**Props**:
```typescript
interface SkillTagSelectorProps {
  availableTags: Tag[]; // All available tags
  selectedTags: number[]; // Currently selected tag IDs
  onChange: (selectedTagIds: number[]) => void; // Selection change callback
  maxSelection?: number; // Maximum number of selectable tags
  required?: boolean; // Whether at least one tag is required
}
```

**Behavior**:
- Displays tags as selectable pills
- Supports search/filtering of tags
- Enforces `maxSelection` limit (if provided)
- Shows selected count
- Required validation if `required=true`

**Rendering Strategy**: Client component (selection state management)

**Responsive Behavior**:
- **Mobile (<768px)**: Full-width dropdown with search
- **Tablet/Desktop (≥768px)**: Multi-column selectable grid

**Page Locations**: `EditProfileForm`, job creation/edit forms

---

#### `PortfolioItem`
**Description**: Component displaying a single portfolio item with optional image and description.

**File Location**: `components/profile/PortfolioItem.tsx`

**Props**:
```typescript
interface PortfolioItemProps {
  item: PortfolioItem; // Portfolio item data
  editable?: boolean; // Whether item can be edited/deleted
  onEdit?: (item: PortfolioItem) => void; // Edit callback
  onDelete?: (itemId: string) => void; // Delete callback
  onClick?: (item: PortfolioItem) => void; // Click handler
}
```

**Behavior**:
- Displays: title, optional image (Supabase Storage URL), optional description, optional link
- Shows edit/delete buttons if `editable=true`
- Opens image in lightbox on click
- External links open in new tab

**Rendering Strategy**: Server component (static content display)

**Responsive Behavior**:
- **Mobile (<768px)**: Full-width card
- **Tablet/Desktop (≥768px)**: Fixed-width card in grid

**Page Locations**: Portfolio grid on Seeker profile pages

---

#### `PortfolioManager`
**Description**: Component for managing portfolio items with add/edit/delete functionality.

**File Location**: `components/profile/PortfolioManager.tsx`

**Props**:
```typescript
interface PortfolioManagerProps {
  userId: string; // User ID for portfolio ownership
  initialItems: PortfolioItem[]; // Existing portfolio items
  maxItems?: number; // Maximum allowed items (default: 20)
}
```

**Behavior**:
- Displays grid of `PortfolioItem` components
- Provides "Add Portfolio Item" button
- Enforces `maxItems` limit (shows message when limit reached)
- Integrates with `addPortfolioItem` Server Action
- Shows loading states during operations

**Rendering Strategy**: Client component (CRUD operations)

**Responsive Behavior**: Responsive grid (1 column mobile, 2 columns tablet, 3 columns desktop)

**Page Locations**: Seeker profile edit page

---

### Job Components

#### `ApplicationList`
**Description**: Component listing all applications for a job with applicant profiles and status management.

**File Location**: `components/jobs/ApplicationList.tsx`

**Props**:
```typescript
interface ApplicationListProps {
  jobId: string; // Job ID for filtering applications
  applications: ApplicationWithUser[]; // Applications with user data
  isPoster: boolean; // Whether current user is the job poster
  onStatusUpdate?: (applicationId: string, newStatus: string) => Promise<void>; // Status update callback
}
```

**Behavior**:
- Lists each applicant's `ProfileCard`, Skill_Tags, and Rating
- Shows "Mark as Viewed" and "Mark as Engaged" buttons if `isPoster=true`
- Updates application status via Server Action
- Shows loading state during status updates
- Sorts applications by applied date (newest first)

**Rendering Strategy**: Server component for initial render, client-side status updates

**Responsive Behavior**: Full-width list on all viewports

**Page Locations**: `/jobs/[id]` page (for job poster)

---

### Subscription Components

#### `SubscriptionBanner`
**Description**: Contextual banner displayed when user has no active subscription.

**File Location**: `components/ui/SubscriptionBanner.tsx`

**Props**:
```typescript
interface SubscriptionBannerProps {
  subscriptionStatus: SubscriptionStatus; // Current subscription status
  reason?: 'post' | 'apply' | 'general'; // Context for display message
  className?: string; // Additional CSS classes
}
```

**Behavior**:
- Shows current status: "No subscription" or "Subscription expired"
- Displays contextual CTA message based on `reason` prop
- Links to `/subscribe` page with appropriate query parameters
- Auto-hides when user obtains active subscription

**Rendering Strategy**: Server component (reads subscription status server-side)

**Responsive Behavior**: Full-width banner on all viewports

**Page Locations**: Feed page, profile page, job creation page (when blocked)

---

### Rating Components

#### `RatingForm`
**Description**: Modal form for submitting ratings (1-5) with star UI.

**File Location**: `components/ui/rating-form.tsx`

**Props**:
```typescript
interface RatingFormProps {
  jobId: string; // Job ID being rated
  rateeId: string; // User ID being rated
  raterId: string; // User ID submitting the rating
  onSuccess?: () => void; // Callback after successful submission
  onCancel?: () => void; // Callback when form is cancelled
  isOpen: boolean; // Whether modal is open
}
```

**Behavior**:
- Displays 5-star interactive rating input
- Validates score is between 1-5
- Prevents duplicate ratings per job
- Submits via `submitRating` Server Action
- Shows success/error messages
- Auto-closes on successful submission

**Rendering Strategy**: Client component (form state and validation)

**Responsive Behavior**: Centered modal on all viewports

**Page Locations**: Triggered when Poster closes a job

---

### UI Utility Components

#### `Button`
**Description**: Reusable button component with multiple variants and states.

**File Location**: `components/ui/button.tsx`

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

**Behavior**:
- Consistent styling across all button uses
- Loading state with spinner
- Icon support (left/right)
- Full-width option for mobile
- Accessible keyboard and screen reader support

**Rendering Strategy**: Client component (interactive)

**Responsive Behavior**: Adaptive sizing based on viewport

**Page Locations**: Used throughout application

---

## Component Rendering Strategy

### Server Components (Static)
- `JobCard` - Display job data
- `ProfileCard` - Display user profile
- `PortfolioItem` - Display portfolio content
- `SubscriptionBanner` - Display subscription status (server-checked)

### Client Components (Interactive)
- `BottomNav` - Navigation with active state
- `TopNav` - Desktop navigation
- `NotificationBadge` - Real-time updates
- `FeedClient` - WebSocket subscriptions
- `TagCloud` - Filter state management
- `EditProfileForm` - Form state
- `SkillTagSelector` - Selection state
- `PortfolioManager` - CRUD operations
- `ApplicationList` - Status updates
- `RatingForm` - Form validation
- `Button` - Interactive element

### Hybrid Components
- `ApplicationList` - Server-rendered list with client-side updates

## Responsive Layout System

### Breakpoints
- **Mobile**: < 768px (single-column)
- **Tablet**: 768px - 1024px (two-column grid)
- **Desktop**: ≥ 1024px (sidebar layout)

### Layout Patterns

#### Feed Page Layout
```
Mobile (<768px):
┌─────────────────┐
│     TopNav      │
├─────────────────┤
│   TagCloud      │
│   (scrollable)   │
├─────────────────┤
│   JobCard       │
│   JobCard       │
│   JobCard       │
├─────────────────┤
│    BottomNav    │
└─────────────────┘

Tablet (768px-1024px):
┌─────────────────┐
│     TopNav      │
├─────────────────┤
│   TagCloud      │
├───────┬─────────┤
│ Job   │  Job    │
│ Card  │  Card   │
├───────┼─────────┤
│ Job   │  Job    │
│ Card  │  Card   │
└───────┴─────────┘

Desktop (≥1024px):
┌─────────────────────────────────┐
│            TopNav               │
├──────────────┬──────────────────┤
│   TagCloud   │   JobCard        │
│   (sidebar)  │   JobCard        │
│              │   JobCard        │
│              │   JobCard        │
└──────────────┴──────────────────┘
```

#### Profile Page Layout
```
Mobile (<768px):
┌─────────────────┐
│   ProfileCard   │
├─────────────────┤
│  PortfolioGrid  │
│  (1 column)     │
└─────────────────┘

Tablet/Desktop (≥768px):
┌─────────────────────────────────┐
│   ProfileCard   │  Portfolio    │
│                 │  Grid         │
│                 │  (2-3 columns)│
└─────────────────────────────────┘
```

## Component Dependencies

### Data Dependencies
```
FeedClient
├── depends on: jobs, tags tables
├── uses: JobCard, TagCloud
└── real-time: Supabase Realtime

JobCard
├── depends on: jobs, users, tags tables
└── static data display

ProfileCard
├── depends on: users, user_tags, tags tables
└── static data display

ApplicationList
├── depends on: applications, users, user_tags, tags tables
└── uses: ProfileCard
```

### State Dependencies
```
TagCloud
├── state: selectedTags (number[])
└── emits: onFilterChange

EditProfileForm
├── state: formData, validationErrors
└── submits: updateProfile Server Action

PortfolioManager
├── state: portfolioItems, loading states
└── CRUD: addPortfolioItem Server Action
```

## Accessibility Features

### Keyboard Navigation
- All interactive components support keyboard navigation
- `Tab` order follows visual layout
- `Enter`/`Space` for button activation
- Arrow keys for rating star selection

### Screen Reader Support
- Semantic HTML elements throughout
- ARIA labels for interactive elements
- Live regions for dynamic updates (notifications)
- Proper heading hierarchy

### Color Contrast
- Minimum 4.5:1 contrast ratio for text
- 3:1 contrast ratio for interactive elements
- Color-blind friendly palette

### Focus Management
- Visible focus indicators
- Logical focus order
- Skip-to-content links
- Modal focus trapping

## Performance Considerations

### Code Splitting
- Dynamic imports for heavy components
- Route-based code splitting
- Lazy loading for below-the-fold content

### Image Optimization
- Next.js Image component for portfolio images
- Lazy loading for images
- WebP format with fallbacks
- Responsive image sizes

### Bundle Size
- Tree-shaking for unused components
- Component-level code splitting
- Minimal third-party dependencies

### Caching Strategy
- Static generation for profile pages
- ISR for job listings
- Client-side caching for user data
- CDN for static assets

## Testing Strategy

### Unit Tests
- Component rendering tests
- Prop validation tests
- State management tests
- Event handler tests

### Integration Tests
- Form submission flows
- Navigation flows
- Real-time update scenarios
- Authentication flows

### E2E Tests
- Complete user journeys
- Payment flow testing
- Cross-browser compatibility
- Mobile responsiveness

### Accessibility Tests
- Automated a11y scanning
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast verification