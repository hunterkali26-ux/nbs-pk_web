import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";

type SearchParams = Promise<{ redirect?: string }>;

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const { redirect: requested } = await searchParams;
  const redirectTo =
    typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/";
  const loginHref =
    redirectTo === "/" ? "/login" : `/login?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthShell
      eyebrow="Create your account"
      title="Join NBS-pk."
      description="One account for faster checkout, live order tracking, and members-only drops."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-[#d4b06a] hover:text-[#8d6928]">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm redirectTo={redirectTo} />
    </AuthShell>
  );
}