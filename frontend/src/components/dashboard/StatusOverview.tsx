import { JOB_STATUSES, type JobStatus } from "@/lib/dashboard";

interface StatusOverviewProps {
  data?: Record<JobStatus, number>;
  loading?: boolean;
}

const statusStyles: Record<JobStatus, { dot: string; bar: string }> = {
  Applied: { dot: "bg-blue-500", bar: "bg-blue-500" },
  Screening: { dot: "bg-amber-400", bar: "bg-amber-400" },
  Interview: { dot: "bg-purple-500", bar: "bg-purple-500" },
  Offer: { dot: "bg-emerald-500", bar: "bg-emerald-500" },
  Rejected: { dot: "bg-red-400", bar: "bg-red-400" },
  Withdrawn: { dot: "bg-slate-400", bar: "bg-slate-400" },
};

export default function StatusOverview({
  data,
  loading = false,
}: StatusOverviewProps) {
  const total = data
    ? Object.values(data).reduce((sum, count) => sum + count, 0)
    : 0;

  if (loading) {
    return (
      <section className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Application status</h2>
        <p className="mt-4 text-sm text-slate-500">
          Loading application status...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm shadow-slate-200/20">
      <h2 className="font-semibold text-slate-900">Application status</h2>
      <p className="mt-1 text-sm text-slate-500">
        Current application pipeline
      </p>

      {!data ? (
        <div className="mt-6 flex h-40 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
          Live status data will appear here.
        </div>
      ) : (
        <>
          <div
            className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label="Distribution of applications by status"
          >
            {JOB_STATUSES.map((status) => {
              const count = data[status];

              return count > 0 ? (
                <div
                  key={status}
                  className={statusStyles[status].bar}
                  style={{ width: `${(count / Math.max(total, 1)) * 100}%` }}
                  title={`${status}: ${count}`}
                />
              ) : null;
            })}
          </div>

          <div className="mt-6 space-y-4">
            {JOB_STATUSES.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${statusStyles[status].dot}`}
                  />
                  <span className="text-sm text-slate-600">{status}</span>
                </div>

                <span className="text-sm font-semibold text-slate-900">
                  {data[status]}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
