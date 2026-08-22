import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { DepartmentsTable } from "@/components/features/departments/DepartmentsTable";

export default function DepartmentsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <div className="bg-card/80 backdrop-blur-3xl border border-border rounded-[1.5rem] p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient overlay for extra depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground drop-shadow-sm mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Manage Departments
              </h1>
              <p className="text-foreground/80 text-lg">
                View and manage university departments.
              </p>
            </div>
          </div>
          
          <div className="mt-10 relative z-10">
            <DepartmentsTable />
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
