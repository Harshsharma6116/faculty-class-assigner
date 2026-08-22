import { requireAuth } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db';
import { BookOpen, CalendarX } from 'lucide-react';

export default async function FacultyPreferencesPage() {
  const user = await requireAuth(['FACULTY']);

  // Fetch preferences
  const [preferredSubjects, unavailability] = await Promise.all([
    prisma.facultyPreferredSubject.findMany({
      where: { facultyId: user.id },
      include: { subject: true },
      orderBy: { preferenceRank: 'asc' }
    }),
    prisma.facultyUnavailability.findMany({
      where: { facultyId: user.id },
      orderBy: { startDate: 'asc' }
    })
  ]);

  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          My Preferences
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your preferred subjects and unavailability periods.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subject Preferences */}
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="w-6 h-6 text-fuchsia-500 mr-3" />
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Subjects</h2>
            </div>
            <button className="text-sm font-medium text-primary hover:underline">Add Preference</button>
          </div>
          
          {preferredSubjects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>No subject preferences added.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preferredSubjects.map((pref) => (
                <div key={pref.id} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50">
                  <div>
                    <h4 className="font-medium text-foreground">{pref.subject.name}</h4>
                    <p className="text-sm text-muted-foreground">{pref.subject.code}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium bg-fuchsia-500/10 text-fuchsia-500 px-3 py-1 rounded-full border border-fuchsia-500/20">
                      Rank {pref.preferenceRank}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unavailability */}
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CalendarX className="w-6 h-6 text-amber-500 mr-3" />
              <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Unavailability</h2>
            </div>
            <button className="text-sm font-medium text-primary hover:underline">Add Period</button>
          </div>
          
          {unavailability.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <CalendarX className="w-12 h-12 mb-4 opacity-20" />
              <p>No unavailability periods set.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unavailability.map((unavail) => (
                <div key={unavail.id} className="p-4 rounded-2xl bg-background/50 border border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground">
                      {new Date(unavail.startDate).toLocaleDateString()} - {new Date(unavail.endDate).toLocaleDateString()}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{unavail.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
