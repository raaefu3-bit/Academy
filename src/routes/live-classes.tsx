import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/live-classes")({ component: Page });

type LiveClass = {
  id: string;
  title: string;
  description: string | null;
  meeting_url: string | null;
  class_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  courses?: { title: string } | null;
};

function Page() {
  const [items, setItems] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      const today = new Date().toISOString().slice(0, 10);
      const result = await supabase
        .from("live_classes")
        .select("*,courses(title)")
        .eq("status", "scheduled")
        .gte("class_date", today)
        .order("class_date")
        .order("start_time");
      setItems((result.data as LiveClass[]) ?? []);
      setError(result.error?.message ?? "");
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Live Classes"
      subtitle="Upcoming classes for your enrolled courses."
    >
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Loading classes…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No upcoming classes for your enrolled courses.
        </p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <p className="text-xs font-bold uppercase text-primary">{item.courses?.title}</p>
              <h2 className="mt-1 text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm">
                {item.class_date} · {item.start_time.slice(0, 5)}
                {item.end_time ? `–${item.end_time.slice(0, 5)}` : ""}
              </p>
              {item.description && (
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.meeting_url ? (
                <a
                  href={item.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-xl gradient-primary px-4 py-2 font-bold text-primary-foreground"
                >
                  Join class
                </a>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Meeting link has not been added yet.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
