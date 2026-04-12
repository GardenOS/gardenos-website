import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function FeatureCard({ title, children, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-garden-200/90 bg-white p-6 shadow-sm ring-1 ring-garden-100/80 ${className}`}
    >
      <span className="mb-4 h-1 w-10 rounded-full bg-garden-500" aria-hidden />
      <h3 className="text-base font-semibold text-garden-950">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-garden-800">{children}</div>
    </div>
  );
}
