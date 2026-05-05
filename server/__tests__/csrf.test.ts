import { describe, it, expect, vi } from "vitest";
import { csrfProtection, generateCsrfToken, signPayload as _ } from "../middleware/csrf.js";

function mockReq(opts: {
  method?: string; path?: string; cookies?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  return {
    method: opts.method || "POST",
    path: opts.path || "/api/contacts",
    url: opts.path || "/api/contacts",
    cookies: opts.cookies || {},
    headers: opts.headers || {},
  } as any;
}
function mockRes() {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  return res;
}

describe("middleware/csrf", () => {
  it("generates non-trivial random tokens", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it("skips CSRF on GET", () => {
    const next = vi.fn();
    const res = mockRes();
    csrfProtection(mockReq({ method: "GET" }), res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it("skips CSRF when Bearer token is present (API client)", () => {
    const next = vi.fn();
    const res = mockRes();
    csrfProtection(
      mockReq({ method: "POST", headers: { authorization: "Bearer abc" } }),
      res, next,
    );
    expect(next).toHaveBeenCalled();
  });

  it("skips CSRF on safelisted paths", () => {
    const next = vi.fn();
    const res = mockRes();
    csrfProtection(mockReq({ method: "POST", path: "/api/auth/login" }), res, next);
    expect(next).toHaveBeenCalled();
  });

  it("rejects mutation when cookie present but header missing", () => {
    const next = vi.fn();
    const res = mockRes();
    csrfProtection(
      mockReq({ method: "POST", cookies: { argilette_csrf: "tok123" } }),
      res, next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it("rejects when header doesn't match cookie", () => {
    const next = vi.fn();
    const res = mockRes();
    csrfProtection(
      mockReq({
        method: "POST",
        cookies: { argilette_csrf: "tok123" },
        headers: { "x-csrf-token": "different" },
      }),
      res, next,
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it("accepts when header matches cookie", () => {
    const next = vi.fn();
    const res = mockRes();
    csrfProtection(
      mockReq({
        method: "POST",
        cookies: { argilette_csrf: "tok123" },
        headers: { "x-csrf-token": "tok123" },
      }),
      res, next,
    );
    expect(next).toHaveBeenCalled();
  });

  it("rejects when neither cookie nor header is present (no auth at all)", () => {
    const next = vi.fn();
    const res = mockRes();
    csrfProtection(mockReq({ method: "POST" }), res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
