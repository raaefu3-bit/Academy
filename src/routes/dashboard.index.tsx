import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { studentNav } from "@/components/nav-items";
export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Student Dashboard — TeachINK" }] }),
  component: Page,
});
function Page() {
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Dashboard"
      subtitle="Your learning space."
    >
      <EmptyState
        icon={LayoutDashboard}
        title="Your dashboard is ready"
        description="Your enrolled courses, upcoming classes, assignments, and progress will appear here after your account is connected."
      />
    </DashboardShell>
  );
}
