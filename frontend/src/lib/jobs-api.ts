import api from "@/lib/api";
import type { JobStatus } from "@/lib/dashboard";

export interface CreateJobData {
  company: string;
  jobTitle: string;
  location?: string;
  jobUrl?: string;
  salary?: string;
  status: JobStatus;
  appliedDate: string;
  interviewDate?: string | null;
  notes?: string;
}

export interface JobApplication extends CreateJobData {
  _id: string;
  createdAt: string;
  updatedAt?: string;
}

interface CreateJobResponse {
  success: boolean;
  job: JobApplication;
}

interface SingleJobResponse {
  success: boolean;
  job: JobApplication;
}

// Create a new application
export async function createJobApplication(
  application: CreateJobData,
): Promise<CreateJobResponse> {
  const { data } = await api.post<CreateJobResponse>("/jobs", application);

  return data;
}

// Fetch one application for editing
export async function getJobApplication(id: string): Promise<JobApplication> {
  const { data } = await api.get<SingleJobResponse>(`/jobs/${id}`);

  return data.job;
}

// Update an existing application
export async function updateJobApplication(
  id: string,
  application: CreateJobData,
): Promise<SingleJobResponse> {
  const { data } = await api.patch<SingleJobResponse>(
    `/jobs/${id}`,
    application,
  );

  return data;
}

export async function deleteJobApplication(id: string): Promise<void> {
  await api.delete(`/jobs/${id}`);
}

export interface GetJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: JobStatus | "";
}

export interface GetJobsResponse {
  success: boolean;
  jobs: JobApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getJobApplications(
  params: GetJobsParams = {},
): Promise<GetJobsResponse> {
  const { data } = await api.get<GetJobsResponse>("/jobs", {
    params,
  });

  return data;
}
