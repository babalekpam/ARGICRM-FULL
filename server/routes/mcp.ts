/**
 * Native MCP server (Streamable HTTP).
 *
 * Lets Claude Code / any MCP client drive the CRM directly:
 *
 *   claude mcp add --transport http argicrm https://<host>/mcp \
 *     --header "Authorization: Bearer <api_key>"
 *
 * Stateless: a fresh McpServer + transport is built per request, scoped to the
 * tenant + scopes resolved from the API key. Tools reuse the same metadata
 * registry + CRUD engine as the public API, plus ARIA's multi-entity executor
 * for richer built-in operations (convert lead, run workflow, enrich, invoice…).
 */
import { Router, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { authenticateApiKey, type ApiKeyRequest, type ApiKeyContext } from "../middleware/api-key-auth.js";
import { resolveDescriptor, listObjects } from "../platform/objects.js";
import { listRecords, getRecord, createRecord, updateRecord, deleteRecord } from "../platform/crud.js";
import { executeAriaAction } from "./aria.js";

const router = Router();

function scoped(apiKey: ApiKeyContext | undefined, scope: string): boolean {
  const held = apiKey?.scopes ?? [];
  if (held.includes("*")) return true;
  const [resource] = scope.split(":");
  return held.includes(scope) || held.includes(`${resource}:*`);
}

const ok = (data: any) => ({ content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }] });
const fail = (msg: string) => ({ content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true });

function buildMcpServer(tenantId: string, apiKey: ApiKeyContext): McpServer {
  const server = new McpServer({ name: "argicrm", version: "1.0.0" });

  server.registerTool(
    "list_objects",
    { description: "List every object type available (built-in CRM objects + custom objects)." },
    async () => ok(await listObjects(tenantId)),
  );

  server.registerTool(
    "list_records",
    {
      description: "List records of an object. Supports text search and a result limit.",
      inputSchema: {
        object: z.string().describe('Object key, e.g. "contacts", "deals", or a custom object plural'),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ object, search, limit }) => {
      const d = await resolveDescriptor(tenantId, object);
      if (!d) return fail(`Unknown object "${object}"`);
      if (!scoped(apiKey, `${d.scope}:read`)) return fail(`Missing scope ${d.scope}:read`);
      return ok(await listRecords(d, tenantId, { search, limit }));
    },
  );

  server.registerTool(
    "get_record",
    {
      description: "Fetch a single record by id.",
      inputSchema: { object: z.string(), id: z.string() },
    },
    async ({ object, id }) => {
      const d = await resolveDescriptor(tenantId, object);
      if (!d) return fail(`Unknown object "${object}"`);
      if (!scoped(apiKey, `${d.scope}:read`)) return fail(`Missing scope ${d.scope}:read`);
      const row = await getRecord(d, id, tenantId);
      return row ? ok(row) : fail("Not found");
    },
  );

  server.registerTool(
    "create_record",
    {
      description: "Create a record. `data` holds the field values (camelCase keys).",
      inputSchema: { object: z.string(), data: z.record(z.any()) },
    },
    async ({ object, data }) => {
      const d = await resolveDescriptor(tenantId, object);
      if (!d) return fail(`Unknown object "${object}"`);
      if (!scoped(apiKey, `${d.scope}:write`)) return fail(`Missing scope ${d.scope}:write`);
      return ok(await createRecord(d, tenantId, data, apiKey.id));
    },
  );

  server.registerTool(
    "update_record",
    {
      description: "Update fields on a record by id.",
      inputSchema: { object: z.string(), id: z.string(), data: z.record(z.any()) },
    },
    async ({ object, id, data }) => {
      const d = await resolveDescriptor(tenantId, object);
      if (!d) return fail(`Unknown object "${object}"`);
      if (!scoped(apiKey, `${d.scope}:write`)) return fail(`Missing scope ${d.scope}:write`);
      const row = await updateRecord(d, id, tenantId, data);
      return row ? ok(row) : fail("Not found");
    },
  );

  server.registerTool(
    "delete_record",
    {
      description: "Delete a record by id.",
      inputSchema: { object: z.string(), id: z.string() },
    },
    async ({ object, id }) => {
      const d = await resolveDescriptor(tenantId, object);
      if (!d) return fail(`Unknown object "${object}"`);
      if (!scoped(apiKey, `${d.scope}:write`)) return fail(`Missing scope ${d.scope}:write`);
      const done = await deleteRecord(d, id, tenantId);
      return done ? ok({ success: true }) : fail("Not found");
    },
  );

  // Richer built-in operations via ARIA's executor: CONVERT lead, RUN workflow,
  // ENRICH contact, create invoice/campaign/contract, etc.
  server.registerTool(
    "crm_action",
    {
      description:
        "Run a higher-level CRM action across built-in modules. " +
        "type: CREATE|READ|UPDATE|DELETE|SUMMARIZE|CONVERT|RUN|ENRICH; " +
        "entity: contact|lead|deal|task|account|invoice|campaign|project|contract|workflow.",
      inputSchema: {
        type: z.string(),
        entity: z.string(),
        data: z.record(z.any()).optional(),
      },
    },
    async ({ type, entity, data }) => {
      const writeish = ["CREATE", "UPDATE", "DELETE", "CONVERT", "RUN", "ENRICH"].includes(String(type).toUpperCase());
      const needed = `${entity}s:${writeish ? "write" : "read"}`;
      if (!scoped(apiKey, needed) && !scoped(apiKey, "*")) return fail(`Missing scope ${needed}`);
      try {
        const result = await executeAriaAction({ type, entity, data: data ?? {} }, { id: apiKey.id }, tenantId);
        return ok(result);
      } catch (err) {
        return fail((err as Error).message);
      }
    },
  );

  return server;
}

// Stateless Streamable HTTP: one server + transport per request.
router.post("/", authenticateApiKey, async (req: ApiKeyRequest, res: Response) => {
  const server = buildMcpServer(req.tenantId!, req.apiKey!);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[mcp] request error:", err);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  }
});

// Stateless server: no long-lived SSE stream or session teardown.
const methodNotAllowed = (_req: ApiKeyRequest, res: Response) =>
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
router.get("/", methodNotAllowed);
router.delete("/", methodNotAllowed);

export default router;
