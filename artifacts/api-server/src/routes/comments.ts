import { Router } from "express";
import { db } from "@workspace/db";
import { commentsTable, usersTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { moderateContent } from "../lib/moderation.js";

const router = Router({ mergeParams: true });

router.get("/", async (req: any, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

    const comments = await db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        userId: commentsTable.userId,
        userName: usersTable.name,
        userAvatar: usersTable.avatar,
        createdAt: commentsTable.createdAt,
      })
      .from(commentsTable)
      .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(commentsTable.postId, postId))
      .orderBy(asc(commentsTable.createdAt));

    res.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.postId!);
    if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      res.status(400).json({ error: "التعليق لا يمكن أن يكون فارغاً" });
      return;
    }
    if (content.trim().length > 1000) {
      res.status(400).json({ error: "التعليق طويل جداً (1000 حرف كحد أقصى)" });
      return;
    }

    const moderation = moderateContent(content.trim());
    if (moderation.blocked) {
      res.status(422).json({ error: moderation.reason || "التعليق يحتوي على محتوى غير لائق" });
      return;
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({ postId, userId: req.user!.userId, content: content.trim() })
      .returning();

    const [user] = await db
      .select({ name: usersTable.name, avatar: usersTable.avatar })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId));

    res.status(201).json({
      ...comment,
      userName: user?.name || "مجهول",
      userAvatar: user?.avatar ?? null,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:commentId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const commentId = parseInt(req.params.commentId!);
    if (isNaN(commentId)) { res.status(400).json({ error: "Invalid comment id" }); return; }

    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(eq(commentsTable.id, commentId))
      .limit(1);

    if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }

    const isOwner = comment.userId === req.user!.userId;
    const isAdmin = req.user!.role === "admin" || req.user!.role === "superadmin";
    if (!isOwner && !isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
