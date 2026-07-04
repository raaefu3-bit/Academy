import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Files, FileUp, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { DashboardShell } from "@/components/DashboardShell";
import { adminNav } from "@/components/nav-items";
import { supabase } from "@/lib/supabase";
import type { Course, Resource } from "@/types/academy";

export const Route = createFileRoute("/admin/resources")({ component: ResourcesPage });
const types = [
  "notes",
  "past_paper",
  "marking_scheme",
  "worksheet",
  "syllabus",
  "examiner_report",
  "formula_sheet",
  "recording_file",
  "other",
];

function ResourcesPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("notes");
  const [status, setUploadStatus] = useState<"draft" | "published">("draft");
  const [year, setYear] = useState("");
  const [session, setSession] = useState("");
  const [paper, setPaper] = useState("");
  const [variant, setVariant] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [bulkFiles, setBulkFiles] = useState<
    { file: File; title: string; topic: string; state: "ready" | "uploading" | "done" | "error" }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const [courseResult, resourceResult] = await Promise.all([
      profile?.role === "teacher"
        ? supabase.from("teacher_courses").select("courses(*)").eq("teacher_id", profile.id)
        : supabase.from("courses").select("*").neq("status", "archived").order("title"),
      supabase
        .from("resources")
        .select("*, courses(title)")
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
    ]);
    setCourses(
      profile?.role === "teacher"
        ? ((courseResult.data ?? [])
            .map((row: { courses: Course | null }) => row.courses)
            .filter(Boolean) as Course[])
        : ((courseResult.data as Course[]) ?? []),
    );
    setResources((resourceResult.data as Resource[]) ?? []);
    setMessage(courseResult.error?.message ?? resourceResult.error?.message ?? "");
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, [profile?.id, profile?.role]);

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !profile || !file || !courseId) return setMessage("Choose a course and file.");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${courseId}/${type}/${Date.now()}-${safeName}`;
    setMessage("Uploading…");
    const stored = await supabase.storage
      .from("course-resources")
      .upload(path, file, { upsert: false });
    if (stored.error) return setMessage(stored.error.message);
    const saved = await supabase.from("resources").insert({
      course_id: courseId,
      title: title.trim(),
      topic: topic.trim() || null,
      resource_type: type,
      file_path: path,
      file_name: file.name,
      file_mime_type: file.type || null,
      file_size: file.size,
      status,
      year: year || null,
      session: session || null,
      paper_number: paper || null,
      variant: variant || null,
      created_by: profile.id,
      updated_by: profile.id,
    });
    if (saved.error) {
      await supabase.storage.from("course-resources").remove([path]);
      return setMessage(saved.error.message);
    }
    setTitle("");
    setTopic("");
    setFile(null);
    setMessage(`Resource uploaded as ${status}.`);
    await load();
  }

  function chooseBulk(files: FileList | null) {
    setBulkFiles(
      Array.from(files ?? []).map((item) => ({
        file: item,
        title: item.name.replace(/\.[^.]+$/, "").replaceAll(/[-_]+/g, " "),
        topic: "",
        state: "ready",
      })),
    );
  }

  async function uploadAll() {
    if (!supabase || !profile || !courseId || bulkFiles.length === 0)
      return setMessage("Choose a course and at least one file.");
    setUploading(true);
    let succeeded = 0;
    for (let index = 0; index < bulkFiles.length; index += 1) {
      const item = bulkFiles[index];
      setBulkFiles((current) =>
        current.map((row, rowIndex) => (rowIndex === index ? { ...row, state: "uploading" } : row)),
      );
      const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${courseId}/${type}/${Date.now()}-${index}-${safeName}`;
      const stored = await supabase.storage.from("course-resources").upload(path, item.file);
      if (stored.error) {
        setBulkFiles((current) =>
          current.map((row, rowIndex) => (rowIndex === index ? { ...row, state: "error" } : row)),
        );
        continue;
      }
      const saved = await supabase.from("resources").insert({
        course_id: courseId,
        title: item.title.trim() || item.file.name,
        topic: item.topic.trim() || null,
        resource_type: type,
        file_path: path,
        file_name: item.file.name,
        file_mime_type: item.file.type || null,
        file_size: item.file.size,
        status,
        created_by: profile.id,
        updated_by: profile.id,
      });
      if (saved.error) {
        await supabase.storage.from("course-resources").remove([path]);
        setBulkFiles((current) =>
          current.map((row, rowIndex) => (rowIndex === index ? { ...row, state: "error" } : row)),
        );
      } else {
        succeeded += 1;
        setBulkFiles((current) =>
          current.map((row, rowIndex) => (rowIndex === index ? { ...row, state: "done" } : row)),
        );
      }
    }
    setUploading(false);
    setMessage(`${succeeded} of ${bulkFiles.length} resources uploaded as ${status}.`);
    await load();
  }

  async function publish(resource: Resource) {
    if (!supabase || !profile) return;
    const status = resource.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("resources")
      .update({ status, updated_by: profile.id })
      .eq("id", resource.id);
    setMessage(error?.message ?? `Resource ${status}.`);
    if (!error) await load();
  }

  async function preview(resource: Resource) {
    if (!supabase) return;
    const { data, error } = await supabase.storage
      .from("course-resources")
      .createSignedUrl(resource.file_path, 300);
    if (error) return setMessage(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function archive(resource: Resource) {
    if (!supabase || !profile || !window.confirm(`Archive “${resource.title}”?`)) return;
    const { error } = await supabase
      .from("resources")
      .update({ status: "archived", updated_by: profile.id })
      .eq("id", resource.id);
    setMessage(error?.message ?? "Resource archived.");
    if (!error) await load();
  }

  return (
    <DashboardShell
      items={adminNav}
      role="admin"
      title="Resources"
      subtitle="Upload and publish private course materials."
    >
      <div className="mb-5 rounded-2xl border bg-card p-4 shadow-card">
        <label className="text-sm font-bold">Managing course</label>
        <select
          required
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="mt-2 w-full rounded-xl border p-3"
        >
          <option value="">Select a course first</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 inline-flex rounded-xl bg-secondary p-1">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "single" ? "bg-card shadow-card" : ""}`}
        >
          Single upload
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${mode === "bulk" ? "bg-card shadow-card" : ""}`}
        >
          <Files className="mr-2 inline h-4 w-4" />
          Bulk upload
        </button>
      </div>
      {mode === "single" ? (
        <form
          onSubmit={upload}
          className="grid gap-3 rounded-2xl border bg-card p-5 shadow-card md:grid-cols-2"
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-xl border p-3"
          >
            {types.map((item) => (
              <option key={item}>{item.replaceAll("_", " ")}</option>
            ))}
          </select>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource title"
            className="rounded-xl border p-3"
          />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic"
            className="rounded-xl border p-3"
          />
          <select
            value={status}
            onChange={(e) => setUploadStatus(e.target.value as "draft" | "published")}
            className="rounded-xl border p-3"
          >
            <option value="draft">Save as draft</option>
            <option value="published">Publish immediately</option>
          </select>
          {["past_paper", "marking_scheme", "examiner_report"].includes(type) && (
            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Year"
                className="rounded-xl border p-3"
              />
              <input
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="Session"
                className="rounded-xl border p-3"
              />
              <input
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                placeholder="Paper"
                className="rounded-xl border p-3"
              />
              <input
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="Variant"
                className="rounded-xl border p-3"
              />
            </div>
          )}
          <input
            required
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-xl border p-3 md:col-span-2"
          />
          <button className="inline-flex items-center justify-center gap-2 rounded-xl gradient-primary p-3 font-bold text-primary-foreground md:col-span-2">
            <FileUp className="h-4 w-4" />
            Upload draft
          </button>
        </form>
      ) : (
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border p-3"
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setUploadStatus(e.target.value as "draft" | "published")}
              className="rounded-xl border p-3"
            >
              <option value="draft">Save all as draft</option>
              <option value="published">Publish all</option>
            </select>
            <input
              multiple
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4"
              onChange={(e) => chooseBulk(e.target.files)}
              className="rounded-xl border p-3 md:col-span-2"
            />
          </div>
          <div className="mt-4 space-y-3">
            {bulkFiles.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className="grid gap-2 rounded-xl bg-secondary p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  value={item.title}
                  onChange={(e) =>
                    setBulkFiles((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, title: e.target.value } : row,
                      ),
                    )
                  }
                  className="rounded-lg border p-2"
                  aria-label={`Title for ${item.file.name}`}
                />
                <input
                  value={item.topic}
                  onChange={(e) =>
                    setBulkFiles((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, topic: e.target.value } : row,
                      ),
                    )
                  }
                  placeholder="Topic (optional)"
                  className="rounded-lg border p-2"
                />
                <span className="self-center text-xs font-bold capitalize">{item.state}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={uploading || !courseId || bulkFiles.length === 0}
            onClick={uploadAll}
            className="mt-4 w-full rounded-xl gradient-primary p-3 font-bold text-primary-foreground disabled:opacity-50"
          >
            {uploading ? "Uploading files…" : `Upload ${bulkFiles.length || ""} files`}
          </button>
        </section>
      )}
      {message && <p className="my-4 rounded-xl bg-secondary p-3 text-sm">{message}</p>}
      {loading ? (
        <p className="mt-6">Loading resources…</p>
      ) : resources.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed p-12 text-center">
          No resources uploaded yet.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {resources
            .filter((resource) => !courseId || resource.course_id === courseId)
            .map((r) => (
              <article
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.courses?.title} · {r.resource_type.replaceAll("_", " ")} · {r.status}
                  </p>
                </div>
                <button
                  onClick={() => preview(r)}
                  className="rounded-lg border p-2"
                  title="Preview"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={() => publish(r)}
                  className="rounded-lg border px-3 py-2 text-xs font-bold"
                >
                  {r.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  onClick={() => archive(r)}
                  className="rounded-lg border p-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </article>
            ))}
        </div>
      )}
    </DashboardShell>
  );
}
