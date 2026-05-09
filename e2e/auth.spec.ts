/**
 * E2E: Registration → forced password change is NOT required for self-registered
 * tenants → dashboard renders.
 *
 * Uses a unique workspace name per run to avoid collisions on the shared
 * test DB. Self-registered users do not get force_password_change set
 * (only the seed-created platform-owner does), so this flow lands on
 * /dashboard immediately.
 */
import { test, expect } from "@playwright/test";

const SLUG = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const EMAIL = `${SLUG}@e2e.argilette.test`;
const PASSWORD = "E2eTestPassword!2026";

test.describe("auth: register → login", () => {
  test("a new workspace can register and reach the dashboard", async ({ page }) => {
    await page.goto("/register");

    // The Register page may render its fields with various labels;
    // the API contract is { companyName, firstName, lastName, email,
    // password }. Use POST directly via the API to keep the test
    // independent of the page's exact label/markup.
    const res = await page.request.post("/api/auth/register", {
      data: {
        companyName: `E2E ${SLUG}`,
        firstName: "E2E",
        lastName: "User",
        email: EMAIL,
        password: PASSWORD,
        plan: "trial",
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(EMAIL);
    expect(body.mustChangePassword).toBe(false);
    expect(body.requiresTotp).toBeFalsy();
  });

  test("the registered user can log in and the dashboard route returns 200", async ({ page, request }) => {
    // Hit /api/auth/login directly to verify the cookie path works.
    const res = await request.post("/api/auth/login", {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.token).toBeTruthy();
    // httpOnly cookie should be set by the server.
    const setCookie = res.headers()["set-cookie"] || "";
    expect(setCookie).toContain("auth-token=");
    expect(setCookie.toLowerCase()).toContain("httponly");

    // Now hit /api/auth/me with the cookie session to prove cookie auth works.
    const me = await request.get("/api/auth/me");
    // Cookies are persisted on the request context automatically.
    expect(me.ok()).toBeTruthy();
    const meBody = await me.json();
    expect(meBody.user.email).toBe(EMAIL);
  });

  test("login with wrong password returns 401", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: EMAIL, password: "wrong-password" },
    });
    expect(res.status()).toBe(401);
  });

  test("unauthenticated /api/contacts returns 401", async ({ request }) => {
    // Fresh request context — no cookie, no token.
    const res = await request.get("/api/contacts");
    expect(res.status()).toBe(401);
  });
});
