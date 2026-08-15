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
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
        <span className="text-xl font-bold text-gray-900 dark:text-white truncate">
          Class Assigner
        </span>
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
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                }`}
              >
                <link.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive
                      ? 'text-blue-700 dark:text-blue-200'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
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
