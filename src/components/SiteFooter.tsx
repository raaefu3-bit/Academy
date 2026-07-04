import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Instagram, Youtube, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <div className="inline-block rounded-xl bg-white p-2 shadow-glow">
              <Logo className="h-9" />
            </div>
            <p className="mt-4 max-w-xs text-sm text-sidebar-foreground/70">
              Premium O/A Level academy. Live classes, past papers, notes, tests — everything you
              need to become exam ready.
            </p>
          </div>
          <FooterCol
            title="Learn"
            links={[
              { to: "/live-classes", label: "Live Classes" },
              { to: "/past-papers", label: "Past Papers" },
              { to: "/notes", label: "Teacher Notes" },
              { to: "/assignments", label: "Assignments" },
              { to: "/tests", label: "Tests" },
            ]}
          />
          <FooterCol
            title="Account"
            links={[
              { to: "/login", label: "Login" },
              { to: "/onboarding", label: "Onboarding" },
              { to: "/dashboard", label: "Dashboard" },
              { to: "/profile", label: "Profile" },
            ]}
          />
          <FooterCol
            title="Team"
            links={[
              { to: "/teacher", label: "Teacher Portal" },
              { to: "/admin", label: "Admin Portal" },
              { to: "/announcements", label: "Announcements" },
              { to: "/schedule", label: "Schedule" },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-sidebar-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-sidebar-foreground/60">
            © 2026 TeachINK Academy. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {[Instagram, Youtube, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-accent/60 hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-gold">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sidebar-foreground/75 transition hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
