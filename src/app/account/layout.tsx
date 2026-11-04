import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/AccountNav";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransitionLoader } from "@/components/layout/PageTransitionLoader";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Surface the Admin Dashboard shortcut only for admins.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = (profileRow as { role: string } | null)?.role === "admin";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <AccountNav isAdmin={isAdmin} />
          <main className="min-w-0">
            <PageTransitionLoader>{children}</PageTransitionLoader>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
