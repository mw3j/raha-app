// Content moderation for Islamic app
// Blocks profanity, inappropriate content, and non-Islamic off-topic posts

const BLOCKED_WORDS_AR = [
  // Profanity & insults
  'كلب', 'حمار', 'غبي', 'أحمق', 'منافق', 'كافر', 'فاجر', 'فاحشة', 'زنا', 'خمر', 'مخدرات',
  'لعنة', 'اللعنة', 'ملعون', 'إبليس', 'شيطان', 'جهنم', 'تعبان', 'بذيء',
  'عاهرة', 'فاسق', 'فاسقة', 'يلعن', 'ابن الحرام', 'ولد الحرام', 'حرامي',
  'سكران', 'مجنون', 'حقير', 'وقح', 'سافل',
  // Violence
  'اقتل', 'دمر', 'انفجار', 'قنبلة', 'سلاح', 'إرهاب', 'إرهابي',
];

const BLOCKED_WORDS_EN = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'bastard', 'idiot', 'stupid',
  'porn', 'sex', 'nude', 'naked', 'drug', 'alcohol', 'beer', 'wine',
  'kill', 'murder', 'bomb', 'terrorist', 'terrorism', 'hate',
  'racist', 'racism',
];

const OFF_TOPIC_KEYWORDS = [
  // Gambling
  'قمار', 'كازينو', 'رهان', 'casino', 'gambling', 'bet', 'poker',
  // Adult content
  'إباحي', 'جنسي', 'مثير', 'عاري',
];

export function moderateContent(text: string): { blocked: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { blocked: false };

  const lower = text.toLowerCase();

  for (const word of BLOCKED_WORDS_AR) {
    if (text.includes(word)) {
      return { blocked: true, reason: 'المحتوى يحتوي على ألفاظ غير لائقة' };
    }
  }

  for (const word of BLOCKED_WORDS_EN) {
    if (lower.includes(word)) {
      return { blocked: true, reason: 'Content contains inappropriate language' };
    }
  }

  for (const word of OFF_TOPIC_KEYWORDS) {
    if (lower.includes(word) || text.includes(word)) {
      return { blocked: true, reason: 'المحتوى غير مناسب لتطبيق إسلامي' };
    }
  }

  return { blocked: false };
}

export function moderatePost(title: string, content: string): { blocked: boolean; reason?: string } {
  const titleCheck = moderateContent(title);
  if (titleCheck.blocked) return titleCheck;

  const contentCheck = moderateContent(content);
  if (contentCheck.blocked) return contentCheck;

  return { blocked: false };
}
