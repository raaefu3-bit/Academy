import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Video, FileText, ClipboardCheck, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types/academy";

export const Route = createFileRoute("/")({ component: HomePage });

const features = [
  {
    icon: Video,
    title: "Live classes",
    text: "Join academy classes through simple Zoom or Google Meet links.",
  },
  {
    icon: FileText,
    title: "Learning resources",
    text: "Access notes, worksheets, syllabuses, past papers, and recordings.",
  },
  {
    icon: ClipboardCheck,
    title: "Assignments",
    text: "Submit work and receive marks and feedback in one place.",
  },
  {
    icon: BookOpen,
    title: "Your courses",
    text: "See only the courses and resources assigned to your account.",
  },
];

function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("courses")
      .select("*")
      .eq("status", "published")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCourses((data as Course[]) ?? []);
        setLoadingCourses(false);
      });
  }, []);
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <SiteNav />
      <main>
        <section className="relative px-6 pb-24 pt-20 sm:pt-28">
          <div className="pointer-events-none absolute inset-0 gradient-mesh" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary">
                Private online academy
              </p>
              <h1 className="mt-6 text-5xl font-extrabold leading-tight sm:text-6xl">
                Learn with clarity. <span className="text-gradient">Become exam ready.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                A focused learning platform for live classes, course resources, assignments,
                announcements, and student progress.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/onboarding"
                  className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-elegant"
                >
                  Request enrollment <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-input bg-card px-6 py-3 font-bold"
                >
                  Student login
                </Link>
              </div>
            </div>
            <div className="relative isolate flex min-h-[420px] items-end justify-center lg:min-h-[560px]">
              <div className="absolute inset-x-[8%] bottom-[8%] top-[12%] -z-10 rounded-[45%] bg-primary/20 blur-3xl" />
              <div className="absolute bottom-[5%] left-1/2 -z-10 h-2/3 w-2/3 -translate-x-1/2 rounded-full bg-blue-400/20 blur-[70px]" />
              <img
                src="/teacher-hero.png"
                alt="Teacher holding an iPad and Apple Pencil"
                className="max-h-[620px] w-full max-w-[540px] rounded-[2.5rem] object-contain object-bottom drop-shadow-[0_30px_45px_rgba(15,49,130,0.28)]"
              />
            </div>
          </div>
        </section>
        <section id="courses" className="scroll-mt-24 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Available courses
            </p>
            <h2 className="mt-3 text-4xl font-extrabold">Choose your course</h2>
            {loadingCourses ? (
              <p className="mt-8 text-muted-foreground">Loading courses…</p>
            ) : courses.length === 0 ? (
              <p className="mt-8 rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                No courses are available yet.
              </p>
            ) : (
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <article key={course.id} className="rounded-2xl border bg-card p-6 shadow-card">
                    <p className="text-xs font-bold uppercase text-primary">{course.subject}</p>
                    <h3 className="mt-1 text-xl font-bold">{course.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.level} · {course.board}
                    </p>
                    <p className="mt-4 font-bold">
                      {course.price_type === "free"
                        ? "Free"
                        : `${course.currency ?? "PKR"} ${course.price ?? 0}`}
                    </p>
                    <Link
                      to="/login"
                      className="mt-5 inline-flex rounded-xl gradient-primary px-4 py-3 font-bold text-primary-foreground"
                    >
                      Request access
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
        <section
          id="how-it-works"
          className="scroll-mt-24 border-y border-border bg-secondary/35 px-6 py-20"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Simple enrollment
            </p>
            <h2 className="mt-3 text-4xl font-extrabold">
              From choosing a level to opening your course.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                "Select your academic level",
                "Choose a matching course",
                "Request academy access",
                "Learn from your dashboard",
              ].map((item, index) => (
                <article key={item} className="rounded-2xl border bg-card p-6 shadow-card">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 font-bold">{item}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="features" className="scroll-mt-24 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                One learning space
              </p>
              <h2 className="mt-3 text-4xl font-extrabold">
                Everything students need, without the clutter.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-card"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl gradient-primary text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
