import { Router } from "express";
import { db } from "@workspace/db";
import { supportTicketsTable } from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// Submit a new support ticket (public — no auth required)
router.post("/", async (req: AuthRequest, res) => {
  try {
    const { name, email, type, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      res.status(400).json({ error: "جميع الحقول مطلوبة" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "البريد الإلكتروني غير صالح" });
      return;
    }
    const validTypes = ["bug", "suggestion", "question", "other"];
    const ticketType = validTypes.includes(type) ? type : "other";

    const [ticket] = await db.insert(supportTicketsTable).values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      type: ticketType as "bug" | "suggestion" | "question" | "other",
      subject: subject.trim(),
      message: message.trim(),
      userId: req.user?.userId ?? null,
    }).returning();

    res.status(201).json({ id: ticket.id, message: "تم إرسال رسالتك بنجاح" });
  } catch (error) {
    console.error("Support ticket error:", error);
    res.status(500).json({ error: "حدث خطأ أثناء الإرسال" });
  }
});

// Admin — list all tickets
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const query = db.select().from(supportTicketsTable);
    const countQuery = db.select({ count: count() }).from(supportTicketsTable);

    const [tickets, totalResult] = await Promise.all([
      (status && status !== "all"
        ? db.select().from(supportTicketsTable)
            .where(eq(supportTicketsTable.status, status as any))
            .orderBy(desc(supportTicketsTable.createdAt))
            .limit(limit).offset(offset)
        : db.select().from(supportTicketsTable)
            .orderBy(desc(supportTicketsTable.createdAt))
            .limit(limit).offset(offset)
      ),
      (status && status !== "all"
        ? db.select({ count: count() }).from(supportTicketsTable)
            .where(eq(supportTicketsTable.status, status as any))
        : countQuery
      ),
    ]);

    res.json({
      tickets,
      total: Number(totalResult[0]?.count || 0),
      page,
      totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / limit),
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin — update ticket status / add note
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, adminNote } = req.body;

    const validStatuses = ["open", "in_progress", "resolved", "closed"];
    if (status && !validStatuses.includes(status)) {
      res.status(400).json({ error: "حالة غير صالحة" });
      return;
    }

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const [updated] = await db.update(supportTicketsTable)
      .set(updateData)
      .where(eq(supportTicketsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "التذكرة غير موجودة" });
      return;
    }
    res.json(updated);
  } catch (error) {
    console.error("Update ticket error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin — delete ticket
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(supportTicketsTable).where(eq(supportTicketsTable.id, id));
    res.json({ message: "تم حذف التذكرة" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
