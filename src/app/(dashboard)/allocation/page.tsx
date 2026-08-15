import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { AllocationDashboard } from '@/components/features/allocation/AllocationDashboard';

export default function AllocationPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Class Allocation & Timetable Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Automate faculty-class schedule mappings, resolve conflicts, and manually manage schedule overrides.
          </p>
        </div>
        <AllocationDashboard />
      </div>
    </ProtectedLayout>
  );
}
