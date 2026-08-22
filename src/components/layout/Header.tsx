'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProfileModal } from '@/components/features/profile/ProfileModal';

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return 'Dashboard';
  };

  return (
    <>
      <header className="h-16 bg-card/60 backdrop-blur-2xl border-b border-border flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex-1 flex">
          <h1 className="text-xl font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {getPageTitle()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
          )}
          
          <div className="relative border-l border-border pl-4">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">
                  {session?.user?.name || 'User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session?.user?.role || 'Role'}
                </span>
              </div>
              
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary ring-2 ring-transparent hover:ring-primary/50 transition-all overflow-hidden">
                {session?.user?.avatarUrl ? (
                  <img src={session.user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                
                <div className="absolute right-0 mt-3 w-48 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-lg z-50 overflow-hidden py-1">
                  <div className="px-4 py-2 border-b border-border/50 mb-1">
                    <p className="text-sm text-foreground font-medium truncate">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      signOut({ callbackUrl: '/login' });
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}

