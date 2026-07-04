export type AppRole = "super_admin" | "admin" | "teacher" | "student";
export type AcademicLevel = "O Levels" | "IGCSE" | "AS / A1" | "A2" | "A Level";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  role: AppRole;
  academic_level: AcademicLevel | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
