import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AcademicLevel } from "@/types/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login or create account — TeachINK Academy" }] }),
  component: LoginPage,
});

type AuthMode = "login" | "signup";

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (lower.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (lower.includes("already registered") || lower.includes("already exists"))
    return "An account already exists with this email. Use Login instead.";
  if (lower.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return message || "Authentication failed. Please try again.";
}

function destinationFor(role: string) {
  if (role === "student") return "/student";
  if (role === "teacher") return "/teacher";
  return "/admin";
}

async function loadOrRepairProfile(userId: string) {
  if (!supabase) throw new Error("Supabase is not connected.");
  let result = await supabase.from("profiles").select("role, is_active").eq("id", userId).single();
  if (result.error?.code === "PGRST116") {
    const repaired = await supabase.rpc("ensure_my_profile");
    if (repaired.error) throw repaired.error;
    result = { data: repaired.data, error: null, count: null, status: 200, statusText: "OK" };
  }
  if (result.error) throw result.error;
  if (!result.data?.is_active) throw new Error("This account is deactivated. Contact the academy.");
  return result.data;
}

function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    setError("");
    setSuccess("");

    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase is not connected. Check the local environment configuration.");
      return;
    }
    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (mode === "signup") {
      if (fullName.trim().length < 2) return setError("Enter the student's full name.");
      if (!academicLevel) return setError("Select the student's academic level.");
      if (password.length < 8) return setError("Use a password with at least 8 characters.");
      if (password !== confirmPassword) return setError("The passwords do not match.");
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: { full_name: fullName.trim(), academic_level: academicLevel },
          },
        });
        if (signupError) throw signupError;
        const identities = data.user?.identities ?? [];
        if (data.user && identities.length === 0) {
          throw new Error("An account already exists with this email. Use Login instead.");
        }
        if (!data.session) {
          setSuccess(
            "Account created. Check your email and confirm the account, then return to login.",
          );
          return;
        }
        const profile = await loadOrRepairProfile(data.user.id);
        window.location.assign(destinationFor(profile.role));
        return;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (loginError) throw loginError;
      const profile = await loadOrRepairProfile(data.user.id);
      window.location.assign(destinationFor(profile.role));
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <div className="glass relative w-full max-w-lg rounded-3xl p-7 shadow-elegant sm:p-10">
        <div className="text-center">
          <div className="inline-block rounded-2xl bg-white p-3 shadow-glow">
            <Logo className="h-12" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold">
            {isSignup ? "Create student account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Create a secure account to access classes and learning resources."
              : "Sign in and we’ll take you to the correct dashboard."}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-2xl bg-secondary p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "login" ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold ${mode === "signup" ? "bg-card text-primary shadow-card" : "text-muted-foreground"}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {isSignup && (
            <>
              <Field icon={UserRound} label="Full name">
                <input
                  id="full-name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Student full name"
                  className="w-full bg-transparent outline-none"
                />
              </Field>
              <Field icon={UserRound} label="Academic level">
                <select
                  id="academic-level"
                  value={academicLevel}
                  onChange={(event) => setAcademicLevel(event.target.value as AcademicLevel)}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="">Select your level</option>
                  {["O Levels", "IGCSE", "AS / A1", "A2", "A Level"].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
          <Field icon={Mail} label="Email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@example.com"
              className="w-full bg-transparent outline-none"
            />
          </Field>
          <Field icon={LockKeyhole} label="Password">
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              className="w-full bg-transparent outline-none"
            />
          </Field>
          {isSignup && (
            <Field icon={LockKeyhole} label="Confirm password">
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                className="w-full bg-transparent outline-none"
              />
            </Field>
          )}
          {error && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {success}
            </div>
          )}
          <button
            disabled={busy || !isSupabaseConfigured}
            className="w-full rounded-xl gradient-primary px-4 py-3.5 font-bold text-primary-foreground shadow-elegant disabled:opacity-50"
          >
            {busy ? "Please wait…" : isSignup ? "Create student account" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          New accounts are always created as students. Admin and teacher access is assigned securely
          by the academy.
        </p>
        <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={label.toLowerCase().replaceAll(" ", "-")}
        className="mb-2 block text-sm font-semibold"
      >
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-xl border-2 border-input bg-background px-4 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
