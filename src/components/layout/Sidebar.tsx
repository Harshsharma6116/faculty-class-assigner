'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  Building, 
  Users, 
  BookOpen, 
  DoorOpen, 
  Users2, 
  Calendar, 
  CheckCircle, 
  CalendarCheck 
} from 'lucide-react';

interface SidebarProps {
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DEPT_ADMIN';
}

import Image from 'next/image';

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const allLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN'] },
    { name: 'Schools', href: '/schools', icon: Building2, roles: ['SUPER_ADMIN'] },
    { name: 'Departments', href: '/departments', icon: Building, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
    { name: 'Faculty', href: '/faculty', icon: Users, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN'] },
    { name: 'Subjects', href: '/subjects', icon: BookOpen, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN'] },
    { name: 'Rooms', href: '/rooms', icon: DoorOpen, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
    { name: 'Batches', href: '/batches', icon: Users2, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DEPT_ADMIN'] },
    { name: 'Semesters', href: '/semesters', icon: Calendar, roles: ['SUPER_ADMIN'] },
    { name: 'Eligibility', href: '/eligibility', icon: CheckCircle, roles: ['SUPER_ADMIN'] },
    { name: 'Allocation', href: '/allocation', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN'] },
  ];

  const visibleLinks = allLinks.filter((link) => link.roles.includes(role));

  return (
    <aside className="w-64 bg-card/60 backdrop-blur-2xl border-r border-border hidden md:flex flex-col z-20">
      <div className="h-24 flex flex-col items-center justify-center border-b border-border/50 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex flex-col items-center">
          <span className="text-[1.75rem] font-bold text-foreground leading-none tracking-tight drop-shadow-sm" style={{ fontFamily: 'var(--font-heading)' }}>
            syncadia
          </span>
          <span className="text-[0.65rem] font-bold text-primary tracking-[0.3em] uppercase mt-1.5 opacity-90">
            grid
          </span>
        </div>
      </div>
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary-foreground dark:text-primary-foreground shadow-sm'
                    : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <link.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                  aria-hidden="true"
                />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
