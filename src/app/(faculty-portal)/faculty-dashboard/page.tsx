import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/helpers';
import { Clock, MapPin, CalendarDays, BookOpen } from 'lucide-react';

export default async function FacultyDashboard() {
  const user = await requireAuth(['FACULTY']);

  // Fetch the classes assigned to this faculty member
  const assignedClasses = await prisma.classRequirement.findMany({
    where: { assignedFacultyId: user.id },
    include: {
      subject: true,
      batch: true,
      room: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            My Schedule
          </h1>
          <p className="text-muted-foreground mt-2">
            View your assigned classes and academic load for the current semester.
          </p>
        </div>
      </div>

      {assignedClasses.length === 0 ? (
        <div className="rounded-[2rem] border border-border bg-card/40 backdrop-blur-md p-12 text-center shadow-sm">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-xl font-medium text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>No Classes Assigned Yet</h3>
          <p className="text-muted-foreground mt-2">
            You currently have no classes assigned. This might be because the allocation algorithm hasn't run yet, or your department hasn't finalized the timetable.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assignedClasses.map((cls) => (
            <div key={cls.id} className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{cls.subject.name}</h3>
                  <p className="text-sm text-primary font-medium tracking-wide mt-1">{cls.subject.code}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {cls.classType}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                <div className="flex items-center text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4 mr-2 opacity-70" />
                  Batch: {cls.batch.name}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 opacity-70" />
                  Room: {cls.room.name}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2 opacity-70" />
                  {cls.sessionsPerWeek} Sessions/Week
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
