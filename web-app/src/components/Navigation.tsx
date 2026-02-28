'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/config';

export default function Navigation({ user }: { user: any }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Warehouses', href: '/warehouses', icon: '🏭' },
    { name: 'Inventory', href: '/inventory', icon: '📦' },
    { name: 'Devices', href: '/devices', icon: '📡' },
    { name: 'Alerts', href: '/alerts', icon: '🔔' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
              🏭 Smart Warehouse
            </Link>
            <div className="hidden md:flex gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg transition ${
                    pathname === item.href
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-300 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={() => auth.signOut()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
