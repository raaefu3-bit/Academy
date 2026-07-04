import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import type { AcademicLevel } from "@/types/auth";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Choose your academic level — TeachINK" }] }),
  component: OnboardingPage,
});

const levels: AcademicLevel[] = ["O Levels", "IGCSE", "AS / A1", "A2", "A Level"];

function OnboardingPage() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [level, setLevel] = useState<AcademicLevel | "">(profile?.academic_level ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (loading)
    return <div className="grid min-h-screen place-items-center">Loading your profile…</div>;
  if (!session) return <Navigate to="/login" />;
  if (profile?.role !== "student") return <Navigate to="/admin" />;

  async function save() {
    if (!supabase || !profile || !level) return setError("Select your academic level.");
    setSaving(true);
    setError("");
    const result = await supabase
      .from("profiles")
      .update({ academic_level: level })
      .eq("id", profile.id);
    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }
    await refreshProfile();
    window.location.assign("/student");
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-10">
      <div className="pointer-events-none absolute inset-0 gradient-mesh" />
      <section className="glass relative w-full max-w-2xl rounded-3xl p-7 shadow-elegant sm:p-10">
        <Logo className="mx-auto h-12" />
        <div className="mx-auto mt-6 grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-primary-foreground">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-center text-3xl font-extrabold">Choose your academic level</h1>
        <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
          We use this to show only courses designed for your current level. You can update it later
          from your profile.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {levels.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLevel(item)}
              className={`rounded-2xl border-2 p-4 text-left font-bold transition ${
                level === item
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}
        <button
          type="button"
          disabled={!level || saving}
          onClick={save}
          className="mt-6 w-full rounded-xl gradient-primary px-5 py-3.5 font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Continue to dashboard"}
        </button>
      </section>
    </main>
  );
}
