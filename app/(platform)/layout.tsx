import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/navigation/BottomNav';
import TopNav from '@/components/navigation/TopNav';

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A]">
      {/* Top Navigation - visible on desktop (md and above) */}
      <div className="hidden md:block">
        <TopNav />
      </div>

      {/* Main content - with padding for bottom nav on mobile */}
      <main className="flex-1 pb-20 md:pb-0 bg-[#0F172A]">
        {children}
      </main>

      {/* Bottom Navigation - visible on mobile only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
