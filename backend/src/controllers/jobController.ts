import type { RequestHandler } from "express";
import mongoose from "mongoose";
import JobApplication, {
  JOB_STATUSES,
  type JobStatus,
} from "../models/JobApplication";

type JobInput = {
  company?: unknown;
  jobTitle?: unknown;
  location?: unknown;
  jobUrl?: unknown;
  salary?: unknown;
  status?: unknown;
  appliedDate?: unknown;
  interviewDate?: unknown;
  notes?: unknown;
};

const editableFields = [
  "company",
  "jobTitle",
  "location",
  "jobUrl",
  "salary",
  "status",
  "appliedDate",
  "interviewDate",
  "notes",
] as const;

function isValidDate(value: unknown): boolean {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Date.parse(value))
  );
}

function getDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateOnly(value: unknown): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = getDateValue(value);

  return date ? date.toISOString().slice(0, 10) : null;
}

function validateJobInput(
  body: JobInput,
  isCreate: boolean,
  existing?: {
    appliedDate?: unknown;
    interviewDate?: unknown;
    status?: unknown;
  },
): string | null {
  if (isCreate) {
    if (
      typeof body.company !== "string" ||
      !body.company.trim() ||
      typeof body.jobTitle !== "string" ||
      !body.jobTitle.trim()
    ) {
      return "Company and job title are required";
    }
  }

  for (const field of ["company", "jobTitle"] as const) {
    const value = body[field];

    if (value !== undefined) {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        value.length > (field === "company" ? 100 : 150)
      ) {
        return `Invalid ${field}`;
      }
    }
  }

  for (const field of ["location", "salary", "notes"] as const) {
    const value = body[field];

    const maxLength =
      field === "location" ? 150 : field === "salary" ? 100 : 5000;

    if (
      value !== undefined &&
      (typeof value !== "string" || value.length > maxLength)
    ) {
      return `Invalid ${field}`;
    }
  }

  if (body.jobUrl !== undefined) {
    if (typeof body.jobUrl !== "string" || body.jobUrl.length > 2048) {
      return "Invalid job URL";
    }

    if (body.jobUrl.trim()) {
      try {
        const url = new URL(body.jobUrl);

        if (!["http:", "https:"].includes(url.protocol)) {
          return "Job URL must use HTTP or HTTPS";
        }
      } catch {
        return "Please provide a valid job URL";
      }
    }
  }

  if (
    body.status !== undefined &&
    (typeof body.status !== "string" ||
      !JOB_STATUSES.includes(body.status as JobStatus))
  ) {
    return "Invalid application status";
  }

  for (const field of ["appliedDate", "interviewDate"] as const) {
    const value = body[field];

    if (value === undefined) continue;

    if (field === "appliedDate" && value === null) {
      return "Application date is required";
    }

    if (value !== null && !isValidDate(value)) {
      return `Invalid ${field}`;
    }
  }

  const appliedDateValue =
    body.appliedDate !== undefined
      ? body.appliedDate
      : (existing?.appliedDate ?? (isCreate ? new Date() : undefined));

  const interviewDateValue =
    body.interviewDate !== undefined
      ? body.interviewDate
      : existing?.interviewDate;

  const statusValue =
    body.status !== undefined ? body.status : (existing?.status ?? "Applied");

  const appliedDate = getDateValue(appliedDateValue);
  const interviewDate = getDateValue(interviewDateValue);

  if (!appliedDate) {
    return "A valid application date is required";
  }

  const appliedDateOnly = getDateOnly(appliedDateValue);
  const now = new Date();
  const todayOnly = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  if (!appliedDateOnly || appliedDateOnly > todayOnly) {
    return "The application date cannot be in the future";
  }

  if (interviewDateValue !== undefined && interviewDateValue !== null) {
    if (!interviewDate) {
      return "Invalid interview date";
    }

    if (interviewDate < appliedDate) {
      return "The interview date cannot be earlier than the application date";
    }
  }

  if (statusValue === "Interview" && !interviewDate) {
    return "An interview date is required for Interview status";
  }

  return null;
}

function getUserId(req: Parameters<RequestHandler>[0]): string {
  return req.user!.userId;
}

