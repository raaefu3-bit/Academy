import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { teacherManagementNav } from "@/components/nav-items";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface DashboardShellProps {
  items: NavItem[];
  title: string;
  subtitle?: string;
  role: "student" | "teacher" | "admin";
  children: ReactNode;
}

export function DashboardShell({ items, title, subtitle, role, children }: DashboardShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLabel = role === "student" ? "Student" : role === "teacher" ? "Teacher" : "Admin";
  const displayName = profile?.full_name || profile?.email || "Academy account";
  const initials = displayName.slice(0, 2).toUpperCase();
  const visibleItems =
    role === "admin" && profile?.role === "teacher" ? teacherManagementNav : items;
  const panelLabel =
    role === "admin" && profile?.role === "teacher" ? "Teacher Workspace" : `${roleLabel} Panel`;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-white p-1.5">
              <Logo animated className="h-7" />
            </div>
          </Link>
        </div>
        <div className="px-4 pt-5 pb-2">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {panelLabel}
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          {visibleItems.map((item) => {
            const active =
              pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "shrink-0",
                    active
                      ? "text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-gold text-sm font-bold text-gold-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{roleLabel} account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex h-20 items-center gap-4 px-4 sm:px-8">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border bg-card lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="lg:hidden">
              <Logo className="h-8" />
            </Link>
            <div className="hidden min-w-0 flex-1 lg:block">
              <h1 className="truncate text-xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden max-w-56 text-right sm:block">
                <p className="truncate text-sm font-bold">{displayName}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {profile?.role?.replaceAll("_", " ")}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="grid h-10 w-10 place-items-center rounded-lg border border-input bg-secondary/40 hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="border-t border-border/60 px-4 py-2 sm:px-8 lg:hidden">
            <h1 className="truncate text-lg font-bold">{title}</h1>
          </div>
        </header>

        <main className="px-4 pb-10 pt-6 sm:px-8">{children}</main>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-sidebar/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="relative flex h-full w-[min(86vw,320px)] flex-col bg-sidebar p-4 text-sidebar-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-sidebar-border pb-4">
              <div className="rounded-xl bg-white p-2">
                <Logo className="h-7" />
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-sidebar-accent"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="px-3 pb-2 pt-5 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
              {panelLabel}
            </p>
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {visibleItems.map((item) => {
                const active =
                  pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
