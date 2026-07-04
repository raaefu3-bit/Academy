import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course, Resource } from "@/types/academy";

export const Route = createFileRoute("/student/courses/$courseId")({ component: StudentCourse });
const tabs = [
  "Overview",
  "Live Classes",
  "Recordings",
  "Notes",
  "Past Papers",
  "Worksheets",
  "Assignments",
  "Announcements",
  "Payments / Access Status",
];
type Item = Record<string, unknown> & { id: string; title: string; status?: string };
function StudentCourse() {
  const { courseId } = Route.useParams();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [tab, setTab] = useState("Overview");
  const [resources, setResources] = useState<Resource[]>([]);
  const [classes, setClasses] = useState<Item[]>([]);
  const [recordings, setRecordings] = useState<Item[]>([]);
  const [assignments, setAssignments] = useState<Item[]>([]);
  const [announcements, setAnnouncements] = useState<Item[]>([]);
  const [payment, setPayment] = useState<Item[]>([]);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      if (!supabase || !profile) return;
      const enrollment = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", profile.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();
      if (!enrollment.data) {
        setAuthorized(false);
        setError(enrollment.error?.message ?? "You are not enrolled in this course.");
        return;
      }
      setAuthorized(true);
      const results = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase
          .from("resources")
          .select("*")
          .eq("course_id", courseId)
          .eq("status", "published")
          .order("created_at", { ascending: false }),
        supabase.from("live_classes").select("*").eq("course_id", courseId).order("class_date"),
        supabase.from("recordings").select("*").eq("course_id", courseId).eq("status", "published"),
        supabase
          .from("assignments")
          .select("*")
          .eq("course_id", courseId)
          .eq("status", "published"),
        supabase
          .from("announcements")
          .select("*")
          .eq("course_id", courseId)
          .eq("status", "published"),
        supabase
          .from("payments")
          .select("*")
          .eq("course_id", courseId)
          .eq("student_id", profile.id),
      ]);
      setCourse(results[0].data as Course);
      setResources((results[1].data as Resource[]) ?? []);
      setClasses((results[2].data as Item[]) ?? []);
      setRecordings((results[3].data as Item[]) ?? []);
      setAssignments((results[4].data as Item[]) ?? []);
      setAnnouncements((results[5].data as Item[]) ?? []);
      setPayment((results[6].data as Item[]) ?? []);
      setError(results.find((x) => x.error)?.error?.message ?? "");
    }
    void load();
  }, [courseId, profile]);
  async function preview(item: Resource) {
    if (!supabase) return;
    const result = await supabase.storage
      .from("course-resources")
      .createSignedUrl(item.file_path, 300);
    if (result.error) setError(result.error.message);
    else window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
  }
  if (authorized === null)
    return (
      <DashboardShell items={studentNav} role="student" title="Course">
        <p>Checking course access…</p>
      </DashboardShell>
    );
  if (!authorized)
    return (
      <DashboardShell items={studentNav} role="student" title="Course locked">
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <h2 className="text-xl font-bold">Access denied</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Link
            to="/student"
            className="mt-4 inline-block rounded-xl gradient-primary px-4 py-3 font-bold text-primary-foreground"
          >
            Return to My Courses
          </Link>
        </div>
      </DashboardShell>
    );
  const resourceFilter =
    tab === "Notes"
      ? ["notes"]
      : tab === "Past Papers"
        ? ["past_paper", "marking_scheme", "examiner_report"]
        : ["worksheet"];
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title={course?.title ?? "Course"}
      subtitle={[course?.subject, course?.level, course?.board].filter(Boolean).join(" · ")}
    >
      <Link
        to="/student"
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        My Courses
      </Link>
      <div className="mb-6 flex gap-2 overflow-x-auto border-b pb-3">
        {tabs.map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold ${tab === x ? "gradient-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {x}
          </button>
        ))}
      </div>
      {error && <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-destructive">{error}</p>}
      {tab === "Overview" && (
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-bold">{course?.title}</h2>
          <p className="mt-2 text-muted-foreground">
            {course?.description || "Course materials and updates are organized in the tabs above."}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Mini label="Resources" value={resources.length} />
            <Mini label="Classes" value={classes.length} />
            <Mini label="Assignments" value={assignments.length} />
          </div>
        </div>
      )}
      {["Notes", "Past Papers", "Worksheets"].includes(tab) && (
        <List empty="No published materials in this section.">
          {resources
            .filter((x) => resourceFilter.includes(x.resource_type))
            .map((x) => (
              <article
                key={x.id}
                className="flex items-center gap-3 rounded-2xl border bg-card p-4"
              >
                <div className="flex-1">
                  <h3 className="font-bold">{x.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {x.topic || x.resource_type.replaceAll("_", " ")}
                  </p>
                </div>
                <button onClick={() => preview(x)} className="rounded-lg border p-2">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </article>
            ))}
        </List>
      )}
      {tab === "Live Classes" && <Simple items={classes} empty="No classes scheduled." />}
      {tab === "Recordings" && <Simple items={recordings} empty="No published recordings." />}
      {tab === "Assignments" && <Simple items={assignments} empty="No published assignments." />}
      {tab === "Announcements" && <Simple items={announcements} empty="No course announcements." />}
      {tab === "Payments / Access Status" && (
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-bold text-emerald-700">Enrollment active</p>
          {payment.length ? (
            <Simple items={payment} empty="" />
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No payment record for this course.</p>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
function List({ children, empty }: { children: ReactNode[]; empty: string }) {
  return children.length ? (
    <div className="space-y-3">{children}</div>
  ) : (
    <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
      {empty}
    </p>
  );
}
function Simple({ items, empty }: { items: Item[]; empty: string }) {
  return (
    <List empty={empty}>
      {items.map((x) => (
        <article key={x.id} className="rounded-2xl border bg-card p-4">
          <h3 className="font-bold">{x.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {String(x.description ?? x.instructions ?? x.message ?? x.status ?? "")}
          </p>
          {x.meeting_url ? (
            <a
              href={String(x.meeting_url)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-lg gradient-primary px-3 py-2 text-sm font-bold text-primary-foreground"
            >
              Join class
            </a>
          ) : null}
        </article>
      ))}
    </List>
  );
}
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
