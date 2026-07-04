import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
export const Route = createFileRoute("/assignments")({ component: Page });
type Assignment = {
  id: string;
  course_id: string;
  title: string;
  instructions: string | null;
  due_date: string | null;
  max_marks: number | null;
  courses: { title: string };
};
function Page() {
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const result = await supabase
        .from("assignments")
        .select("id,course_id,title,instructions,due_date,max_marks,courses(title)")
        .eq("status", "published")
        .order("due_date");
      setItems((result.data as unknown as Assignment[]) ?? []);
      setError(result.error?.message ?? "");
      setLoading(false);
    }
    void load();
  }, []);
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Assignments"
      subtitle="Published work from your enrolled courses."
    >
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-destructive">{error}</p>}
      {loading ? (
        <p>Loading assignments…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No published assignments for your courses.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-5">
              <p className="text-xs font-bold uppercase text-primary">{item.courses.title}</p>
              <h2 className="font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.instructions}</p>
              <p className="mt-3 text-sm">
                Due: {item.due_date ? new Date(item.due_date).toLocaleString() : "Not set"}
              </p>
              <Link
                to="/student/courses/$courseId"
                params={{ courseId: item.course_id }}
                className="mt-3 inline-block rounded-lg border px-3 py-2 text-sm font-bold"
              >
                Open course
              </Link>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
