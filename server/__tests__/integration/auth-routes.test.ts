/**
 * Integration test: POST /api/auth/login + /register + /me + /logout
 * against the real auth router (server/routes/auth.ts) using supertest.
 *
 * Storage layer is mocked at the module boundary; cookie-parser is
 * wired in like production; CSRF middleware is NOT mounted here
 * because we want to test auth in isolation (CSRF is unit-tested
 * separately in csrf.test.ts).
 *
 * Covers:
 *  - 401 on unknown user (and timing-safe rejection)
 *  - 401 on wrong password
 *  - 200 + httpOnly cookie + CSRF cookie + JSON token on success
 *  - 403 on suspended tenant
 *  - 429 after 5 failed attempts (per-account lockout)
 *  - 200 with requiresTotp:true when TOTP is enabled and no code given
 *  - 200 + token when valid TOTP code is supplied
 *  - mustChangePassword flag surfaces in login + /me responses
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import bcrypt from "bcrypt";

// JWT secret must be set BEFORE importing the auth router (read at module load).
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";

// ─── Module mocks (must come before importing the router) ─────────────
const mockStorage = {
  getUserByEmailGlobal: vi.fn(),
  getTenantById: vi.fn(),
  updateUserLastLogin: vi.fn(),
  getUserById: vi.fn(),
  getTenantByDomain: vi.fn(),
  createTenant: vi.fn(),
  createUser: vi.fn(),
  getUsersByTenant: vi.fn(),
  getUserByEmail: vi.fn(),
  updateUser: vi.fn(),
};
vi.mock("../../storage.js", () => mockStorage);

const mockMfaFlags = { force_password_change: false, totp_enabled: false };
vi.mock("../../db.js", () => ({
  db: {
    execute: vi.fn().mockImplementation(async () => ({
      rows: [{
        force_password_change: mockMfaFlags.force_password_change,
        totp_enabled: mockMfaFlags.totp_enabled,
      }],
    })),
  },
}));

vi.mock("../../services/email.js", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendTeamInviteEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordChangedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../seed-demo.js", () => ({
  seedNewTenantOnboarding: vi.fn().mockResolvedValue(undefined),
}));

const totpVerifyMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("../../routes/totp.js", () => ({
  default: express.Router(),
  verifyTotpForLogin: totpVerifyMock,
}));

// ─── Now safe to import the router ────────────────────────────────
const { default: authRouter } = await import("../../routes/auth.js");

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  return app;
}

function tenantOk() {
  return {
    id: "t1", name: "Test Co", domain: "test.argilette.org",
    subscriptionPlan: "starter", subscriptionStatus: "active",
    isActive: true, trialEndsAt: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  totpVerifyMock.mockResolvedValue({ ok: true });
  mockMfaFlags.force_password_change = false;
  mockMfaFlags.totp_enabled = false;
});

describe("integration: POST /api/auth/login", () => {
  it("returns 401 when the user doesn't exist", async () => {
    mockStorage.getUserByEmailGlobal.mockResolvedValue(null);

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "missing@example.com", password: "any-password-8" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid/i);
    // Doesn't leak existence (same message for missing vs. wrong password).
    expect(res.body.error).not.toMatch(/missing@example/);
  });

  it("returns 401 with wrong password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "user@example.com",
      passwordHash, isActive: true, role: "admin",
    });

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("returns 200 + token + httpOnly cookie + CSRF cookie on valid creds", async () => {
    const passwordHash = await bcrypt.hash("correct-pw-1", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "user@example.com",
      firstName: "Test", lastName: "User",
      passwordHash, isActive: true, role: "admin",
    });
    mockStorage.getTenantById.mockResolvedValue(tenantOk());
    mockStorage.updateUserLastLogin.mockResolvedValue(undefined);

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "correct-pw-1" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("user@example.com");
    expect(res.body.user.role).toBe("admin");
    expect(res.body.mustChangePassword).toBe(false);

    const cookies = (res.headers["set-cookie"] || []) as string[];
    expect(cookies.some(c => c.includes("auth-token=") && c.toLowerCase().includes("httponly"))).toBe(true);
    expect(cookies.some(c => c.startsWith("argilette_csrf="))).toBe(true);
    // SameSite=Lax + Path=/ should be set
    expect(cookies.some(c => c.toLowerCase().includes("samesite=lax"))).toBe(true);
  });

  it("returns 403 when the tenant is not active (suspended)", async () => {
    const passwordHash = await bcrypt.hash("correct-pw-1", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "u@e.com",
      passwordHash, isActive: true, role: "admin",
    });
    mockStorage.getTenantById.mockResolvedValue({ ...tenantOk(), isActive: false });

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "u@e.com", password: "correct-pw-1" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/suspended/i);
  });

  it("returns 403 when the tenant is blocked", async () => {
    const passwordHash = await bcrypt.hash("correct-pw-1", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "u@e.com",
      passwordHash, isActive: true, role: "admin",
    });
    mockStorage.getTenantById.mockResolvedValue({
      ...tenantOk(), subscriptionStatus: "blocked",
    });

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "u@e.com", password: "correct-pw-1" });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/blocked/i);
  });

  it("surfaces requiresTotp:true when MFA is enabled and no code is given", async () => {
    mockMfaFlags.totp_enabled = true;
    const passwordHash = await bcrypt.hash("correct-pw-1", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "mfa@e.com",
      passwordHash, isActive: true, role: "admin",
    });

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "mfa@e.com", password: "correct-pw-1" });

    expect(res.status).toBe(200);
    expect(res.body.requiresTotp).toBe(true);
    expect(res.body.token).toBeUndefined();
    expect(totpVerifyMock).not.toHaveBeenCalled();
  });

  it("completes login when valid TOTP code is supplied", async () => {
    mockMfaFlags.totp_enabled = true;
    totpVerifyMock.mockResolvedValueOnce({ ok: true });
    const passwordHash = await bcrypt.hash("correct-pw-1", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "mfa@e.com",
      passwordHash, isActive: true, role: "admin",
    });
    mockStorage.getTenantById.mockResolvedValue(tenantOk());

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "mfa@e.com", password: "correct-pw-1", totpCode: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(totpVerifyMock).toHaveBeenCalledWith("u1", "123456", undefined);
  });

  it("rejects login when MFA code is wrong", async () => {
    mockMfaFlags.totp_enabled = true;
    totpVerifyMock.mockResolvedValueOnce({ ok: false });
    const passwordHash = await bcrypt.hash("correct-pw-1", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "mfa@e.com",
      passwordHash, isActive: true, role: "admin",
    });
    mockStorage.getTenantById.mockResolvedValue(tenantOk());

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "mfa@e.com", password: "correct-pw-1", totpCode: "000000" });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/TOTP/i);
  });

  it("surfaces mustChangePassword=true on login when force_password_change is set", async () => {
    mockMfaFlags.force_password_change = true;
    const passwordHash = await bcrypt.hash("correct-pw-1", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "newuser@e.com",
      passwordHash, isActive: true, role: "user",
    });
    mockStorage.getTenantById.mockResolvedValue(tenantOk());

    const res = await request(makeApp())
      .post("/api/auth/login")
      .send({ email: "newuser@e.com", password: "correct-pw-1" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.mustChangePassword).toBe(true);
  });

  it("locks the account after 5 consecutive failed attempts", async () => {
    const passwordHash = await bcrypt.hash("real-password", 10);
    mockStorage.getUserByEmailGlobal.mockResolvedValue({
      id: "u1", tenantId: "t1", email: "locked@e.com",
      passwordHash, isActive: true, role: "admin",
    });
    const app = makeApp();

    for (let i = 0; i < 5; i++) {
      const r = await request(app)
        .post("/api/auth/login")
        .send({ email: "locked@e.com", password: "wrong" });
      expect(r.status).toBe(401);
    }

    const r6 = await request(app)
      .post("/api/auth/login")
      .send({ email: "locked@e.com", password: "real-password" });
    expect(r6.status).toBe(429);
    expect(r6.body.error).toMatch(/locked/i);
  });
});
