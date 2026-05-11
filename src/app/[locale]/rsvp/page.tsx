"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

type RsvpState = {
  status: "loading" | "success" | "invalid" | "error";
  eventTitle?: string;
  eventTime?: string;
  errorMessage?: string;
};

function LoadingView() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-garden-600"></div>
        </div>
        <p className="text-garden-700 font-medium">正在处理...</p>
      </div>
    </div>
  );
}

function RsvpPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("rsvp");
  const [state, setState] = useState<RsvpState>({ status: "loading" });

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setState({
        status: "invalid",
        errorMessage: "No token provided",
      });
      return;
    }

    // Verify token and process RSVP
    fetch("/api/live/rsvp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setState({
            status: "success",
            eventTitle: data.eventTitle,
            eventTime: data.eventTime,
          });
          // Auto redirect after 5 seconds
          setTimeout(() => {
            router.push(`/${locale}/live`);
          }, 5000);
        } else {
          setState({
            status: data.reason === "invalid_token" ? "invalid" : "error",
            errorMessage: data.message,
          });
        }
      })
      .catch(() => {
        setState({
          status: "error",
          errorMessage: "Network error",
        });
      });
  }, [searchParams, router, locale]);

  // Success State
  if (state.status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          {/* Success Card */}
          <div className="rounded-2xl border border-green-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-garden-500 to-green-600 px-6 py-12 text-center sm:px-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{t("success.title")}</h1>
              <p className="mt-3 text-lg text-green-50">{t("success.subtitle")}</p>
            </div>

            {/* Event Details Card */}
            {state.eventTitle && (
              <div className="border-t border-green-100 px-6 py-8 sm:px-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-garden-700 mb-4">
                  {t("success.eventInfo")}
                </h2>
                <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-garden-600">{t("success.topic")}</p>
                      <p className="mt-1 text-lg font-semibold text-garden-950">{state.eventTitle}</p>
                    </div>
                    {state.eventTime && (
                      <div className="border-t border-green-200 pt-3">
                        <p className="text-xs font-medium text-garden-600">{t("success.time")}</p>
                        <p className="mt-1 text-sm text-garden-700">{state.eventTime}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Message & CTA */}
            <div className="border-t border-green-100 px-6 py-8 sm:px-8">
              <p className="text-center text-sm text-garden-700 mb-6">{t("success.message")}</p>
              <div className="flex flex-col gap-3 sm:flex-row justify-center">
                <Link
                  href="/live"
                  className="inline-flex items-center justify-center rounded-full bg-garden-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700"
                >
                  {t("success.ctaPrimary")}
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-garden-300 bg-white px-8 py-3 text-sm font-semibold text-garden-700 shadow-sm transition hover:bg-garden-50"
                >
                  {t("success.ctaSecondary")}
                </Link>
              </div>
              <p className="mt-6 text-center text-xs text-garden-600">{t("success.redirect")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (state.status === "invalid" || state.status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-white shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-12 text-center sm:px-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {state.status === "invalid" ? t("invalid.title") : t("error.title")}
              </h1>
              <p className="mt-3 text-lg text-red-50">
                {state.status === "invalid" ? t("invalid.subtitle") : t("error.subtitle")}
              </p>
            </div>

            <div className="border-t border-red-100 px-6 py-8 sm:px-8">
              <p className="text-center text-sm text-red-700 mb-6">
                {state.status === "invalid" ? t("invalid.message") : t("error.message")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row justify-center">
                <Link
                  href="/live"
                  className="inline-flex items-center justify-center rounded-full bg-garden-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-garden-700"
                >
                  {state.status === "invalid" ? t("invalid.cta") : t("error.cta")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  return <LoadingView />;
}

export default function RsvpPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <RsvpPageContent />
    </Suspense>
  );
}
