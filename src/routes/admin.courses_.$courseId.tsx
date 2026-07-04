import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, FileUp } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course, Resource } from "@/types/academy";

export const Route = createFileRoute("/admin/courses_/$courseId")({ component: CourseDashboard });
type Enrollment = {
  id: string;
  status: string;
  payment_status: string;
  profiles: { full_name: string | null; email: string };
};
type Request = {
  id: string;
  status: string;
  profiles: { full_name: string | null; email: string };
};
const tabs = [
  "Overview",
  "Students",
  "Access Requests",
  "Resources",
  "Live Classes",
  "Recordings",
  "Notes",
  "Past Papers",
  "Assignments",
  "Announcements",
  "Pricing & Settings",
];

function CourseDashboard() {
  const { courseId } = Route.useParams();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tab, setTab] = useState("Overview");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("notes");
  const [file, setFile] = useState<File | null>(null);
  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [c, e, q, r] = await Promise.all([
      supabase.from("courses").select("*").eq("id", courseId).single(),
      supabase
        .from("enrollments")
        .select("id,status,payment_status,profiles!enrollments_student_id_fkey(full_name,email)")
        .eq("course_id", courseId),
      supabase
        .from("enrollments")
        .select("id,status,profiles!enrollments_student_id_fkey(full_name,email)")
        .eq("course_id", courseId)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("resources")
        .select("*")
        .eq("course_id", courseId)
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
    ]);
    setCourse(c.data as Course);
    setEnrollments((e.data as unknown as Enrollment[]) ?? []);
    setRequests((q.data as Request[]) ?? []);
    setResources((r.data as Resource[]) ?? []);
    setNotice(c.error?.message ?? e.error?.message ?? q.error?.message ?? r.error?.message ?? "");
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, [courseId]);
  async function review(item: Request, decision: "active" | "rejected") {
    if (!supabase) return;
    const note =
      window.prompt(decision === "active" ? "Optional approval note" : "Reason for rejection") ??
      "";
    if (decision === "rejected" && !note) return;
    const result = await supabase.rpc("review_enrollment_request", {
      enrollment_id: item.id,
      decision,
      note: note || null,
    });
    setNotice(result.error?.message ?? `Request ${decision}.`);
    if (!result.error) await load();
  }
  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !profile || !file) return;
    const path = `${courseId}/${type}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    setNotice("Uploading resource…");
    const stored = await supabase.storage.from("course-resources").upload(path, file);
    if (stored.error) return setNotice(stored.error.message);
    const saved = await supabase.from("resources").insert({
      course_id: courseId,
      title,
      topic: topic || null,
      subject: course?.subject,
      resource_type: type,
      file_path: path,
      file_name: file.name,
      file_mime_type: file.type || null,
      file_size: file.size,
      created_by: profile.id,
      updated_by: profile.id,
    });
    if (saved.error) {
      await supabase.storage.from("course-resources").remove([path]);
      return setNotice(saved.error.message);
    }
    setTitle("");
    setTopic("");
    setFile(null);
    setNotice("Resource uploaded as draft.");
    await load();
  }
  async function resourceStatus(item: Resource) {
    if (!supabase || !profile) return;
    const status = item.status === "published" ? "draft" : "published";
    const result = await supabase
      .from("resources")
      .update({ status, updated_by: profile.id })
      .eq("id", item.id);
    setNotice(result.error?.message ?? `Resource ${status}.`);
    if (!result.error) await load();
  }
  async function preview(item: Resource) {
    if (!supabase) return;
    const result = await supabase.storage
      .from("course-resources")
      .createSignedUrl(item.file_path, 300);
    if (result.error) setNotice(result.error.message);
    else window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
  }
  if (loading)
    return (
      <DashboardShell
        items={adminNav}
        role="admin"
        title="Course"
        subtitle="Loading course dashboard…"
      >
        <p>Loading…</p>
      </DashboardShell>
    );
  if (!course)
    return (
      <DashboardShell items={adminNav} role="admin" title="Course not found">
        <p>This course does not exist or you cannot access it.</p>
      </DashboardShell>
    );
  const pending = requests.filter((item) => item.status === "pending");
  const shownResources = resources.filter((r) =>
    tab === "Notes"
      ? r.resource_type === "notes"
      : tab === "Past Papers"
        ? ["past_paper", "marking_scheme", "examiner_report"].includes(r.resource_type)
        : true,
  );
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title={course.title}
      subtitle={`${course.subject} · ${course.level ?? "All levels"} · ${course.board ?? "Custom board"}`}
    >
      <Link
        to="/admin/courses"
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
      </Link>
      <div className="mb-6 flex gap-2 overflow-x-auto border-b pb-3">
        {tabs.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold ${tab === name ? "gradient-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {name}
          </button>
        ))}
      </div>
      {notice && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{notice}</p>}
      {tab === "Overview" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Stat
            label="Active students"
            value={enrollments.filter((x) => x.status === "active").length}
          />
          <Stat label="Pending requests" value={pending.length} />
          <Stat label="Course resources" value={resources.length} />
          <section className="rounded-2xl border bg-card p-5 md:col-span-3">
            <h2 className="font-bold">Course details</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {course.description || "No description added."}
            </p>
            <p className="mt-3 text-sm">
              <strong>Schedule:</strong> {course.schedule || "Not set"} · <strong>Price:</strong>{" "}
              {course.price_type === "free" ? "Free" : `${course.currency} ${course.price ?? 0}`} ·{" "}
              <strong>Enrollment:</strong> {course.enrollment_status?.replaceAll("_", " ")}
            </p>
          </section>
        </div>
      )}
      {tab === "Students" && (
        <List empty={enrollments.length === 0} text="No approved students in this course yet.">
          {enrollments.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-4">
              <h3 className="font-bold">{item.profiles.full_name || "Student"}</h3>
              <p className="text-sm text-muted-foreground">
                {item.profiles.email} · {item.status} · payment {item.payment_status}
              </p>
            </article>
          ))}
        </List>
      )}
      {tab === "Access Requests" && (
        <List empty={requests.length === 0} text="No access requests for this course.">
          {requests.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="font-bold">{item.profiles.full_name || "Student"}</h3>
                  <p className="text-sm text-muted-foreground">{item.profiles.email}</p>
                </div>
                <span className="text-xs font-bold uppercase">{item.status}</span>
              </div>
              {item.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => review(item, "active")}
                    className="rounded-lg gradient-primary px-3 py-2 text-sm font-bold text-primary-foreground"
                  >
                    Approve & enroll
                  </button>
                  <button
                    onClick={() => review(item, "rejected")}
                    className="rounded-lg border px-3 py-2 text-sm text-destructive"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </List>
      )}
      {(tab === "Resources" || tab === "Notes" || tab === "Past Papers") && (
        <>
          <form
            onSubmit={upload}
            className="grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-2"
          >
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource title"
              className="rounded-xl border p-3"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic"
              className="rounded-xl border p-3"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border p-3"
            >
              {[
                "notes",
                "past_paper",
                "marking_scheme",
                "worksheet",
                "syllabus",
                "examiner_report",
                "formula_sheet",
                "recording_file",
                "other",
              ].map((x) => (
                <option key={x} value={x}>
                  {x.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <input
              required
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-xl border p-3"
            />
            <button className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary p-3 font-bold text-primary-foreground md:col-span-2">
              <FileUp className="h-4 w-4" />
              Upload to {course.title}
            </button>
          </form>
          <div className="mt-4 space-y-3">
            {shownResources.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.resource_type.replaceAll("_", " ")} · {item.status}
                  </p>
                </div>
                <button onClick={() => preview(item)} className="rounded-lg border p-2">
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={() => resourceStatus(item)}
                  className="rounded-lg border px-3 py-2 text-xs font-bold"
                >
                  {item.status === "published" ? "Unpublish" : "Publish"}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
      {tab === "Live Classes" && (
        <Link
          to="/teacher/live-classes"
          className="inline-block rounded-xl gradient-primary px-4 py-3 font-bold text-primary-foreground"
        >
          Manage live classes
        </Link>
      )}
      {tab === "Announcements" && (
        <Link
          to="/teacher/announcements"
          className="inline-block rounded-xl gradient-primary px-4 py-3 font-bold text-primary-foreground"
        >
          Manage announcements
        </Link>
      )}
      {["Recordings", "Assignments", "Pricing & Settings"].includes(tab) && (
        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-bold">{tab}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "Pricing & Settings"
              ? "Edit pricing and settings from the course Edit action."
              : `No ${tab.toLowerCase()} have been created for this course.`}
          </p>
        </section>
      )}
    </DashboardShell>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </article>
  );
}
function List({ empty, text, children }: { empty: boolean; text: string; children: ReactNode }) {
  return empty ? (
    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">{text}</p>
  ) : (
    <div className="space-y-3">{children}</div>
  );
}
