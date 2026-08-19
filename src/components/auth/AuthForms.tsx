"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { signIn, signUp } from "@/app/auth/actions";

const inputClassName =
  "mt-2 w-full border-b border-black/15 bg-transparent px-0 py-3 text-sm outline-none transition placeholder:text-black/30 focus:border-[#b58a3a]";

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="group mt-8 flex w-full items-center justify-center gap-3 bg-[#172a2a] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#284444] disabled:cursor-wait disabled:opacity-60"
    >
      <span>{label}</span>
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label
      suppressHydrationWarning
      className="block text-xs font-semibold uppercase tracking-[0.14em] text-black/65"
    >
      {label}
      <input
        suppressHydrationWarning
        className={inputClassName}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function ActionError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-5 border border-red-900/15 bg-red-50 px-4 py-3 text-sm leading-5 text-red-900">
      {message}
    </p>
  ) : null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});

  return (
    <form suppressHydrationWarning action={action}>
      <div className="space-y-6">
        <Field name="email" label="Email address" type="email" placeholder="you@example.com" />
        <Field name="password" label="Password" type="password" placeholder="Your password" />
      </div>
      <ActionError message={state.error} />
      <div className="flex justify-end pt-3">
        <Link href="/signup" className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b58a3a] hover:text-[#8d6928]">
          Create an account
        </Link>
      </div>
      {pending ? <LoaderCircle className="mx-auto mt-8 size-5 animate-spin text-[#b58a3a]" /> : <SubmitButton label="Sign in" />}
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, {});

  return (
    <form suppressHydrationWarning action={action}>
      <div className="space-y-6">
        <Field name="full_name" label="Full name" placeholder="Your name" />
        <Field name="email" label="Email address" type="email" placeholder="you@example.com" />
        <Field name="password" label="Password" type="password" placeholder="At least 8 characters" />
        <Field name="phone_number" label="Phone number" type="tel" placeholder="+92 300 0000000" />
        <label
          suppressHydrationWarning
          className="block text-xs font-semibold uppercase tracking-[0.14em] text-black/65"
        >
          Delivery address
          <textarea
            suppressHydrationWarning
            className={`${inputClassName} min-h-20 resize-y`}
            name="address"
            placeholder="Street, city, Pakistan"
            required
          />
        </label>
      </div>
      <ActionError message={state.error} />
      <div className="mt-6 text-center text-xs leading-5 text-black/45">
        By creating an account, you agree to shop with VEXIS pk.
      </div>
      {pending ? <LoaderCircle className="mx-auto mt-8 size-5 animate-spin text-[#b58a3a]" /> : <SubmitButton label="Create account" />}
    </form>
  );
}