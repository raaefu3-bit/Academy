import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile(userId: string) {
    if (!supabase) return setProfile(null);
    const result = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!result.error) {
      setProfile(result.data as Profile);
      return;
    }
    if (result.error.code === "PGRST116") {
      const repair = await supabase.rpc("ensure_my_profile");
      if (!repair.error) {
        setProfile(repair.data as Profile);
        return;
      }
    }
    throw result.error;
  }

  async function loadProfileSafely(userId: string) {
    try {
      setError(null);
      await Promise.race([
        loadProfile(userId),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("Profile check timed out.")), 10_000),
        ),
      ]);
    } catch (profileError) {
      setProfile(null);
      setError(
        profileError instanceof Error ? profileError.message : "Profile could not be loaded.",
      );
    }
  }

  async function refreshProfile() {
    if (session?.user.id) await loadProfile(session.user.id);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) throw sessionError;
        setSession(data.session);
        if (data.session) await loadProfileSafely(data.session.user.id);
      })
      .catch((sessionError) => {
        if (!active) return;
        setError(
          sessionError instanceof Error ? sessionError.message : "Session could not be loaded.",
        );
        setSession(null);
        setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setError(null);
        return;
      }
      // Supabase warns against starting more client requests inside this callback.
      // Defer the profile query until the auth lock has been released.
      window.setTimeout(() => {
        if (active) void loadProfileSafely(nextSession.user.id);
      }, 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      configured: isSupabaseConfigured,
      error,
      refreshProfile,
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
      },
    }),
    [session, profile, loading, error],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
