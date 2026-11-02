"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { signIn, signUp } from "@/app/auth/actions";

const inputClassName =
  "mt-2 w-full border-b border-slate-200 bg-transparent px-0 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-600 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500";

function SubmitButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="group mt-8 flex w-full items-center justify-center gap-3 rounded-lg bg-amber-700 px-5 py-4 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-wait disabled:opacity-60"
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
      
      className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300"
    >
      {label}
      <input
        
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
    <p role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-900">
      {message}
    </p>
  ) : null;
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(signIn, {});

  return (
    <form  action={action}>
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="space-y-6">
        <Field name="email" label="Email address" type="email" placeholder="you@example.com" />
        <Field name="password" label="Password" type="password" placeholder="Your password" />
      </div>
      <ActionError message={state.error} />
      <div className="flex justify-end pt-3">
        <Link href="/signup" className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 hover:text-amber-800">
          Create an account
        </Link>
      </div>
      {pending ? <LoaderCircle className="mx-auto mt-8 size-5 animate-spin text-amber-700" /> : <SubmitButton label="Sign in" />}
    </form>
  );
}

export function SignupForm({ redirectTo }: { redirectTo: string }) {
  const [state, action, pending] = useActionState(signUp, {});

  return (
    <form  action={action}>
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="space-y-6">
        <Field name="full_name" label="Full name" placeholder="Your name" />
        <Field name="email" label="Email address" type="email" placeholder="you@example.com" />
        <Field name="password" label="Password" type="password" placeholder="At least 8 characters" />
        <Field name="phone_number" label="Phone number" type="tel" placeholder="+92 300 0000000" />
        <label
          
          className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300"
        >
          Delivery address
          <textarea
            
            className={`${inputClassName} min-h-20 resize-y`}
            name="address"
            placeholder="Street, city, Pakistan"
            required
          />
        </label>
      </div>
      <ActionError message={state.error} />
      <div className="mt-6 text-center text-xs leading-5 text-black/45 dark:text-slate-500">
        By creating an account, you agree to shop with NBS-pk.
      </div>
      {pending ? <LoaderCircle className="mx-auto mt-8 size-5 animate-spin text-amber-700" /> : <SubmitButton label="Create account" />}
    </form>
  );
}