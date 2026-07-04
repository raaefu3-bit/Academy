import {
  LayoutDashboard,
  BookOpen,
  Video,
  FileText,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Calendar,
  User,
  FlaskConical,
  Atom,
  Users,
  PlugZap,
} from "lucide-react";
import type { NavItem } from "./DashboardShell";

export const studentNav: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/student", label: "My Courses", icon: <BookOpen className="h-4 w-4" /> },
  { to: "/live-classes", label: "Live Classes", icon: <Video className="h-4 w-4" /> },
  { to: "/notes", label: "Notes", icon: <FileText className="h-4 w-4" /> },
  { to: "/past-papers", label: "Past Papers", icon: <FileText className="h-4 w-4" /> },
  { to: "/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/tests", label: "Tests", icon: <GraduationCap className="h-4 w-4" /> },
  { to: "/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { to: "/schedule", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
  { to: "/profile", label: "Profile", icon: <User className="h-4 w-4" /> },
];

export const teacherNav: NavItem[] = [
  { to: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/teacher/live-classes", label: "Live Classes", icon: <Video className="h-4 w-4" /> },
  { to: "/teacher/notes", label: "Resources", icon: <FileText className="h-4 w-4" /> },
  { to: "/teacher/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { to: "/teacher/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
];

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/courses", label: "Courses", icon: <BookOpen className="h-4 w-4" /> },
  { to: "/admin/resources", label: "Resources", icon: <FileText className="h-4 w-4" /> },
  { to: "/admin/live-classes", label: "Live Classes", icon: <Video className="h-4 w-4" /> },
  { to: "/admin/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { to: "/admin/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/tests", label: "Tests", icon: <GraduationCap className="h-4 w-4" /> },
  {
    to: "/admin/connected-accounts",
    label: "Connected Accounts",
    icon: <PlugZap className="h-4 w-4" />,
  },
  { to: "/admin/orders", label: "Payments", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/students", label: "Students", icon: <User className="h-4 w-4" /> },
  { to: "/admin/users", label: "Users & Roles", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/access", label: "Access Requests", icon: <FlaskConical className="h-4 w-4" /> },
];

export const teacherManagementNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/courses", label: "My Courses", icon: <BookOpen className="h-4 w-4" /> },
  { to: "/admin/resources", label: "Resources", icon: <FileText className="h-4 w-4" /> },
  { to: "/admin/live-classes", label: "Live Classes", icon: <Video className="h-4 w-4" /> },
  { to: "/admin/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
  { to: "/admin/assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/admin/tests", label: "Tests", icon: <GraduationCap className="h-4 w-4" /> },
  {
    to: "/admin/connected-accounts",
    label: "Connected Accounts",
    icon: <PlugZap className="h-4 w-4" />,
  },
];

export { Atom };
