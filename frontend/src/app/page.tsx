"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDashboardAnalytics } from "@/lib/analytics-api";
import type { DashboardStats } from "@/lib/dashboard";
import Link from "next/link";

import type { ComponentProps } from "react";
import StatCard from "@/components/dashboard/StatCard";
import ApplicationTrend from "@/components/dashboard/ApplicationTrend";
import StatusOverview from "@/components/dashboard/StatusOverview";

function getDashboardCards(analytics: DashboardStats) {
  const total = analytics.totalApplications;
  const interviews = analytics.applicationsByStatus.Interview;
  const offers = analytics.applicationsByStatus.Offer;
  const rejected = analytics.applicationsByStatus.Rejected;

  const screening = analytics.applicationsByStatus.Screening;

  const responded = screening + interviews + offers + rejected;

  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  return [
    {
      label: "Total Applications",
      value: total,
      change: "Applications tracked",
      icon: "▤",
      color: "purple" as const,
    },
    {
      label: "Interviews",
      value: interviews,
      change: "Applications in interview stage",
      icon: "◷",
      color: "blue" as const,
    },
    {
      label: "Offers",
      value: offers,
      change: "Offers received",
      icon: "✦",
      color: "green" as const,
    },
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      change: "Applications with a response",
      icon: "↗",
      color: "orange" as const,
    },
  ];
}

const statusStyles: Record<string, string> = {
  Interview: "bg-purple-50 text-purple-700",
  Applied: "bg-blue-50 text-blue-700",
  Screening: "bg-amber-50 text-amber-700",
  Rejected: "bg-red-50 text-red-700",
  Offer: "bg-emerald-50 text-emerald-700",
};

