import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import quranRouter from "./quran.js";
import prayerRouter from "./prayer.js";
import postsRouter from "./posts.js";
import commentsRouter from "./comments.js";
import adminRouter from "./admin.js";
import supportRouter from "./support.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/quran", quranRouter);
router.use("/prayer", prayerRouter);
router.use("/posts", postsRouter);
router.use("/posts/:postId/comments", commentsRouter);
router.use("/admin", adminRouter);
router.use("/support", supportRouter);

export default router;
