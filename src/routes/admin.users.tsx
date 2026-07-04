import { createFileRoute } from "@tanstack/react-router";
import { Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { AppRole, Profile } from "@/types/auth";
import { RequireRole } from "@/auth/RequireRole";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users & Roles — Admin" }] }),
  component: () => (
    <RequireRole allow={["admin", "super_admin"]}>
      <UsersPage />
    </RequireRole>
  ),
});

function UsersPage() {
  const { profile: current } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setMessage(error?.message ?? "");
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  const filtered = useMemo(
    () =>
      users.filter((user) =>
        `${user.full_name ?? ""} ${user.email}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [users, query],
  );

  async function changeRole(id: string, role: AppRole) {
    if (!supabase) return;
    const { error } = await supabase.rpc("set_user_role", { target_user_id: id, new_role: role });
    setMessage(error?.message ?? "Role updated.");
    if (!error) await load();
  }
  async function changeActive(id: string, active: boolean) {
    if (!supabase) return;
    const { error } = await supabase.rpc("set_user_active", { target_user_id: id, active });
    setMessage(error?.message ?? (active ? "User activated." : "User deactivated."));
    if (!error) await load();
  }

  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Users & Roles"
      subtitle="Role changes are enforced by the database."
    >
      {current?.role !== "super_admin" ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-xl font-bold">Super admin access required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only a super admin can change roles or account status.
          </p>
        </div>
      ) : (
        <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3"
            />
          </div>
          {message && <p className="mb-4 rounded-xl bg-secondary p-3 text-sm">{message}</p>}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="p-4">User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      Loading users…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border/60">
                      <td className="p-4">
                        <p className="font-bold">{user.full_name || "Unnamed user"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="font-semibold">{user.role.replace("_", " ")}</td>
                      <td>{user.is_active ? "Active" : "Inactive"}</td>
                      <td className="pr-4 text-right">
                        <div className="inline-flex gap-2">
                          {user.role !== "super_admin" && (
                            <button
                              onClick={() =>
                                changeRole(user.id, user.role === "admin" ? "student" : "admin")
                              }
                              className="rounded-lg border px-3 py-2 text-xs font-bold"
                            >
                              {user.role === "admin" ? "Make student" : "Make admin"}
                            </button>
                          )}
                          <button
                            onClick={() => changeActive(user.id, !user.is_active)}
                            className="rounded-lg border px-3 py-2 text-xs font-bold"
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
