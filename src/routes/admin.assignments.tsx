import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";

export const Route = createFileRoute("/admin/assignments")({ component: Page });
type Assignment = {
  id: string;
  title: string;
  instructions: string | null;
  due_date: string | null;
  status: string;
  courses: { title: string };
};
function Page() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<Assignment[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [due, setDue] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [notice, setNotice] = useState("");
  async function load() {
    if (!supabase || !profile) return;
    const [a, c] = await Promise.all([
      supabase
        .from("assignments")
        .select("*,courses(title)")
        .order("created_at", { ascending: false }),
      profile.role === "teacher"
        ? supabase.from("teacher_courses").select("courses(*)").eq("teacher_id", profile.id)
        : supabase.from("courses").select("*").neq("status", "archived"),
    ]);
    setItems((a.data as unknown as Assignment[]) ?? []);
    setCourses(
      profile.role === "teacher"
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
    if (!supabase || !profile || !courseId) return;
    const result = await supabase.from("assignments").insert({
      course_id: courseId,
      title,
      instructions: instructions || null,
      due_date: due || null,
      max_marks: maxMarks ? Number(maxMarks) : null,
      status: "draft",
      created_by: profile.id,
      updated_by: profile.id,
    });
    setNotice(result.error?.message ?? "Assignment saved as draft.");
    if (!result.error) {
      setTitle("");
      setInstructions("");
      setDue("");
      setMaxMarks("");
      await load();
    }
  }
  async function toggle(item: Assignment) {
    if (!supabase || !profile) return;
    const status = item.status === "published" ? "draft" : "published";
    const result = await supabase
      .from("assignments")
      .update({ status, updated_by: profile.id })
      .eq("id", item.id);
    setNotice(result.error?.message ?? `Assignment ${status}.`);
    if (!result.error) await load();
  }
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Assignments"
      subtitle="Create course-specific work for enrolled students."
    >
      {courses.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No courses assigned yet.
        </p>
      ) : (
        <form
          onSubmit={create}
          className="grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-2"
        >
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
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            className="rounded-xl border p-3"
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions"
            className="rounded-xl border p-3 md:col-span-2"
          />
          <input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-xl border p-3"
          />
          <input
            type="number"
            min="0"
            value={maxMarks}
            onChange={(e) => setMaxMarks(e.target.value)}
            placeholder="Maximum marks"
            className="rounded-xl border p-3"
          />
          <button className="rounded-xl gradient-primary p-3 font-bold text-primary-foreground md:col-span-2">
            Save assignment draft
          </button>
        </form>
      )}
      {notice && <p className="my-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border bg-card p-5">
            <p className="text-xs font-bold uppercase text-primary">{item.courses.title}</p>
            <div className="flex justify-between gap-3">
              <h2 className="font-bold">{item.title}</h2>
              <span className="text-xs font-bold uppercase">{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.instructions}</p>
            <button
              onClick={() => toggle(item)}
              className="mt-3 rounded-lg border px-3 py-2 text-sm font-bold"
            >
              {item.status === "published" ? "Unpublish" : "Publish"}
            </button>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
