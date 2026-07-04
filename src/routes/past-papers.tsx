import { createFileRoute } from "@tanstack/react-router";
import { Files } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { studentNav } from "@/components/nav-items";
export const Route = createFileRoute("/past-papers")({
  head: () => ({ meta: [{ title: "Past Papers — TeachINK" }] }),
  component: Page,
});
function Page() {
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Past Papers"
      subtitle="Past papers assigned to your courses."
    >
      <EmptyState
        icon={Files}
        title="No past papers yet"
        description="Past papers and marking resources uploaded by the academy will appear here."
      />
    </DashboardShell>
  );
}
