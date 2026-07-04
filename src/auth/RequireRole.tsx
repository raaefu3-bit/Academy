import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import type { AppRole } from "@/types/auth";

export function RequireRole({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { session, profile, loading, configured, error } = useAuth();
  if (loading) return <AuthLoading />;
  if (!configured) return <Navigate to="/login" search={{ reason: "setup" }} />;
  if (!session) return <Navigate to="/login" search={{ reason: "auth" }} />;
  if (error) return <AccessError message={error} />;
  if (!profile?.is_active) return <Navigate to="/forbidden" />;
  if (!profile || !allow.includes(profile.role)) {
    const destination =
      profile?.role === "student"
        ? "/student"
        : profile?.role === "teacher"
          ? "/forbidden"
          : "/admin";
    return <Navigate to={destination} />;
  }
  return children;
}

function AccessError({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md rounded-2xl border border-destructive/20 bg-card p-8 text-center shadow-card">
        <h1 className="text-xl font-bold">We couldn’t verify access</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        <a
          href="/login"
          className="mt-6 inline-flex rounded-xl gradient-primary px-5 py-3 font-bold text-primary-foreground"
        >
          Return to login
        </a>
      </div>
    </div>
  );
}

function AuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Checking access…</p>
      </div>
    </div>
  );
}
