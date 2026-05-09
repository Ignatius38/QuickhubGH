# Google OAuth Configuration for QuickHubGH Platform

## Task 3.1: Configure Supabase Auth with Google OAuth

### Overview
This document provides step-by-step instructions for configuring Google OAuth as the sole authentication method for the QuickHubGH platform using Supabase.

### Requirements
- Requirements 1.1, 1.2: Google OAuth as sole authentication method
- Design Document: Authentication Flow section

### Step 1: Set Up Google Cloud Console Project

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project named "QuickHubGH Authentication"
   - Note the Project ID for reference

2. **Configure OAuth Consent Screen**:
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Choose "External" user type (for public apps)
   - Fill in:
     - App name: "QuickHubGH"
     - User support email: [your-email@example.com]
     - Developer contact information: [your-email@example.com]
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (optional during development)
   - Save and continue

3. **Create OAuth 2.0 Credentials**:
   - Navigate to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "QuickHubGH Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-production-domain.com/auth/callback` (production)
     - `https://[your-supabase-project-id].supabase.co/auth/v1/callback` (Supabase callback)
   - Click "Create" and note:
     - **Client ID**: [your-google-client-id]
     - **Client Secret**: [your-google-client-secret]

### Step 2: Configure Supabase Auth

1. **Log in to Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to "Authentication" → "Providers"

2. **Enable Google Provider**:
   - Find "Google" in the provider list and toggle it ON
   - Fill in the configuration:
     - Client ID: [your-google-client-id from Step 1]
     - Client Secret: [your-google-client-secret from Step 1]
   - Configure additional settings:
     - Enable "Email confirmation": OFF (Google already verifies emails)
     - Enable "Link accounts": ON (allows users to link multiple providers)
   - Save configuration

3. **Configure Site URL**:
   - Navigate to "Authentication" → "URL Configuration"
   - Set "Site URL":
     - Development: `http://localhost:3000`
     - Production: `https://your-production-domain.com`
   - Set "Additional Redirect URLs":
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain.com/auth/callback`

### Step 3: Update Environment Variables

Update your `.env.local` file with actual Supabase credentials:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-supabase-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-supabase-service-role-key]

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_...  # Replace with actual Paystack secret key
PAYSTACK_PUBLIC_KEY=pk_live_...   # Replace with actual Paystack public key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production

# Payment Test Mode
PAYMENT_TEST_MODE=false

# Application Settings
NODE_ENV=development
```

To find your Supabase credentials:
1. Go to Supabase project dashboard
2. Navigate to "Settings" → "API"
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secure!)

### Step 4: Verify Configuration

1. **Test OAuth Flow**:
   - Start the development server: `npm run dev`
   - Navigate to `http://localhost:3000`
   - Click "Sign in with Google"
   - You should be redirected to Google OAuth consent screen
   - After consent, you should be redirected back to `/feed`

2. **Verify Callback URLs**:
   - Ensure the callback URL in Google Cloud Console matches:
     - `https://[your-supabase-project-id].supabase.co/auth/v1/callback`
   - Ensure Supabase redirect URL is configured correctly

3. **Check Session Management**:
   - Verify middleware is refreshing sessions
   - Check that cookies are being set properly
   - Verify users are created in `auth.users` table

### Step 5: Production Deployment

For production deployment:

1. **Update Google Cloud Console**:
   - Submit OAuth consent screen for verification (if needed)
   - Add production domain to authorized origins and redirect URIs
   - Update "Publishing status" to "Production"

2. **Update Supabase Configuration**:
   - Update Site URL to production domain
   - Add production redirect URLs
   - Review security settings

3. **Update Environment Variables**:
   - Set `NEXT_PUBLIC_APP_URL` to production domain
   - Set `NODE_ENV=production`
   - Use production Paystack keys

### Troubleshooting

**Common Issues**:

1. **Redirect URI mismatch**:
   ```
   Error: redirect_uri_mismatch
   ```
   - Solution: Ensure all redirect URIs in Google Cloud Console match exactly

2. **Invalid OAuth client**:
   ```
   Error: invalid_client
   ```
   - Solution: Verify Client ID and Client Secret are correct in Supabase

3. **CORS errors**:
   ```
   Error: Cross-Origin Request Blocked
   ```
   - Solution: Add domain to Google Cloud Console authorized origins

4. **Session not persisting**:
   - Solution: Check middleware configuration and cookie settings

### References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Guide](https://nextjs.org/docs/authentication)

### Completion Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Supabase Google provider enabled
- [ ] Site URL and redirect URLs configured
- [ ] Environment variables updated
- [ ] OAuth flow tested successfully
- [ ] Production configuration prepared (if applicable)

This completes Task 3.1: Configure Supabase Auth with Google OAuth.