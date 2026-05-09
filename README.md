# QuickHubGH Platform

A social-media-style gig economy platform built for the Ghanaian market. Built with Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL + Auth + Realtime), and Paystack for Ghana-local payments.

## Features

- **Google OAuth Authentication**: Secure authentication via Supabase Auth with Google OAuth
- **Subscription-Gated Platform**: Users pay a flat subscription fee to post or apply for jobs
- **Real-Time Job Feed**: Live updates via Supabase Realtime WebSocket channels
- **Mobile-First Design**: Optimized for 320px viewports and up
- **Ghana-Local Payments**: Paystack integration for MoMo and card payments in GHS

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Payments**: Paystack API (MoMo & card payments)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Paystack account (for production payments)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables template:
   ```bash
   cp .env.local.example .env.local
   ```
4. Configure your environment variables in `.env.local`

### Environment Variables

See `.env.local.example` for all required variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `PAYSTACK_SECRET_KEY`: Your Paystack secret key
- `PAYSTACK_PUBLIC_KEY`: Your Paystack public key
- `NEXT_PUBLIC_APP_URL`: Your application URL (e.g., http://localhost:3000)

### Google OAuth Setup

1. **Configure Google Cloud Console**:
   - Create a new project at [Google Cloud Console](https://console.cloud.google.com/)
   - Configure OAuth consent screen (External user type)
   - Create OAuth 2.0 credentials (Web application type)
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)
     - `https://[your-supabase-project-id].supabase.co/auth/v1/callback`

2. **Configure Supabase Auth**:
   - In Supabase Dashboard, go to Authentication → Providers
   - Enable Google provider
   - Enter your Google Client ID and Client Secret
   - Configure Site URL and redirect URLs

Detailed instructions: [docs/supabase-google-oauth-setup.md](docs/supabase-google-oauth-setup.md)

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/                    # Next.js App Router pages
  (public)/            # Public routes (landing page, auth)
  (platform)/          # Authenticated platform routes
  api/                 # API routes (webhooks, subscriptions)
components/            # Reusable UI components
lib/                   # Utility functions and helpers
middleware.ts          # Next.js middleware (auth, subscription gate)
```

## License

MIT