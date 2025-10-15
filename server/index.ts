import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";
import { neon } from '@neondatabase/serverless';
import { 
  performanceMiddleware, 
  memoryOptimizationMiddleware, 
  requestSizeLimitMiddleware,
  connectionPoolMiddleware,
  optimizedErrorHandler 
} from "./middleware/performance.js";
import { 
  securityHeaders, 
  validateRequest, 
  rateLimiters,
  sessionSecurity 
} from "./security.js";
import { applySecurityHardening } from "./security-config.js";
import session from "express-session";
import cors from "cors";

const app = express();

// ================== DATABASE SCHEMA HOTFIX ==================
// Runtime idempotent migration to add missing Stripe columns
async function ensureStripeColumns() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Add missing columns if they don't exist (comprehensive schema sync)
    await sql`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS stripe_customer_id text,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
      ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
      ADD COLUMN IF NOT EXISTS trial_ends_at timestamp,
      ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trialing'
    `;
    
    // Add unique indexes for Stripe columns (non-blocking)
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS tenants_stripe_customer_id_key ON tenants(stripe_customer_id)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS tenants_stripe_subscription_id_key ON tenants(stripe_subscription_id)`;
    
    console.log('✅ Schema hotfix: Stripe columns ensured in tenants table');
  } catch (error) {
    console.error('❌ Schema hotfix failed:', error);
    // Don't crash the server, just log the error
  }
}

// CRITICAL FIX: Trust proxy for proper IP detection
app.set('trust proxy', 1);

// CRITICAL: PERMANENT LANDER PROTECTION - HIGHEST PRIORITY
// Must be FIRST middleware to intercept before anything else
app.use((req, res, next) => {
  if (req.path === '/lander' || req.path.startsWith('/lander/') || req.originalUrl.includes('/lander')) {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const redirectUrl = '/' + queryString;
    
    console.log(`🛡️ TOP-LEVEL PROTECTION: ${req.originalUrl} -> ${redirectUrl}`);
    
    // IMMEDIATE permanent redirect
    res.writeHead(301, {
      'Location': redirectUrl,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Protection': 'permanent-top-level'
    });
    res.end();
    return;
  }
  next();
});

// CRITICAL FIX: Apply security hardening only in production
if (process.env.NODE_ENV === 'production') {
  applySecurityHardening(app);
  console.log('🔒 Security hardening applied (production mode)');
} else {
  console.log('🚫 Security hardening disabled in development for Vite compatibility');
}
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://argilette.org', 'https://www.argilette.org'] // Production domains
    : ['http://localhost:5000', 'http://127.0.0.1:5000'],  // Development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Session middleware
app.use(session({
  ...sessionSecurity,
  name: 'argilette-session' // Don't use default session name
}));

// Rate limiting - only in production, NONE in development for Vite compatibility
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth', rateLimiters.auth);
  app.use('/api/upload', rateLimiters.upload);
  app.use('/api', rateLimiters.api);
  app.use(rateLimiters.general);
}

// CRITICAL FIX: Enhanced Vite dev server bypass for HMR and asset requests
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    // Comprehensive bypass for ALL Vite-specific routes and HMR
    if (req.path.startsWith('/@vite') || 
        req.path.startsWith('/src/') ||
        req.path.startsWith('/@react-refresh') ||
        req.path.startsWith('/@fs/') ||
        req.path.startsWith('/node_modules/') ||
        req.path.match(/\.(ts|tsx|js|jsx|css|scss|sass|less|styl|stylus|vue|svelte)$/) ||
        req.headers.upgrade === 'websocket' ||
        req.headers['sec-websocket-key']) {
      console.log('🚀 Vite bypass:', req.path);
      return next();
    }
    next();
  });
}

// Request validation and sanitization
app.use(validateRequest);

// Add performance monitoring middleware
app.use(performanceMiddleware);
app.use(memoryOptimizationMiddleware);
app.use(requestSizeLimitMiddleware());
app.use(connectionPoolMiddleware);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// SEO-friendly headers and routes
app.use((req, res, next) => {
  // Add SEO-friendly headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  
  // Set proper cache headers for static assets
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
  
  next();
});

// Serve SEO files
app.get('/sitemap.xml', (req, res) => {
  res.set('Content-Type', 'application/xml');
  res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
});

app.get('/google9c7323ee98d28ee4.html', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(process.cwd(), 'public', 'google9c7323ee98d28ee4.html'));
});

app.get('/browserconfig.xml', (req, res) => {
  res.set('Content-Type', 'application/xml');
  res.sendFile(path.join(process.cwd(), 'public', 'browserconfig.xml'));
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize customer journey service
  const { customerJourneyService } = await import("./customer-journey-service.js");
  await customerJourneyService.initializeDefaultStages();
  
  // Apply schema hotfix before starting server
  await ensureStripeColumns();
  
  // CRITICAL FIX: Setup Vite middleware BEFORE routes in development for proper request handling
  let server: Server;
  
  if (app.get("env") === "development") {
    // CRITICAL FIX: Register API routes FIRST, then Vite middleware
    server = createServer(app);
    await registerRoutes(app);
    console.log('✅ API routes registered FIRST');
    
    // Then setup Vite to handle frontend assets only
    await setupVite(app, server);
    console.log('🚀 Vite middleware initialized AFTER routes (development mode)');
  } else {
    // In production: Register routes first, then serve static
    server = await registerRoutes(app);
    serveStatic(app);
  }

  // Serve static files from public directory in both dev and production
  app.use('/assets', express.static(path.resolve(import.meta.dirname, '..', 'public', 'assets')));
  
  // ADDITIONAL SAFETY: Catch any remaining lander requests at the very end
  app.use('/lander*', (req, res) => {
    console.log(`🚨 FINAL SAFETY NET: Redirecting ${req.originalUrl} to /`);
    res.redirect(301, '/');
  });

  // Use optimized error handler
  app.use(optimizedErrorHandler);

  // Initialize collaboration service and start activity simulation
  const { collaborationService } = await import('./services/collaboration-service.js');
  collaborationService.startActivitySimulation();

  // Use PORT environment variable for Cloud Run or default to 8080 for production deployments
  const port = Number(process.env.PORT) || (process.env.NODE_ENV === 'production' ? 8080 : 5000);
  server.listen(port, "0.0.0.0", () => {
    log(`Application listening on port ${port}`);
    if (process.env.NODE_ENV === 'production') {
      log(`Production deployment ready - using port ${port}`);
    } else {
      log(`🚀 Development server ready - React app + Vite HMR on port ${port}`);
      log(`🚫 All rate limiting disabled for Vite compatibility`);
    }
  });
})();
