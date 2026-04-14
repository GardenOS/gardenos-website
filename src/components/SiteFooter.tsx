import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-auto border-t border-garden-200/80 bg-white/60 py-8 text-center text-sm text-garden-700">
      <p>
        © {new Date().getFullYear()} GardenOS · mygardenos.com — {t("rights")}
      </p>
    </footer>
  );
}
