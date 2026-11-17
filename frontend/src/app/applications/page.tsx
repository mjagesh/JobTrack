"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  deleteJobApplication,
  getJobApplications,
  type JobApplication,
  type GetJobsResponse,
} from "@/lib/jobs-api";
import { JOB_STATUSES, type JobStatus } from "@/lib/dashboard";

const PAGE_SIZE = 10;

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status: JobStatus) {
  switch (status) {
    case "Applied":
      return "bg-blue-100 text-blue-700";
    case "Screening":
      return "bg-purple-100 text-purple-700";
    case "Interview":
      return "bg-amber-100 text-amber-700";
    case "Offer":
      return "bg-green-100 text-green-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    case "Withdrawn":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [pagination, setPagination] = useState<GetJobsResponse["pagination"]>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JobStatus | "">("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getJobApplications({
        page,
        limit: PAGE_SIZE,
        search,
        status,
      });

      setJobs(response.jobs);
      setPagination(response.pagination);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load applications.";

      setError(message);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications, refreshKey]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleStatusChange(value: string) {
    setPage(1);
    setStatus(value as JobStatus | "");
  }

  async function handleDelete(application: JobApplication) {
    const confirmed = window.confirm(
      `Delete the application for ${application.company} — ${application.jobTitle}?`,
    );

    if (!confirmed) return;

    setDeletingId(application._id);
    setError("");

    try {
      await deleteJobApplication(application._id);

      if (jobs.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        setRefreshKey((current) => current + 1);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this application.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const firstItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * PAGE_SIZE + 1;

  const lastItem = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex text-sm font-medium text-blue-600 hover:text-blue-800 bred-links"
            >
              ← Back to Dashboard
            </Link>

            <Link
              href="/interviews"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bred-links"
            >
              ← Interviews
            </Link>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              All Applications
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Manage and track all your job applications in one place.
            </p>
          </div>

          <Link
            href="/applications/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Application
          </Link>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <form
            onSubmit={handleSearch}
            className="mb-6 flex flex-col gap-3 md:flex-row"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search company, job title, or location..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
            >
              Search
            </button>

            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              aria-label="Filter by application status"
              className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">All statuses</option>
              {JOB_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </form>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
              <button
                type="button"
                onClick={() => setRefreshKey((current) => current + 1)}
                className="ml-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Loading applications...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center">
              <h2 className="text-lg font-semibold text-gray-800">
                No applications found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Try changing your search or status filter, or add a new
                application.
              </p>
              <Link
                href="/applications/new"
                className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Application
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {firstItem}–{lastItem} of {pagination.total}{" "}
                  applications
                </p>
                <p>
                  Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-y border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 font-semibold">
                        Company / Role
                      </th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Applied Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {jobs.map((application) => (
                      <tr
                        key={application._id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-semibold text-gray-900">
                            {application.company}
                          </p>
                          <p className="mt-1 text-gray-500">
                            {application.jobTitle}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-gray-600">
                          {application.location || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                          {formatDate(application.appliedDate)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(application.status)}`}
                          >
                            {application.status}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/applications/${application._id}`}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              View
                            </Link>

                            <Link
                              href={`/applications/${application._id}/edit`}
                              className="font-medium text-gray-700 hover:text-gray-950"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              disabled={deletingId === application._id}
                              onClick={() => void handleDelete(application)}
                              className="font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === application._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                <span className="text-sm text-gray-500">
                  Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
