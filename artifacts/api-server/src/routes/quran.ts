import { Router } from "express";
import { db } from "@workspace/db";
import { readingProgressTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

const QURAN_API = "https://api.alquran.cloud/v1";

router.get("/surahs", async (_req, res) => {
  try {
    const response = await fetch(`${QURAN_API}/surah`);
    const data = await response.json() as { code: number; data: unknown[] };
    if (data.code !== 200) {
      res.status(500).json({ error: "Failed to fetch surahs" });
      return;
    }
    const surahs = (data.data as Array<{
      number: number;
      name: string;
      englishName: string;
      englishNameTranslation: string;
      revelationType: string;
      numberOfAyahs: number;
    }>).map(s => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      revelationType: s.revelationType,
      numberOfAyahs: s.numberOfAyahs,
    }));
    res.json(surahs);
  } catch (error) {
    console.error("Surahs error:", error);
    res.status(500).json({ error: "Failed to fetch surahs" });
  }
});

router.get("/surahs/:surahNumber", async (req, res) => {
  try {
    const surahNumber = parseInt(req.params.surahNumber);
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      res.status(400).json({ error: "Invalid surah number" });
      return;
    }

    const [arabicRes, translationRes] = await Promise.all([
      fetch(`${QURAN_API}/surah/${surahNumber}`),
      fetch(`${QURAN_API}/surah/${surahNumber}/en.asad`),
    ]);

    const [arabicData, translationData] = await Promise.all([
      arabicRes.json() as Promise<{ code: number; data: { number: number; name: string; englishName: string; englishNameTranslation: string; revelationType: string; numberOfAyahs: number; ayahs: Array<{ number: number; numberInSurah: number; text: string }> } }>,
      translationRes.json() as Promise<{ code: number; data: { ayahs: Array<{ numberInSurah: number; text: string }> } }>,
    ]);

    if (arabicData.code !== 200) {
      res.status(500).json({ error: "Failed to fetch surah" });
      return;
    }

    const translationMap = new Map(
      translationData.data?.ayahs?.map((a: { numberInSurah: number; text: string }) => [a.numberInSurah, a.text]) || []
    );

    const surah = arabicData.data;
    res.json({
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      revelationType: surah.revelationType,
      numberOfAyahs: surah.numberOfAyahs,
      verses: surah.ayahs.map((a) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        translation: translationMap.get(a.numberInSurah) || null,
      })),
    });
  } catch (error) {
    console.error("Surah error:", error);
    res.status(500).json({ error: "Failed to fetch surah" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res.status(400).json({ error: "Query required" });
      return;
    }

    const response = await fetch(`${QURAN_API}/search/${encodeURIComponent(q)}/all/ar`);
    const data = await response.json() as { code: number; data: { matches: Array<{ surah: { number: number; name: string }; numberInSurah: number; number: number; text: string }> } };

    if (data.code !== 200) {
      res.json([]);
      return;
    }

    const results = data.data.matches.slice(0, 20).map((m) => ({
      surahNumber: m.surah.number,
      surahName: m.surah.name,
      verseNumber: m.numberInSurah,
      text: m.text,
      translation: null,
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

router.get("/reading-progress", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [progress] = await db.select()
      .from(readingProgressTable)
      .where(eq(readingProgressTable.userId, req.user!.userId))
      .limit(1);

    if (!progress) {
      res.json({
        userId: req.user!.userId,
        lastSurah: 1,
        lastVerse: 1,
        completedSurahs: [],
        updatedAt: new Date(),
      });
      return;
    }

    res.json({
      userId: progress.userId,
      lastSurah: progress.lastSurah,
      lastVerse: progress.lastVerse,
      completedSurahs: progress.completedSurahs || [],
      updatedAt: progress.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/reading-progress", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { lastSurah, lastVerse, completedSurah } = req.body;

    const existing = await db.select()
      .from(readingProgressTable)
      .where(eq(readingProgressTable.userId, req.user!.userId))
      .limit(1);

    let completedSurahs: number[] = existing[0]?.completedSurahs || [];
    if (completedSurah && !completedSurahs.includes(completedSurah)) {
      completedSurahs = [...completedSurahs, completedSurah];
    }

    if (existing.length === 0) {
      const [progress] = await db.insert(readingProgressTable).values({
        userId: req.user!.userId,
        lastSurah: lastSurah || 1,
        lastVerse: lastVerse || 1,
        completedSurahs,
      }).returning();

      res.json({
        userId: progress.userId,
        lastSurah: progress.lastSurah,
        lastVerse: progress.lastVerse,
        completedSurahs: progress.completedSurahs || [],
        updatedAt: progress.updatedAt,
      });
    } else {
      const [progress] = await db.update(readingProgressTable)
        .set({
          lastSurah: lastSurah || existing[0].lastSurah,
          lastVerse: lastVerse || existing[0].lastVerse,
          completedSurahs,
          updatedAt: new Date(),
        })
        .where(eq(readingProgressTable.userId, req.user!.userId))
        .returning();

      res.json({
        userId: progress.userId,
        lastSurah: progress.lastSurah,
        lastVerse: progress.lastVerse,
        completedSurahs: progress.completedSurahs || [],
        updatedAt: progress.updatedAt,
      });
    }
  } catch (error) {
    console.error("Reading progress error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
