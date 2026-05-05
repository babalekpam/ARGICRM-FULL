import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

// Cookie names. Keep in lockstep with server/routes/auth.ts and the client.
export const CSRF_COOKIE = "argilette_csrf";
export const CSRF_HEADER = "x-csrf-token";
export const AUTH_COOKIE = "auth-token";

/** Generate a cryptographically random CSRF token (URL-safe, ~43 chars). */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Issue both cookies on the response. Call from /login + /register. */
export function issueAuthCookies(res: Response, jwt: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const csrf = generateCsrfToken();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // httpOnly auth cookie — not readable by JS
  res.cookie(AUTH_COOKIE, jwt, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: sevenDaysMs,
  });

  // Non-httpOnly CSRF cookie — client must read it and echo via header
  res.cookie(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: sevenDaysMs,
  });

  return csrf;
}

/** Clear both cookies. Call from /logout. */
export function clearAuthCookies(res: Response) {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}

/**
 * Double-submit CSRF middleware.
 *
 * Triggers only on mutating methods (POST/PUT/PATCH/DELETE) and only when
 * the request appears to be cookie-authenticated (no Authorization header).
 *
 * Bearer-authenticated requests bypass CSRF — they're API clients that can't
 * be CSRF'd from a browser context (no cookie auto-attach across origins
 * for Authorization headers).
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return next(); // API client, CSRF doesn't apply
  }

  // Allow safelisted public endpoints (login/register/webhooks need to be CSRF-exempt).
  // Add more as needed; the safelist is intentionally narrow.
  const path = req.path || req.url;
  if (
    path === "/login" || path === "/register" ||  // mounted under /api/auth/
    path === "/api/auth/login" || path === "/api/auth/register" ||
    path.startsWith("/api/public/") ||
    path.startsWith("/api/email/track/") ||
    path.startsWith("/api/sign/") ||
    path.startsWith("/api/v1/")  // future scoped public API
  ) {
    return next();
  }

  const cookieToken = (req as any).cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER];
  const headerStr = Array.isArray(headerToken) ? headerToken[0] : headerToken;

  if (!cookieToken || !headerStr || cookieToken !== headerStr) {
    return res.status(403).json({ error: "CSRF token missing or invalid" });
  }

  next();
}
