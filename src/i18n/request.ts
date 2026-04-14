import { getRequestConfig } from "next-intl/server";
import { isRoutingLocale, routing } from "./routing";
import en from "../../messages/en.json";
import zh from "../../messages/zh.json";

const messagesByLocale = {
  zh,
  en,
} as const;

type AppLocale = keyof typeof messagesByLocale;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (
    isRoutingLocale(requested) ? requested : routing.defaultLocale
  ) as AppLocale;

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
