import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/");
  const { data: profileData } = await supabase.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
  const profile = profileData as Pick<Profile, "role"> | null;
  if (profile?.role !== "admin") redirect("/");
  return <AdminShell>{children}</AdminShell>;
}