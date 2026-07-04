import { createFileRoute } from "@tanstack/react-router";
import { Cloud, ShieldCheck, Video } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { PageHeader, StatusBadge } from "@/components/lms";

export const Route = createFileRoute("/admin/connected-accounts")({
  component: ConnectedAccountsPage,
});

function ConnectedAccountsPage() {
  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Connected Accounts"
      subtitle="Secure provider connections for live classes and recording storage."
    >
      <PageHeader
        eyebrow="Phase 3 integrations"
        title="Connect your teaching services"
        description="OAuth credentials are handled by server-side callbacks. Access and refresh tokens will never be exposed in this browser."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <ProviderCard
          icon={Video}
          title="Zoom"
          description="Create scheduled and instant meetings from TeachINK once Zoom OAuth is configured."
          features={[
            "Meeting creation",
            "Live class status",
            "Recording webhooks",
            "Attendance sync",
          ]}
        />
        <ProviderCard
          icon={Cloud}
          title="Google Drive"
          description="Store processed class recordings in each teacher's connected Google Drive."
          features={[
            "Private OAuth connection",
            "Storage usage",
            "Recording folders",
            "Account switching",
          ]}
        />
      </div>
      <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-bold">Server configuration required</h3>
          <p className="mt-1 text-sm leading-6">
            Connect buttons remain disabled until Zoom and Google OAuth client IDs, server-only
            secrets, callback URLs, and secure token storage are configured.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

function ProviderCard({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: typeof Video;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <article className="rounded-3xl border bg-card p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <StatusBadge value="not connected" />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <ul className="mt-5 grid gap-2 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled
        title="OAuth configuration is required"
        className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground opacity-50"
      >
        Connect {title}
      </button>
    </article>
  );
}
