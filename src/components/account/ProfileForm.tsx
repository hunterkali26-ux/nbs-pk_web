"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle, ExternalLink, LoaderCircle } from "lucide-react";

import { updateProfile } from "@/app/account/actions";

const inputClass =
  "mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800 dark:disabled:text-slate-500";
const labelClass =
  "block text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400";

export function ProfileForm({
  email,
  fullName,
  phoneNumber,
  address,
}: {
  email: string;
  fullName: string;
  phoneNumber: string;
  address: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, {});

  return (
    <div className="border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Details</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update your contact details and delivery address.
          </p>
        </div>
      </div>

      <form action={action} className="mt-6 space-y-6">
        <div>
          <label className={labelClass}>Email address</label>
          <input type="email" value={email} disabled readOnly className={inputClass} />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Your email address cannot be changed.
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={fullName}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="phone_number">
            Phone number
          </label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            required
            defaultValue={phoneNumber}
            placeholder="0320 8684757"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="address">
            Delivery address
          </label>
          <textarea
            id="address"
            name="address"
            required
            rows={4}
            defaultValue={address}
            placeholder="Street, city, Pakistan"
            className={`${inputClass} resize-y`}
          />
        </div>

        {state.error && (
          <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {state.error}
          </p>
        )}

        {state.success && (
          <p role="status" className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="size-4 shrink-0" />
            Your profile has been updated.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {pending ? "Saving..." : "Save changes"}
          </button>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
          >
            View order history <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </form>
    </div>
  );
}
