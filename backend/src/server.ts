import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { errorHandler, notFound } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import jobRoutes from "./routes/jobRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "JobTrack API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`JobTrack API running at http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start JobTrack API:", error);
    process.exit(1);
  }
}

void startServer();
