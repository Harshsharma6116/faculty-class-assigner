import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { SemestersTable } from "@/components/features/semesters/SemestersTable";

export default function SemestersPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Semesters</h1>
          <p className="text-muted-foreground mt-2">
            View and manage academic semesters and their active status.
          </p>
        </div>
        <SemestersTable />
      </div>
    </ProtectedLayout>
  );
}
