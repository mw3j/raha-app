# Workspace

## Overview

RAHA (راحة) - Islamic Comprehensive App. A full-stack pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Mobile**: Capacitor (Android) — App ID: `com.raha.islamic`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, quran, prayer, posts, admin)
│   └── raha/               # React + Vite frontend (Islamic app)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Pages

| Route | Description |
|---|---|
| `/` | Home feed with posts, daily verse, like/save/share |
| `/quran` | Quran browser with 114 surahs |
| `/quran/:id` | Surah reader with audio player + 4 reciters + translation toggle |
| `/prayer` | Prayer times with GPS auto-detect + notifications |
| `/adhkar` | Adhkar library with daily progress tracking |
| `/tasbih` | Electronic tasbih counter |
| `/qibla` | Qibla compass |
| `/favorites` | Saved posts from home feed |
| `/settings` | App settings: dark mode, font size, notifications, data management |
| `/profile` | User profile with stats, avatar upload, navigation to favorites/settings |
| `/login` | Login page (Google OAuth + email/password, no Facebook) |
| `/register` | Register new account |
| `/forgot-password` | Forgot password — generates reset token |
| `/reset-password?token=...` | Reset password via token link |
| `/admin` | Admin dashboard (admin/superadmin only) |

## App Features

### RAHA Islamic App

- **Home**: Islamic posts feed with like/save/share/comment buttons, search and category filters
- **Comments**: Embedded comments on each post — authenticated users can add/delete comments (backend: `comments` table, `/api/posts/:id/comments`)
- **Quran**: Browse 114 surahs with Arabic text, audio (4 reciters), translation toggle, and tafsir (التفسير الميسر from alquran.cloud)
- **Prayer Times**: GPS-based prayer times, per-prayer notification settings, 5 muadhins, Fajr special adhan, auto-play adhan at prayer time
- **Notifications**: Browser notification system with per-prayer toggles, auto adhan audio on prayer time
- **Authentication**: JWT-based auth (email/password + Google OAuth), stored as `raha_token` in localStorage
- **Forgot Password**: Full reset flow — token stored in DB (1hr expiry), reset link shown in response (for testing); integrate email service for production
- **Profile**: User profile customization, password change, theme toggle
- **Admin Dashboard**: User management, posts management (admin/superadmin only)

### Default Admin Account
- Email: `admin@raha.app`
- Password: `admin123`
- Role: superadmin

### User Roles
- `user` - regular user
- `admin` - can manage posts and users
- `superadmin` - first registered user, can promote admins

## External APIs Used

- **Quran + Tafsir**: https://api.alquran.cloud/v1 (free, no key required; tafsir edition: `ar.muyassar`)
- **Prayer Times**: https://api.aladhan.com/v1 (free, no key required)

## Theme System

- 6 color themes: `emerald` (default), `blue`, `red`, `purple`, `green`, `gold`
- CSS variables via `data-theme` attribute on `<html>` element
- Theme utility: `artifacts/raha/src/lib/theme.ts` — exports `THEMES[]`, `applyTheme()`, `initTheme()`, `getStoredTheme()`
- Storage: `localStorage.raha_color_theme`
- `initTheme()` called in `main.tsx` before React renders
- Theme picker UI in settings page (6 colored circles grid)
- Social login: Google only (Facebook removed per user request) — Google OAuth credentials pending

## DB Schema

- `users` table: id, name, email, password_hash, avatar, role (enum), is_active, password_reset_token, password_reset_expiry, created_at, updated_at
- `posts` table: id, title, content, category, image_url, author_id, is_published, created_at, updated_at
- `reading_progress` table: id, user_id, last_surah, last_verse, completed_surahs[], updated_at
- `comments` table: id, post_id (FK→posts, cascade), user_id (FK→users), content, created_at

## API Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (JWT required)
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password (requires current password)
- `POST /api/auth/forgot-password` - Generate reset token (returns resetLink)
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-reset-token?token=` - Validate reset token
- `GET /api/quran/surahs` - Get all 114 surahs
- `GET /api/quran/surahs/:n` - Get surah with verses
- `GET /api/quran/search?q=` - Search Quran
- `GET/PUT /api/quran/reading-progress` - Reading progress (JWT required)
- `GET /api/prayer/times` - Prayer times by lat/lon
- `GET /api/prayer/methods` - Calculation methods list
- `GET /api/posts` - Published posts
- `POST/PUT/DELETE /api/posts` - Manage posts (admin only)
- `GET /api/admin/users` - All users (admin only)
- `PUT /api/admin/users/:id/toggle-active` - Toggle user status
- `PUT /api/admin/users/:id/make-admin` - Promote to admin (superadmin only)
- `GET /api/admin/stats` - Dashboard statistics
