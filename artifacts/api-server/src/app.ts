import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get("/google-callback", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>راحة - تسجيل الدخول</title>
  <style>
    body { margin:0; display:flex; align-items:center; justify-content:center;
           min-height:100vh; background:#16a34a; font-family:sans-serif; }
    .box { background:#fff; border-radius:1.5rem; padding:2rem; text-align:center;
           max-width:320px; width:90%; box-shadow:0 8px 32px rgba(0,0,0,.2); }
    .spinner { width:40px; height:40px; border:4px solid #e5e7eb; border-top-color:#16a34a;
               border-radius:50%; animation:spin .8s linear infinite; margin:0 auto 1rem; }
    @keyframes spin { to { transform:rotate(360deg); } }
    p { color:#374151; font-size:1rem; margin:0; }
    .err { color:#dc2626; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner" id="spinner"></div>
    <p id="msg">جارٍ تسجيل الدخول...</p>
  </div>
  <script>
    (async function() {
      const msg = document.getElementById('msg');
      const spinner = document.getElementById('spinner');
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const error = params.get('error');

        if (error || !accessToken) {
          spinner.style.display = 'none';
          msg.className = 'err';
          msg.textContent = 'تم إلغاء تسجيل الدخول';
          setTimeout(() => { window.location.href = '/login'; }, 1500);
          return;
        }

        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken })
        });
        const data = await res.json();

        if (!res.ok || !data.token) {
          throw new Error(data.message || 'فشل التحقق');
        }

        localStorage.setItem('raha_token', data.token);
        msg.textContent = 'تم تسجيل الدخول بنجاح!';
        setTimeout(() => { window.location.href = '/'; }, 500);
      } catch(e) {
        spinner.style.display = 'none';
        msg.className = 'err';
        msg.textContent = 'فشل تسجيل الدخول — حاول مجدداً';
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      }
    })();
  </script>
</body>
</html>`);
});

app.get("/api/healthz", (_req, res) => { res.json({ status: "ok" }); });

app.use("/api", router);

export default app;
