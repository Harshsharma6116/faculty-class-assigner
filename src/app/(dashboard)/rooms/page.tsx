import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { RoomsTable } from "@/components/features/rooms/RoomsTable";

export default function RoomsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Rooms</h1>
          <p className="text-muted-foreground mt-2">
            View and manage university rooms, lecture halls, and labs.
          </p>
        </div>
        <RoomsTable />
      </div>
    </ProtectedLayout>
  );
}
