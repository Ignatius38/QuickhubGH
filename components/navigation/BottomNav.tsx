'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, User, Bell } from 'lucide-react';
import NotificationBadge from './NotificationBadge';

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-[#1E293B] border-t border-[#334155] fixed bottom-0 left-0 right-0 z-50">
      <div className="flex justify-around items-center px-4 py-3">
        <Link
          href="/feed"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
            isActive('/feed')
              ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <Home size={24} />
          <span className="text-xs font-medium">Feed</span>
        </Link>

        <Link
          href="/jobs/new"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
            isActive('/jobs/new')
              ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <Plus size={24} />
          <span className="text-xs font-medium">Post a Job</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
            isActive('/profile') || isActive('/profile/edit')
              ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <User size={24} />
          <span className="text-xs font-medium">My Profile</span>
        </Link>

        <Link
          href="/notifications"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition relative ${
            isActive('/notifications')
              ? 'text-[#F59E0B] bg-[#0F172A] border border-[#334155]'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A]'
          }`}
        >
          <Bell size={24} />
          <NotificationBadge />
          <span className="text-xs font-medium">Notifications</span>
        </Link>
      </div>
    </nav>
  );
}
