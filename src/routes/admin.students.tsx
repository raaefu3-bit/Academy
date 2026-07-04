import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import { RequireRole } from "@/auth/RequireRole";

export const Route = createFileRoute("/admin/students")({
  component: () => (
    <RequireRole allow={["admin", "super_admin"]}>
      <StudentsPage />
    </RequireRole>
  ),
});
type Enrollment = {
  id: string;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; email: string };
  courses: { title: string };
};

function StudentsPage() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    if (!supabase) return;
    setLoading(true);
    const result = await supabase
      .from("enrollments")
      .select(
        "id,status,created_at,profiles!enrollments_student_id_fkey(full_name,email),courses(title)",
      )
      .order("created_at", { ascending: false });
    setItems((result.data as unknown as Enrollment[]) ?? []);
    setNotice(result.error?.message ?? "");
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);
  async function status(id: string, value: string) {
    if (!supabase) return;
    const result = await supabase.from("enrollments").update({ status: value }).eq("id", id);
    setNotice(result.error?.message ?? `Enrollment ${value}.`);
    if (!result.error) await load();
  }
  const visible = items.filter((item) =>
    `${item.profiles.full_name} ${item.profiles.email} ${item.courses.title}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Students"
      subtitle="Real students and their course enrollments."
    >
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search student or course"
        className="mb-4 w-full rounded-xl border p-3 md:max-w-md"
      />
      {notice && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      {loading ? (
        <p>Loading students…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No matching enrollments. Approving an access request creates one here.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5 shadow-card"
            >
              <div>
                <h2 className="font-bold">{item.profiles.full_name || "Student"}</h2>
                <p className="text-sm text-muted-foreground">
                  {item.profiles.email} · {item.courses.title}
                </p>
              </div>
              <select
                value={item.status}
                onChange={(e) => status(item.id, e.target.value)}
                className="rounded-xl border p-2"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
