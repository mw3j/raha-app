import { Router } from "express";

const router = Router();

const PRAYER_METHODS = [
  { id: "MWL", name: "Muslim World League", nameAr: "رابطة العالم الإسلامي" },
  { id: "ISNA", name: "Islamic Society of North America", nameAr: "الجمعية الإسلامية لأمريكا الشمالية" },
  { id: "Egypt", name: "Egyptian General Authority of Survey", nameAr: "الهيئة المصرية العامة للمساحة" },
  { id: "Makkah", name: "Umm Al-Qura University, Makkah", nameAr: "جامعة أم القرى، مكة المكرمة" },
  { id: "Karachi", name: "University of Islamic Sciences, Karachi", nameAr: "جامعة العلوم الإسلامية، كراتشي" },
  { id: "Tehran", name: "Institute of Geophysics, University of Tehran", nameAr: "معهد الجيوفيزياء، جامعة طهران" },
  { id: "Gulf", name: "Gulf Region", nameAr: "منطقة الخليج" },
  { id: "Kuwait", name: "Kuwait", nameAr: "الكويت" },
  { id: "Qatar", name: "Qatar", nameAr: "قطر" },
  { id: "Singapore", name: "Majlis Ugama Islam Singapura", nameAr: "مجلس أوغاما إسلام سنغافورة" },
  { id: "France", name: "Union Organization Islamic de France", nameAr: "الاتحاد الفرنسي الإسلامي" },
  { id: "Turkey", name: "Presidency of Religious Affairs, Turkey", nameAr: "رئاسة الشؤون الدينية، تركيا" },
  { id: "Russia", name: "Spiritual Administration of Muslims of Russia", nameAr: "الإدارة الروحية للمسلمين في روسيا" },
];

const METHOD_IDS: Record<string, number> = {
  MWL: 3,
  ISNA: 2,
  Egypt: 5,
  Makkah: 4,
  Karachi: 1,
  Tehran: 7,
  Gulf: 8,
  Kuwait: 9,
  Qatar: 10,
  Singapore: 11,
  France: 12,
  Turkey: 13,
  Russia: 14,
};

router.get("/times", async (req, res) => {
  try {
    const { latitude, longitude, method = "MWL", date } = req.query as {
      latitude: string;
      longitude: string;
      method?: string;
      date?: string;
    };

    if (!latitude || !longitude) {
      res.status(400).json({ error: "latitude and longitude are required" });
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ error: "Invalid coordinates" });
      return;
    }

    const methodId = METHOD_IDS[method] || 3;
    const targetDate = date || new Date().toLocaleDateString("en-CA");
    
    const url = `https://api.aladhan.com/v1/timings/${targetDate}?latitude=${lat}&longitude=${lon}&method=${methodId}`;
    const response = await fetch(url);
    const data = await response.json() as {
      code: number;
      data: {
        timings: {
          Fajr: string;
          Sunrise: string;
          Dhuhr: string;
          Asr: string;
          Sunset: string;
          Maghrib: string;
          Isha: string;
          Midnight: string;
        };
        date: { readable: string };
        meta: { timezone: string };
      }
    };

    if (data.code !== 200) {
      res.status(500).json({ error: "Failed to fetch prayer times" });
      return;
    }

    const { timings, date: dateInfo } = data.data;
    res.json({
      date: dateInfo.readable,
      location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      method,
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      sunset: timings.Sunset,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      midnight: timings.Midnight,
    });
  } catch (error) {
    console.error("Prayer times error:", error);
    res.status(500).json({ error: "Failed to fetch prayer times" });
  }
});

router.get("/methods", (_req, res) => {
  res.json(PRAYER_METHODS);
});

export default router;
