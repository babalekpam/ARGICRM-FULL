import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = Number(process.env.PORT) || 5000;

async function main() {
  const app = express();

  // ─── Security ─────────────────────────────────────────
  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: false, // Allow Vite in development
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: isProd
      ? [process.env.APP_URL || "https://argilette.com", /\.argilette\.com$/]
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }));

  // ─── Rate limiting (production only) ──────────────────
  if (isProd) {
    app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Too many requests, please try again later" } }));
    app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
  }

  // ─── Middleware ────────────────────────────────────────
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  app.use(session({
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: isProd, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" },
    name: "argilette-session",
  }));

  // ─── Request logging ──────────────────────────────────
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        const ms = Date.now() - start;
        const color = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m";
        console.log(`${color}${req.method} ${req.path} ${res.statusCode} ${ms}ms\x1b[0m`);
      }
    });
    next();
  });

  // ─── Register all API routes ───────────────────────────
  const server = await registerRoutes(app);

  // ─── Start Code Healing System ─────────────────────────
  const { startHealingScheduler, healingMiddleware } = await import("./services/healing.js");
  app.use(healingMiddleware());
  startHealingScheduler();

  // ─── Serve frontend ────────────────────────────────────
  if (isProd) {
    const distPath = path.resolve(__dirname, "public");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // In development, Vite serves the frontend
    const { setupVite } = await import("./vite.js");
    await setupVite(app, server);
  }

  // ─── Error handler ─────────────────────────────────────
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || "Internal server error" });
  });

  // ─── Start ─────────────────────────────────────────────
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 \x1b[36mARGILETTE CRM\x1b[0m is running`);
    console.log(`   Mode:    ${isProd ? "production" : "development"}`);
    console.log(`   Port:    \x1b[33m${PORT}\x1b[0m`);
    console.log(`   URL:     \x1b[34mhttp://localhost:${PORT}\x1b[0m\n`);

    if (!process.env.DATABASE_URL) {
      console.warn("⚠️  DATABASE_URL not set — database features will fail");
    }
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
