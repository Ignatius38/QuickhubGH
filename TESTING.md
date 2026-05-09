# Testing the QuickHubGH MVP

## Authentication Flow Testing

### Prerequisites
1. Ensure you have a `.env.local` file with valid Supabase credentials
2. Google OAuth must be configured in your Supabase dashboard
3. Run the development server: `npm run dev`

### Manual Test Steps

#### 1. Landing Page
- [ ] Navigate to `http://localhost:3000`
- [ ] Verify the landing page displays with:
  - QuickHubGH branding
  - Value proposition text
  - "Sign in with Google" button with Google logo
  - Three feature cards (Post Jobs, Find Work, No Commission)

#### 2. Google Sign-In Flow
- [ ] Click the "Sign in with Google" button
- [ ] Verify you're redirected to Google's OAuth consent screen
- [ ] Select a Google account
- [ ] Grant permissions when prompted
- [ ] Verify you're redirected back to the app

#### 3. Authenticated Feed Page
- [ ] After successful sign-in, verify you land on `/feed`
- [ ] Verify the page displays:
  - Welcome message with your email address
  - Success confirmation message
  - "Coming Soon" features list
- [ ] Verify navigation is visible:
  - **Mobile (< 768px)**: Bottom navigation bar with 4 icons
  - **Desktop (≥ 768px)**: Top navigation bar with links and Sign Out button

#### 4. Navigation Testing
- [ ] Click each navigation item and verify it navigates correctly:
  - Feed → `/feed`
  - Post Job → `/jobs/new` (placeholder page)
  - Profile → `/profile/edit` (placeholder page)
  - Notifications → `/notifications` (placeholder page)
- [ ] Verify active state highlighting works (current page is highlighted)

#### 5. Sign Out Flow
- [ ] On desktop, click the "Sign Out" button in the top navigation
- [ ] Verify you're redirected to the landing page (`/`)
- [ ] Verify you're signed out (try accessing `/feed` directly - should redirect to `/`)

#### 6. Protected Route Testing
- [ ] Sign out completely
- [ ] Try to access `/feed` directly by typing the URL
- [ ] Verify you're redirected to the landing page
- [ ] Repeat for other protected routes: `/jobs/new`, `/profile/edit`, `/notifications`

#### 7. Error Handling
- [ ] If Google OAuth fails (deny permissions), verify:
  - You're redirected to `/auth/error`
  - An error message is displayed
  - You can navigate back to the landing page

### Expected Results
✅ All authentication flows work without errors
✅ Protected routes are properly secured
✅ Navigation works on both mobile and desktop
✅ Sign out functionality works correctly
✅ Error states are handled gracefully

### Common Issues

**Issue**: "Sign in with Google" button does nothing
- **Solution**: Check browser console for errors. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

**Issue**: Redirected to error page after Google sign-in
- **Solution**: Verify Google OAuth is properly configured in Supabase dashboard with correct redirect URLs

**Issue**: Can access `/feed` without signing in
- **Solution**: Check that middleware is running. Verify `middleware.ts` exists and is not being bypassed

**Issue**: Infinite redirect loop
- **Solution**: Clear browser cookies and try again. Check Supabase session is being properly set

## Next Steps
Once authentication is working:
1. Build user profile system (Task 5)
2. Implement subscription gate (Task 6)
3. Create job listing system (Task 8)
4. Add real-time feed functionality (Task 8.3)
