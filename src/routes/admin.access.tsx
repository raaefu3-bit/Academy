import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
export const Route = createFileRoute("/admin/access")({ component: Page });
type Request = {
  id: string;
  status: string;
  requested_at: string;
  review_note: string | null;
  profiles: { full_name: string | null; email: string };
  courses: { title: string; subject: string; level: string | null };
};
function Page() {
  const [items, setItems] = useState<Request[]>([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  async function load() {
    if (!supabase) return;
    setLoading(true);
    let query = supabase
      .from("enrollments")
      .select(
        "id,status,requested_at,review_note,profiles!enrollments_student_id_fkey(full_name,email),courses(title,subject,level)",
      )
      .order("requested_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);
    const result = await query;
    setItems((result.data as unknown as Request[]) ?? []);
    setNotice(result.error?.message ?? "");
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, [status]);
  async function review(item: Request, decision: "active" | "rejected") {
    if (!supabase) return;
    const note =
      window.prompt(decision === "active" ? "Optional approval note" : "Reason for rejection") ??
      "";
    if (decision === "rejected" && !note.trim()) return;
    const result = await supabase.rpc("review_enrollment_request", {
      enrollment_id: item.id,
      decision,
      note: note.trim() || null,
    });
    setNotice(
      result.error?.message ?? `Enrollment ${decision === "active" ? "approved" : "rejected"}.`,
    );
    if (!result.error) await load();
  }
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Access Requests"
      subtitle="Pending course enrollments grouped by course."
    >
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="mb-4 rounded-xl border p-3"
      >
        <option value="pending">Pending</option>
        <option value="active">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="all">All</option>
      </select>
      {notice && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      {loading ? (
        <p>Loading enrollment requests…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No {status === "all" ? "" : status} enrollment requests.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold">{item.profiles.full_name || "Student"}</h2>
                  <p className="text-sm text-muted-foreground">{item.profiles.email}</p>
                </div>
                <span className="text-xs font-bold uppercase">{item.status}</span>
              </div>
              <p className="mt-3 text-sm">
                <strong>{item.courses.title}</strong> · {item.courses.subject} ·{" "}
                {item.courses.level}
              </p>
              {item.review_note && (
                <p className="mt-2 rounded-lg bg-secondary p-2 text-sm">{item.review_note}</p>
              )}
              {item.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => review(item, "active")}
                    className="rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => review(item, "rejected")}
                    className="rounded-lg border px-4 py-2 text-sm text-destructive"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
