"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const PointCloudShowcase = dynamic(
  () => import("@/components/PointCloudShowcase"),
  { ssr: false }
);

function HeroPlaceholder() {
  return (
    <div
      className="relative w-full h-[600px] rounded-2xl bg-garden-950/20 ring-1 ring-garden-800/15"
      aria-hidden
    />
  );
}

/**
 * Renders the 3D hero only after mount so server HTML matches the first
 * client paint (avoids hydration mismatches with `dynamic(..., { ssr: false })`).
 */
export function HomePointCloudHero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <HeroPlaceholder />;
  }

  return <PointCloudShowcase />;
}
