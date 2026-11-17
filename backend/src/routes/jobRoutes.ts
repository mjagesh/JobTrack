import { Router } from "express";
import {
  createJob,
  deleteJob,
  getJobById,
  getJobs,
  updateJob,
} from "../controllers/jobController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.route("/").post(createJob).get(getJobs);

router.route("/:id").get(getJobById).patch(updateJob).delete(deleteJob);

export default router;
