/**
 * Integration test: tenant isolation in council orchestrator queries.
 *
 * Both getDecision() and listDecisions() filter by req.user.tenantId; this
 * test checks the query construction at the SQL-builder level (drizzle's
 * eq() + and()) so that no caller can pass a foreign decisionId and
 * receive someone else's row. Cross-tenant access is the single most
 * important enterprise smoke test — a regression here is a P0 incident.
 */
import { describe, it, expect, vi } from "vitest";

// Mock the db module's select to spy on the where clauses passed to it.
const whereCalls: any[] = [];
vi.mock("../../db.js", () => {
  return {
    db: {
      select: () => ({
        from: () => ({
          where: (cond: any) => {
            whereCalls.push(cond);
            return {
              limit: () => Promise.resolve([]),
              orderBy: () => ({ limit: () => Promise.resolve([]) }),
            };
          },
        }),
      }),
      insert: () => ({
        values: () => ({ returning: () => Promise.resolve([{ id: "new-id" }]) }),
      }),
      update: () => ({
        set: () => ({ where: () => Promise.resolve({ rowCount: 0 }) }),
      }),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    },
  };
});

import { getDecision, listDecisions } from "../../services/council/index.js";

describe("integration: tenant isolation in council queries", () => {
  it("getDecision builds a where clause that includes tenant_id", async () => {
    whereCalls.length = 0;
    await getDecision("some-decision-id", "tenant-A");

    expect(whereCalls.length).toBe(1);
    // Drizzle's `and(eq(id, ...), eq(tenant_id, ...))` produces an
    // SQL fragment object. Stringifying it via the queryChunks property
    // should mention both bindings.
    const stringified = JSON.stringify(whereCalls[0]);
    expect(stringified).toContain("tenant_id");
    expect(stringified).toContain("tenant-A");
    expect(stringified).toContain("some-decision-id");
  });

  it("listDecisions builds a where clause that includes tenant_id", async () => {
    whereCalls.length = 0;
    await listDecisions("tenant-B", 50);

    expect(whereCalls.length).toBe(1);
    const stringified = JSON.stringify(whereCalls[0]);
    expect(stringified).toContain("tenant_id");
    expect(stringified).toContain("tenant-B");
  });

  it("different tenants produce different where clauses (no shared mutable state)", async () => {
    whereCalls.length = 0;
    await getDecision("d1", "tenant-X");
    await getDecision("d2", "tenant-Y");

    expect(whereCalls.length).toBe(2);
    expect(JSON.stringify(whereCalls[0])).toContain("tenant-X");
    expect(JSON.stringify(whereCalls[1])).toContain("tenant-Y");
    expect(JSON.stringify(whereCalls[0])).not.toContain("tenant-Y");
    expect(JSON.stringify(whereCalls[1])).not.toContain("tenant-X");
  });
});
