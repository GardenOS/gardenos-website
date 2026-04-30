"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface LiveStreamConfig {
  youtubeUrl?: string;
  title?: string;
  description?: string;
}

function toYoutubeEmbedUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;

  try {
    const input = rawUrl.trim();
    if (!input) return null;

    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return input;

      const watchId = url.searchParams.get("v");
      if (watchId) return `https://www.youtube.com/embed/${watchId}`;

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "live" && parts[1]) {
        return `https://www.youtube.com/embed/${parts[1]}`;
      }
    }

    if (host === "youtu.be") {
      const id = url.pathname.replace("/", "").trim();
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    return null;
  } catch {
    return null;
  }
}

export default function LiveTestPage() {
  const t = useTranslations("liveTest");

  const [configUrl, setConfigUrl] = useState<string>("");
  const [liveUrl, setLiveUrl] = useState<string>("");
  const [draftUrl, setDraftUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/config/live-stream.json", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load config");
        }
        const config: LiveStreamConfig = await response.json();
        const initialUrl = config.youtubeUrl ?? "";
        setConfigUrl(initialUrl);
        setLiveUrl(initialUrl);
        setDraftUrl(initialUrl);
      } catch (err) {
        console.error("Failed to load live stream config:", err);
        setError("Unable to load stream configuration");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  const embedUrl = toYoutubeEmbedUrl(liveUrl);

  function applyDraftUrl() {
    setLiveUrl(draftUrl.trim());
  }

  function resetToConfigUrl() {
    setDraftUrl(configUrl);
    setLiveUrl(configUrl);
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      <header className="space-y-6">
        <p className="inline-flex rounded-full border border-garden-200 bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-garden-700">
          {t("badge")}
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-garden-950 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="max-w-3xl text-pretty text-lg leading-relaxed text-garden-800">{t("lead")}</p>
      </header>

      <section className="rounded-2xl border border-garden-200 bg-white px-6 py-6 shadow-sm sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-garden-950">{t("configTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-garden-800">{t("configBody")}</p>
        <div className="mt-4 rounded-lg border border-garden-100 bg-garden-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-garden-700">{t("envLabel")}</p>
          <p className="mt-2 break-all font-mono text-sm text-garden-900">
            {loading ? (
              <span className="text-garden-500">Loading…</span>
            ) : error ? (
              <span className="text-red-600">{error}</span>
            ) : liveUrl ? (
              liveUrl
            ) : (
              t("envEmpty")
            )}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="live-url-input" className="block text-xs font-semibold uppercase tracking-widest text-garden-700">
            {t("inputLabel")}
          </label>
          <input
            id="live-url-input"
            type="url"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder={t("inputPlaceholder")}
            className="w-full rounded-lg border border-garden-200 bg-white px-3 py-2 text-sm text-garden-900 outline-none transition focus:border-garden-500 focus:ring-2 focus:ring-garden-200"
          />
          <p className="text-xs text-garden-700">{t("inputHint")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyDraftUrl}
              className="rounded-md bg-garden-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-garden-800"
            >
              {t("applyButton")}
            </button>
            <button
              type="button"
              onClick={resetToConfigUrl}
              className="rounded-md border border-garden-300 bg-white px-3 py-2 text-xs font-semibold text-garden-800 transition hover:bg-garden-50"
            >
              {t("useConfigButton")}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-garden-950">{t("previewTitle")}</h2>
        <p className="text-sm leading-relaxed text-garden-800">{t("previewHint")}</p>

        {loading ? (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900">
            <p className="text-sm font-medium">Loading live stream configuration...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-900">
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : embedUrl ? (
          <div className="overflow-hidden rounded-2xl border border-garden-200 bg-black shadow-sm">
            <iframe
              title="YouTube live preview"
              src={embedUrl}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
            <p className="text-sm font-medium">{t("previewUnavailable")}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-garden-200 bg-gradient-to-b from-white to-garden-50/70 px-6 py-8 shadow-sm sm:px-8">
        <h2 className="text-lg font-semibold tracking-tight text-garden-950">{t("fallbackTitle")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-garden-800">{t("fallbackBody")}</p>
        <div className="mt-4 rounded-md bg-garden-50 px-3 py-2 text-xs text-garden-700">
          <p className="font-semibold">配置位置：</p>
          <p className="mt-1 font-mono text-garden-800">
            编辑 <code className="bg-white px-1 py-0.5 rounded">public/config/live-stream.json</code> 中的{" "}
            <code className="bg-white px-1 py-0.5 rounded">youtubeUrl</code> 字段即可实时更新（无需重启）。
          </p>
        </div>
      </section>
    </div>
  );
}
