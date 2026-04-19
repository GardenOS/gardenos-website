"use client";

import dynamic from "next/dynamic";

const PointCloudShowcase = dynamic(
  () => import("@/components/PointCloudShowcase"),
  { ssr: false }
);

export function HomePointCloudHero() {
  return <PointCloudShowcase />;
}
