"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  deleteJobApplication,
  getJobApplication,
  type JobApplication,
} from "@/lib/jobs-api";

const statusStyles: Record<string, string> = {
  Applied: "bg-blue-50 text-blue-700",
  Screening: "bg-amber-50 text-amber-700",
  Interview: "bg-purple-50 text-purple-700",
  Offer: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
  Withdrawn: "bg-slate-100 text-slate-700",
};

function formatDate(value?: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not provided";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ApplicationDetailsContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [application, setApplication] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadApplication() {
      try {
        const result = await getJobApplication(id);

        if (!cancelled) {
          setApplication(result);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load this application. It may not exist or you may not have access.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) void loadApplication();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the application for ${application?.company}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await deleteJobApplication(id);
      window.location.assign("/");
    } catch {
      setDeleteError("Unable to delete this application. Please try again.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <p className="mx-auto max-w-3xl text-sm text-gray-600">
          Loading application details...
        </p>
      </main>
    );
  }

  if (error || !application) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6">
          <p role="alert" className="text-sm text-red-600">
            {error || "Application not found."}
          </p>
          <Link
            href="/"
            className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800 bred-links"
          >
            ← Back to dashboard
          </Link>

          <Link
            href="/interviews"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bred-links"
          >
            ← Interviews
          </Link>
        </div>
      </main>
    );
  }

  const interviewDate = application.interviewDate
    ? new Date(application.interviewDate)
    : null;

  const validInterviewDate =
    interviewDate && !Number.isNaN(interviewDate.getTime())
      ? interviewDate
      : null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bred-links"
        >
          ← Back to dashboard
        </Link>

        <Link
          href="/interviews"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bred-links"
        >
          ← Interviews
        </Link>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Job application</p>
                <h1 className="mt-2 text-2xl font-bold text-gray-900">
                  {application.company}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  {application.jobTitle}
                </p>
              </div>

              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                  statusStyles[application.status] ??
                  "bg-slate-100 text-slate-700"
                }`}
              >
                {application.status}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/applications/${application._id}/edit`}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Edit Application
              </Link>

              {application.jobUrl && (
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  View Job Posting ↗
                </a>
              )}

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Application"}
              </button>
            </div>

            {deleteError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {deleteError}
              </p>
            )}
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Location
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {application.location || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Salary
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {application.salary || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Date applied
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {formatDate(application.appliedDate)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Interview date
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {validInterviewDate
                  ? formatDate(validInterviewDate.toISOString())
                  : "Not scheduled"}
              </p>

              {validInterviewDate && (
                <p className="mt-1 text-sm text-gray-500">
                  {validInterviewDate.toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {application.notes || "No notes added yet."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ApplicationDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 p-6">
          <p className="mx-auto max-w-3xl text-sm text-gray-600">
            Loading application details...
          </p>
        </main>
      }
    >
      <ApplicationDetailsContent />
    </Suspense>
  );
}
