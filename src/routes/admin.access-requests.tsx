import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/access-requests")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/access" });
  },
});
