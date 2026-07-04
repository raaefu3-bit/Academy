import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CalendarDays, FileText, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { PageHeader, StatCard, StatusBadge } from "@/components/lms";
import { teacherNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";

export const Route = createFileRoute("/teacher/")({ component: TeacherDashboard });

type AssignedCourse = Course & {
  enrollments: { count: number }[];
  resources: { count: number }[];
};

function TeacherDashboard() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<AssignedCourse[]>([]);
  const [classCount, setClassCount] = useState(0);
  const [resourceCount, setResourceCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!supabase || !profile) return;
      const assigned = await supabase
        .from("teacher_courses")
        .select("courses(*,enrollments(count),resources(count))")
        .eq("teacher_id", profile.id);
      const rows = (assigned.data ?? [])
        .map((row: { courses: AssignedCourse | null }) => row.courses)
        .filter(Boolean) as AssignedCourse[];
      setCourses(rows);
      const ids = rows.map((course) => course.id);
      if (ids.length) {
        const today = new Date().toISOString().slice(0, 10);
        const [classes, resources] = await Promise.all([
          supabase
            .from("live_classes")
            .select("*", { count: "exact", head: true })
            .in("course_id", ids)
            .eq("status", "scheduled")
            .gte("class_date", today),
          supabase
            .from("resources")
            .select("*", { count: "exact", head: true })
            .in("course_id", ids)
            .neq("status", "archived"),
        ]);
        setClassCount(classes.count ?? 0);
        setResourceCount(resources.count ?? 0);
        setError(classes.error?.message ?? resources.error?.message ?? "");
      }
      setError((current) => assigned.error?.message ?? current);
    }
    void load();
  }, [profile]);

  const subjects = [...new Set(courses.map((course) => course.subject))].join(" & ");
  const teacherTitle = `${profile?.full_name || "Teacher"}${subjects ? ` — ${subjects} Panel` : ""}`;
  const isChemistry = subjects.toLowerCase().includes("chemistry");
  const isPhysics = subjects.toLowerCase().includes("physics");
  const portrait = isChemistry
    ? "/sir-hashim-ali.jpeg"
    : isPhysics
      ? "/sir-hamiz-javed.jpeg"
      : null;

  return (
    <DashboardShell
      items={teacherNav}
      role="teacher"
      title={teacherTitle}
      subtitle="Your assigned courses and teaching activity."
    >
      <section
        className={`relative mb-7 overflow-hidden rounded-3xl p-7 text-white shadow-elegant sm:p-9 ${
          isChemistry
            ? "bg-gradient-to-br from-sky-950 via-blue-900 to-cyan-700"
            : isPhysics
              ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-amber-700"
              : "gradient-primary"
        }`}
      >
        <div className="relative z-10 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-white/65">
            Personal teacher panel
          </p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">{teacherTitle}</h2>
          <p className="mt-3 max-w-xl leading-7 text-white/75">
            Manage only your assigned {subjects || "academy"} courses, students, classes, and
            learning material.
          </p>
        </div>
        {portrait && (
          <img
            src={portrait}
            alt=""
            className="absolute inset-y-0 right-0 hidden h-full w-72 object-cover opacity-35 [mask-image:linear-gradient(to_left,black,transparent)] md:block"
          />
        )}
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      </section>
      <PageHeader
        eyebrow="Teacher workspace"
        title="Your courses, one focused workspace"
        description="Everything below is filtered through your assigned course IDs and the existing database security policies."
        actions={
          <Link to="/teacher/resources" className="lms-button">
            Quick upload
          </Link>
        }
      />
      {error && <p className="mb-5 rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={BookOpen} label="Assigned courses" value={courses.length} />
        <StatCard icon={CalendarDays} label="Upcoming classes" value={classCount} />
        <StatCard icon={FileText} label="Course resources" value={resourceCount} />
      </div>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold">My Courses</h2>
            <p className="text-sm text-muted-foreground">Only courses assigned to your account.</p>
          </div>
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        {courses.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
            No courses assigned yet. Ask an admin to assign you to a course.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="rounded-2xl border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-primary">{course.subject}</p>
                    <h3 className="mt-1 text-lg font-bold">{course.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.course_target_levels?.join(" + ") || course.level} · {course.board}
                    </p>
                  </div>
                  <StatusBadge value={course.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <Mini label="Students" value={course.enrollments?.[0]?.count ?? 0} />
                  <Mini label="Resources" value={course.resources?.[0]?.count ?? 0} />
                </div>
                <Link to="/teacher/resources" className="lms-button mt-4 w-full">
                  Manage course content
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="font-extrabold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
