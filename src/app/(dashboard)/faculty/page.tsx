import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { FacultyTable } from "@/components/features/faculty/FacultyTable";

export default function FacultyPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Faculty</h1>
          <p className="text-muted-foreground mt-2">
            View and manage university faculty members.
          </p>
        </div>
        <FacultyTable />
      </div>
    </ProtectedLayout>
  );
}
