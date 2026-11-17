import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "JobTrack — Job Application Tracker",
  description:
    "Track job applications, manage interviews, and monitor your job search progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
