import mongoose, { Schema } from "mongoose";

export const JOB_STATUSES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

const jobApplicationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    jobUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
    },
    salary: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "Applied",
      required: true,
    },
    appliedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

jobApplicationSchema.index({ user: 1, appliedDate: -1 });

const JobApplication =
  mongoose.models.JobApplication ||
  mongoose.model("JobApplication", jobApplicationSchema);

export default JobApplication;