function getJobId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

function getSafePage(value: unknown, fallback: number): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// POST /api/jobs
export const createJob: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as JobInput;
    const validationError = validateJobInput(body, true);

    if (validationError) {
      res.status(400).json({
        success: false,
        message: validationError,
      });
      return;
    }

    const job = await JobApplication.create({
      user: getUserId(req),
      company: body.company,
      jobTitle: body.jobTitle,
      location: body.location ?? "",
      jobUrl: body.jobUrl ?? "",
      salary: body.salary ?? "",
      status: body.status ?? "Applied",
      appliedDate: body.appliedDate ?? new Date(),
      interviewDate: body.interviewDate ?? null,
      notes: body.notes ?? "",
    });

    res.status(201).json({
      success: true,
      message: "Job application created",
      job,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs?page=1&limit=10&search=react&status=Interview
export const getJobs: RequestHandler = async (req, res, next) => {
  try {
    const page = getSafePage(req.query.page, 1);
    const limit = Math.min(getSafePage(req.query.limit, 10), 100);
    const skip = (page - 1) * limit;

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    const status = typeof req.query.status === "string" ? req.query.status : "";

    if (status && !JOB_STATUSES.includes(status as JobStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid application status filter",
      });
      return;
    }

    const filter: Record<string, unknown> = {
      user: getUserId(req),
    };

    if (status) {
      filter.status = status;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedSearch, "i");

      filter.$or = [
        { company: regex },
        { jobTitle: regex },
        { location: regex },
      ];
    }

    const [jobs, total] = await Promise.all([
      JobApplication.find(filter)
        .sort({ appliedDate: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      JobApplication.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id
export const getJobById: RequestHandler = async (req, res, next) => {
  try {
    const jobId = req.params.id;

    if (typeof jobId !== "string" || !getJobId(jobId)) {
      res.status(400).json({
        success: false,
        message: "Invalid job application ID",
      });
      return;
    }

    const job = await JobApplication.findOne({
      _id: req.params.id,
      user: getUserId(req),
    }).lean();

    if (!job) {
      res.status(404).json({
        success: false,
        message: "Job application not found",
      });
      return;
    }

    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/jobs/:id
export const updateJob: RequestHandler = async (req, res, next) => {
  try {
    const jobId = req.params.id;

    if (typeof jobId !== "string" || !getJobId(jobId)) {
      res.status(400).json({
        success: false,
        message: "Invalid job application ID",
      });
      return;
    }

    const body = req.body as JobInput;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length === 0
    ) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    const unknownFields = Object.keys(body).filter(
      (field) => !(editableFields as readonly string[]).includes(field),
    );

    if (unknownFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Unsupported field: ${unknownFields[0]}`,
      });
      return;
    }

    const existingJob = await JobApplication.findOne({
      _id: jobId,
      user: getUserId(req),
    });

    if (!existingJob) {
      res.status(404).json({
        success: false,
        message: "Job application not found",
      });
      return;
    }

    const validationError = validateJobInput(body, false, {
      appliedDate: existingJob.appliedDate,
      interviewDate: existingJob.interviewDate,
      status: existingJob.status,
    });

    if (validationError) {
      res.status(400).json({
        success: false,
        message: validationError,
      });
      return;
    }

    const updates: Record<string, unknown> = {};

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    const job = await JobApplication.findOneAndUpdate(
      {
        _id: req.params.id,
        user: getUserId(req),
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!job) {
      res.status(404).json({
        success: false,
        message: "Job application not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Job application updated",
      job,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/jobs/:id
export const deleteJob: RequestHandler = async (req, res, next) => {
  try {
    const jobId = req.params.id;

    if (typeof jobId !== "string" || !getJobId(jobId)) {
      res.status(400).json({
        success: false,
        message: "Invalid job application ID",
      });
      return;
    }

    const job = await JobApplication.findOneAndDelete({
      _id: req.params.id,
      user: getUserId(req),
    });

    if (!job) {
      res.status(404).json({
        success: false,
        message: "Job application not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Job application deleted",
    });
  } catch (error) {
    next(error);
  }
};
