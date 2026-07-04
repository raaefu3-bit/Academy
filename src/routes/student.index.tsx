import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, ClipboardList, Megaphone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course, Resource } from "@/types/academy";

export const Route = createFileRoute("/student/")({ component: StudentDashboard });
type Enrollment = {
  id: string;
  courses: Course & { profiles?: { full_name: string | null } | null };
};
type Request = {
  id: string;
  course_id: string;
  status: string;
  review_note: string | null;
  courses: { title: string };
};
type LiveClass = {
  id: string;
  course_id: string;
  title: string;
  class_date: string;
  start_time: string;
  meeting_url: string | null;
  reminder_enabled: boolean;
  courses: { title: string };
};
type Assignment = {
  id: string;
  course_id: string;
  title: string;
  due_date: string | null;
  courses: { title: string };
};
type Announcement = {
  id: string;
  course_id: string | null;
  title: string;
  message: string;
  priority: string;
  courses: { title: string } | null;
};

function StudentDashboard() {
  const { profile } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase || !profile) return;
      const today = new Date().toISOString().slice(0, 10);
      const results = await Promise.all([
        supabase
          .from("enrollments")
          .select("id,courses(*,profiles!courses_teacher_id_fkey(full_name))")
          .eq("student_id", profile.id)
          .eq("status", "active"),
        supabase
          .from("enrollments")
          .select("id,course_id,status,review_note,courses(title)")
          .eq("student_id", profile.id)
          .in("status", ["pending", "rejected"])
          .order("requested_at", { ascending: false }),
        supabase
          .from("courses")
          .select("*")
          .eq("status", "published")
          .eq("is_public", true)
          .eq("enrollment_status", "open")
          .contains("course_target_levels", [profile.academic_level])
          .order("title"),
        supabase
          .from("live_classes")
          .select("*,courses(title)")
          .eq("status", "scheduled")
          .gte("class_date", today)
          .order("class_date")
          .limit(6),
        supabase
          .from("resources")
          .select("*,courses(title)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("assignments")
          .select("id,course_id,title,due_date,courses(title)")
          .eq("status", "published")
          .order("due_date")
          .limit(6),
        supabase
          .from("announcements")
          .select("id,course_id,title,message,priority,courses(title)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      setEnrollments((results[0].data as unknown as Enrollment[]) ?? []);
      setRequests((results[1].data as unknown as Request[]) ?? []);
      setAvailable((results[2].data as Course[]) ?? []);
      setClasses((results[3].data as unknown as LiveClass[]) ?? []);
      setResources((results[4].data as Resource[]) ?? []);
      setAssignments((results[5].data as unknown as Assignment[]) ?? []);
      setAnnouncements((results[6].data as unknown as Announcement[]) ?? []);
      setError(results.find((result) => result.error)?.error?.message ?? "");
      setLoading(false);
    }
    void load();
  }, [profile]);

  async function requestAccess(courseId: string) {
    if (!supabase || !profile) return;
    const course = available.find((item) => item.id === courseId);
    if (
      !profile.academic_level ||
      !course?.course_target_levels?.includes(profile.academic_level)
    ) {
      setError("This course is not available for your selected level.");
      return;
    }
    const result = await supabase.from("enrollments").insert({
      student_id: profile.id,
      course_id: courseId,
      status: "pending",
      payment_status: "unpaid",
    });
    if (result.error) setError(result.error.message);
    else window.location.reload();
  }

  const nextClass = (courseId: string) => classes.find((item) => item.course_id === courseId);
  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Student Dashboard"
      subtitle="Everything is separated by your approved courses."
    >
      {error && <p className="mb-5 rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      {loading ? (
        <p>Loading your academy…</p>
      ) : (
        <>
          <section className="mb-8 overflow-hidden rounded-3xl gradient-primary p-6 text-primary-foreground shadow-elegant sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wider opacity-80">
              Student workspace
            </p>
            <h2 className="mt-2 text-3xl font-extrabold">
              Welcome back, {profile?.full_name?.split(" ")[0] || "student"}
            </h2>
            <p className="mt-1 opacity-85">{profile?.academic_level}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <WelcomeStat label="Enrolled courses" value={enrollments.length} />
              <WelcomeStat
                label="Next class"
                value={
                  classes[0]
                    ? `${classes[0].class_date} · ${classes[0].start_time.slice(0, 5)}`
                    : "None scheduled"
                }
              />
              <WelcomeStat label="Pending tasks" value={assignments.length} />
            </div>
          </section>
          <Section title="My Courses" icon={<BookOpen className="h-5 w-5" />}>
            {enrollments.length === 0 ? (
              <Empty text="You are not enrolled in any course yet. Browse available courses below." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {enrollments.map(({ id, courses: course }) => {
                  const upcoming = nextClass(course.id);
                  return (
                    <article key={id} className="rounded-2xl border bg-card p-5 shadow-card">
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-primary">
                            {course.subject}
                          </p>
                          <h3 className="text-lg font-bold">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {course.level} · {course.board}
                          </p>
                        </div>
                        <span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          Approved
                        </span>
                      </div>
                      <p className="mt-3 text-sm">
                        <strong>Teacher:</strong> {course.profiles?.full_name || "Academy teacher"}
                      </p>
                      <p className="mt-1 text-sm">
                        <strong>Next class:</strong>{" "}
                        {upcoming
                          ? `${upcoming.class_date} at ${upcoming.start_time.slice(0, 5)}`
                          : "Not scheduled"}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <Mini
                          label="New resources"
                          value={resources.filter((x) => x.course_id === course.id).length}
                        />
                        <Mini
                          label="Assignments"
                          value={assignments.filter((x) => x.course_id === course.id).length}
                        />
                      </div>
                      <Link
                        to="/student/courses/$courseId"
                        params={{ courseId: course.id }}
                        className="mt-4 block rounded-xl gradient-primary px-4 py-3 text-center font-bold text-primary-foreground"
                      >
                        Continue course
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </Section>
          <Section title="Pending Requests">
            <div className="grid gap-3 md:grid-cols-2">
              {requests.length === 0 ? (
                <Empty text="No course access requests." />
              ) : (
                requests.map((request) => (
                  <article key={request.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-bold">{request.courses.title}</h3>
                      <Badge value={request.status} />
                    </div>
                    {request.review_note && (
                      <p className="mt-2 text-sm text-muted-foreground">{request.review_note}</p>
                    )}
                  </article>
                ))
              )}
            </div>
          </Section>
          <Section title="Available Courses">
            <div className="grid gap-4 lg:grid-cols-2">
              {available
                .filter(
                  (course) =>
                    !enrollments.some((item) => item.courses.id === course.id) &&
                    !requests.some((item) => item.course_id === course.id),
                )
                .map((course) => (
                  <article key={course.id} className="rounded-2xl border bg-card p-5 shadow-card">
                    <p className="text-xs font-bold uppercase text-primary">{course.subject}</p>
                    <h3 className="text-lg font-bold">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {course.level} · {course.board}
                    </p>
                    <p className="mt-3 text-sm font-semibold">
                      {course.price_type === "free"
                        ? "Free"
                        : `${course.currency ?? "PKR"} ${course.price ?? 0}`}
                    </p>
                    <button
                      onClick={() => requestAccess(course.id)}
                      className="mt-4 rounded-xl gradient-primary px-4 py-3 font-bold text-primary-foreground"
                    >
                      Request access
                    </button>
                  </article>
                ))}
            </div>
          </Section>
          <Section title="Upcoming Live Classes" icon={<CalendarDays className="h-5 w-5" />}>
            <Cards
              empty="No upcoming classes."
              items={classes.map((item) => (
                <article key={item.id} className="rounded-2xl border bg-card p-4">
                  <p className="text-xs font-bold uppercase text-primary">{item.courses.title}</p>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.class_date} · {item.start_time.slice(0, 5)} · Reminder{" "}
                    {item.reminder_enabled ? "on" : "off"}
                  </p>
                  {item.meeting_url && (
                    <a
                      href={item.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block rounded-lg gradient-primary px-3 py-2 text-sm font-bold text-primary-foreground"
                    >
                      Join class
                    </a>
                  )}
                </article>
              ))}
            />
          </Section>
          <Section title="New Resources">
            <Cards
              empty="New resources will appear here after your teacher publishes them."
              items={resources.map((item) => (
                <article key={item.id} className="rounded-2xl border bg-card p-4">
                  <p className="text-xs font-bold uppercase text-primary">{item.courses?.title}</p>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.resource_type.replaceAll("_", " ")} · {item.topic || "General"}
                  </p>
                </article>
              ))}
            />
          </Section>
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Assignments" icon={<ClipboardList className="h-5 w-5" />}>
              <Cards
                empty="No pending assignments."
                items={assignments.map((item) => (
                  <article key={item.id} className="rounded-2xl border bg-card p-4">
                    <p className="text-xs font-bold uppercase text-primary">{item.courses.title}</p>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Due{" "}
                      {item.due_date ? new Date(item.due_date).toLocaleString() : "date not set"}
                    </p>
                  </article>
                ))}
              />
            </Section>
            <Section title="Announcements" icon={<Megaphone className="h-5 w-5" />}>
              <Cards
                empty="No announcements."
                items={announcements.map((item) => (
                  <article key={item.id} className="rounded-2xl border bg-card p-4">
                    <p className="text-xs font-bold uppercase text-primary">
                      {item.courses?.title || "All enrolled students"}
                    </p>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                  </article>
                ))}
              />
            </Section>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
function Cards({ items, empty }: { items: ReactNode[]; empty: string }) {
  return items.length ? (
    <div className="grid gap-3 md:grid-cols-2">{items}</div>
  ) : (
    <Empty text={empty} />
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{text}</p>
  );
}
function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary p-2">
      <p className="font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function Badge({ value }: { value: string }) {
  return (
    <span className="h-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize">
      {value}
    </span>
  );
}
function WelcomeStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 font-extrabold">{value}</p>
    </div>
  );
}
