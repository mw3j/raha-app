import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import { OAuth2Client } from "google-auth-library";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import {
  RegisterBody,
  LoginBody,
  UpdateProfileBody,
  ChangePasswordBody,
} from "@workspace/api-zod";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation error", message: parsed.error.message });
      return;
    }
    const { name, email, password } = parsed.data;

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered", message: "This email is already in use" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const isFirstUser = (await db.select().from(usersTable).limit(1)).length === 0;
    const role = isFirstUser ? "superadmin" : "user";

    const [user] = await db.insert(usersTable).values({
      name,
      email,
      passwordHash,
      role: role as "user" | "admin" | "superadmin",
    }).returning();

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation error", message: parsed.error.message });
      return;
    }
    const { email, password } = parsed.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials", message: "Email or password incorrect" });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Account disabled", message: "Your account has been disabled" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials", message: "Email or password incorrect" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/update-profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = UpdateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation error" });
      return;
    }

    const [user] = await db.update(usersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user!.userId))
      .returning();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/change-password", requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = ChangePasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation error" });
      return;
    }
    const { currentPassword, newPassword } = parsed.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "Invalid password", message: "Current password is incorrect" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, req.user!.userId));
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Forgot Password - generates reset token and sends email via Resend
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).limit(1);

    // Always return success to prevent email enumeration
    if (!user || !user.isActive) {
      res.json({ message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين إليه" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(usersTable).set({
      passwordResetToken: token,
      passwordResetExpiry: expiry,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    const host = (req.headers["x-forwarded-host"] as string || req.headers.host || "localhost").split(",")[0].trim();
    const proto = (req.headers["x-forwarded-proto"] as string || "https").split(",")[0].trim();
    const resetLink = `${proto}://${host}/reset-password?token=${token}`;

    console.log(`[RAHA] Password reset link for ${user.email}: ${resetLink}`);

    // Send via Resend if API key is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        // Use custom domain if configured, else fall back to Resend's test address
        const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
        const fromName = process.env.RESEND_FROM_NAME || "RAHA - راحة";
        const { error: emailError } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [user.email],
          subject: "إعادة تعيين كلمة المرور - تطبيق راحة",
          html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#065f46);padding:32px 24px;text-align:center;">
              <div style="font-size:48px;margin-bottom:8px;">☪️</div>
              <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">راحة</h1>
              <p style="color:#86efac;margin:4px 0 0;font-size:14px;">التطبيق الإسلامي الشامل</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;">إعادة تعيين كلمة المرور 🔐</h2>
              <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 8px;">السلام عليكم ورحمة الله وبركاته،</p>
              <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
                مرحباً <strong>${user.name}</strong>،<br/>
                تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في تطبيق <strong>راحة</strong>.
                اضغط على الزر أدناه لاختيار كلمة مرور جديدة.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#ffffff;text-decoration:none;
                          font-size:16px;font-weight:700;padding:14px 36px;border-radius:12px;
                          box-shadow:0 4px 12px rgba(22,163,74,0.35);">
                  إعادة تعيين كلمة المرور
                </a>
              </div>

              <!-- Expiry notice -->
              <div style="background:#fef9c3;border:1px solid #fde047;border-radius:12px;padding:14px 16px;margin-bottom:24px;">
                <p style="color:#713f12;font-size:13px;margin:0;line-height:1.6;">
                  ⚠️ ينتهي هذا الرابط خلال <strong>ساعة واحدة</strong> من وقت الطلب.
                  إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد بأمان.
                </p>
              </div>

              <!-- Link fallback -->
              <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;">
                إذا لم يعمل الزر، انسخ هذا الرابط والصقه في متصفحك:<br/>
                <span style="color:#16a34a;word-break:break-all;font-size:11px;">${resetLink}</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 28px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
                © 2026 تطبيق راحة — التطبيق الإسلامي الشامل<br/>
                هذا البريد أُرسل تلقائياً، يرجى عدم الرد عليه.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });

        if (emailError) {
          console.error("[RAHA] Resend email error:", emailError);
        } else {
          console.log(`[RAHA] Reset email sent successfully to ${user.email}`);
        }
      } catch (emailErr) {
        console.error("[RAHA] Failed to send reset email:", emailErr);
      }
    } else {
      console.warn("[RAHA] RESEND_API_KEY not set — email not sent");
    }

    res.json({ message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين إليه" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset Password - validates token and sets new password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.passwordResetToken, token))
      .limit(1);

    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset token", message: "الرابط غير صالح أو منتهي الصلاحية" });
      return;
    }

    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      res.status(400).json({ error: "Token expired", message: "انتهت صلاحية رابط إعادة التعيين، يرجى طلب رابط جديد" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, user.id));

    res.json({ message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify reset token validity
router.get("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      res.status(400).json({ valid: false });
      return;
    }
    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.passwordResetToken, token))
      .limit(1);

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      res.json({ valid: false });
      return;
    }
    res.json({ valid: true, email: user.email });
  } catch (error) {
    res.status(500).json({ valid: false });
  }
});

