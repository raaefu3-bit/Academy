import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";

export const Route = createFileRoute("/admin/announcements")({ component: Page });
type Announcement = {
  id: string;
  title: string;
  message: string;
  audience_type: string;
  priority: string;
  status: string;
  courses?: { title: string } | null;
};

function Page() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("course");
  const [courseId, setCourseId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [notify, setNotify] = useState(false);
  const [notice, setNotice] = useState("");
  async function load() {
    if (!supabase) return;
    const [a, c] = await Promise.all([
      supabase
        .from("announcements")
        .select("*,courses(title)")
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
      profile?.role === "teacher"
        ? supabase.from("teacher_courses").select("courses(*)").eq("teacher_id", profile.id)
        : supabase.from("courses").select("*").neq("status", "archived"),
    ]);
    setItems((a.data as Announcement[]) ?? []);
    setCourses(
      profile?.role === "teacher"
        ? ((c.data ?? [])
            .map((row: { courses: Course | null }) => row.courses)
            .filter(Boolean) as Course[])
        : ((c.data as Course[]) ?? []),
    );
    setNotice(a.error?.message ?? c.error?.message ?? "");
  }
  useEffect(() => {
    void load();
  }, [profile?.id, profile?.role]);
  async function create(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !profile) return;
    const { error } = await supabase.from("announcements").insert({
      title,
      message,
      audience_type: audience,
      course_id: audience === "course" ? courseId : null,
      priority,
      send_notification: notify,
      created_by: profile.id,
      updated_by: profile.id,
    });
    setNotice(error?.message ?? "Announcement saved as draft.");
    if (!error) {
      setTitle("");
      setMessage("");
      await load();
    }
  }
  async function toggle(a: Announcement) {
    if (!supabase || !profile) return;
    const status = a.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("announcements")
      .update({ status, updated_by: profile.id })
      .eq("id", a.id);
    setNotice(error?.message ?? `Announcement ${status}.`);
    if (!error) await load();
  }
  async function archive(a: Announcement) {
    if (!supabase || !profile || !confirm(`Archive “${a.title}”?`)) return;
    await supabase
      .from("announcements")
      .update({ status: "archived", updated_by: profile.id })
      .eq("id", a.id);
    await load();
  }
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Announcements"
      subtitle="Publish updates to the right students."
    >
      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-2"
      >
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded-xl border p-3"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option>normal</option>
          <option>important</option>
          <option>urgent</option>
        </select>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          className="rounded-xl border p-3 md:col-span-2"
        />
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="course">One course (recommended)</option>
          <option value="all">Show to all enrolled students</option>
        </select>
        {audience === "course" && (
          <select
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">Choose course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Send notification
        </label>
        <button className="rounded-xl gradient-primary p-3 font-bold text-primary-foreground md:col-span-2">
          Save draft
        </button>
      </form>
      {notice && <p className="my-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      <div className="space-y-3">
        {items.map((a) => (
          <article key={a.id} className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex justify-between">
              <h2 className="font-bold">{a.title}</h2>
              <span className="text-xs uppercase">{a.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{a.message}</p>
            <p className="mt-2 text-xs">
              {a.audience_type === "course" ? a.courses?.title : "All students"} · {a.priority}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => toggle(a)}
                className="rounded-lg border px-3 py-2 text-xs font-bold"
              >
                {a.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => archive(a)}
                className="rounded-lg border px-3 py-2 text-xs text-destructive"
              >
                Archive
              </button>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
