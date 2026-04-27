"use client";

import {
  ClerkLoaded,
  ClerkLoading,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import { Show } from "@clerk/react";
import { useTranslations } from "next-intl";

export function SiteHeaderClerkAuth() {
  const t = useTranslations("nav");

  return (
    <div className="flex h-9 shrink-0 items-center">
      <ClerkLoading>
        <span
          className="inline-block h-9 w-16 rounded-full bg-garden-100"
          aria-hidden
        />
      </ClerkLoading>
      <ClerkLoaded>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button
              type="button"
              className="rounded-full border border-garden-300 bg-white px-4 py-2 text-sm font-semibold text-garden-800 shadow-sm transition hover:border-garden-400 hover:bg-garden-50"
            >
              {t("signIn")}
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9 ring-1 ring-garden-200",
              },
            }}
          />
        </Show>
      </ClerkLoaded>
    </div>
  );
}
