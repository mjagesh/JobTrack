"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function GuestGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <p className="text-sm text-slate-500">Checking your session...</p>
      </main>
    );
  }

  return <>{children}</>;
}
