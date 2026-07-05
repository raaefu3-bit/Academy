import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";
import { Archive, BellRing, Megaphone, Radio, Send } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/lms";

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
      <PageHeader
        eyebrow="Communication centre"
        title="Keep every course in the loop"
        description="Create targeted updates, publish urgent notices, and keep students focused without mixing course audiences."
      />
      <form onSubmit={create} className="lms-form grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-3 md:col-span-2">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-extrabold">Create an announcement</h2>
            <p className="text-sm text-muted-foreground">Draft first, then publish when ready.</p>
          </div>
        </div>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="lms-field"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="lms-field"
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
          className="lms-field min-h-28 md:col-span-2"
        />
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="lms-field"
        >
          <option value="course">One course (recommended)</option>
          <option value="all">Show to all enrolled students</option>
        </select>
        {audience === "course" && (
          <select
            required
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="lms-field"
          >
            <option value="">Choose course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
        <label className="flex min-h-12 items-center gap-3 rounded-xl border bg-background/70 px-4 text-sm font-semibold">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Send notification
        </label>
        <button className="lms-button md:col-span-2">
          <Send className="h-4 w-4" /> Save announcement draft
        </button>
      </form>
      {notice && <p className="my-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {items.map((a) => (
          <article key={a.id} className="lms-card group min-h-56">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                {a.priority === "urgent" ? (
                  <BellRing className="h-5 w-5" />
                ) : (
                  <Radio className="h-5 w-5" />
                )}
              </span>
              <StatusBadge value={a.status} />
            </div>
            <h2 className="mt-4 text-lg font-extrabold">{a.title}</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{a.message}</p>
            <p className="mt-2 text-xs">
              {a.audience_type === "course" ? a.courses?.title : "All students"} · {a.priority}
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => toggle(a)} className="lms-button-secondary text-xs">
                {a.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => archive(a)}
                className="lms-button-secondary text-xs text-destructive"
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </button>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
