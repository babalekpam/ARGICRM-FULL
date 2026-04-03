/**
 * marketplace-ingestion.ts
 * ─────────────────────────────────────────────────────────────────
 * Data ingestion engine for the ArgiCRM Data Marketplace.
 * Sources: NPI Registry · OpenStreetMap/Overpass (Africa) · CMS Medicare
 * All free, no API keys required.
 * Runs on startup + cron schedule (weekly/daily depending on source).
 */

import axios from "axios";
import { db } from "../db.js";
import { marketplaceLeads, ingestionLogs } from "@shared/schema-extended";
import { eq, and, sql } from "drizzle-orm";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Deduplication helper ────────────────────────────────────────
async function upsertLead(lead: typeof marketplaceLeads.$inferInsert): Promise<"added" | "skipped"> {
  if (!lead.externalId || !lead.source) return "skipped";
  try {
    const existing = await db.select({ id: marketplaceLeads.id })
      .from(marketplaceLeads)
      .where(and(
        eq(marketplaceLeads.source, lead.source),
        eq(marketplaceLeads.externalId, lead.externalId),
      ))
      .limit(1);

    if (existing.length > 0) return "skipped";

    // Also deduplicate on phone + company name if both present
    if (lead.phone && lead.companyName) {
      const dupCheck = await db.select({ id: marketplaceLeads.id })
        .from(marketplaceLeads)
        .where(and(
          eq(marketplaceLeads.phone, lead.phone),
          eq(marketplaceLeads.companyName, lead.companyName),
        ))
        .limit(1);
      if (dupCheck.length > 0) return "skipped";
    }

    await db.insert(marketplaceLeads).values({
      ...lead,
      qualityScore: computeQuality(lead),
    });
    return "added";
  } catch {
    return "skipped";
  }
}

function computeQuality(lead: Partial<typeof marketplaceLeads.$inferInsert>): number {
  let score = 0;
  if (lead.fullName || lead.companyName) score += 2;
  if (lead.email) score += 2;
  if (lead.phone) score += 2;
  if (lead.address || lead.city) score += 1;
  if (lead.website) score += 1;
  if (lead.industry || lead.specialty) score += 1;
  if (lead.title) score += 1;
  return Math.min(score, 10);
}

async function logIngestion(
  source: string,
  market: string,
  stats: { added: number; skipped: number; errors: string[] },
  durationMs: number,
  status: "success" | "failed" | "partial",
) {
  await db.insert(ingestionLogs).values({
    source,
    market,
    recordsAdded: stats.added,
    recordsSkipped: stats.skipped,
    errors: stats.errors,
    duration: durationMs,
    status,
    completedAt: new Date(),
  });
  console.log(`[Marketplace] ${source}/${market}: +${stats.added} added, ${stats.skipped} skipped — ${durationMs}ms`);
}

// ═══════════════════════════════════════════════════════════════
// SOURCE 1: NPI REGISTRY — US Healthcare Providers (free, no key)
// ═══════════════════════════════════════════════════════════════

const NPI_SPECIALTIES = [
  "207Q00000X", // Family Medicine
  "207R00000X", // Internal Medicine
  "1223G0001X", // General Dentistry
  "207N00000X", // Dermatology
  "207V00000X", // Obstetrics & Gynecology
  "208000000X", // Pediatrics
  "207T00000X", // Neurological Surgery
  "207Y00000X", // Orthopedic Surgery
  "2086S0120X", // Plastic Surgery
  "207RC0200X", // Critical Care Medicine
];

const SPECIALTY_NAMES: Record<string, string> = {
  "207Q00000X": "Family Medicine",
  "207R00000X": "Internal Medicine",
  "1223G0001X": "Dentistry",
  "207N00000X": "Dermatology",
  "207V00000X": "Obstetrics & Gynecology",
  "208000000X": "Pediatrics",
  "207T00000X": "Neurological Surgery",
  "207Y00000X": "Orthopedic Surgery",
  "2086S0120X": "Plastic Surgery",
  "207RC0200X": "Critical Care Medicine",
};

