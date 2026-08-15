import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { SubjectsTable } from "@/components/features/subjects/SubjectsTable";

export default function SubjectsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Subjects</h1>
          <p className="text-muted-foreground mt-2">
            View and manage academic subjects across departments.
          </p>
        </div>
        <SubjectsTable />
      </div>
    </ProtectedLayout>
  );
}
