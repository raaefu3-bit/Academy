import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { studentNav } from "@/components/nav-items";
export const Route = createFileRoute("/schedule")({
  head: () => ({ meta: [{ title: "Schedule — TeachINK" }] }),
  component: Page,
});
function Page() {
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Schedule"
      subtitle="Your course and live-class calendar."
    >
      <EmptyState
        icon={Calendar}
        title="Your schedule is empty"
        description="Upcoming classes and deadlines for your enrolled courses will appear here."
      />
    </DashboardShell>
  );
}
