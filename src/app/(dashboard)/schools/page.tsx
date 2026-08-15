import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { SchoolsTable } from "@/components/features/schools/SchoolsTable";

export default function SchoolsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Schools</h1>
          <p className="text-muted-foreground mt-2">
            View and manage university schools.
          </p>
        </div>
        <SchoolsTable />
      </div>
    </ProtectedLayout>
  );
}
