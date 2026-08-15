import { ProtectedLayout } from "@/components/layout/ProtectedLayout";

export default function Home() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to the Faculty Class Allocation System.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Faculties</h3>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">--</div>
            </div>
          </div>
          {/* Add more stats cards here later */}
        </div>
      </div>
    </ProtectedLayout>
  );
}
