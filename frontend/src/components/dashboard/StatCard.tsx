import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  change: string;
  icon: ReactNode;
  color: "purple" | "blue" | "green" | "orange";
}

const iconStyles: Record<StatCardProps["color"], string> = {
  purple: "bg-purple-50 text-purple-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function StatCard({
  label,
  value,
  change,
  icon,
  color,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-[#e9ebf2] bg-white p-5 shadow-sm shadow-slate-200/20">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold ${iconStyles[color]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">{change}</p>
    </article>
  );
}