function Sidebar({
  userName,
  onLogout,
}: {
  userName: string;
  onLogout: () => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#171a2b] text-white md:fixed md:inset-y-0 md:left-0 md:w-[248px]">
      <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7167ff] text-xl font-bold">
          J
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight">JobTrack</p>
          <p className="text-xs text-slate-400">Career workspace</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto p-4 md:flex-1 md:flex-col">
        <p className="hidden px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 md:block">
          Workspace
        </p>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-xl bg-[#7167ff]/20 px-4 py-3 text-sm font-medium text-white"
        >
          <span>▦</span> Dashboard
        </Link>

        <Link
          href="/applications"
          className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <span>▤</span> Applications
        </Link>

        <Link
          href="/interviews"
          className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <span>◷</span> Interviews
        </Link>

        <Link
          href="/#analytics"
          className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <span>▥</span> Analytics
        </Link>
      </nav>

      <div className="hidden border-t border-white/10 p-5 md:block">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-sm font-medium">Keep moving forward</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Every application brings you closer to your next opportunity.
          </p>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-400/20 text-sm font-semibold">
            {userName
              .trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-slate-400">Career dashboard</p>

            <button
              type="button"
              onClick={onLogout}
              className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

type RecentApplication = DashboardStats["recentApplications"][number];

function RecentApplications({
  data,
  loading,
  error,
}: {
  data?: RecentApplication[];
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <section
        id="applications"
        className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Recent applications</h2>
        <p className="mt-4 text-sm text-slate-500">
          Loading recent applications...
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        id="applications"
        className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Recent applications</h2>
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error || "Unable to load applications."}
        </p>
      </section>
    );
  }

  return (
    <section
      id="applications"
      className="overflow-hidden rounded-2xl border border-[#e9ebf2] bg-white shadow-sm shadow-slate-200/20"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-6">
        <div>
          <h2 className="font-semibold text-slate-900">Recent applications</h2>
          <p className="mt-1 text-sm text-slate-500">
            Keep track of your latest opportunities
          </p>
        </div>

        <Link
          href="/applications"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View all →
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">
          No applications yet. Add your first application to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-y border-slate-100 bg-slate-50/70">
              <tr className="text-xs font-medium text-slate-500">
                <th className="px-6 py-4">Company / Role</th>
                <th className="px-4 py-4">Date applied</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {data.map((application) => (
                <tr key={application._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-700">
                        {application.company.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {application.company}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {application.jobTitle}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-500">
                    {new Date(application.appliedDate).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${
                        statusStyles[application.status] ??
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {application.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/applications/${application._id}`}
                        className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </Link>

                      <Link
                        href={`/applications/${application._id}/edit`}
                        className="inline-flex items-center rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

type UpcomingInterview = DashboardStats["upcomingInterviews"][number];

function UpcomingInterviews({
  data,
  loading,
  error,
}: {
  data?: UpcomingInterview[];
  loading: boolean;
  error: string;
}) {
  if (loading) {
    return (
      <section
        id="interviews"
        className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Upcoming interviews</h2>
        <p className="mt-4 text-sm text-slate-500">
          Loading upcoming interviews...
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        id="interviews"
        className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Upcoming interviews</h2>
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error || "Unable to load interviews."}
        </p>
      </section>
    );
  }

  return (
    <section
      id="interviews"
      className="rounded-2xl border border-[#e9ebf2] bg-white p-6 shadow-sm shadow-slate-200/20"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Upcoming interviews</h2>
          <p className="mt-1 text-sm text-slate-500">Prepare for what's next</p>
        </div>
        <span className="text-xl text-[#7167ff]">◷</span>
      </div>

      {data.length === 0 ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
          No upcoming interviews scheduled.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {data.map((interview) => {
            const date = new Date(interview.interviewDate);
            const hasValidDate = !Number.isNaN(date.getTime());

            const dateLabel = hasValidDate
              ? date.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Date unavailable";

            const timeLabel = hasValidDate
              ? date.toLocaleTimeString("en-IN", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "";

            return (
              <div
                key={interview._id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#f0efff] text-[#6258ed]">
                  <span className="text-lg font-bold leading-5">
                    {hasValidDate
                      ? date.toLocaleDateString("en-IN", {
                          day: "2-digit",
                        })
                      : "--"}
                  </span>
                  <span className="mt-1 text-[9px] font-semibold tracking-wider">
                    {hasValidDate
                      ? date
                          .toLocaleDateString("en-IN", {
                            month: "short",
                          })
                          .toUpperCase()
                      : "---"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {interview.company}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {interview.jobTitle}
                  </p>

                  <p className="mt-2 text-xs font-medium text-[#6258ed]">
                    {dateLabel}
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <span aria-hidden="true">◷</span>
                    {hasValidDate ? timeLabel : "Time unavailable"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<DashboardStats | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (loading || !user) return;

    let active = true;

    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      try {
        const data = await getDashboardAnalytics();

        if (active) {
          setAnalytics(data);
        }
      } catch {
        if (active) {
          setAnalyticsError("Unable to load dashboard data. Please try again.");
        }
      } finally {
        if (active) {
          setAnalyticsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [loading, user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <div id="dashboard" className="min-h-screen">
      <Sidebar userName={user.name} onLogout={logout} />

      <main className="min-w-0 md:ml-[248px]">
        <header className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-medium text-slate-400">
              WORKSPACE / OVERVIEW
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              Your career journey
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efedff] text-sm font-bold text-[#6258ed]">
              JT
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-7 p-5 sm:p-8">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Here's your job search at a glance.
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Welcome back, {user.name}
              </h2>
            </div>
            <Link
              href="/applications/new"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              + Add Application
            </Link>
          </section>

          <section
            aria-label="Application summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {analyticsLoading ? (
              <p className="col-span-full py-8 text-center text-sm text-slate-500">
                Loading application statistics...
              </p>
            ) : analytics ? (
              getDashboardCards(analytics).map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))
            ) : (
              <p
                role="alert"
                className="col-span-full py-8 text-center text-sm text-red-600"
              >
                {analyticsError || "Dashboard statistics are unavailable."}
              </p>
            )}
          </section>

          <section
            id="analytics"
            className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]"
          >
            <ApplicationTrend
              data={analytics?.applicationsOverTime}
              loading={analyticsLoading}
            />

            <StatusOverview
              data={analytics?.applicationsByStatus}
              loading={analyticsLoading}
            />
          </section>

          <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.6fr_1fr]">
            <RecentApplications
              data={analytics?.recentApplications}
              loading={analyticsLoading}
              error={analyticsError}
            />

            <UpcomingInterviews
              data={analytics?.upcomingInterviews}
              loading={analyticsLoading}
              error={analyticsError}
            />
          </section>

          <footer className="pb-2 text-center text-xs text-slate-400">
            JobTrack · Your next opportunity starts here.
          </footer>
        </div>
      </main>
    </div>
  );
}
