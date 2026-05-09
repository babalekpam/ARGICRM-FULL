/**
 * E2E: Contact CRUD via session cookie auth.
 */
import { test, expect } from "@playwright/test";

const SLUG = `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const EMAIL = `contacts-${SLUG}@e2e.argilette.test`;
const PASSWORD = "E2eTestPassword!2026";

test.describe("contacts CRUD", () => {
  test.beforeAll(async ({ request }) => {
    await request.post("/api/auth/register", {
      data: {
        companyName: `Contacts E2E ${SLUG}`,
        firstName: "Contacts",
        lastName: "Tester",
        email: EMAIL,
        password: PASSWORD,
        plan: "trial",
      },
    });
  });

  test("create → list → get → delete", async ({ request }) => {
    // Login first — this populates the request context's cookie jar.
    await request.post("/api/auth/login", { data: { email: EMAIL, password: PASSWORD } });

    // Create
    const create = await request.post("/api/contacts", {
      data: {
        firstName: "Jane",
        lastName: "Doe",
        email: `jane-${SLUG}@example.com`,
        company: "Acme",
        jobTitle: "VP Sales",
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = await create.json();
    expect(created.firstName).toBe("Jane");
    const contactId = created.id;
    expect(contactId).toBeTruthy();

    // List — the new contact should be in there.
    const list = await request.get("/api/contacts");
    expect(list.ok()).toBeTruthy();
    const listBody = await list.json();
    const items = Array.isArray(listBody) ? listBody : (listBody.data || []);
    expect(items.some((c: any) => c.id === contactId)).toBe(true);

    // Get one
    const get = await request.get(`/api/contacts/${contactId}`);
    expect(get.ok()).toBeTruthy();
    const gotten = await get.json();
    expect(gotten.email).toBe(`jane-${SLUG}@example.com`);

    // Delete
    const del = await request.delete(`/api/contacts/${contactId}`);
    expect(del.ok()).toBeTruthy();

    // Confirm 404 after deletion
    const after = await request.get(`/api/contacts/${contactId}`);
    expect(after.status()).toBe(404);
  });
});
