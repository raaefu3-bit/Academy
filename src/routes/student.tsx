import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { RequireRole } from "@/auth/RequireRole";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  const { profile } = useAuth();
  return (
    <RequireRole allow={["student"]}>
      {!profile?.academic_level ? (
        <Navigate to="/onboarding" />
      ) : (
        <Outlet />
      )}
    </RequireRole>
  );
}
