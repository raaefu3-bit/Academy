import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { studentNav } from "@/components/nav-items";
export const Route = createFileRoute("/dashboard/physics")({
  head: () => ({ meta: [{ title: "Course — TeachINK" }] }),
  component: Page,
});
function Page() {
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Course"
      subtitle="Your enrolled course content."
    >
      <EmptyState
        icon={BookOpen}
        title="No course enrollment"
        description="Only courses assigned to your account will appear here after the database is connected."
      />
    </DashboardShell>
  );
}
