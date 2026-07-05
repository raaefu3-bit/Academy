import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/academy";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="relative mb-8 flex flex-col gap-4 overflow-hidden rounded-3xl border bg-card px-5 py-6 shadow-card sm:flex-row sm:items-end sm:justify-between sm:px-7">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div>
        {eyebrow && <p className="lms-kicker">{eyebrow}</p>}
        <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="relative flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <article className="lms-card group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
        </div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/8 text-primary transition group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {note && <p className="mt-3 text-xs text-muted-foreground">{note}</p>}
    </article>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const good = ["active", "published", "approved", "paid", "completed"].includes(value);
  const warning = ["pending", "draft", "pending_review", "scheduled"].includes(value);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold capitalize",
        good && "bg-emerald-100 text-emerald-700",
        warning && "bg-amber-100 text-amber-800",
        !good && !warning && "bg-secondary text-muted-foreground",
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function CourseSwitcher({
  courses,
  value,
  onChange,
  label = "Managing course",
}: {
  courses: Course[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="lms-form mb-6">
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="lms-field mt-2 w-full font-semibold sm:max-w-lg"
      >
        <option value="">Select a course</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title} · {course.subject}
          </option>
        ))}
      </select>
    </div>
  );
}
