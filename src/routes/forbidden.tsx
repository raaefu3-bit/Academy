import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";

export const Route = createFileRoute("/forbidden")({ component: ForbiddenPage });
function ForbiddenPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <ShieldX className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-5 text-3xl font-bold">Access unavailable</h1>
        <p className="mt-3 text-muted-foreground">
          Your account does not have permission to open this page, or it has been deactivated.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex rounded-xl gradient-primary px-5 py-3 font-bold text-primary-foreground"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
