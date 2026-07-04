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
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p>
        )}
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
    <article className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-extrabold">{value}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
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
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize",
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
    <div className="mb-6 rounded-2xl border bg-card p-4 shadow-card">
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border bg-background p-3 font-semibold sm:max-w-lg"
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
