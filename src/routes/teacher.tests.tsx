import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/teacher/tests")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/tests" });
  },
});
