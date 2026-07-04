import { createFileRoute } from "@tanstack/react-router";
import { Eye, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { studentNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Resource } from "@/types/academy";

export const Route = createFileRoute("/notes")({ component: StudentResources });

function StudentResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("resources")
      .select("*, courses(title)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        setResources((data as Resource[]) ?? []);
        setError(queryError?.message ?? "");
        setLoading(false);
      });
  }, []);

  async function open(resource: Resource) {
    if (!supabase) return;
    const { data, error: signedError } = await supabase.storage
      .from("course-resources")
      .createSignedUrl(resource.file_path, 300);
    if (signedError) return setError(signedError.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <DashboardShell
      items={studentNav}
      role="student"
      title="Notes & Resources"
      subtitle="Published materials from your enrolled courses."
    >
      {error && (
        <p className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      {loading ? (
        <p>Loading resources…</p>
      ) : resources.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-bold">No published resources for your courses</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <article key={resource.id} className="rounded-2xl border bg-card p-5 shadow-card">
              <p className="text-xs font-bold uppercase text-primary">
                {resource.resource_type.replaceAll("_", " ")}
              </p>
              <h2 className="mt-2 font-bold">{resource.title}</h2>
              <p className="text-sm text-muted-foreground">
                {resource.courses?.title}
                {resource.topic ? ` · ${resource.topic}` : ""}
              </p>
              <button
                onClick={() => open(resource)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                <Eye className="h-4 w-4" />
                Open viewer
              </button>
              {!resource.allow_download && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Downloads are disabled. Viewing links expire after 5 minutes.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
