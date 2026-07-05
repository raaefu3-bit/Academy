import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";
import { Clock3, FileCheck2, GraduationCap, Sparkles, Trophy } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/lms";
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
      <PageHeader
        eyebrow="Assessment studio"
        title="Build tests students want to finish"
        description="Create clear, course-specific assessments with strong timing and marks visibility."
      />
      {courses.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No courses assigned yet. Ask an admin to assign you to a course.
        </p>
      ) : (
        <form onSubmit={create} className="lms-form grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 md:col-span-2">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-700">
              <GraduationCap className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-extrabold">Create a course test</h2>
              <p className="text-sm text-muted-foreground">
                Set the challenge, duration, and marks.
              </p>
            </div>
          </div>
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
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Test title"
            className="lms-field"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="lms-field min-h-24 md:col-span-2"
          />
          <input
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration minutes"
            className="lms-field"
          />
          <input
            type="number"
            min="0"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
            placeholder="Total marks"
            className="lms-field"
          />
          <button className="lms-button md:col-span-2">
            <Sparkles className="h-4 w-4" /> Save test draft
          </button>
        </form>
      )}
      {notice && <p className="my-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="lms-card group">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/15 blur-2xl" />
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 text-blue-700 transition group-hover:rotate-3 group-hover:scale-110">
                <FileCheck2 className="h-6 w-6" />
              </span>
              <StatusBadge value={item.status} />
            </div>
            <p className="mt-5 text-xs font-extrabold uppercase tracking-[.14em] text-primary">
              {item.courses.title}
            </p>
            <h2 className="mt-1 text-lg font-extrabold">{item.title}</h2>
            {item.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-secondary/70 p-3">
                <Clock3 className="mb-1 h-4 w-4 text-primary" />
                <p className="text-sm font-extrabold">{item.duration_minutes ?? "—"} min</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <Trophy className="mb-1 h-4 w-4 text-amber-600" />
                <p className="text-sm font-extrabold">{item.total_marks ?? "—"} marks</p>
              </div>
            </div>
            <button onClick={() => toggle(item)} className="lms-button-secondary mt-4 w-full">
              {item.status === "published" ? "Unpublish" : "Publish"}
            </button>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
