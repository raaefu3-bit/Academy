import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
export const Route = createFileRoute("/announcements")({ component: Page });
type Announcement = {
  id: string;
  course_id: string | null;
  title: string;
  message: string;
  priority: string;
  courses: { title: string } | null;
};
function Page() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const result = await supabase
        .from("announcements")
        .select("id,course_id,title,message,priority,courses(title)")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      setItems((result.data as unknown as Announcement[]) ?? []);
      setError(result.error?.message ?? "");
      setLoading(false);
    }
    void load();
  }, []);
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Announcements"
      subtitle="Updates from your enrolled courses."
    >
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-destructive">{error}</p>}
      {loading ? (
        <p>Loading announcements…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No announcements for your enrolled courses.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-5">
              <div className="flex justify-between gap-3">
                <p className="text-xs font-bold uppercase text-primary">
                  {item.courses?.title || "All enrolled students"}
                </p>
                <span className="text-xs font-bold uppercase">{item.priority}</span>
              </div>
              <h2 className="mt-1 font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
              {item.course_id && (
                <Link
                  to="/student/courses/$courseId"
                  params={{ courseId: item.course_id }}
                  className="mt-3 inline-block text-sm font-bold text-primary"
                >
                  Open course
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
