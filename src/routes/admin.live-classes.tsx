import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";

export const Route = createFileRoute("/admin/live-classes")({ component: Page });

type LiveClass = {
  id: string;
  title: string;
  description: string | null;
  meeting_provider: string;
  meeting_url: string | null;
  class_date: string;
  start_time: string;
  end_time: string | null;
  status: "scheduled" | "completed" | "cancelled";
  courses?: { title: string } | null;
};

function Page() {
  const { profile } = useAuth();
  const [items, setItems] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState("zoom");
  const [url, setUrl] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reminder, setReminder] = useState(true);
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [classesResult, coursesResult] = await Promise.all([
      supabase
        .from("live_classes")
        .select("*,courses(title)")
        .order("class_date", { ascending: true })
        .order("start_time", { ascending: true }),
      profile?.role === "teacher"
        ? supabase.from("teacher_courses").select("courses(*)").eq("teacher_id", profile.id)
        : supabase.from("courses").select("*").neq("status", "archived").order("title"),
    ]);
    setItems((classesResult.data as LiveClass[]) ?? []);
    setCourses(
      profile?.role === "teacher"
        ? ((coursesResult.data ?? [])
            .map((row: { courses: Course | null }) => row.courses)
            .filter(Boolean) as Course[])
        : ((coursesResult.data as Course[]) ?? []),
    );
    setNotice(classesResult.error?.message ?? coursesResult.error?.message ?? "");
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [profile?.id, profile?.role]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !profile) return;
    const { error } = await supabase.from("live_classes").insert({
      course_id: courseId,
      title,
      description: description || null,
      meeting_provider: provider,
      meeting_url: url || null,
      class_date: date,
      start_time: start,
      end_time: end || null,
      reminder_enabled: reminder,
      recording_enabled: recording,
      created_by: profile.id,
      updated_by: profile.id,
    });
    setNotice(error?.message ?? "Live class scheduled.");
    if (!error) {
      setTitle("");
      setDescription("");
      setUrl("");
      setDate("");
      setStart("");
      setEnd("");
      await load();
    }
  }

  async function setStatus(item: LiveClass, status: LiveClass["status"]) {
    if (!supabase || !profile) return;
    const { error } = await supabase
      .from("live_classes")
      .update({ status, updated_by: profile.id })
      .eq("id", item.id);
    setNotice(error?.message ?? `Class marked ${status}.`);
    if (!error) await load();
  }

  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Live Classes"
      subtitle="Schedule real Zoom, Google Meet, or other meeting links."
    >
      <form
        onSubmit={create}
        className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-2"
      >
        <select
          required
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="">Choose course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Class title"
          className="rounded-xl border p-3"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="rounded-xl border p-3 md:col-span-2"
        />
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="zoom">Zoom</option>
          <option value="google_meet">Google Meet</option>
          <option value="manual">Other link</option>
        </select>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://meeting-link…"
          className="rounded-xl border p-3"
        />
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border p-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-xl border p-3"
          />
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-xl border p-3"
          />
        </div>
        <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={reminder}
            onChange={(e) => setReminder(e.target.checked)}
          />
          Enable class reminder
        </label>
        <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={recording}
            onChange={(e) => setRecording(e.target.checked)}
          />
          Recording planned
        </label>
        <button className="rounded-xl gradient-primary p-3 font-bold text-primary-foreground md:col-span-2">
          Schedule class
        </button>
      </form>
      {notice && <p className="my-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      {loading ? (
        <p className="py-8 text-center text-muted-foreground">Loading classes…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No classes scheduled yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-bold">{item.title}</h2>
                  <p className="text-sm text-muted-foreground">{item.courses?.title}</p>
                </div>
                <span className="text-xs font-bold uppercase">{item.status}</span>
              </div>
              <p className="mt-3 text-sm">
                {item.class_date} · {item.start_time.slice(0, 5)}
                {item.end_time ? `–${item.end_time.slice(0, 5)}` : ""}
              </p>
              {item.description && (
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {item.meeting_url && (
                  <a
                    href={item.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg gradient-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                  >
                    Open meeting
                  </a>
                )}
                {item.status !== "completed" && (
                  <button
                    onClick={() => setStatus(item, "completed")}
                    className="rounded-lg border px-3 py-2 text-xs font-bold"
                  >
                    Mark completed
                  </button>
                )}
                {item.status !== "cancelled" && (
                  <button
                    onClick={() => setStatus(item, "cancelled")}
                    className="rounded-lg border px-3 py-2 text-xs text-destructive"
                  >
                    Cancel
                  </button>
                )}
                {item.status !== "scheduled" && (
                  <button
                    onClick={() => setStatus(item, "scheduled")}
                    className="rounded-lg border px-3 py-2 text-xs font-bold"
                  >
                    Restore
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
