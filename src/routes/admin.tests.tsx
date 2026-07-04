import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";
export const Route = createFileRoute("/admin/tests")({ component: Page });
type Test = {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  total_marks: number | null;
  status: string;
  courses: { title: string };
};
function Page() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [items, setItems] = useState<Test[]>([]);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [marks, setMarks] = useState("");
  const [notice, setNotice] = useState("");
  async function load() {
    if (!supabase || !profile) return;
    const [t, c] = await Promise.all([
      supabase
        .from("tests")
        .select("*,courses(title)")
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
      profile.role === "teacher"
        ? supabase.from("teacher_courses").select("courses(*)").eq("teacher_id", profile.id)
        : supabase.from("courses").select("*").neq("status", "archived"),
    ]);
    setItems((t.data as unknown as Test[]) ?? []);
    setCourses(
      profile.role === "teacher"
        ? ((c.data ?? [])
            .map((row: { courses: Course | null }) => row.courses)
            .filter(Boolean) as Course[])
        : ((c.data as Course[]) ?? []),
    );
    setNotice(t.error?.message ?? c.error?.message ?? "");
  }
  useEffect(() => {
    void load();
  }, [profile]);
  async function create(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !profile) return;
    const result = await supabase.from("tests").insert({
      course_id: courseId,
      title,
      description: description || null,
      duration_minutes: duration ? Number(duration) : null,
      total_marks: marks ? Number(marks) : null,
      status: "draft",
      created_by: profile.id,
      updated_by: profile.id,
    });
    setNotice(result.error?.message ?? "Test saved as draft.");
    if (!result.error) {
      setTitle("");
      setDescription("");
      setDuration("");
      setMarks("");
      await load();
    }
  }
  async function toggle(item: Test) {
    if (!supabase || !profile) return;
    const status = item.status === "published" ? "draft" : "published";
    const result = await supabase
      .from("tests")
      .update({ status, updated_by: profile.id })
      .eq("id", item.id);
    setNotice(result.error?.message ?? `Test ${status}.`);
    if (!result.error) await load();
  }
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Tests"
      subtitle="Create tests inside assigned courses."
    >
      {courses.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No courses assigned yet. Ask an admin to assign you to a course.
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
            placeholder="Test title"
            className="rounded-xl border p-3"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="rounded-xl border p-3 md:col-span-2"
          />
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration minutes"
            className="rounded-xl border p-3"
          />
          <input
            type="number"
            min="0"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="Total marks"
            className="rounded-xl border p-3"
          />
          <button className="rounded-xl gradient-primary p-3 font-bold text-primary-foreground md:col-span-2">
            Save test draft
          </button>
        </form>
      )}
      {notice && <p className="my-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border bg-card p-5">
            <p className="text-xs font-bold uppercase text-primary">{item.courses.title}</p>
            <div className="flex justify-between">
              <h2 className="font-bold">{item.title}</h2>
              <span className="text-xs font-bold uppercase">{item.status}</span>
            </div>
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
