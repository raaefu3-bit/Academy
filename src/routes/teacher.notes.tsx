import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/teacher/notes")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/resources" });
  },
});
