"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Smartphone,
  Download,
  ShieldCheck,
  Package,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  Apple,
  CheckCircle2,
} from "lucide-react";

const GITHUB_APK_URL =
  "https://github.com/hunterkali26-ux/vexis-pk_web/releases/latest/download/vexis-pk.apk";

type Platform = "android" | "ios";

export default function DownloadAppPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>("android");

  return (
    <>
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-6 grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Smartphone className="size-10 text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Get Vexis Mobile App
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-slate-500 dark:text-slate-400">
            Shop faster, track orders in real-time, and get exclusive app-only deals — right from your pocket.
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActivePlatform("android")}
              aria-pressed={activePlatform === "android"}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activePlatform === "android"
                  ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              <Smartphone className="size-4" />
              Android (APK)
            </button>
            <button
              type="button"
              onClick={() => setActivePlatform("ios")}
              aria-pressed={activePlatform === "ios"}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                activePlatform === "ios"
                  ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-600"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              <Apple className="size-4" />
              iOS (iPhone)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          {activePlatform === "android" ? (
            <AndroidSection apkUrl={GITHUB_APK_URL} />
          ) : (
            <IOSSection />
          )}
        </div>

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
          >
            <ArrowRight className="size-4 rotate-180" />
            Back to Vexis
          </Link>
        </div>
      </main>
    </>
  );

/* ─── Android Section ─────────────────────────────────────────────────── */

function AndroidSection({ apkUrl }: { apkUrl: string }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = [
    {
      number: 1,
      title: 'Click "Download APK"',
      icon: Download,
      detail:
        "Tap the green button below. The APK file will start downloading to your device.",
    },
    {
      number: 2,
      title: "Open the downloaded file",
      icon: Package,
      detail:
        'If Android shows "File might be harmful" or "Blocked by Play Protect", click "Download anyway" or "Install anyway". Vexis is safe — this is a generic warning for apps outside the Play Store.',
    },
    {
      number: 3,
      title: "Enable & Install",
      icon: ShieldCheck,
      detail:
        'If prompted, allow "Install from Unknown Sources" for your browser in Settings → Security. Then tap "Install" and you\'re done!',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Download CTA */}
      <a
        href={apkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-700"
      >
        <Download className="size-5 transition-transform group-hover:-translate-y-0.5" />
        Download APK for Android
        <ExternalLink className="size-4 opacity-60" />
      </a>

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          3-Step Installation Guide
        </h2>
        {steps.map((step) => {
          const Icon = step.icon;
          const isOpen = expandedStep === step.number;
          return (
            <div
              key={step.number}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white transition dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                type="button"
                onClick={() => setExpandedStep(isOpen ? null : step.number)}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {/* Step number badge */}
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  {step.number}
                </span>
                {/* Step icon */}
                <Icon className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
                {/* Step title */}
                <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </span>
                {/* Chevron */}
                {isOpen ? (
                  <ChevronUp className="size-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-slate-400" />
                )}
              </button>
              {/* Expandable detail */}
              <div
                className={`grid transition-all duration-200 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 pl-16 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {step.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust note */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
          <strong className="font-bold">Vexis APK is safe.</strong> It is built
          from the same open-source codebase you see here. No tracking, no ads,
          no unnecessary permissions.
        </p>
      </div>
    </div>
  );
}


/* ─── iOS Section ─────────────────────────────────────────────────────── */

function IOSSection() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = [
    {
      number: 1,
      title: "Open vexis.pk in Safari",
      icon: Smartphone,
      detail:
        'Launch Safari on your iPhone and navigate to vexis.pk. Note: this process requires Safari — other browsers on iOS do not support "Add to Home Screen".',
    },
    {
      number: 2,
      title: "Tap the Share icon",
      icon: Package,
      detail:
        'Look for the Share button at the bottom of the screen — it\'s a square with an upward arrow. Tap it to open the iOS share sheet.',
    },
    {
      number: 3,
      title: 'Scroll down and tap "Add to Home Screen"',
      icon: CheckCircle2,
      detail:
        'In the share sheet, scroll down through the actions list until you see "Add to Home Screen". Tap it, confirm the name "Vexis", then tap "Add". The app icon will appear on your home screen!',
    },
  ];

  return (
    <div className="space-y-6">
      {/* iOS info card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <Apple className="mt-0.5 size-6 shrink-0 text-slate-700 dark:text-slate-300" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Progressive Web App (PWA)
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              iOS doesn&apos;t allow direct APK-style installs, but you can add
              Vexis to your home screen for an app-like experience — offline
              support, push notifications, and full-screen browsing. No
              developer account needed!
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          3-Step Guide to Add Vexis on iPhone
        </h2>
        {steps.map((step) => {
          const Icon = step.icon;
          const isOpen = expandedStep === step.number;
          return (
            <div
              key={step.number}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white transition dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                type="button"
                onClick={() => setExpandedStep(isOpen ? null : step.number)}
                className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                {/* Step number badge */}
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  {step.number}
                </span>
                {/* Step icon */}
                <Icon className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={1.8} />
                {/* Step title */}
                <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </span>
                {/* Chevron */}
                {isOpen ? (
                  <ChevronUp className="size-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronDown className="size-4 shrink-0 text-slate-400" />
                )}
              </button>
              {/* Expandable detail */}
              <div
                className={`grid transition-all duration-200 ease-out ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 pl-16 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {step.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Done note */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm leading-relaxed text-emerald-800 dark:text-emerald-300">
          <strong className="font-bold">You&apos;re all set!</strong> The Vexis
          icon will now appear on your home screen. Tap it to open the app in
          full-screen mode — just like a native app.
        </p>
      </div>
    </div>
  );
}

}
