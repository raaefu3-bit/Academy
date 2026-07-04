import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/teacher/announcements")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/announcements" });
  },
});
