import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/teacher/live-classes")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/live-classes" });
  },
});
