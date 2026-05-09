'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      setError('Configuration error');
      return;
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting user:', userError);
          setUnreadCount(0);
          return;
        }

        if (!user) {
          setUnreadCount(0);
          return;
        }

        const { count, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('read_at', null);

        if (countError) {
          console.error('Error fetching notification count:', countError);
          setUnreadCount(0);
          return;
        }

        setUnreadCount(count || 0);
        setError(null);
      } catch (err) {
        console.error('Unexpected error fetching notifications:', err);
        setUnreadCount(0);
        setError('Failed to load notifications');
      }
    };

    fetchUnreadCount();

    // Subscribe to new notifications (async)
    const setupSubscription = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          return () => {};
        }

        const channel = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              setUnreadCount((prev) => prev + 1);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // Refetch count when notifications are updated (marked as read)
              fetchUnreadCount();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Subscribed to notifications channel');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Failed to subscribe to notifications channel');
            }
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error('Error setting up notification subscription:', err);
        return () => {};
      }
    };

    const cleanupPromise = setupSubscription();
    
    return () => {
      cleanupPromise.then(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, []);

  if (error) {
    // Don't show badge if there's an error
    return null;
  }

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
