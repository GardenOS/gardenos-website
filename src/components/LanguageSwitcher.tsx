"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSwitch(loc: string) {
    // 如果已登录，调用API记录语言
    void fetch("/api/user/language", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: loc }),
      keepalive: true,
    }).catch(() => {
      // 忽略错误
    });
    router.replace(pathname, { locale: loc });
  }
  return (
    <div
      className="inline-flex rounded-full border border-garden-200 bg-white p-0.5 text-xs font-medium text-garden-800 shadow-sm"
      role="group"
      aria-label="Language"
    >
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => handleSwitch(loc)}
          className={`rounded-full px-3 py-1 transition ${
            locale === loc
              ? "bg-garden-600 text-white shadow-sm"
              : "hover:bg-garden-50"
          }`}
        >
          {loc === "zh" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}
