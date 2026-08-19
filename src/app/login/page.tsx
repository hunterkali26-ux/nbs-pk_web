import Link from "next/link";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Good to see you again."
      description="Sign in to keep your edit close and continue where you left off."
      footer={
        <>
          New to VEXIS pk?{" "}
          <Link href="/signup" className="font-semibold text-[#b58a3a] hover:text-[#8d6928]">
            Join the edit
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}