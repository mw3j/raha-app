import { Router, type Request } from "express";
import { db } from "@workspace/db";
import { postsTable, usersTable, commentsTable } from "@workspace/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";
import { moderatePost } from "../lib/moderation.js";

const router = Router();

const postFields = {
  id: postsTable.id,
  title: postsTable.title,
  content: postsTable.content,
  imageUrl: postsTable.imageUrl,
  authorId: postsTable.authorId,
  authorName: usersTable.name,
  isPublished: postsTable.isPublished,
  likesCount: postsTable.likesCount,
  sharesCount: postsTable.sharesCount,
  savesCount: postsTable.savesCount,
  createdAt: postsTable.createdAt,
  updatedAt: postsTable.updatedAt,
};

// Admin: get all posts including pending
router.get("/admin/all", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const posts = await db.select({
      ...postFields,
      commentsCount: sql<number>`(select count(*) from comments where comments.post_id = ${postsTable.id})`.mapWith(Number),
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .orderBy(desc(postsTable.createdAt));

    res.json({ posts: posts.map(p => ({ ...p, authorName: p.authorName || "مستخدم" })) });
  } catch (error) {
    console.error("Admin get all posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const [totalResult, posts] = await Promise.all([
      db.select({ count: count() }).from(postsTable).where(eq(postsTable.isPublished, true)),
      db.select({
        ...postFields,
        commentsCount: sql<number>`(select count(*) from comments where comments.post_id = ${postsTable.id})`.mapWith(Number),
      })
      .from(postsTable)
      .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(eq(postsTable.isPublished, true))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit)
      .offset(offset),
    ]);

    const total = totalResult[0]?.count || 0;
    res.json({
      posts: posts.map(p => ({ ...p, authorName: p.authorName || "مستخدم" })),
      total,
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:postId", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

    const [post] = await db.select({
      ...postFields,
      commentsCount: sql<number>`(select count(*) from comments where comments.post_id = ${postsTable.id})`.mapWith(Number),
    })
    .from(postsTable)
    .leftJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(eq(postsTable.id, postId))
    .limit(1);

    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ ...post, authorName: post.authorName || "مستخدم" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Like / unlike a post (toggle)
router.post("/:postId/like", requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

    const { action } = req.body; // 'like' or 'unlike'
    const delta = action === 'unlike' ? -1 : 1;

    const [post] = await db.update(postsTable)
      .set({ likesCount: sql`greatest(0, ${postsTable.likesCount} + ${delta})` })
      .where(eq(postsTable.id, postId))
      .returning({ likesCount: postsTable.likesCount });

    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ likesCount: post.likesCount });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Share a post (increment counter)
router.post("/:postId/share", async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

    const [post] = await db.update(postsTable)
      .set({ sharesCount: sql`${postsTable.sharesCount} + 1` })
      .where(eq(postsTable.id, postId))
      .returning({ sharesCount: postsTable.sharesCount });

    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ sharesCount: post.sharesCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Save / unsave a post (toggle)
router.post("/:postId/save", requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

    const { action } = req.body; // 'save' or 'unsave'
    const delta = action === 'unsave' ? -1 : 1;

    const [post] = await db.update(postsTable)
      .set({ savesCount: sql`greatest(0, ${postsTable.savesCount} + ${delta})` })
      .where(eq(postsTable.id, postId))
      .returning({ savesCount: postsTable.savesCount });

    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ savesCount: post.savesCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// All authenticated users can post
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: "العنوان مطلوب" }); return;
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: "المحتوى مطلوب" }); return;
    }
    if (title.trim().length > 200) {
      res.status(400).json({ error: "العنوان طويل جداً (200 حرف كحد أقصى)" }); return;
    }
    if (content.trim().length > 5000) {
      res.status(400).json({ error: "المحتوى طويل جداً (5000 حرف كحد أقصى)" }); return;
    }

    const moderation = moderatePost(title.trim(), content.trim());
    if (moderation.blocked) {
      res.status(422).json({ error: moderation.reason || "المحتوى غير مناسب" }); return;
    }

    let sanitizedImageUrl: string | null = null;
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
      const img = imageUrl.trim();
      if (img.startsWith('data:image/') || img.startsWith('http://') || img.startsWith('https://')) {
        sanitizedImageUrl = img;
      }
    }

    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';
    const [post] = await db.insert(postsTable).values({
      title: title.trim(),
      content: content.trim(),
      category: 'إسلامي',
      imageUrl: sanitizedImageUrl,
      authorId: req.user!.userId,
      isPublished: isAdmin ? true : false,
    }).returning();

    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user!.userId));

    res.status(201).json({
      ...post,
      authorName: user?.name || "مستخدم",
      commentsCount: 0,
      pendingReview: !isAdmin,
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:postId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.postId as string);
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';

    const [existing] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
    if (!existing) { res.status(404).json({ error: "Post not found" }); return; }
    if (existing.authorId !== req.user!.userId && !isAdmin) {
      res.status(403).json({ error: "غير مصرح لك بتعديل هذا المنشور" }); return;
    }

    const { title, content, imageUrl, isPublished } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (isPublished !== undefined && isAdmin) updates.isPublished = isPublished;

    if (title && content) {
      const moderation = moderatePost(title, content);
      if (moderation.blocked) { res.status(422).json({ error: moderation.reason }); return; }
    }

    const [post] = await db.update(postsTable).set(updates).where(eq(postsTable.id, postId)).returning();
    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, post.authorId));
    res.json({ ...post, authorName: user?.name || "مستخدم" });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:postId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const postId = parseInt(req.params.postId as string);
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'superadmin';

    const [existing] = await db.select().from(postsTable).where(eq(postsTable.id, postId)).limit(1);
    if (!existing) { res.status(404).json({ error: "Post not found" }); return; }
    if (existing.authorId !== req.user!.userId && !isAdmin) {
      res.status(403).json({ error: "غير مصرح لك بحذف هذا المنشور" }); return;
    }

    await db.delete(postsTable).where(eq(postsTable.id, postId));
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
