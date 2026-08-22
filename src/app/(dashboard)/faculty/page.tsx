import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { FacultyTable } from "@/components/features/faculty/FacultyTable";

export default function FacultyPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <div className="bg-card backdrop-blur-2xl border border-border rounded-[1.5rem] p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient overlay for extra depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-sm mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Faculty Management
              </h1>
              <p className="text-foreground/80 text-lg">
                View academic staff, track workload, and adjust schedules.
              </p>
            </div>
          </div>
          
          <div className="mt-10 relative z-10">
            <FacultyTable />
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
