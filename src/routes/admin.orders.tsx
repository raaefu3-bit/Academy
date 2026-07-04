import { createFileRoute } from "@tanstack/react-router";
import { ReceiptText } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { adminNav } from "@/components/nav-items";
import { RequireRole } from "@/auth/RequireRole";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Payments — Admin" }] }),
  component: () => (
    <RequireRole allow={["admin", "super_admin"]}>
      <PaymentsPage />
    </RequireRole>
  ),
});

function PaymentsPage() {
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Manual Payments"
      subtitle="Review payment proofs and payment status."
    >
      <EmptyState
        icon={ReceiptText}
        title="No payment submissions"
        description="Real payment proofs will appear here after secure storage and the manual payment workflow are connected."
      />
    </DashboardShell>
  );
}
