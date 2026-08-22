import { requireAuth } from '@/lib/auth/helpers';
import { prisma } from '@/lib/db';
import { User, Mail, Building, Award, Shield } from 'lucide-react';

export default async function FacultyProfilePage() {
  const user = await requireAuth(['FACULTY']);

  // Fetch full faculty details
  const faculty = await prisma.faculty.findUnique({
    where: { id: user.id },
    include: {
      department: true,
    }
  });

  if (!faculty) {
    return <div>Profile not found.</div>;
  }

  return (
    <div className="flex flex-col space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          My Profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and account settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-sm flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-inner">
              <User className="w-16 h-16 text-primary opacity-80" />
            </div>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              {faculty.fullName}
            </h2>
            <p className="text-primary font-medium text-sm tracking-wide mt-1 uppercase">
              {faculty.seniorityLevel.replace('_', ' ')}
            </p>
            
            <div className="w-full h-px bg-border my-6" />
            
            <div className="w-full space-y-4 text-left">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mr-3 opacity-70" />
                <span className="truncate">{faculty.email}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Building className="w-4 h-4 mr-3 opacity-70" />
                <span>{faculty.department.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings & Preferences Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-sm">
            <div className="flex items-center mb-6">
              <Shield className="w-5 h-5 text-primary mr-3" />
              <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Security Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50">
                <div>
                  <h4 className="font-medium text-foreground">Password</h4>
                  <p className="text-sm text-muted-foreground">Change your account password securely.</p>
                </div>
                <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium rounded-lg transition-colors text-sm">
                  Update Password
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-8 shadow-sm">
            <div className="flex items-center mb-6">
              <Award className="w-5 h-5 text-primary mr-3" />
              <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Workload Limits</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Max Classes / Day</p>
                <p className="text-2xl font-bold text-foreground">{faculty.maxClassesPerDay}</p>
              </div>
              <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Max Classes / Week</p>
                <p className="text-2xl font-bold text-foreground">{faculty.maxClassesPerWeek}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Workload limits are set by your Department Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
