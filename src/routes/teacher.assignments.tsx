import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/teacher/assignments")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/assignments" });
  },
});
