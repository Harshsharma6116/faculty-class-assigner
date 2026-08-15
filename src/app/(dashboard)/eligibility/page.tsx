import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { EligibilityForm } from "@/components/features/eligibility/EligibilityForm";

export default function EligibilityPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eligibility Rules</h1>
          <p className="text-muted-foreground mt-2">
            Manage academic rules restricting courses by degree levels.
          </p>
        </div>
        <EligibilityForm />
      </div>
    </ProtectedLayout>
  );
}
