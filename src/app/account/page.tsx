import { ProfileForm } from "@/components/account/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Server-rendered so profile details appear instantly (no client fetch flash)
 * and stay in sync after updateProfile calls revalidatePath("/account").
 */
export default async function AccountProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as Profile | null) ?? null;
  }

  // Fall back to signup metadata when the profile row is missing,
  // so the form is never rendered blank.
  const meta = user?.user_metadata as Record<string, string | undefined> | undefined;

  return (
    <ProfileForm
      email={user?.email ?? ""}
      fullName={profile?.full_name ?? meta?.full_name ?? ""}
      phoneNumber={profile?.phone_number ?? meta?.phone_number ?? ""}
      address={profile?.address ?? meta?.address ?? ""}
    />
  );
}

