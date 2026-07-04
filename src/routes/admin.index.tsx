import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/AuthProvider";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });
const cards = [
  ["students", "Total students"],
  ["enrollments", "Active enrollments"],
  ["requests", "Pending requests"],
  ["courses", "Published courses"],
  ["resources", "Uploaded resources"],
  ["classes", "Upcoming classes"],
] as const;
function AdminOverview() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const today = new Date().toISOString().slice(0, 10);
      const results = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("courses")
          .select("*", { count: "exact", head: true })
          .eq("status", "published"),
        supabase
          .from("resources")
          .select("*", { count: "exact", head: true })
          .neq("status", "archived"),
        supabase
          .from("live_classes")
          .select("*", { count: "exact", head: true })
          .eq("status", "scheduled")
          .gte("class_date", today),
      ]);
      setStats(Object.fromEntries(cards.map(([key], index) => [key, results[index].count ?? 0])));
      setError(results.find((result) => result.error)?.error?.message ?? "");
    }
    void load();
  }, []);
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title={profile?.role === "teacher" ? "Teacher Workspace" : "Academy Overview"}
      subtitle={
        profile?.role === "teacher"
          ? "Manage your assigned courses and content."
          : "Live academy data from Supabase."
      }
    >
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([key, label]) => (
          <article key={key} className="rounded-2xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-extrabold">{stats[key] ?? "—"}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/admin/courses"
          className="rounded-xl gradient-primary px-4 py-3 font-bold text-primary-foreground"
        >
          {profile?.role === "teacher" ? "My courses" : "Create course"}
        </Link>
        {profile?.role !== "teacher" && (
          <Link to="/admin/access" className="rounded-xl border px-4 py-3 font-bold">
            Review access requests
          </Link>
        )}
        <Link to="/admin/resources" className="rounded-xl border px-4 py-3 font-bold">
          Upload resource
        </Link>
      </div>
    </DashboardShell>
  );
}
