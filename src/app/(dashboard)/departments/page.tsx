import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { DepartmentsTable } from "@/components/features/departments/DepartmentsTable";

export default function DepartmentsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Departments</h1>
          <p className="text-muted-foreground mt-2">
            View and manage university departments.
          </p>
        </div>
        <DepartmentsTable />
      </div>
    </ProtectedLayout>
  );
}
