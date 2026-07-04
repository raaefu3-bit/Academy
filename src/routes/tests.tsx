import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { studentNav } from "@/components/nav-items";
export const Route = createFileRoute("/tests")({
  head: () => ({ meta: [{ title: "Tests — TeachINK" }] }),
  component: Page,
});
function Page() {
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Tests & Results"
      subtitle="View assigned tests and verified results."
    >
      <EmptyState
        icon={GraduationCap}
        title="No tests or results"
        description="Tests and real marked results will appear here once they are published."
      />
    </DashboardShell>
  );
}
