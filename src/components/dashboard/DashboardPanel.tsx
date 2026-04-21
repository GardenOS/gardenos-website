"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type ScanRow = { key: string; size: number; lastModified: string | null };

function scanBasename(key: string) {
  const i = key.lastIndexOf("/");
  return i >= 0 ? key.slice(i + 1) : key;
}

function formatBytes(bytes: number, localeTag: string) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const nf = new Intl.NumberFormat(localeTag, {
    maximumFractionDigits: i === 0 ? 0 : 1,
  });
  return `${nf.format(v)} ${units[i]}`;
}

export function DashboardPanel() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const localeTag = locale === "zh" ? "zh-CN" : "en-US";

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [localeTag]
  );

  const [scans, setScans] = useState<ScanRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadScans = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const res = await fetch("/api/scans", { cache: "no-store" });
      if (res.status === 401) {
        setListError(t("errorAuth"));
        setScans([]);
        return;
      }
      if (!res.ok) throw new Error("list");
      const data = (await res.json()) as { scans: ScanRow[] };
      setScans(data.scans ?? []);
    } catch {
      setListError(t("errorList"));
      setScans([]);
    } finally {
      setListLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadScans();
  }, [loadScans]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".las")) {
      setListError(t("uploadHint"));
      return;
    }

    const contentType =
      file.type && file.type.length > 0 ? file.type : "application/octet-stream";

    setUploading(true);
    setShowSuccess(false);
    setListError(null);

    try {
      const presign = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType }),
      });

      if (presign.status === 401) {
        setListError(t("errorAuth"));
        return;
      }
      if (!presign.ok) {
        setListError(t("errorPresign"));
        return;
      }

      const { url } = (await presign.json()) as { url: string };

      const put = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });

      if (!put.ok) {
        setListError(t("errorUpload"));
        return;
      }

      setShowSuccess(true);
      await loadScans();
    } catch {
      setListError(t("errorUpload"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".las,application/octet-stream"
        className="sr-only"
        aria-hidden
        onChange={onFileChange}
      />

      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-garden-500">
          GardenOS · {t("eyebrow")}
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-garden-950 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-pretty text-base leading-relaxed text-garden-800">
          {t("subtitle")}
        </p>
      </header>

      {showSuccess && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-garden-400/50 bg-gradient-to-r from-garden-800/95 to-garden-700/95 px-5 py-4 text-garden-50 shadow-lg sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-white">{t("successTitle")}</p>
            <p className="mt-1 text-sm text-garden-100">{t("successBody")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccess(false)}
            className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-garden-900 shadow-sm transition hover:bg-garden-50"
          >
            {t("dismiss")}
          </button>
        </div>
      )}

      {listError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          {listError}
        </div>
      )}

      <section
        aria-labelledby="scans-heading"
        className="overflow-hidden rounded-2xl border border-garden-700/35 bg-gradient-to-br from-garden-950 via-garden-900 to-garden-950 shadow-xl ring-1 ring-garden-800/40"
      >
        <div className="flex flex-col gap-4 border-b border-garden-700/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2
              id="scans-heading"
              className="text-lg font-semibold tracking-tight text-white"
            >
              {t("listTitle")}
            </h2>
            <p className="mt-1 text-xs text-garden-300/90">{t("uploadHint")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadScans()}
              disabled={listLoading || uploading}
              className="rounded-full border border-garden-600/80 bg-garden-900/60 px-4 py-2 text-sm font-medium text-garden-100 transition hover:border-garden-500 hover:bg-garden-800/80 disabled:opacity-50"
            >
              {t("refresh")}
            </button>
            <button
              type="button"
              onClick={openFilePicker}
              disabled={uploading}
              className="inline-flex items-center justify-center rounded-full bg-garden-500 px-5 py-2 text-sm font-semibold text-garden-950 shadow-sm transition hover:bg-garden-400 disabled:opacity-50"
            >
              {uploading ? t("uploading") : t("upload")}
            </button>
          </div>
        </div>

        <div className="px-0 py-0">
          {listLoading ? (
            <div className="px-5 py-12 text-center text-sm text-garden-300">
              {t("loadingList")}
            </div>
          ) : scans.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm leading-relaxed text-garden-300">
              {t("empty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm text-garden-100">
                <thead className="border-b border-garden-800 bg-garden-950/80 text-xs font-semibold uppercase tracking-wide text-garden-400">
                  <tr>
                    <th className="px-5 py-3 sm:px-6">{t("colName")}</th>
                    <th className="px-3 py-3">{t("colSize")}</th>
                    <th className="px-5 py-3 sm:px-6">{t("colDate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garden-800/80">
                  {scans.map((row) => (
                    <tr
                      key={row.key}
                      className="bg-garden-950/40 transition hover:bg-garden-900/50"
                    >
                      <td className="max-w-[14rem] truncate px-5 py-3 font-medium text-white sm:max-w-md sm:px-6">
                        {scanBasename(row.key)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-garden-200 tabular-nums">
                        {formatBytes(row.size, localeTag)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-garden-300 sm:px-6">
                        {row.lastModified
                          ? dateFmt.format(new Date(row.lastModified))
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
