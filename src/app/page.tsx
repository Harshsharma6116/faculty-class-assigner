import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Users, BookOpen, DoorOpen } from 'lucide-react';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'FACULTY') {
    redirect('/faculty-dashboard');
  }

  // Fetch real-time counts from the database concurrently
  const [facultyCount, subjectCount, roomCount] = await Promise.all([
    prisma.faculty.count({ where: { isActive: true } }),
    prisma.subject.count(),
    prisma.room.count(),
  ]);

  return (
    <ProtectedLayout>
      {/* Main Container mirroring the earlier playful layout but with Ethereal glassmorphism */}
      <div className="flex flex-col h-full space-y-16 py-4 md:py-12 text-foreground relative z-10">
        
        {/* Hero Section */}
        <div className="relative flex flex-col items-center justify-center text-center z-10 pt-10">
          
          {/* Ambient Glowing Orb Behind Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[120%] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          {/* Micro-Header */}
          <span className="text-sm md:text-base font-semibold tracking-[0.3em] uppercase text-primary mb-6 drop-shadow-sm">
            Intelligent Allocation Platform
          </span>
          
          {/* Massive Bubble Text */}
          <h1 className="text-7xl md:text-[9rem] font-bold tracking-tight leading-[0.9]" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="bg-gradient-to-br from-foreground to-foreground/40 bg-clip-text text-transparent drop-shadow-sm">
              Syncadia
            </span>
            <br/>
            <span className="bg-gradient-to-r from-primary via-indigo-400 to-blue-500 bg-clip-text text-transparent drop-shadow-md">
              Grid
            </span>
          </h1>
          
          {/* CTA Button */}
          <div className="mt-16 md:mt-24 z-30">
            <Link href="/allocation" className="inline-block bg-primary text-primary-foreground px-10 py-5 rounded-full font-bold text-2xl hover:scale-105 transition-transform shadow-[0_8px_32px_rgba(79,70,229,0.4)] hover:shadow-[0_12px_48px_rgba(79,70,229,0.6)] font-sans">
              Manage Now
            </Link>
          </div>
        </div>

        {/* Bottom Pastel Cards Grid (Clean Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-16 px-4">
          
          {/* Highlight Card */}
          <div className="col-span-1 md:col-span-2 xl:col-span-1 rounded-[2.5rem] p-8 flex flex-col justify-end text-foreground border border-border backdrop-blur-lg shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--card) 0%, transparent 100%)' }}>
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <h2 className="text-3xl md:text-4xl font-bold leading-tight drop-shadow-sm relative z-10" style={{ fontFamily: 'var(--font-heading)' }}>
              Smart,<br/>perfect allocation<br/>for everyone.
            </h2>
          </div>

          {/* Stat Card 1 - Faculty (Blue Theme) */}
          <div className="bg-card/40 backdrop-blur-lg text-foreground rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="font-bold text-xl opacity-90 font-sans">Total Faculties</h3>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:-rotate-6 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-500 ease-out">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="text-5xl font-bold drop-shadow-sm mt-4 relative z-10" style={{ fontFamily: 'var(--font-heading)' }}>
              {facultyCount}
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"/>
          </div>

          {/* Stat Card 2 - Subjects (Fuchsia Theme) */}
          <div className="bg-card/40 backdrop-blur-lg text-foreground rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="font-bold text-xl opacity-90 font-sans">Active Subjects</h3>
              <div className="h-12 w-12 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/40 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all duration-500 ease-out">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="text-5xl font-bold drop-shadow-sm mt-4 relative z-10" style={{ fontFamily: 'var(--font-heading)' }}>
              {subjectCount}
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-fuchsia-500/10 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"/>
          </div>

          {/* Stat Card 3 - Classrooms (Amber Theme) */}
          <div className="bg-card/40 backdrop-blur-lg text-foreground rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-border flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <h3 className="font-bold text-xl opacity-90 font-sans">Classrooms</h3>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 group-hover:-rotate-12 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-500 ease-out">
                <DoorOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="text-5xl font-bold drop-shadow-sm mt-4 relative z-10" style={{ fontFamily: 'var(--font-heading)' }}>
              {roomCount}
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"/>
          </div>

        </div>
      </div>
      
      {/* Background ambient splashes (Retained for depth) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] left-[10%] w-32 h-32 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] w-48 h-48 bg-primary/20 rounded-full blur-[100px]" />
      </div>
    </ProtectedLayout>
  );
}
