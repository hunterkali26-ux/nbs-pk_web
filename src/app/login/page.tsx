import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";

type SearchParams = Promise<{ redirect?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { redirect: requested } = await searchParams;
  // Same-app paths only — mirrors safeRedirectPath on the server action.
  const redirectTo =
    typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/";
  const signupHref =
    redirectTo === "/" ? "/signup" : `/signup?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Good to see you again."
      description="Sign in to track orders, check out faster, and keep your essentials close."
      footer={
        <>
          New to NBS-pk?{" "}
          <Link href={signupHref} className="font-semibold text-[#d4b06a] hover:text-[#8d6928]">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthShell>
  );
}