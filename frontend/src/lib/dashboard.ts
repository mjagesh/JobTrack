export const JOB_STATUSES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface DashboardStats {
  totalApplications: number;
  applicationsByStatus: Record<JobStatus, number>;
  applicationsOverTime: {
    month: string;
    count: number;
  }[];
  upcomingInterviews: {
    _id: string;
    company: string;
    jobTitle: string;
    interviewDate: string;
    status: JobStatus;
  }[];
  recentApplications: {
    _id: string;
    company: string;
    jobTitle: string;
    status: JobStatus;
    appliedDate: string;
    createdAt: string;
  }[];
}
