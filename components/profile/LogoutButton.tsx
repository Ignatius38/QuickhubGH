'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase-client';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError(error.message);
        console.error('Logout error:', error);
      } else {
        // Redirect to landing page after successful logout
        router.push('/');
        router.refresh(); // Refresh to update auth state
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-500/10 hover:border-red-600 hover:text-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LogOut size={18} />
        {isLoading ? 'Logging out...' : 'Logout'}
      </button>
      
      {error && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}