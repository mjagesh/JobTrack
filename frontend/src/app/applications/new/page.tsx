"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createJobApplication } from "@/lib/jobs-api";
import { JOB_STATUSES, type JobStatus } from "@/lib/dashboard";

export default function NewApplicationPage() {
  const router = useRouter();

  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [status, setStatus] = useState<JobStatus>("Applied");
  const [appliedDate, setAppliedDate] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errorVersion, setErrorVersion] = useState(0);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    setAppliedDate(`${year}-${month}-${day}`);
  }, []);

  function showValidationError(message: string) {
    setError(message);
    setErrorVersion((version) => version + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!company.trim() || !jobTitle.trim()) {
      showValidationError("Company name and job title are required.");
      return;
    }

    if (!appliedDate) {
      showValidationError("Please select the date you applied.");
      return;
    }

    const selectedAppliedDate = new Date(`${appliedDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (
      Number.isNaN(selectedAppliedDate.getTime()) ||
      selectedAppliedDate > today
    ) {
      showValidationError("The application date cannot be in the future.");
      return;
    }

    if (interviewDate) {
      const selectedInterviewDate = new Date(interviewDate);
      const selectedAppliedDateTime = new Date(`${appliedDate}T00:00:00`);

      if (Number.isNaN(selectedInterviewDate.getTime())) {
        showValidationError("Please select a valid interview date and time.");
        return;
      }

      if (selectedInterviewDate < selectedAppliedDateTime) {
        showValidationError(
          "The interview date cannot be earlier than the application date.",
        );
        return;
      }
    }

    if (jobUrl.trim()) {
      try {
        const url = new URL(jobUrl.trim());
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

    if (status === "Interview" && !interviewDate) {
      showValidationError(
        "Please select an interview date for an interview-stage application.",
      );
      return;
    }

    setSaving(true);

    try {
      await createJobApplication({
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        location: location.trim(),
        jobUrl: jobUrl.trim(),
        salary: salary.trim(),
        status,
        appliedDate,
        interviewDate: interviewDate
          ? new Date(interviewDate).toISOString()
          : null,
        notes: notes.trim(),
      });

      router.replace("/");
      router.refresh();
    } catch (err: unknown) {
      let message = "Unable to save the application. Please try again.";

      if (typeof err === "object" && err !== null && "response" in err) {
        const response = err.response;

        if (
          typeof response === "object" &&
          response !== null &&
          "data" in response &&
          typeof response.data === "object" &&
          response.data !== null &&
          "message" in response.data &&
          typeof response.data.message === "string"
        ) {
          message = response.data.message;
        }
      }

      setError(message);
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

  const labelClass = "mb-2 block text-sm font-medium text-slate-700";
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#635bff] focus:ring-2 focus:ring-[#635bff]/10";

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-[#635bff] hover:underline"
        >
          ← Back to dashboard
        </Link>

        <header className="mb-8 mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#635bff]">
            JobTrack / Applications
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Add application
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Record a job opportunity and keep your search organized.
          </p>
        </header>

        {error && (
          <p
            ref={errorRef}
            role="alert"
            tabIndex={-1}
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border border-[#e9ebf2] bg-white p-5 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="mb-5 font-semibold text-slate-900">Job details</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="company" className={labelClass}>
                  Company name *
                </label>
                <input
                  id="company"
                  required
                  maxLength={100}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Acme Technologies"
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className={labelClass}>
                  Job title *
                </label>
                <input
                  id="jobTitle"
                  required
                  maxLength={120}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Senior React Developer"
                />
              </div>

              <div>
                <label htmlFor="location" className={labelClass}>
                  Location
                </label>
                <input
                  id="location"
                  maxLength={120}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                  placeholder="Remote, Chennai, Bengaluru..."
                />
              </div>

              <div>
                <label htmlFor="jobUrl" className={labelClass}>
                  Job posting URL
                </label>
                <input
                  id="jobUrl"
                  type="text"
                  inputMode="url"
                  maxLength={2048}
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://example.com/jobs/123"
                />
              </div>

              <div>
                <label htmlFor="salary" className={labelClass}>
                  Salary / package
                </label>
                <input
                  id="salary"
                  maxLength={100}
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. ₹15 LPA"
                />
              </div>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-7">
            <h2 className="mb-5 font-semibold text-slate-900">
              Application status
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="status" className={labelClass}>
                  Current status *
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobStatus)}
                  className={inputClass}
                >
                  {JOB_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="appliedDate" className={labelClass}>
                  Date applied *
                </label>
                <input
                  id="appliedDate"
                  type="date"
                  required
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="interviewDate" className={labelClass}>
                  Interview date {status === "Interview" ? "*" : "(optional)"}
                </label>
                <input
                  id="interviewDate"
                  type="datetime-local"
                  required={status === "Interview"}
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Add a date if an interview has been scheduled.
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-7">
            <label htmlFor="notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              maxLength={5000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Recruiter contact, interview preparation, follow-up reminders..."
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {notes.length}/5000
            </p>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#635bff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5148ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving application..." : "Save application"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