export async function ingestNPI(limitPerSpecialty = 200): Promise<void> {
  const start = Date.now();
  const stats = { added: 0, skipped: 0, errors: [] as string[] };

  for (const taxonomy of NPI_SPECIALTIES) {
    try {
      const params = new URLSearchParams({
        version: "2.1",
        limit: String(limitPerSpecialty),
        taxonomy_description: "",
        enumeration_type: "NPI-1",
        skip: "0",
      });
      params.append("taxonomy_description", SPECIALTY_NAMES[taxonomy] || "");

      const res = await axios.get(`https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=${limitPerSpecialty}&enumeration_type=NPI-1&taxonomy_description=${encodeURIComponent(SPECIALTY_NAMES[taxonomy] || "")}`, {
        timeout: 20000,
        headers: { "Accept": "application/json" },
      });

      const results: any[] = res.data?.results || [];

      for (const r of results) {
        const basic = r.basic || {};
        const address = (r.addresses || [])[0] || {};
        const tax = (r.taxonomies || [])[0] || {};

        const firstName = basic.first_name || basic.authorized_official_first_name || "";
        const lastName = basic.last_name || basic.authorized_official_last_name || "";
        const orgName = basic.organization_name || "";
        const fullName = orgName || `${firstName} ${lastName}`.trim();
        const phone = address.telephone_number || "";
        const npiNum = r.number || "";

        const outcome = await upsertLead({
          source: "npi",
          market: "US",
          category: "Healthcare",
          fullName: fullName || undefined,
          companyName: orgName || `${firstName} ${lastName}` || undefined,
          title: tax.desc || SPECIALTY_NAMES[taxonomy] || "Healthcare Provider",
          phone: phone || undefined,
          address: `${address.address_1 || ""} ${address.address_2 || ""}`.trim() || undefined,
          city: address.city || undefined,
          state: address.state || undefined,
          country: "US",
          zip: address.postal_code?.slice(0, 5) || undefined,
          industry: "Healthcare",
          specialty: tax.desc || SPECIALTY_NAMES[taxonomy] || undefined,
          language: "EN",
          externalId: npiNum,
          rawData: { npi: npiNum, taxonomy: tax.code, license: tax.license },
        });

        if (outcome === "added") stats.added++;
        else stats.skipped++;
      }

      await sleep(1000); // polite delay between specialties
    } catch (err: any) {
      stats.errors.push(`NPI ${taxonomy}: ${err.message}`);
    }
  }

  await logIngestion("npi", "US", stats, Date.now() - start, stats.errors.length > 0 ? "partial" : "success");
}

// ═══════════════════════════════════════════════════════════════
// SOURCE 2: OPENSTREETMAP / OVERPASS — Africa Business Data
// ═══════════════════════════════════════════════════════════════

const AFRICA_QUERIES = [
  { country: "Togo", iso: "TG", lang: "FR" },
  { country: "Ghana", iso: "GH", lang: "EN" },
  { country: "Nigeria", iso: "NG", lang: "EN" },
  { country: "Senegal", iso: "SN", lang: "FR" },
  { country: "Côte d'Ivoire", iso: "CI", lang: "FR" },
  { country: "Cameroon", iso: "CM", lang: "FR" },
  { country: "Kenya", iso: "KE", lang: "EN" },
];

const AFRICA_CATEGORIES = [
  { osm: "amenity=hospital", cat: "Healthcare", industry: "Healthcare" },
  { osm: "amenity=clinic", cat: "Healthcare", industry: "Healthcare" },
  { osm: "amenity=bank", cat: "Finance", industry: "Financial Services" },
  { osm: "shop=supermarket", cat: "Retail", industry: "Retail" },
  { osm: "amenity=restaurant", cat: "Restaurant", industry: "Food & Beverage" },
  { osm: "office=company", cat: "Business", industry: "Business Services" },
  { osm: "office=lawyer", cat: "Legal", industry: "Legal" },
  { osm: "amenity=school", cat: "Education", industry: "Education" },
];

