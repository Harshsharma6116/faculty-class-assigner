'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen } from 'lucide-react';

export function FacultySidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', href: '/faculty-dashboard', icon: LayoutDashboard },
    { name: 'Preferences', href: '/faculty-dashboard/preferences', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-2xl border-r border-border hidden md:flex flex-col z-20">
      <div className="h-24 flex flex-col items-center justify-center border-b border-border/50 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex flex-col items-center">
          <span className="text-[1.75rem] font-bold text-foreground leading-none tracking-tight drop-shadow-sm" style={{ fontFamily: 'var(--font-heading)' }}>
            syncadia
          </span>
          <span className="text-[0.65rem] font-bold text-primary tracking-[0.3em] uppercase mt-1.5 opacity-90">
            faculty
          </span>
        </div>
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {links.map((link) => {
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/faculty-dashboard');
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                }`}
              >
                <link.icon
                  className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
