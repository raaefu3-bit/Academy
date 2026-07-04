export interface Course {
  id: string;
  title: string;
  subject: string;
  level: string | null;
  course_target_levels?: string[];
  board: string | null;
  description: string | null;
  price: number | null;
  schedule: string | null;
  status: "draft" | "published" | "archived";
  is_public?: boolean;
  level_group?: string | null;
  class_type?: string;
  currency?: string;
  slug?: string | null;
  batch_name?: string | null;
  price_type?: "free" | "one_time" | "monthly" | "manual_payment";
  included_content?: string | null;
  enrollment_status?: "open" | "closed" | "invite_only";
  duration?: string | null;
  short_description?: string | null;
  teacher_id?: string | null;
  thumbnail_url?: string | null;
  description: string | null;
}

export interface Resource {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  topic: string | null;
  resource_type: string;
  file_path: string;
  file_name: string;
  file_mime_type: string | null;
  file_size: number | null;
  status: "draft" | "published" | "archived";
  allow_download: boolean;
  courses?: { title: string } | null;
}
