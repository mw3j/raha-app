import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";

const rawPort = process.env.PORT;
const port = Number(rawPort || "3000");
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/google-callback/, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quran-api-cache",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.aladhan\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "prayer-times-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: "راحة - التطبيق الإسلامي الشامل",
        short_name: "راحة",
        description: "القرآن الكريم، أوقات الصلاة، الأذكار، بوصلة القبلة، والمسبحة الإلكترونية",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#16a34a",
        theme_color: "#16a34a",
        orientation: "portrait",
        lang: "ar",
        dir: "rtl",
        categories: ["lifestyle", "utilities", "education"],
        icons: [
          { src: "/icon-72.png",            sizes: "72x72",   type: "image/png", purpose: "any" },
          { src: "/icon-96.png",            sizes: "96x96",   type: "image/png", purpose: "any" },
          { src: "/icon-128.png",           sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/icon-144.png",           sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/icon-152.png",           sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/icon-192.png",           sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-384.png",           sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icon-512.png",           sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-192.png",  sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icon-maskable-512.png",  sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "أوقات الصلاة", url: "/prayer", icons: [{ src: "/icon-96.png", sizes: "96x96" }] },
          { name: "القرآن الكريم", url: "/quran",  icons: [{ src: "/icon-96.png", sizes: "96x96" }] },
          { name: "الأذكار",       url: "/adhkar", icons: [{ src: "/icon-96.png", sizes: "96x96" }] },
        ],
      },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
