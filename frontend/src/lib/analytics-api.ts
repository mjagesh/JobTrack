import api from "@/lib/api";
import type { DashboardStats } from "@/lib/dashboard";

interface AnalyticsResponse {
  success: boolean;
  analytics: DashboardStats;
}

export async function getDashboardAnalytics(): Promise<DashboardStats> {
  const { data } = await api.get<AnalyticsResponse>("/analytics");

  return data.analytics;
}
