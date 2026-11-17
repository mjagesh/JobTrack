import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  const statusCode =
    typeof err.statusCode === "number" &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};
