import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/AuthForms";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Begin your edit"
      title="Make an entrance."
      description="Create your account for considered essentials, tailored updates, and a smoother checkout."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#b58a3a] hover:text-[#8d6928]">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}