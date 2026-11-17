"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getJobApplication,
  updateJobApplication,
  type CreateJobData,
} from "@/lib/jobs-api";
import { JOB_STATUSES, type JobStatus } from "@/lib/dashboard";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

function EditApplicationForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [form, setForm] = useState<CreateJobData>({
    company: "",
    jobTitle: "",
    location: "",
    jobUrl: "",
    salary: "",
    status: "Applied",
    appliedDate: "",
    interviewDate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorVersion, setErrorVersion] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadApplication() {
      try {
        const application = await getJobApplication(id);

        if (cancelled) return;

        setForm({
          company: application.company ?? "",
          jobTitle: application.jobTitle ?? "",
          location: application.location ?? "",
          jobUrl: application.jobUrl ?? "",
          salary: application.salary ?? "",
          status: application.status,
          appliedDate: application.appliedDate
            ? application.appliedDate.slice(0, 10)
            : "",
          interviewDate: application.interviewDate
            ? (() => {
                const date = new Date(application.interviewDate);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");

                return `${year}-${month}-${day}T${hours}:${minutes}`;
              })()
            : "",
          notes: application.notes ?? "",
        });
      } catch (err) {
        if (!cancelled) {
          showValidationError(
            "Unable to load this application. Please check the application and try again.",
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

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function showValidationError(message: string) {
    setError(message);
    setErrorVersion((version) => version + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    showValidationError("");

    if (!form.company.trim() || !form.jobTitle.trim() || !form.appliedDate) {
      showValidationError(
        "Company, job title, and application date are required.",
      );
      return;
    }

    const selectedAppliedDate = new Date(`${form.appliedDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(selectedAppliedDate.getTime()) ||
      selectedAppliedDate > today
    ) {
      showValidationError("The application date cannot be in the future.");
      return;
    }

    if (form.interviewDate) {
      const selectedInterviewDate = new Date(form.interviewDate);

      if (Number.isNaN(selectedInterviewDate.getTime())) {
        showValidationError("Please select a valid interview date and time.");
        return;
      }

      if (selectedInterviewDate < selectedAppliedDate) {
        showValidationError(
          "The interview date cannot be earlier than the application date.",
        );
        return;
      }
    }

    if (form.jobUrl?.trim()) {
      try {
        const url = new URL(form.jobUrl.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        showValidationError(
          "Enter a valid job URL starting with https:// or http://.",
        );
        return;
      }
    }

    if (form.status === "Interview" && !form.interviewDate) {
      showValidationError(
        "Please select an interview date for an interview-stage application.",
      );
      return;
    }

    setSaving(true);

    try {
      await updateJobApplication(id, {
        ...form,
        company: form.company.trim(),
        jobTitle: form.jobTitle.trim(),
        location: form.location?.trim(),
        jobUrl: form.jobUrl?.trim(),
        salary: form.salary?.trim(),
        notes: form.notes?.trim(),
        interviewDate: form.interviewDate
          ? new Date(form.interviewDate).toISOString()
          : null,
      });

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Unable to update the application. Please try again.";

      showValidationError(message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!error || !errorRef.current) return;

    requestAnimationFrame(() => {
      const errorElement = errorRef.current;

      if (!errorElement) return;

      errorElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      errorElement.focus({ preventScroll: true });
    });
  }, [error, errorVersion]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <p className="mx-auto max-w-3xl text-sm text-gray-600">
          Loading application...
        </p>
      </main>
    );
  }

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

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Application</h1>
          <p className="mt-2 text-sm text-gray-500">
            Update the application details as your recruitment process
            progresses.
          </p>

          {error && (
            <div
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="company">
                  Company *
                </label>
                <input
                  id="company"
                  name="company"
                  value={form.company}
                  maxLength={100}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="jobTitle">
                  Job Title *
                </label>
                <input
                  id="jobTitle"
                  name="jobTitle"
                  value={form.jobTitle}
                  maxLength={120}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="location">
                  Location
                </label>
                <input
                  id="location"
                  name="location"
                  value={form.location}
                  maxLength={120}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. Remote, Chennai"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="salary">
                  Salary
                </label>
                <input
                  id="salary"
                  name="salary"
                  value={form.salary}
                  maxLength={100}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. ₹15 LPA"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="jobUrl">
                  Job URL
                </label>
                <input
                  id="jobUrl"
                  name="jobUrl"
                  type="text"
                  inputMode="url"
                  maxLength={2048}
                  value={form.jobUrl}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="status">
                  Application Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as JobStatus,
                    }))
                  }
                  className={inputClass}
                >
                  {JOB_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="appliedDate">
                  Date Applied *
                </label>
                <input
                  id="appliedDate"
                  name="appliedDate"
                  type="date"
                  value={form.appliedDate}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="interviewDate">
                  Interview Date & Time
                </label>
                <input
                  id="interviewDate"
                  name="interviewDate"
                  type="datetime-local"
                  value={form.interviewDate ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                maxLength={5000}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="Recruiter updates, interview feedback, next steps..."
              />
            </div>

            <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                href="/"
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function EditApplicationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 p-6">
          <p className="mx-auto max-w-3xl text-sm text-gray-600">
            Loading application...
          </p>
        </main>
      }
    >
      <EditApplicationForm />
    </Suspense>
  );
}