export async function ingestOverpassAfrica(limitPerQuery = 50): Promise<void> {
  const start = Date.now();
  const stats = { added: 0, skipped: 0, errors: [] as string[] };

  for (const { country, iso, lang } of AFRICA_QUERIES) {
    for (const { osm, cat, industry } of AFRICA_CATEGORIES) {
      try {
        const query = `
          [out:json][timeout:25];
          area["ISO3166-1"="${iso}"]->.searchArea;
          node[${osm}](area.searchArea);
          out body ${limitPerQuery};
        `;

        const res = await axios.post(
          "https://overpass-api.de/api/interpreter",
          `data=${encodeURIComponent(query)}`,
          {
            timeout: 30000,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );

        const elements: any[] = res.data?.elements || [];

        for (const el of elements) {
          const tags = el.tags || {};
          const name = tags.name || tags["name:en"] || tags["name:fr"] || "";
          if (!name) continue;

          const phone = tags.phone || tags["contact:phone"] || tags["phone:mobile"] || "";
          const website = tags.website || tags["contact:website"] || "";
          const street = tags["addr:street"] || "";
          const city = tags["addr:city"] || tags.city || "";
          const externalId = `osm_${el.id}`;

          const outcome = await upsertLead({
            source: "overpass",
            market: "Africa",
            category: cat,
            companyName: name,
            phone: phone || undefined,
            website: website || undefined,
            address: street || undefined,
            city: city || undefined,
            country,
            industry,
            language: lang as "EN" | "FR",
            externalId,
            rawData: { osmId: el.id, lat: el.lat, lon: el.lon, tags },
          });

          if (outcome === "added") stats.added++;
          else stats.skipped++;
        }

        await sleep(2000); // Overpass rate limiting — be polite
      } catch (err: any) {
        stats.errors.push(`Overpass ${country}/${osm}: ${err.message}`);
        await sleep(5000);
      }
    }
  }

  await logIngestion("overpass", "Africa", stats, Date.now() - start, stats.errors.length > 5 ? "partial" : "success");
}

// ═══════════════════════════════════════════════════════════════
// SOURCE 3: CMS MEDICARE — US Healthcare Providers (free, no key)
// ═══════════════════════════════════════════════════════════════

export async function ingestCMSMedicare(limit = 500): Promise<void> {
  const start = Date.now();
  const stats = { added: 0, skipped: 0, errors: [] as string[] };

  try {
    // CMS Provider of Services dataset
    const url = `https://data.cms.gov/provider-data/api/1/datastore/sql?query=SELECT%20provider_name%2Cprovider_type%2Cprovider_city%2Cprovider_state%2Cprovider_zip_code%2Cprovider_phone_number%2Cprovider_id%20FROM%20c7dd%2C64ec%20LIMIT%20${limit}`;
    const res = await axios.get(url, { timeout: 30000, headers: { "Accept": "application/json" } });
    const rows: any[] = Array.isArray(res.data) ? res.data : [];

    for (const row of rows) {
      const name = row.provider_name || row.facility_name || "";
      const externalId = `cms_${row.provider_id || row.ccn || ""}`;
      if (!name || !externalId || externalId === "cms_") continue;

      const outcome = await upsertLead({
        source: "cms",
        market: "US",
        category: "Healthcare",
        companyName: name,
        title: row.provider_type || row.specialty_description || "Healthcare Provider",
        phone: row.provider_phone_number || undefined,
        city: row.provider_city || undefined,
        state: row.provider_state || undefined,
        zip: row.provider_zip_code || undefined,
        country: "US",
        industry: "Healthcare",
        specialty: row.provider_type || undefined,
        language: "EN",
        externalId,
        rawData: row,
      });

      if (outcome === "added") stats.added++;
      else stats.skipped++;
    }
  } catch (err: any) {
    stats.errors.push(`CMS: ${err.message}`);
  }

  await logIngestion("cms", "US", stats, Date.now() - start, stats.errors.length > 0 ? "partial" : "success");
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULER — runs at startup + on schedule
// ═══════════════════════════════════════════════════════════════

let ingestionRunning = false;

async function runAllSources(trigger: "startup" | "scheduled" | "manual" = "scheduled"): Promise<void> {
  if (ingestionRunning) {
    console.log("[Marketplace] Ingestion already running — skipping");
    return;
  }
  ingestionRunning = true;
  console.log(`[Marketplace] Starting ingestion (${trigger})`);

  try {
    // Run in sequence to be polite to free APIs
    await ingestNPI(100);
    await sleep(3000);
    await ingestCMSMedicare(300);
    await sleep(3000);
    await ingestOverpassAfrica(30);
  } catch (err) {
    console.error("[Marketplace] Ingestion error:", err);
  } finally {
    ingestionRunning = false;
    console.log("[Marketplace] Ingestion complete");
  }
}

export async function startMarketplaceIngestion(): Promise<void> {
  // Run a lightweight initial pull on first startup
  setTimeout(() => runAllSources("startup"), 15000); // 15s after boot

  // Weekly full refresh — every 7 days
  setInterval(() => runAllSources("scheduled"), 7 * 24 * 60 * 60 * 1000);

  console.log("[Marketplace] Ingestion scheduler started — initial run in 15s, weekly thereafter");
}

export async function triggerIngestion(source?: string): Promise<void> {
  if (source === "npi") { await ingestNPI(200); return; }
  if (source === "cms") { await ingestCMSMedicare(500); return; }
  if (source === "overpass") { await ingestOverpassAfrica(50); return; }
  await runAllSources("manual");
}

export { ingestionRunning };
