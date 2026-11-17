"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/auth-api";
import { saveToken } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import GuestGuard from "@/components/auth/GuestGuard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      saveToken(response.token);
      await refreshUser();
      router.replace("/");
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
          : "Unable to log in. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuestGuard>
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-[#635bff]"
          >
            JobTrack
          </Link>

          <h1 className="mt-8 text-2xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your job applications.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#635bff]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#635bff]"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#635bff] px-4 py-3 font-semibold text-white transition hover:bg-[#5148e5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#635bff] hover:underline"
            >
              Create account
            </Link>
          </p>
        </section>
      </main>
    </GuestGuard>
  );
}
