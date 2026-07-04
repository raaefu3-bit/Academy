import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/#faculty", label: "Faculty" },
  { to: "/#courses", label: "Courses" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#features", label: "Features" },
];

export function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-card">
          <Link to="/" className="flex items-center gap-2">
            <Logo animated className="h-9" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  pathname === l.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-foreground/80 hover:text-foreground sm:inline-flex"
            >
              Login
            </Link>
            <Link
              to="/onboarding"
              className="hidden rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95 sm:inline-flex"
            >
              Enroll Now
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-input lg:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="glass mt-2 rounded-2xl p-3 lg:hidden">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-3 py-2 text-center text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/onboarding"
                onClick={() => setOpen(false)}
                className="rounded-lg gradient-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
              >
                Enroll
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
