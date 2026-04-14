"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-garden-600">404</p>
      <h1 className="text-2xl font-semibold text-garden-950">{t("title")}</h1>
      <p className="text-garden-800">{t("body")}</p>
      <Link
        href="/"
        className="inline-flex rounded-full bg-garden-600 px-5 py-2 text-sm font-semibold text-white hover:bg-garden-700"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
