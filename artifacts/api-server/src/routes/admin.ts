import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postsTable } from "@workspace/db/schema";
import { eq, count, gte, and } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

router.get("/users", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const [totalResult, users] = await Promise.all([
      db.select({ count: count() }).from(usersTable),
      db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        avatar: usersTable.avatar,
        role: usersTable.role,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
      }).from(usersTable).limit(limit).offset(offset),
    ]);

    const total = totalResult[0]?.count || 0;
    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/:userId/toggle-active", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.userId as string);
    if (userId === req.user!.userId) {
      res.status(400).json({ error: "Cannot disable your own account" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [updated] = await db.update(usersTable)
      .set({ isActive: !user.isActive, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/:userId/make-admin", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    if (req.user!.role !== "superadmin") {
      res.status(403).json({ error: "Only superadmin can promote users" });
      return;
    }
    const userId = parseInt(req.params.userId as string);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const newRole = user.role === "admin" ? "user" : "admin";
    const [updated] = await db.update(usersTable)
      .set({ role: newRole as "user" | "admin" | "superadmin", updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning();

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, activeUsers, totalPosts, publishedPosts, newUsers] = await Promise.all([
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(usersTable).where(eq(usersTable.isActive, true)),
      db.select({ count: count() }).from(postsTable),
      db.select({ count: count() }).from(postsTable).where(eq(postsTable.isPublished, true)),
      db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, firstOfMonth)),
    ]);

    res.json({
      totalUsers: Number(totalUsers[0]?.count || 0),
      activeUsers: Number(activeUsers[0]?.count || 0),
      totalPosts: Number(totalPosts[0]?.count || 0),
      publishedPosts: Number(publishedPosts[0]?.count || 0),
      newUsersThisMonth: Number(newUsers[0]?.count || 0),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
