import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { studentNav } from "@/components/nav-items";
export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — TeachINK" }] }),
  component: Page,
});
function Page() {
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Profile"
      subtitle="Manage your personal information."
    >
      <EmptyState
        icon={User}
        title="Profile not connected"
        description="Your real name, email, level, and enrolled courses will appear here after you sign in."
      />
    </DashboardShell>
  );
}
