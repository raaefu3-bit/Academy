import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/admin/payments")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/orders" });
  },
});
