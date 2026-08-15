import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { BatchesTable } from "@/components/features/batches/BatchesTable";

export default function BatchesPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Batches</h1>
          <p className="text-muted-foreground mt-2">
            View and manage student batches and class groups.
          </p>
        </div>
        <BatchesTable />
      </div>
    </ProtectedLayout>
  );
}
