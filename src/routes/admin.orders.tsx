import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock3, ReceiptText, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { adminNav } from "@/components/nav-items";
import { RequireRole } from "@/auth/RequireRole";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  billing_period: string | null;
  due_date: string | null;
  status: "unpaid" | "pending_review" | "paid" | "rejected";
  admin_notes: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
  courses: { title: string } | null;
};

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Payments — Admin" }] }),
  component: () => (
    <RequireRole allow={["admin", "super_admin"]}>
      <PaymentsPage />
    </RequireRole>
  ),
});

function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: queryError } = await supabase
      .from("payments")
      .select(
        "id,amount,currency,billing_period,due_date,status,admin_notes,created_at,profiles!payments_student_id_fkey(full_name,email),courses(title)",
      )
      .order("created_at", { ascending: false });
    setError(queryError?.message ?? "");
    setPayments((data as unknown as Payment[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: "paid" | "rejected") {
    if (!supabase) return;
    setUpdating(id);
    const { error: updateError } = await supabase
      .from("payments")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) setError(updateError.message);
    else await load();
    setUpdating(null);
  }

  const pendingCount = payments.filter((payment) => payment.status === "pending_review").length;
  const paidTotal = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Payments"
      subtitle="Review manual payments and keep student access records current."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="All records" value={payments.length} icon={ReceiptText} />
        <Stat label="Pending review" value={pendingCount} icon={Clock3} tone="amber" />
        <Stat label="Paid total" value={`PKR ${paidTotal.toLocaleString()}`} icon={CheckCircle2} />
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ReceiptText}
            title="No payment records yet"
            description="Payment records will appear here as soon as a student is assigned a fee or submits proof."
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Course</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Period / due</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-bold">
                        {payment.profiles?.full_name || "Student account"}
                      </p>
                      <p className="text-xs text-muted-foreground">{payment.profiles?.email}</p>
                    </td>
                    <td className="px-5 py-4">{payment.courses?.title || "General fee"}</td>
                    <td className="px-5 py-4 font-bold">
                      {payment.currency} {Number(payment.amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <p>{payment.billing_period || "One-time"}</p>
                      <p className="text-xs">{payment.due_date || "No due date"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize",
                          payment.status === "paid" && "bg-emerald-100 text-emerald-700",
                          payment.status === "pending_review" && "bg-amber-100 text-amber-800",
                          payment.status === "rejected" && "bg-red-100 text-red-700",
                          payment.status === "unpaid" && "bg-slate-100 text-slate-700",
                        )}
                      >
                        {payment.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={updating === payment.id || payment.status === "paid"}
                          onClick={() => void updateStatus(payment.id, "paid")}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={updating === payment.id || payment.status === "rejected"}
                          onClick={() => void updateStatus(payment.id, "rejected")}
                          className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: typeof ReceiptText;
  tone?: "blue" | "amber";
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-card">
      <div
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl",
          tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-2xl font-extrabold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </article>
  );
}
