'use server';

import { createClientWithAsyncCookies } from '@/lib/supabase';

export async function markNotificationsRead() {
  try {
    const supabase = await createClientWithAsyncCookies();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Mark all unread notifications as read
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (updateError) {
      return { error: 'Failed to mark notifications as read' };
    }

    return { success: true };
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return { error: 'Internal server error' };
  }
}
