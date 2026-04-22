"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { parse } from "@loaders.gl/core";
import { LASLoader } from "@loaders.gl/las";
import * as THREE from "three";
import { lasMeshToBufferGeometry } from "./lasMeshToBufferGeometry";
import { LasScanCanvas } from "./LasScanCanvas";

function isSafeScanKey(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes("..") || key.startsWith("/")) return false;
  return key.startsWith("scans/");
}

function buildPublicFileUrl(base: string, key: string): string {
  const b = base.replace(/\/+$/, "");
  const k = key.replace(/^\/+/, "");
  return `${b}/${encodeURI(k)}`;
}

function fetchArrayBufferWithProgress(
  url: string,
  onProgress: (pct: number) => void
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(95, Math.round((ev.loaded / ev.total) * 95)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(96);
        resolve(xhr.response as ArrayBuffer);
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send();
  });
}

export function LasScanViewerPage() {
  const t = useTranslations("dashboardScan");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const rawKey = searchParams.get("key");

  const key = useMemo(() => {
    if (!rawKey) return null;
    try {
      return decodeURIComponent(rawKey);
    } catch {
      return null;
    }
  }, [rawKey]);

  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";

  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "download" | "parse" | "ready" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  const fileUrl = useMemo(() => {
    if (!key || !publicBase || !isSafeScanKey(key)) return null;
    return buildPublicFileUrl(publicBase, key);
  }, [key, publicBase]);

  const basename = useMemo(() => {
    if (!key) return "";
    const i = key.lastIndexOf("/");
    return i >= 0 ? key.slice(i + 1) : key;
  }, [key]);

  const loadLas = useCallback(async () => {
    if (!key) {
      setPhase("error");
      setErrorMsg(t("missingKey"));
      return;
    }
    if (!isSafeScanKey(key)) {
      setPhase("error");
      setErrorMsg(t("badKey"));
      return;
    }
    if (!publicBase) {
      setPhase("error");
      setErrorMsg(t("missingPublicUrl"));
      return;
    }
    if (!fileUrl) {
      setPhase("error");
      setErrorMsg(t("loadFailed"));
      return;
    }

    setErrorMsg(null);
    setGeometry((g) => {
      g?.dispose();
      return null;
    });
    setProgress(0);
    setPhase("download");

    try {
      const ab = await fetchArrayBufferWithProgress(fileUrl, setProgress);
      setPhase("parse");
      setProgress(97);

      const mesh = await parse(ab, LASLoader, {
        worker: false,
        las: { skip: 1 },
      });

      const geom = lasMeshToBufferGeometry(mesh as { attributes: Record<string, unknown> });
      setGeometry(geom);
      setProgress(100);
      setPhase("ready");
    } catch {
      setPhase("error");
      setErrorMsg(t("loadFailed"));
      setProgress(0);
    }
  }, [fileUrl, key, publicBase, t]);

  useEffect(() => {
    void loadLas();
  }, [loadLas]);

  return (
    <div
      lang={locale === "zh" ? "zh-CN" : "en"}
      className="min-h-[calc(100dvh-8rem)] space-y-6 text-garden-50"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-garden-700/80 bg-garden-900/60 px-4 py-2 text-sm font-medium text-garden-100 transition hover:border-garden-500 hover:bg-garden-800/80"
        >
          <span aria-hidden>←</span>
          {t("back")}
        </Link>
      </div>

      <header className="space-y-2 border-b border-garden-800/80 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {t("title")}
        </h1>
        {basename ? (
          <p className="truncate font-mono text-sm text-garden-300" title={key ?? undefined}>
            {basename}
          </p>
        ) : null}
      </header>

      {(phase === "download" || phase === "parse") && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-garden-400">
            <span>{phase === "parse" ? t("parsing") : t("loading")}</span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-garden-950 ring-1 ring-garden-800/80"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-garden-600 to-garden-400 transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-100"
        >
          {errorMsg}
        </div>
      )}

      <LasScanCanvas geometry={geometry} />

      <p className="text-center text-xs text-garden-600">
        {t("hintControls")}
      </p>
    </div>
  );
}
