"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJobApplications, type JobApplication } from "@/lib/jobs-api";

function formatInterviewDate(value?: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function InterviewsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadInterviews() {
      setLoading(true);
      setError("");

      try {
        const response = await getJobApplications({
          page: 1,
          limit: 100,
        });

        if (active) {
          const now = Date.now();

          const interviews = response.jobs
            .filter((job) => {
              if (
                !job.interviewDate ||
                ["Rejected", "Withdrawn"].includes(job.status)
              ) {
                return false;
              }

              const interviewTime = new Date(job.interviewDate).getTime();

              return !Number.isNaN(interviewTime) && interviewTime >= now;
            })
            .sort(
              (a, b) =>
                new Date(a.interviewDate!).getTime() -
                new Date(b.interviewDate!).getTime(),
            );

          setApplications(interviews);
        }
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load interviews.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInterviews();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-4 inline-flex text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
            <p className="mt-2 text-sm text-gray-600">
              Review applications with an interview date and prepare for
              upcoming opportunities.
            </p>
          </div>

          <Link
            href="/applications"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
          >
            All Applications
          </Link>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white py-16 text-center text-sm text-gray-500">
            Loading interviews...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
          >
            {error}
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">No interviews scheduled</h2>
            <p className="mt-2 text-sm text-gray-500">
              Add an interview date to an application to see it here.
            </p>
            <Link
              href="/applications"
              className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Applications
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {applications.length} application
              {applications.length === 1 ? "" : "s"} with an interview date
            </p>

            {applications.map((application) => (
              <article
                key={application._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">
                      {application.company}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {application.jobTitle}
                    </p>

                    <p className="mt-3 text-sm font-medium text-indigo-700">
                      {formatInterviewDate(application.interviewDate)}
                    </p>

                    <span className="mt-3 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {application.status}
                    </span>
                  </div>

                  <div className="flex shrink-0 gap-3">
                    <Link
                      href={`/applications/${application._id}`}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      View
                    </Link>

                    <Link
                      href={`/applications/${application._id}/edit`}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
