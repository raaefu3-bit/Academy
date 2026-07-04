import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireRole } from "@/auth/RequireRole";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RequireRole allow={["teacher", "admin", "super_admin"]}>
      <Outlet />
    </RequireRole>
  ),
});
