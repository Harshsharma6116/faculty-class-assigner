'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Basic title extraction from pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return 'Dashboard';
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex-1 flex">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        )}
        
        <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-800 pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {session?.user?.name || 'User'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {session?.user?.role || 'Role'}
            </span>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-200">
            <User className="h-5 w-5" />
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 ml-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/50 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
