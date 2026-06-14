# ARGI CRM — Platform Layer (API · Webhooks · MCP · Custom Objects)

This layer turns ARGI CRM into an extensible platform. Everything is tenant-scoped
and driven by a shared metadata registry, so the public API, the MCP server and the
no-code data model all expose the same objects — built-in **and** custom.

---

## 1. API keys

Create one in the app under **Developer** (sidebar → Admin → Developer), or via the
authenticated management API:

```bash
curl -X POST https://YOUR_HOST/api/developer/keys \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"name":"My integration","scopes":["*"]}'
# → { "id": "...", "key": "argi_live_xxx", ... }   ← shown ONCE
```

Scopes: `*` (all), or `<resource>:read` / `<resource>:write`
(`contacts`, `leads`, `deals`, `tasks`, `accounts`, `campaigns`, `invoices`, `activities`, `custom`).

---

## 2. Public Developer API — `/api/v1`

Authenticate every request with the key (`Authorization: Bearer <key>` or `X-API-Key`).
Rate limited per key (default 100/min).

```bash
# List objects available to you (built-in + custom)
curl https://YOUR_HOST/api/v1/objects -H "Authorization: Bearer $KEY"

# List + search + paginate
curl "https://YOUR_HOST/api/v1/contacts?search=acme&limit=20&offset=0" -H "Authorization: Bearer $KEY"

# Create (single or batch of up to 60)
curl -X POST https://YOUR_HOST/api/v1/contacts -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Marie","lastName":"Martin","email":"marie@dupont.fr","company":"Dupont & Associés"}'

# Get / update / delete
curl https://YOUR_HOST/api/v1/contacts/<id> -H "Authorization: Bearer $KEY"
curl -X PATCH https://YOUR_HOST/api/v1/deals/<id> -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{"stage":"won"}'
curl -X DELETE https://YOUR_HOST/api/v1/tasks/<id> -H "Authorization: Bearer $KEY"
```

Responses are camelCase. Custom fields on built-in objects ride a `customFields` object.

---

## 3. Webhooks

Subscribe an endpoint (Developer page or `POST /api/developer/webhooks`) to events like
`contact.created`, `deal.updated`, `invoice.deleted`. Deliveries are signed and retried
(1m → 5m → 30m → 2h, up to 5 attempts).

Verify the signature:

```js
import { createHmac } from "crypto";
const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
// compare to the X-Argicrm-Signature header
```

---

## 4. Native MCP server — `/mcp`

Drive the CRM from Claude Code or any MCP client:

```bash
claude mcp add --transport http argicrm https://YOUR_HOST/mcp \
  --header "Authorization: Bearer <api_key>"
```

Tools: `list_objects`, `list_records`, `get_record`, `create_record`, `update_record`,
`delete_record`, and `crm_action` (higher-level built-in ops — convert lead, run workflow,
enrich contact, create invoice/campaign/contract). Tools respect the key's scopes.

---

## 5. Custom objects & fields (no-code)

In **Data Model** (sidebar → Admin → Data Model) or via `/api/metadata`:

- **Custom objects** become **real physical tables** (`co_*`) with **real typed columns** —
  not a generic JSON bucket — so they index, query and serialize like first-class objects.
- **Fields** map to real SQL columns (`text`, `number`, `currency`, `boolean`, `date`,
  `datetime`, `select`, `multiselect`, `email`, `url`, `phone`, `relation`, `json`).
- **Custom fields on built-in objects** are stored in each table's additive `custom_fields`
  jsonb column and flow through the API/MCP automatically.

New custom objects appear immediately in `/api/v1/objects`, the API, and the MCP tools.

```bash
# Define an object
curl -X POST https://YOUR_HOST/api/metadata/objects -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"nameSingular":"property","namePlural":"properties","labelSingular":"Property","labelPlural":"Properties"}'

# Add a field, then use it through the public API
curl -X POST https://YOUR_HOST/api/metadata/objects/properties/fields -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" -d '{"name":"price","label":"Price","type":"currency"}'
curl -X POST https://YOUR_HOST/api/v1/properties -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{"price":450000}'
```
