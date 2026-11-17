interface ApplicationTrendProps {
  data?: { month: string; count: number }[];
  loading?: boolean;
}

function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return value;
  }

  return new Date(year, month - 1, 1).toLocaleDateString("en", {
    month: "short",
  });
}

export default function ApplicationTrend({
  data,
  loading = false,
}: ApplicationTrendProps) {
  const hasData = data !== undefined;
  const points = data ?? [];
  const maxCount = Math.max(1, ...points.map((point) => point.count));

  if (loading) {
    return (
      <section
        id="analytics"
        className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Application activity</h2>
        <p className="mt-4 text-sm text-slate-500">
          Loading application activity...
        </p>
      </section>
    );
  }

  return (
    <section
      id="analytics"
      className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm shadow-slate-200/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Application activity</h2>
          <p className="mt-1 text-sm text-slate-500">
            Applications submitted over time
          </p>
        </div>

        <span className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600">
          Last 6 months
        </span>
      </div>

      {!hasData ? (
        <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
          Live application data will appear here.
        </div>
      ) : points.every((point) => point.count === 0) ? (
        <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
          No applications submitted during this period.
        </div>
      ) : (
        <div
          className="mt-8 flex h-48 items-end justify-between gap-2"
          role="img"
          aria-label="Bar chart showing monthly job applications"
        >
          {points.map((point, index) => (
            <div
              key={point.month}
              className="flex h-full min-w-0 flex-1 flex-col justify-end"
            >
              <div className="flex h-full items-end">
                <div
                  className={`w-full rounded-t-md transition-all ${
                    index === points.length - 1
                      ? "bg-[#7167ff]"
                      : "bg-[#e9e8ff]"
                  }`}
                  style={{
                    height: `${Math.max(
                      point.count > 0 ? 5 : 0,
                      (point.count / maxCount) * 100,
                    )}%`,
                  }}
                  title={`${point.count} applications`}
                />
              </div>

              <span className="mt-3 text-center text-[10px] text-slate-400">
                {formatMonth(point.month)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
