import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/teacher/resources")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/resources" });
  },
});
