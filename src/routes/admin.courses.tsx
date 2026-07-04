import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";

export const Route = createFileRoute("/admin/courses")({ component: CoursesPage });
type Teacher = { id: string; full_name: string | null; email: string };
type CourseRow = Course & {
  enrollments: { count: number }[];
  resources: { count: number }[];
  course_access_requests: { count: number }[];
};
const empty = {
  title: "",
  slug: "",
  subject: "",
  board: "Cambridge",
  levels: [] as string[],
  batch_name: "",
  teacher_id: "",
  class_type: "live",
  price_type: "manual_payment",
  price: "",
  currency: "PKR",
  duration: "",
  schedule: "",
  description: "",
  included_content: "",
  thumbnail_url: "",
  enrollment_status: "open",
  status: "draft",
};

function CoursesPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");

  async function load() {
    if (!supabase || !profile) return;
    setLoading(true);
    if (profile.role === "teacher") {
      const result = await supabase
        .from("teacher_courses")
        .select("courses(*,enrollments(count),resources(count),course_access_requests(count))")
        .eq("teacher_id", profile.id);
      setCourses(
        ((result.data ?? [])
          .map((row: { courses: CourseRow | null }) => row.courses)
          .filter(Boolean) as CourseRow[]) ?? [],
      );
      setTeachers([]);
      setMessage(result.error?.message ?? "");
      setLoading(false);
      return;
    }
    const [courseResult, teacherResult] = await Promise.all([
      supabase
        .from("courses")
        .select("*,enrollments(count),resources(count),course_access_requests(count)")
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id,full_name,email")
        .eq("role", "teacher")
        .eq("is_active", true)
        .order("full_name"),
    ]);
    setCourses((courseResult.data as CourseRow[]) ?? []);
    setTeachers((teacherResult.data as Teacher[]) ?? []);
    setMessage(courseResult.error?.message ?? teacherResult.error?.message ?? "");
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, [profile]);

  function startEdit(course?: CourseRow) {
    if (!course) {
      setEditing(null);
      setForm(empty);
    } else {
      setEditing(course.id);
      setForm({
        ...empty,
        title: course.title,
        slug: course.slug ?? "",
        subject: course.subject,
        board: course.board ?? "Cambridge",
        levels: course.course_target_levels?.length
          ? course.course_target_levels
          : (course.level?.split(", ").filter(Boolean) ?? []),
        batch_name: course.batch_name ?? "",
        teacher_id: course.teacher_id ?? "",
        class_type: course.class_type ?? "live",
        price_type: course.price_type ?? "manual_payment",
        price: course.price?.toString() ?? "",
        currency: course.currency ?? "PKR",
        duration: course.duration ?? "",
        schedule: course.schedule ?? "",
        description: course.description ?? "",
        included_content: course.included_content ?? "",
        thumbnail_url: course.thumbnail_url ?? "",
        enrollment_status: course.enrollment_status ?? "open",
        status: course.status,
      });
    }
    setOpen(true);
  }
  function change(name: string, value: string | string[]) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !profile || form.levels.length === 0)
      return setMessage("Select at least one level.");
    const values = {
      title: form.title.trim(),
      slug: form.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      subject: form.subject.trim(),
      board: form.board,
      level: form.levels.join(", "),
      course_target_levels: form.levels,
      level_group: form.levels.join("_").toLowerCase().replaceAll(" ", "_"),
      batch_name: form.batch_name || null,
      teacher_id: form.teacher_id || null,
      class_type: form.class_type,
      price_type: form.price_type,
      price: form.price_type === "free" ? 0 : Number(form.price || 0),
      currency: form.currency,
      duration: form.duration || null,
      schedule: form.schedule || null,
      description: form.description || null,
      included_content: form.included_content || null,
      thumbnail_url: form.thumbnail_url || null,
      enrollment_status: form.enrollment_status,
      status: form.status,
      is_public: form.enrollment_status !== "invite_only",
      updated_by: profile.id,
    };
    const result = editing
      ? await supabase.from("courses").update(values).eq("id", editing)
      : await supabase.from("courses").insert({ ...values, created_by: profile.id });
    setMessage(result.error?.message ?? `Course ${editing ? "updated" : "created"}.`);
    if (!result.error) {
      setOpen(false);
      await load();
    }
  }
  async function setStatus(course: Course, status: Course["status"]) {
    if (!supabase || !profile) return;
    const result = await supabase
      .from("courses")
      .update({ status, updated_by: profile.id })
      .eq("id", course.id);
    setMessage(result.error?.message ?? "Course updated.");
    if (!result.error) await load();
  }
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Courses"
      subtitle="Create and manage complete academy courses."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Course catalogue</h2>
          <p className="text-sm text-muted-foreground">
            Every course has isolated students, requests, content, and settings.
          </p>
        </div>
        {profile?.role !== "teacher" && (
          <button
            onClick={() => startEdit()}
            className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-3 font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </button>
        )}
      </div>
      {message && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{message}</p>}
      <div className="mb-5 grid gap-3 rounded-2xl border bg-card p-4 shadow-card sm:grid-cols-2 xl:grid-cols-4">
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="">All levels</option>
          {["O Levels", "IGCSE", "AS / A1", "A2", "A Level"].map((level) => (
            <option key={level}>{level}</option>
          ))}
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="">All subjects</option>
          {[...new Set(courses.map((course) => course.subject))].sort().map((subject) => (
            <option key={subject}>{subject}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
          className="rounded-xl border p-3"
        >
          <option value="">All teachers</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.full_name || teacher.email}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading courses…</p>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-bold">Create your first course</p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {courses
            .filter(
              (course) =>
                !levelFilter ||
                course.course_target_levels?.includes(levelFilter) ||
                course.level?.includes(levelFilter),
            )
            .filter((course) => !subjectFilter || course.subject === subjectFilter)
            .filter((course) => !statusFilter || course.status === statusFilter)
            .filter((course) => !teacherFilter || course.teacher_id === teacherFilter)
            .map((course) => (
              <article
                key={course.id}
                className="overflow-hidden rounded-2xl border bg-card shadow-card"
              >
                {course.thumbnail_url && (
                  <img src={course.thumbnail_url} alt="" className="h-32 w-full object-cover" />
                )}
                <div className="p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">{course.subject}</p>
                      <h2 className="text-lg font-bold">{course.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {[course.level, course.board, course.batch_name]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="h-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase">
                      {course.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold">
                    {course.price_type === "free"
                      ? "Free"
                      : `${course.currency ?? "PKR"} ${course.price ?? 0}`}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {(course.class_type ?? "live").replaceAll("_", " ")}
                    </span>
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <Stat label="Students" value={course.enrollments?.[0]?.count ?? 0} />
                    <Stat label="Requests" value={course.course_access_requests?.[0]?.count ?? 0} />
                    <Stat label="Resources" value={course.resources?.[0]?.count ?? 0} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to="/admin/courses/$courseId"
                      params={{ courseId: course.id }}
                      className="rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                    >
                      Manage
                    </Link>
                    {profile?.role !== "teacher" && (
                      <>
                        <button
                          onClick={() => startEdit(course)}
                          className="rounded-lg border px-4 py-2 text-sm font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            setStatus(course, course.status === "published" ? "draft" : "published")
                          }
                          className="rounded-lg border px-4 py-2 text-sm font-bold"
                        >
                          {course.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() =>
                            window.confirm(`Archive “${course.title}”?`) &&
                            setStatus(course, "archived")
                          }
                          className="rounded-lg border p-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <form
            onSubmit={save}
            className="mx-auto my-6 max-w-4xl rounded-2xl bg-background p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{editing ? "Edit Course" : "Create Course"}</h2>
                <p className="text-sm text-muted-foreground">
                  Configure the complete LMS course record.
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Course title">
                <input
                  required
                  value={form.title}
                  onChange={(e) => change("title", e.target.value)}
                />
              </Field>
              <Field label="Course slug">
                <input
                  required
                  value={form.slug}
                  onChange={(e) => change("slug", e.target.value)}
                  placeholder="o-level-chemistry"
                />
              </Field>
              <Field label="Subject">
                <input
                  required
                  value={form.subject}
                  onChange={(e) => change("subject", e.target.value)}
                />
              </Field>
              <Field label="Board">
                <select value={form.board} onChange={(e) => change("board", e.target.value)}>
                  {["Cambridge", "Edexcel", "AQA", "Custom"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Who is this course for?">
                <div className="flex flex-wrap gap-3">
                  {["O Levels", "IGCSE", "AS / A1", "A2", "A Level"].map((level) => (
                    <label key={level} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.levels.includes(level)}
                        onChange={(e) =>
                          change(
                            "levels",
                            e.target.checked
                              ? [...form.levels, level]
                              : form.levels.filter((x) => x !== level),
                          )
                        }
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Class / batch name">
                <input
                  value={form.batch_name}
                  onChange={(e) => change("batch_name", e.target.value)}
                />
              </Field>
              <Field label="Assigned teacher">
                <select
                  value={form.teacher_id}
                  onChange={(e) => change("teacher_id", e.target.value)}
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Course type">
                <select
                  value={form.class_type}
                  onChange={(e) => change("class_type", e.target.value)}
                >
                  {["live", "recorded", "past_paper_course", "notes_course", "full_course"].map(
                    (x) => (
                      <option key={x} value={x}>
                        {x.replaceAll("_", " ")}
                      </option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="Price type">
                <select
                  value={form.price_type}
                  onChange={(e) => change("price_type", e.target.value)}
                >
                  {["free", "one_time", "monthly", "manual_payment"].map((x) => (
                    <option key={x} value={x}>
                      {x.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Price and currency">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={form.price_type === "free"}
                    value={form.price}
                    onChange={(e) => change("price", e.target.value)}
                  />
                  <select
                    value={form.currency}
                    onChange={(e) => change("currency", e.target.value)}
                  >
                    <option>PKR</option>
                    <option>USD</option>
                    <option>GBP</option>
                  </select>
                </div>
              </Field>
              <Field label="Duration">
                <input
                  value={form.duration}
                  onChange={(e) => change("duration", e.target.value)}
                  placeholder="12 weeks"
                />
              </Field>
              <Field label="Schedule">
                <input
                  value={form.schedule}
                  onChange={(e) => change("schedule", e.target.value)}
                  placeholder="Mon/Wed 6:00 PM"
                />
              </Field>
              <Field label="Enrollment status">
                <select
                  value={form.enrollment_status}
                  onChange={(e) => change("enrollment_status", e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="invite_only">Invite-only</option>
                </select>
              </Field>
              <Field label="Course status">
                <select value={form.status} onChange={(e) => change("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <Field label="Thumbnail / banner URL">
                <input
                  type="url"
                  value={form.thumbnail_url}
                  onChange={(e) => change("thumbnail_url", e.target.value)}
                />
              </Field>
              <Field label="Description" wide>
                <textarea
                  value={form.description}
                  onChange={(e) => change("description", e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label="What is included" wide>
                <textarea
                  value={form.included_content}
                  onChange={(e) => change("included_content", e.target.value)}
                  rows={3}
                  placeholder="Live classes, notes, past papers…"
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border px-5 py-3 font-bold"
              >
                Cancel
              </button>
              <button className="rounded-xl gradient-primary px-5 py-3 font-bold text-primary-foreground">
                {editing ? "Save changes" : "Create course"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardShell>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-bold ${wide ? "md:col-span-2" : ""}`}>
      <span>{label}</span>
      <div className="[&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:p-3 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:p-3 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:p-3">
        {children}
      </div>
    </label>
  );
}
