'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, User, Bell } from 'lucide-react';
import NotificationBadge from './NotificationBadge';

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#1E293B] border-b border-[#334155] sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/feed" className="text-2xl font-bold text-[#F59E0B]">
            QuickHubGH
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="/feed"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive('/feed')
                  ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
              }`}
            >
              <Home size={20} />
              <span className="font-medium">Feed</span>
            </Link>

            <Link
              href="/jobs/new"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive('/jobs/new')
                  ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
              }`}
            >
              <Plus size={20} />
              <span className="font-medium">Post a Job</span>
            </Link>

            <Link
              href="/profile"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                isActive('/profile') || isActive('/profile/edit')
                  ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
              }`}
            >
              <User size={20} />
              <span className="font-medium">My Profile</span>
            </Link>

            <Link
              href="/notifications"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition relative ${
                isActive('/notifications')
                  ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
              }`}
            >
              <Bell size={20} />
              <NotificationBadge />
              <span className="font-medium">Notifications</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
