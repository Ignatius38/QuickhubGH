import { createClientWithAsyncCookies } from '@/lib/supabase';
import { markNotificationsRead } from '@/app/actions/notifications';
import type { Notification } from '@/lib/types';

export default async function NotificationsPage() {
  const supabase = await createClientWithAsyncCookies();
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Unauthorized</h1>
          <p className="text-gray-600">Please sign in to view notifications.</p>
        </div>
      );
    }

    // Fetch notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return (
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Error Loading Notifications</h1>
          <p className="text-gray-600">An error occurred while loading notifications.</p>
        </div>
      );
    }

    // Mark notifications as read
    await markNotificationsRead();

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getNotificationMessage = (notification: Notification) => {
      switch (notification.type) {
        case 'new_application':
          return `New application received for your job`;
        case 'application_viewed':
          const payload = notification.payload as any;
          if (payload?.status === 'engaged') {
            return `Your application has been engaged`;
          }
          return `Your application has been viewed`;
        case 'new_rating':
          return `You received a new rating`;
        case 'subscription_activated':
          return `Subscription activated`;
        default:
          return 'New notification';
      }
    };

    const getNotificationLink = (notification: Notification) => {
      const payload = notification.payload as any;
      switch (notification.type) {
        case 'new_application':
          return payload?.job_id ? `/jobs/${payload.job_id}` : null;
        case 'application_viewed':
          return payload?.job_id ? `/jobs/${payload.job_id}` : null;
        default:
          return null;
      }
    };

    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications && notifications.length > 0 && (
            <form action={async () => {
              await markNotificationsRead();
            }}>
              <button
                type="submit"
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            </form>
          )}
        </div>

        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You don't have any notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-4 ${notification.read_at ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <h3 className="font-medium text-gray-900">
                        {getNotificationMessage(notification)}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {formatDate(notification.created_at)}
                    </p>

                    {notification.type === 'new_application' && (
                      <p className="text-gray-700 text-sm">
                        Someone has applied to your job posting.
                      </p>
                    )}

                    {notification.type === 'application_viewed' && (
                      <p className="text-gray-700 text-sm">
                        The job poster has viewed your application.
                      </p>
                    )}

                    {notification.type === 'new_rating' && (
                      <p className="text-gray-700 text-sm">
                        You received a new rating for your work.
                      </p>
                    )}

                    {notification.type === 'subscription_activated' && (
                      <p className="text-gray-700 text-sm">
                        Your subscription is now active.
                      </p>
                    )}
                  </div>

                  {getNotificationLink(notification) && (
                    <a
                      href={getNotificationLink(notification)!}
                      className="ml-4 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading notifications page:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Error Loading Page</h1>
        <p className="text-gray-600">An error occurred while loading the page.</p>
      </div>
    );
  }
}