router.get("/google/start", (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/api/auth/google/landing`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "openid email profile",
    prompt: "select_account",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/auth?${params.toString()}`);
});

router.get("/google/landing", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>راحة</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;
         background:#16a34a;font-family:Segoe UI,Tahoma,Arial,sans-serif}
    .card{background:#fff;border-radius:1.5rem;padding:2.5rem 2rem;text-align:center;
          max-width:300px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.25)}
    .logo{font-size:2.5rem;margin-bottom:.4rem}
    h2{font-size:1.2rem;font-weight:700;color:#111;margin-bottom:.2rem}
    p{font-size:.9rem;color:#6b7280;margin-bottom:1.2rem}
    .spin{width:42px;height:42px;border:4px solid #e5e7eb;border-top-color:#16a34a;
          border-radius:50%;animation:s .8s linear infinite;margin:0 auto 1rem}
    @keyframes s{to{transform:rotate(360deg)}}
    .msg{font-size:1rem;font-weight:500;color:#374151}
    .err{color:#dc2626}.ok{color:#16a34a}
  </style>
</head>
<body>
<div class="card">
  <div class="logo">&#9775;</div>
  <h2>راحة</h2>
  <p>التطبيق الإسلامي الشامل</p>
  <div class="spin" id="sp"></div>
  <div class="msg" id="msg">جارٍ تسجيل الدخول...</div>
</div>
<script>
(async()=>{
  const sp=document.getElementById('sp'),msg=document.getElementById('msg');
  const err=t=>{sp.style.display='none';msg.className='msg err';msg.textContent=t;
    setTimeout(()=>{window.location.replace('/login');},2200);};
  try{
    const h=window.location.hash.slice(1),p=new URLSearchParams(h);
    const tok=p.get('access_token'),e=p.get('error');
    if(e){err('تم إلغاء تسجيل الدخول');return;}
    if(!tok){err('لم يتم استلام رمز الدخول');return;}
    const r=await fetch('/api/auth/google',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({accessToken:tok})});
    const d=await r.json();
    if(!r.ok||!d.token)throw new Error(d.message||'فشل');
    localStorage.setItem('raha_token',d.token);
    sp.style.display='none';msg.className='msg ok';msg.textContent='تم تسجيل الدخول!';
    setTimeout(()=>{window.location.replace('/');},400);
  }catch(ex){err('فشل تسجيل الدخول — حاول مجدداً');}
})();
</script>
</body></html>`);
});

router.post("/google", async (req, res) => {
  try {
    const { credential, accessToken } = req.body;
    if (!credential && !accessToken) {
      res.status(400).json({ error: "Missing token" });
      return;
    }

    let email: string, name: string | undefined, picture: string | undefined;

    if (accessToken) {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userInfoRes.ok) {
        res.status(401).json({ error: "Invalid access token" });
        return;
      }
      const info = await userInfoRes.json() as { email?: string; name?: string; picture?: string };
      if (!info.email) {
        res.status(400).json({ error: "Could not get email from Google" });
        return;
      }
      email = info.email;
      name = info.name;
      picture = info.picture;
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        res.status(401).json({ error: "Invalid Google token" });
        return;
      }
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

    let user = existing[0];
    if (!user) {
      const randomHash = await bcrypt.hash(Math.random().toString(36), 10);
      const [created] = await db.insert(usersTable).values({
        name: name || email.split("@")[0],
        email,
        passwordHash: randomHash,
        avatar: picture || null,
        role: "user",
      }).returning();
      user = created;
    } else if (picture && !user.avatar) {
      await db.update(usersTable).set({ avatar: picture, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
      user.avatar = picture;
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Account disabled", message: "Your account has been disabled" });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

export default router;
