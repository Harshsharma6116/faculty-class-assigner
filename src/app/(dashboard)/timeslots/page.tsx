import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { TimeSlotsTable } from "@/components/features/timeslots/TimeSlotsTable";

export default function TimeSlotsPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Time Slots</h1>
          <p className="text-muted-foreground mt-2">
            View and manage daily class schedules and break periods.
          </p>
        </div>
        <TimeSlotsTable />
      </div>
    </ProtectedLayout>
  );
}
