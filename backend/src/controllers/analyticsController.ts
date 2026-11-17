import type { RequestHandler } from "express";
import mongoose from "mongoose";
import JobApplication, { JOB_STATUSES } from "../models/JobApplication";

export const getDashboardAnalytics: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Start of the current month, five months ago.
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userFilter = { user: userObjectId };

    const [
      totalApplications,
      statusResults,
      monthlyResults,
      upcomingInterviews,
      recentApplications,
    ] = await Promise.all([
      JobApplication.countDocuments(userFilter),

      JobApplication.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      JobApplication.aggregate([
        {
          $match: {
            ...userFilter,
            appliedDate: { $gte: sixMonthsAgo, $lte: now },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$appliedDate" },
              month: { $month: "$appliedDate" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      JobApplication.find({
        ...userFilter,
        status: { $nin: ["Rejected", "Withdrawn"] },
        interviewDate: { $gte: startOfToday },
      })
        .sort({ interviewDate: 1 })
        .limit(5)
        .select("company jobTitle interviewDate status")
        .lean(),

      JobApplication.find(userFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("company jobTitle status appliedDate createdAt")
        .lean(),
    ]);

    // Include every status, even when its count is zero.
    const applicationsByStatus = Object.fromEntries(
      JOB_STATUSES.map((status) => [status, 0]),
    ) as Record<(typeof JOB_STATUSES)[number], number>;

    for (const result of statusResults) {
      if (result._id in applicationsByStatus) {
        applicationsByStatus[result._id as keyof typeof applicationsByStatus] =
          result.count;
      }
    }

    // Fill missing months with zero so charts have a consistent timeline.
    const monthlyMap = new Map<string, number>();

    for (const result of monthlyResults) {
      const key = `${result._id.year}-${String(result._id.month).padStart(
        2,
        "0",
      )}`;

      monthlyMap.set(key, result.count);
    }

    const applicationsOverTime = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      return {
        month: key,
        count: monthlyMap.get(key) ?? 0,
      };
    });

    res.status(200).json({
      success: true,
      analytics: {
        totalApplications,
        applicationsByStatus,
        applicationsOverTime,
        upcomingInterviews,
        recentApplications,
      },
    });
  } catch (error) {
    next(error);
  }
};
