"use server";

import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { ProfileInsert } from "@/types/database";

export type AuthActionState = {
  error?: string;
};

const valueFromForm = (formData: FormData, name: string) =>
  String(formData.get(name) ?? "").trim();

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = valueFromForm(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password to continue." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase sign-in failed:", error.message);

    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Please confirm your email address before signing in." };
    }

    return { error: "We couldn't sign you in. Check your email and password and try again." };
  }

  redirect("/");
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = valueFromForm(formData, "full_name");
  const email = valueFromForm(formData, "email");
  const password = String(formData.get("password") ?? "");
  const phoneNumber = valueFromForm(formData, "phone_number");
  const address = valueFromForm(formData, "address");

  if (!fullName || !email || !password || !phoneNumber || !address) {
    return { error: "Complete every field to create your VEXIS pk account." };
  }

  if (password.length < 8) {
    return { error: "Your password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone_number: phoneNumber, address },
    },
  });

  if (error || !data.user) {
    if (error) {
      console.error("Supabase signup failed:", error.message);
    }
    return { error: "We couldn't create your account. Please try again." };
  }

  const profile: ProfileInsert = {
    id: data.user.id,
    full_name: fullName,
    phone_number: phoneNumber,
    address,
    role: "customer",
  };
  const profileClient = data.session
    ? supabase
    : process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        )
      : null;

  if (!data.session) {
    console.warn(
      "Supabase signup returned no session; using the server-only profile client for user:",
      data.user.id,
    );
  }

  if (!profileClient) {
    console.error(
      "Profile upsert skipped because no authenticated session or service-role key is available for user:",
      data.user.id,
    );
    return {
      error: "Your account was created, but we could not finish your profile. Please contact support.",
    };
  }

  const { error: profileError } = await profileClient
    .from("profiles")
    .upsert(profile as never, { onConflict: "id" });

  if (profileError) {
    console.error("Supabase profile upsert failed for user:", data.user.id, profileError.message);
    if (data.session) {
      await supabase.auth.signOut();
    }
    return { error: "Your account was created, but your profile could not be saved." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}