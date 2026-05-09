/**
 * E2E: Council topic catalog is reachable behind auth.
 *
 * Registers a fresh workspace, then GETs /api/council/topics and verifies
 * the three built-in topics are present with their plan/mode metadata.
 */
import { test, expect } from "@playwright/test";

const SLUG = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const EMAIL = `council-${SLUG}@e2e.argilette.test`;
const PASSWORD = "E2eTestPassword!2026";

test.describe("council", () => {
  test.beforeAll(async ({ request }) => {
    await request.post("/api/auth/register", {
      data: {
        companyName: `Council E2E ${SLUG}`,
        firstName: "Council",
        lastName: "Tester",
        email: EMAIL,
        password: PASSWORD,
        plan: "professional", // pro tier so council topics are reachable
      },
    });
  });

  test("GET /api/council/topics returns the three built-in topics", async ({ request }) => {
    // Fresh login on this request context to set the cookie.
    const login = await request.post("/api/auth/login", {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(login.ok()).toBeTruthy();

    const res = await request.get("/api/council/topics");
    expect(res.ok()).toBeTruthy();
    const topics = await res.json();
    expect(Array.isArray(topics)).toBe(true);
    const names = topics.map((t: any) => t.name).sort();
    expect(names).toEqual(["deal.advance", "discount.approve", "lead.score"]);

    const discount = topics.find((t: any) => t.name === "discount.approve");
    expect(discount.requiresManualApproval).toBe(true);
    expect(discount.minPlan).toBe("professional");
    expect(discount.defaultMode).toBe("ensemble");
  });

  test("GET /api/council/quotas returns the per-plan quota matrix", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: EMAIL, password: PASSWORD },
    });
    const res = await request.get("/api/council/quotas");
    expect(res.ok()).toBeTruthy();
    const quotas = await res.json();
    expect(quotas.trial).toBe(5);
    expect(quotas.starter).toBe(50);
    expect(quotas.professional).toBe(500);
    expect(quotas.business).toBe(2000);
    expect(quotas.enterprise).toBe(-1);
  });

  test("GET /api/council/usage returns the dashboard payload shape", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: EMAIL, password: PASSWORD },
    });
    const res = await request.get("/api/council/usage");
    expect(res.ok()).toBeTruthy();
    const usage = await res.json();
    expect(usage).toHaveProperty("plan");
    expect(usage).toHaveProperty("monthlyLimit");
    expect(usage).toHaveProperty("used");
    expect(usage).toHaveProperty("remaining");
    expect(usage).toHaveProperty("statusBreakdown");
    expect(usage).toHaveProperty("byTopic");
    expect(usage).toHaveProperty("history");
    // Plan should be 'professional' since registration set it that way.
    expect(usage.plan).toBe("professional");
    expect(usage.monthlyLimit).toBe(500);
  });

  test("POST /api/council/decisions with unknown topic returns 400", async ({ request }) => {
    await request.post("/api/auth/login", {
      data: { email: EMAIL, password: PASSWORD },
    });
    const res = await request.post("/api/council/decisions", {
      data: { topic: "nonexistent.topic", inputs: { foo: "bar" } },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Unknown council topic/i);
  });
});
