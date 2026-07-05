import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ExternalLink, FileUp, Loader2 } from "lucide-react";
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
  const [submissions, setSubmissions] = useState<Item[]>([]);
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
        supabase.from("assignment_submissions").select("*").eq("student_id", profile.id),
      ]);
      setCourse(results[0].data as Course);
      setResources((results[1].data as Resource[]) ?? []);
      setClasses((results[2].data as Item[]) ?? []);
      setRecordings((results[3].data as Item[]) ?? []);
      setAssignments((results[4].data as Item[]) ?? []);
      setAnnouncements((results[5].data as Item[]) ?? []);
      setPayment((results[6].data as Item[]) ?? []);
      setSubmissions((results[7].data as Item[]) ?? []);
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
      {tab === "Assignments" && (
        <List empty="No published assignments.">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              profileId={profile!.id}
              existing={submissions.find(
                (submission) => submission.assignment_id === assignment.id,
              )}
              onSaved={(saved) =>
                setSubmissions((current) => [
                  ...current.filter((submission) => submission.assignment_id !== assignment.id),
                  saved,
                ])
              }
            />
          ))}
        </List>
      )}
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

function AssignmentCard({
  assignment,
  profileId,
  existing,
  onSaved,
}: {
  assignment: Item;
  profileId: string;
  existing?: Item;
  onSaved: (submission: Item) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    if (!supabase || !file) return;
    setBusy(true);
    setMessage("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${profileId}/${assignment.id}/${Date.now()}-${safeName}`;
    const upload = await supabase.storage.from("assignment-submissions").upload(path, file);
    if (upload.error) {
      setMessage(upload.error.message);
      setBusy(false);
      return;
    }
    const payload = {
      assignment_id: assignment.id,
      student_id: profileId,
      submission_file_path: path,
      notes: notes || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    };
    const result = existing
      ? await supabase
          .from("assignment_submissions")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single()
      : await supabase.from("assignment_submissions").insert(payload).select().single();
    if (result.error) {
      await supabase.storage.from("assignment-submissions").remove([path]);
      setMessage(result.error.message);
    } else {
      onSaved(result.data as Item);
      setFile(null);
      setNotes("");
      setMessage(existing ? "Submission replaced successfully." : "Work submitted successfully.");
    }
    setBusy(false);
  }

  return (
    <article className="lms-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="lms-kicker">Assignment</p>
          <h3 className="mt-3 text-lg font-extrabold">{assignment.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {String(assignment.instructions ?? "Complete the attached course work.")}
          </p>
        </div>
        {existing && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {String(existing.status ?? "submitted")}
          </span>
        )}
      </div>
      {existing?.marks != null && (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm">
          <p className="font-extrabold text-emerald-800">
            Marks: {String(existing.marks)}
            {assignment.max_marks ? ` / ${String(assignment.max_marks)}` : ""}
          </p>
          {existing.feedback && (
            <p className="mt-1 text-emerald-700">{String(existing.feedback)}</p>
          )}
        </div>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="lms-field flex cursor-pointer items-center gap-2 overflow-hidden">
          <FileUp className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{file?.name || "Choose solution file"}</span>
          <input
            type="file"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional note for your teacher"
          className="lms-field"
        />
        <button
          type="button"
          disabled={!file || busy}
          onClick={() => void submit()}
          className="lms-button"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {existing ? "Resubmit" : "Submit work"}
        </button>
      </div>
      {message && (
        <p className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm font-medium">{message}</p>
      )}
    </article>
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
