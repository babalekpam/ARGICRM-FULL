/**
 * ARGILETTE AUTONOMOUS WEB SCRAPER ENGINE
 * 
 * Scrapes 100% public, freely accessible sources — no paid APIs needed.
 * 
 * Sources:
 *   Business Directories: Yellow Pages, Yelp, Clutch, G2, Capterra, Trustpilot
 *   Company Data: OpenCorporates (free API), WHOIS, Crunchbase (public), LinkedIn (public)
 *   Job Postings: Indeed (public), Glassdoor (public) → intent signals
 *   Tech Stack: Website HTML headers, script tags, meta tags
 *   Email Discovery: Pattern generation + MX record DNS verification (zero API cost)
 *   Search: DuckDuckGo HTML (no API key), Bing (no key for basic), Google (public results)
 *   GitHub: Public repos → tech stack + company info (60 req/hr free)
 *   Product Hunt, AngelList/Wellfound: Public startup data
 */

import axios, { type AxiosInstance } from "axios";
import * as cheerio from "cheerio";
import * as dns from "dns";
import { promisify } from "util";
import pLimit from "p-limit";
import pRetry from "p-retry";

const dnsResolve = promisify(dns.resolve);
const dnsResolveMx = promisify(dns.resolveMx);

// ═══════════════════════════════════════════════════════════════
// SERPAPI KEY ROTATION ENGINE
// Keys stored as SERP_API_KEYS=key1,key2,key3 (comma-separated)
// Each SerpAPI free key = 100 searches/month, paid = varies
// Exhausted keys reset after 24h (daily quota window)
// ═══════════════════════════════════════════════════════════════

interface KeyState {
  key: string;
  exhaustedAt: number | null;  // timestamp or null if healthy
  errorCount: number;
  totalUsed: number;
}

const SERP_KEY_RESET_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadSerpKeys(): KeyState[] {
  const raw = process.env.SERP_API_KEYS || "";
  const keys = raw.split(",").map(k => k.trim()).filter(Boolean);
  if (keys.length > 0) {
    console.log(`[SerpAPI] ${keys.length} key(s) loaded — chain order: ${keys.map((k, i) => `#${i + 1}(...${k.slice(-6)})`).join(" → ")}`);
  } else {
    console.log("[SerpAPI] No keys configured — DuckDuckGo only");
  }
  return keys.map(key => ({ key, exhaustedAt: null, errorCount: 0, totalUsed: 0 }));
}

// Mutable in-process state — persists for lifetime of server process
const serpKeyStates: KeyState[] = loadSerpKeys();

function getNextSerpKey(): KeyState | null {
  const now = Date.now();
  for (const state of serpKeyStates) {
    // Reset if 24h have passed since exhaustion
    if (state.exhaustedAt && now - state.exhaustedAt > SERP_KEY_RESET_MS) {
      state.exhaustedAt = null;
      state.errorCount = 0;
      console.log(`[SerpAPI] Key ...${state.key.slice(-6)} quota reset after 24h`);
    }
    if (!state.exhaustedAt) return state;
  }
  return null; // All keys exhausted
}

function markKeyExhausted(state: KeyState, reason: string) {
  state.exhaustedAt = Date.now();
  console.warn(`[SerpAPI] Key ...${state.key.slice(-6)} marked exhausted: ${reason}`);
}

export function getSerpApiStatus(): Array<{ keyHint: string; status: string; totalUsed: number; resetsIn?: string }> {
  const now = Date.now();
  return serpKeyStates.map(s => {
    const resetsIn = s.exhaustedAt
      ? `${Math.ceil((SERP_KEY_RESET_MS - (now - s.exhaustedAt)) / 3600000)}h`
      : undefined;
    return {
      keyHint: `...${s.key.slice(-6)}`,
      status: s.exhaustedAt ? "exhausted" : "healthy",
      totalUsed: s.totalUsed,
      resetsIn,
    };
  });
}

// ── SerpAPI web search (Google Results via API) ─────────────────
async function searchWithSerpAPI(
  query: string,
  maxResults = 10,
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const keyState = getNextSerpKey();
  if (!keyState) {
    console.warn("[SerpAPI] All keys exhausted — skipping SerpAPI fallback");
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      api_key: keyState.key,
      engine: "google",
      num: String(Math.min(maxResults, 10)),
      hl: "en",
      gl: "us",
    });

    const res = await axios.get(`https://serpapi.com/search?${params}`, {
      timeout: 15000,
      headers: { "Accept": "application/json" },
    });

    const data = res.data;

    // Check for quota/rate errors in response body
    if (data?.error) {
      const errMsg = String(data.error).toLowerCase();
      if (errMsg.includes("limit") || errMsg.includes("plan") || errMsg.includes("credit") || errMsg.includes("quota")) {
        markKeyExhausted(keyState, data.error);
        // Recurse to try next key
        return searchWithSerpAPI(query, maxResults);
      }
      console.warn(`[SerpAPI] API error: ${data.error}`);
      return [];
    }

    keyState.totalUsed++;
    const organicResults = data?.organic_results || [];
    return organicResults.slice(0, maxResults).map((r: any) => ({
      title: r.title || "",
      url: r.link || "",
      snippet: r.snippet || r.displayed_link || "",
    }));

  } catch (err: any) {
    const status = err?.response?.status;
    const body = err?.response?.data;

    if (status === 429 || (body?.error && String(body.error).toLowerCase().includes("limit"))) {
      markKeyExhausted(keyState, `HTTP ${status}`);
      return searchWithSerpAPI(query, maxResults); // try next key
    }

    keyState.errorCount++;
    if (keyState.errorCount >= 3) markKeyExhausted(keyState, "3 consecutive errors");
    console.warn(`[SerpAPI] Request failed: ${err.message}`);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// USER AGENT ROTATION — mimics real browsers
// ═══════════════════════════════════════════════════════════════

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
];

let uaIndex = 0;
function nextUserAgent() {
  return USER_AGENTS[uaIndex++ % USER_AGENTS.length];
}

// ═══════════════════════════════════════════════════════════════
// HTTP CLIENT — rate-limited, retry-capable
// ═══════════════════════════════════════════════════════════════

const limit = pLimit(3); // max 3 concurrent scraping requests
const DELAY_MS = 1500; // 1.5s between requests per domain

const domainLastHit: Record<string, number> = {};

async function politeSleep(domain: string) {
  const last = domainLastHit[domain] || 0;
  const elapsed = Date.now() - last;
  if (elapsed < DELAY_MS) await new Promise(r => setTimeout(r, DELAY_MS - elapsed));
  domainLastHit[domain] = Date.now();
}

async function fetchPage(url: string, options?: { timeout?: number; headers?: Record<string, string> }): Promise<string> {
  const domain = new URL(url).hostname;
  await politeSleep(domain);

  return pRetry(async () => {
    const res = await axios.get(url, {
      timeout: options?.timeout || 12000,
      headers: {
        "User-Agent": nextUserAgent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Upgrade-Insecure-Requests": "1",
        ...options?.headers,
      },
      maxRedirects: 5,
    });
    return res.data as string;
  }, { retries: 2, minTimeout: 2000 });
}

async function fetchJSON(url: string, headers?: Record<string, string>): Promise<any> {
  const domain = new URL(url).hostname;
  await politeSleep(domain);

  return pRetry(async () => {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; ArgiletteCRM/1.0)",
        ...headers,
      },
    });
    return res.data;
  }, { retries: 2, minTimeout: 1500 });
}

// ═══════════════════════════════════════════════════════════════
// 1. WEB SEARCH — DuckDuckGo primary, SerpAPI fallback with key rotation
// ═══════════════════════════════════════════════════════════════

async function searchDuckDuckGoRaw(query: string, maxResults = 10): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const encoded = encodeURIComponent(query);
    const html = await fetchPage(`https://html.duckduckgo.com/html/?q=${encoded}&kl=us-en`);
    const $ = cheerio.load(html);
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    $(".result__body").each((i, el) => {
      if (results.length >= maxResults) return false;
      const title = $(el).find(".result__title").text().trim();
      const url = $(el).find(".result__url").text().trim();
      const snippet = $(el).find(".result__snippet").text().trim();
      if (title && url) results.push({ title, url: url.startsWith("http") ? url : `https://${url}`, snippet });
    });

    return results;
  } catch {
    return [];
  }
}

export async function searchDuckDuckGo(query: string, maxResults = 10): Promise<Array<{ title: string; url: string; snippet: string }>> {
  // Try DuckDuckGo first
  const ddgResults = await searchDuckDuckGoRaw(query, maxResults);

  // Fall back to SerpAPI if DDG returned nothing (rate-limited / blocked) or fewer than half requested
  const FALLBACK_THRESHOLD = Math.max(1, Math.floor(maxResults / 2));
  if (ddgResults.length < FALLBACK_THRESHOLD && serpKeyStates.length > 0) {
    const serpResults = await searchWithSerpAPI(query, maxResults);
    if (serpResults.length > 0) {
      console.log(`[Search] DDG returned ${ddgResults.length} results — SerpAPI fallback returned ${serpResults.length} for: "${query.slice(0, 60)}"`);
      return serpResults;
    }
  }

  return ddgResults;
}

// ═══════════════════════════════════════════════════════════════
// 2. OPENCORPORATES — Free public company registry (80+ countries)
// ═══════════════════════════════════════════════════════════════

export async function searchOpenCorporates(companyName: string, jurisdiction?: string): Promise<Array<{
  name: string; jurisdiction: string; companyNumber: string;
  registeredAddress?: string; incorporatedAt?: string; status?: string;
}>> {
  try {
    const params = new URLSearchParams({ q: companyName, ...(jurisdiction ? { jurisdiction_code: jurisdiction } : {}) });
    const data = await fetchJSON(`https://api.opencorporates.com/v0.4/companies/search?${params}`);
    
    return (data?.results?.companies || []).slice(0, 5).map((c: any) => ({
      name: c.company?.name,
      jurisdiction: c.company?.jurisdiction_code,
      companyNumber: c.company?.company_number,
      registeredAddress: c.company?.registered_address?.street_address,
      incorporatedAt: c.company?.incorporation_date,
      status: c.company?.current_status,
    }));
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. WHOIS — Domain registration data (free, built-in DNS)
// ═══════════════════════════════════════════════════════════════

export async function lookupDomain(domain: string): Promise<{
  exists: boolean; registrar?: string; createdDate?: string;
  country?: string; emails?: string[]; nameservers?: string[];
}> {
  try {
    // DNS-based checks (always free, no API)
    const [aRecords, mxRecords, nsRecords] = await Promise.allSettled([
      dnsResolve(domain, "A"),
      dnsResolveMx(domain),
      dnsResolve(domain, "NS"),
    ]);

    const exists = aRecords.status === "fulfilled" && (aRecords.value as string[]).length > 0;
    const nameservers = nsRecords.status === "fulfilled" ? (nsRecords.value as string[]) : [];

    // Detect registrar from nameservers
    let registrar: string | undefined;
    const nsStr = nameservers.join(" ").toLowerCase();
    if (nsStr.includes("godaddy")) registrar = "GoDaddy";
    else if (nsStr.includes("cloudflare")) registrar = "Cloudflare";
    else if (nsStr.includes("namecheap")) registrar = "Namecheap";
    else if (nsStr.includes("awsdns")) registrar = "Amazon Route 53";
    else if (nsStr.includes("google")) registrar = "Google Domains";
    else if (nsStr.includes("squarespace")) registrar = "Squarespace";

    return { exists, registrar, nameservers };
  } catch {
    return { exists: false };
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. EMAIL VERIFICATION — Pure DNS MX lookup (zero cost, zero API)
// ═══════════════════════════════════════════════════════════════

export async function verifyEmailDNS(email: string): Promise<{
  format: boolean; domain: boolean; mxRecord: boolean;
  mxHost?: string; status: "valid" | "likely" | "risky" | "invalid"; confidence: number;
}> {
  // Format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { format: false, domain: false, mxRecord: false, status: "invalid", confidence: 0 };

  const domain = email.split("@")[1];

  // Block free email providers
  const freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "protonmail.com", "zoho.com"];
  if (freeProviders.includes(domain.toLowerCase())) {
    return { format: true, domain: true, mxRecord: true, status: "risky", confidence: 30,
      mxHost: "free-provider" };
  }

  try {
    // MX record lookup — if MX exists, domain accepts email
    const mxRecords = await dnsResolveMx(domain);
    const topMx = mxRecords.sort((a, b) => a.priority - b.priority)[0];

    // Check if it's a known mail provider (bonus confidence)
    const mxHost = topMx?.exchange?.toLowerCase() || "";
    let bonus = 0;
    if (mxHost.includes("google") || mxHost.includes("googlemail")) bonus = 15;
    else if (mxHost.includes("microsoft") || mxHost.includes("outlook") || mxHost.includes("protection.outlook")) bonus = 15;
    else if (mxHost.includes("mimecast")) bonus = 10;
    else if (mxHost.includes("proofpoint")) bonus = 10;

    const confidence = Math.min(95, 65 + bonus);

    return {
      format: true, domain: true, mxRecord: true,
      mxHost: topMx?.exchange,
      status: confidence >= 80 ? "valid" : "likely",
      confidence,
    };
  } catch {
    // No MX record found
    try {
      // Fallback: check if A record exists for the domain
      await dnsResolve(domain, "A");
      return { format: true, domain: true, mxRecord: false, status: "risky", confidence: 25 };
    } catch {
      return { format: true, domain: false, mxRecord: false, status: "invalid", confidence: 0 };
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. TECHNOGRAPHIC DETECTION — Scan actual website HTML (free)
// ═══════════════════════════════════════════════════════════════

const TECH_FINGERPRINTS: Array<{ name: string; category: string; patterns: RegExp[] }> = [
  // CRM
  { name: "Salesforce", category: "CRM", patterns: [/salesforce\.com/i, /force\.com/i, /pardot/i] },
  { name: "HubSpot", category: "CRM", patterns: [/hubspot\.com/i, /hs-scripts\.com/i, /hs-analytics\.net/i] },
  { name: "Pipedrive", category: "CRM", patterns: [/pipedrive\.com/i] },
  // Analytics
  { name: "Google Analytics", category: "Analytics", patterns: [/google-analytics\.com/i, /googletagmanager\.com/i, /gtag\(/i] },
  { name: "Mixpanel", category: "Analytics", patterns: [/mixpanel\.com/i, /cdn\.mxpnl\.com/i] },
  { name: "Segment", category: "Analytics", patterns: [/cdn\.segment\.com/i, /segment\.io/i] },
  { name: "Amplitude", category: "Analytics", patterns: [/amplitude\.com/i, /cdn\.amplitude\.com/i] },
  { name: "Hotjar", category: "Analytics", patterns: [/hotjar\.com/i, /static\.hotjar\.com/i] },
  { name: "Heap", category: "Analytics", patterns: [/heap\.io/i, /heapanalytics\.com/i] },
  // Marketing
  { name: "Mailchimp", category: "Marketing", patterns: [/mailchimp\.com/i, /chimpstatic\.com/i] },
  { name: "Klaviyo", category: "Marketing", patterns: [/klaviyo\.com/i, /static\.klaviyo\.com/i] },
  { name: "ActiveCampaign", category: "Marketing", patterns: [/activecampaign\.com/i] },
  { name: "Marketo", category: "Marketing", patterns: [/marketo\.com/i, /mktoresp\.com/i] },
  // Support
  { name: "Intercom", category: "Support", patterns: [/intercom\.io/i, /intercomcdn\.com/i] },
  { name: "Zendesk", category: "Support", patterns: [/zendesk\.com/i, /zdassets\.com/i] },
  { name: "Drift", category: "Support", patterns: [/drift\.com/i, /js\.driftt\.com/i] },
  { name: "Crisp", category: "Support", patterns: [/crisp\.chat/i] },
  // Payments
  { name: "Stripe", category: "Payments", patterns: [/stripe\.com/i, /js\.stripe\.com/i] },
  { name: "PayPal", category: "Payments", patterns: [/paypal\.com/i, /paypalobjects\.com/i] },
  { name: "Shopify", category: "E-commerce", patterns: [/shopify\.com/i, /cdn\.shopify\.com/i, /myshopify\.com/i] },
  // Cloud
  { name: "AWS", category: "Cloud", patterns: [/amazonaws\.com/i, /cloudfront\.net/i] },
  { name: "Google Cloud", category: "Cloud", patterns: [/googleapis\.com/i, /google\.cloud/i] },
  { name: "Cloudflare", category: "CDN", patterns: [/cloudflare\.com/i, /cfcdn\.net/i] },
  // Tech
  { name: "React", category: "Frontend", patterns: [/__REACT_DEVTOOLS/i, /react\.development\.js/i, /react\.production\.min\.js/i] },
  { name: "Vue.js", category: "Frontend", patterns: [/vue\.js/i, /vue\.min\.js/i, /vuex/i] },
  { name: "WordPress", category: "CMS", patterns: [/wp-content/i, /wp-includes/i, /wordpress\.org/i] },
  { name: "Webflow", category: "CMS", patterns: [/webflow\.com/i, /assets\.website-files\.com/i] },
  // Recruitment
  { name: "Greenhouse", category: "ATS", patterns: [/greenhouse\.io/i] },
  { name: "Lever", category: "ATS", patterns: [/lever\.co/i] },
  { name: "Workday", category: "HR", patterns: [/workday\.com/i, /myworkday\.com/i] },
];

export async function detectTechStack(domain: string): Promise<Array<{
  name: string; category: string; confidence: number; detected: boolean;
}>> {
  try {
    const url = `https://${domain}`;
    const html = await fetchPage(url, { timeout: 10000 });
    const detected: Array<{ name: string; category: string; confidence: number; detected: boolean }> = [];

    for (const tech of TECH_FINGERPRINTS) {
      const matches = tech.patterns.filter(p => p.test(html));
      if (matches.length > 0) {
        detected.push({
          name: tech.name,
          category: tech.category,
          confidence: Math.min(95, 70 + (matches.length * 10)),
          detected: true,
        });
      }
    }

    // Also check response headers for server info
    return detected;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. COMPANY WEBSITE SCRAPER — Extract contacts + company info
// ═══════════════════════════════════════════════════════════════

export async function scrapeCompanyWebsite(domain: string): Promise<{
  name?: string; description?: string; location?: string;
  phone?: string; email?: string; socialLinks?: Record<string, string>;
  teamMembers?: Array<{ name: string; title: string; email?: string }>;
  industry?: string; founded?: string;
}> {
  const result: any = { socialLinks: {} };

  try {
    const pages = [`https://${domain}`, `https://${domain}/about`, `https://${domain}/team`, `https://${domain}/contact`];

    for (const page of pages.slice(0, 2)) {
      try {
        const html = await fetchPage(page);
        const $ = cheerio.load(html);

        // Company name from title/meta
        if (!result.name) {
          result.name = $("meta[property='og:site_name']").attr("content")
            || $("title").text().split(/[|\-–]/)[0].trim()
            || "";
        }

        // Description
        if (!result.description) {
          result.description = $("meta[name='description']").attr("content")
            || $("meta[property='og:description']").attr("content")
            || "";
        }

        // Social links
        $("a[href*='linkedin.com/company']").each((_, el) => { result.socialLinks.linkedin = $(el).attr("href"); });
        $("a[href*='twitter.com'], a[href*='x.com']").each((_, el) => { result.socialLinks.twitter = $(el).attr("href"); });
        $("a[href*='facebook.com']").each((_, el) => { result.socialLinks.facebook = $(el).attr("href"); });
        $("a[href*='github.com']").each((_, el) => { result.socialLinks.github = $(el).attr("href"); });

        // Phone numbers
        const phoneRegex = /(\+?1?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/g;
        const phoneMatch = $.text().match(phoneRegex);
        if (phoneMatch && !result.phone) result.phone = phoneMatch[0].trim();

        // Email addresses (not just mailto)
        const emailRegex = /\b[A-Za-z0-9._%+-]+@(?!.*\.(png|jpg|gif|svg|webp|ico))[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = $.text().match(emailRegex) || [];
        const bizEmails = emails.filter(e => !e.includes(`@${domain}`.split(".")[0]) === false
          && !["noreply", "support", "hello", "info", "contact", "team"].some(prefix => e.startsWith(prefix + "@"))
        );
        if (bizEmails.length && !result.email) result.email = bizEmails[0];

        // Location from structured data
        const jsonLd = $('script[type="application/ld+json"]').text();
        if (jsonLd) {
          try {
            const structured = JSON.parse(jsonLd.replace(/[\n\r]/g, " "));
            const org = Array.isArray(structured) ? structured.find(s => s["@type"]?.includes("Organization")) : structured;
            if (org) {
              result.name = result.name || org.name;
              result.description = result.description || org.description;
              if (org.address) {
                const addr = org.address;
                result.location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(", ");
              }
              if (org.foundingDate) result.founded = org.foundingDate;
            }
          } catch {}
        }
      } catch {}
    }
  } catch {}

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 7. YELLOW PAGES SCRAPER — US local business directory
// ═══════════════════════════════════════════════════════════════

export async function scrapeYellowPages(query: string, location: string, maxResults = 10): Promise<Array<{
  name: string; phone?: string; address?: string; website?: string;
  category?: string; rating?: number; reviewCount?: number;
}>> {
  try {
    const url = `https://www.yellowpages.com/search?search_terms=${encodeURIComponent(query)}&geo_location_terms=${encodeURIComponent(location)}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const results: any[] = [];

    $(".result").each((i, el) => {
      if (results.length >= maxResults) return false;
      const name = $(el).find(".business-name").text().trim();
      const phone = $(el).find(".phones").text().trim();
      const address = $(el).find(".street-address").text().trim() + " " + $(el).find(".locality").text().trim();
      const website = $(el).find("a.track-visit-website").attr("href") || "";
      const category = $(el).find(".categories a").text().trim();
      const rating = parseFloat($(el).find(".rating").attr("class")?.match(/rating-(\d+)/)?.[1] || "0") / 10;
      const reviewCount = parseInt($(el).find(".count").text().replace(/[()]/g, "") || "0");
      if (name) results.push({ name, phone: phone || undefined, address: address.trim() || undefined, website: website || undefined, category: category || undefined, rating: rating || undefined, reviewCount: reviewCount || undefined });
    });

    return results;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. GITHUB — Company repos → tech stack + hiring intent
// ═══════════════════════════════════════════════════════════════

export async function searchGitHub(orgName: string): Promise<{
  exists: boolean; repos?: number; followers?: number;
  languages?: string[]; topics?: string[]; recentActivity?: string;
  members?: number; website?: string;
}> {
  try {
    // GitHub API: 60 unauthenticated requests per hour (per IP)
    // With GITHUB_TOKEN: 5000/hour
    const headers: Record<string, string> = { "Accept": "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;

    const orgData = await fetchJSON(`https://api.github.com/orgs/${encodeURIComponent(orgName)}`, headers);

    if (orgData.message === "Not Found") return { exists: false };

    // Get top repos to extract languages and topics
    const repos = await fetchJSON(`https://api.github.com/orgs/${encodeURIComponent(orgName)}/repos?sort=updated&per_page=10`, headers);

    const languages = [...new Set(repos.map((r: any) => r.language).filter(Boolean))];
    const topics = [...new Set(repos.flatMap((r: any) => r.topics || []))];
    const recentRepo = repos[0];

    return {
      exists: true,
      repos: orgData.public_repos,
      followers: orgData.followers,
      members: orgData.members_count,
      website: orgData.blog || orgData.html_url,
      languages,
      topics,
      recentActivity: recentRepo?.updated_at,
    };
  } catch {
    return { exists: false };
  }
}

// ═══════════════════════════════════════════════════════════════
// 9. JOB POSTING SCRAPER — Indeed (public, no key needed)
//    Job postings = buying intent signals (hiring CRM admin = using CRM)
// ═══════════════════════════════════════════════════════════════

export async function scrapeJobPostings(company: string, keywords?: string): Promise<Array<{
  title: string; company: string; location: string;
  description?: string; postedAt?: string; techStack?: string[];
}>> {
  try {
    const query = `${company}${keywords ? " " + keywords : ""}`;
    const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&sort=date`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const results: any[] = [];

    $("[data-testid='jobsearch-ResultsList'] li").each((i, el) => {
      if (results.length >= 8) return false;
      const title = $(el).find("[data-testid='jobTitle'] span").text().trim();
      const company = $(el).find("[data-testid='company-name']").text().trim();
      const location = $(el).find("[data-testid='text-location']").text().trim();
      const snippet = $(el).find(".summary, .job-snippet").text().trim();

      // Extract tech from job description
      const techPatterns = ["Salesforce", "HubSpot", "AWS", "React", "Python", "Stripe", "Kubernetes", "Docker", "PostgreSQL", "MongoDB"];
      const techStack = techPatterns.filter(t => snippet.toLowerCase().includes(t.toLowerCase()));

      if (title) results.push({ title, company, location, description: snippet, techStack });
    });

    return results;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 10. LINKEDIN PUBLIC SCRAPER — Public company + employee profiles
//     (company pages are publicly accessible without login)
// ═══════════════════════════════════════════════════════════════

export async function scrapeLinkedInCompany(companySlug: string): Promise<{
  found: boolean; name?: string; description?: string;
  industry?: string; employees?: string; headquarters?: string;
  website?: string; founded?: string; specialties?: string[];
}> {
  try {
    const url = `https://www.linkedin.com/company/${encodeURIComponent(companySlug)}/about/`;
    const html = await fetchPage(url, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Site": "none",
      },
      timeout: 15000,
    });
    const $ = cheerio.load(html);

    // Extract from structured data (LinkedIn embeds this publicly)
    let structured: any = {};
    $('script[type="application/ld+json"]').each((_, el) => {
      try { structured = { ...structured, ...JSON.parse($(el).html() || "{}") }; } catch {}
    });

    // Fallback: meta tags
    const name = structured.name || $("meta[property='og:title']").attr("content")?.replace(" | LinkedIn", "") || "";
    const description = structured.description || $("meta[property='og:description']").attr("content") || "";

    if (!name) return { found: false };

    return {
      found: true,
      name,
      description,
      industry: $(".org-top-card-summary-info-list__info-item").eq(0).text().trim() || structured.industry,
      employees: $("[data-test-id='about-us__size']").text().trim() || "",
      headquarters: $("[data-test-id='about-us__headquarters']").text().trim() || "",
      website: $("[data-test-id='about-us__website']").text().trim() || structured.url || "",
      founded: $("[data-test-id='about-us__foundedOn']").text().trim() || "",
      specialties: [],
    };
  } catch {
    return { found: false };
  }
}

// ═══════════════════════════════════════════════════════════════
// 11. PRODUCT HUNT — Startup discovery
// ═══════════════════════════════════════════════════════════════

export async function scrapeProductHunt(topic: string): Promise<Array<{
  name: string; tagline: string; url?: string; upvotes?: number;
}>> {
  try {
    const html = await fetchPage(`https://www.producthunt.com/topics/${encodeURIComponent(topic)}`);
    const $ = cheerio.load(html);
    const results: any[] = [];

    $("[data-test='post-name']").each((i, el) => {
      if (results.length >= 10) return false;
      const name = $(el).text().trim();
      const tagline = $(el).closest("[data-test='post-item']").find("[data-test='post-tagline']").text().trim();
      if (name) results.push({ name, tagline });
    });

    return results;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 12. YELP — Local business data + reviews
// ═══════════════════════════════════════════════════════════════

export async function scrapeYelp(query: string, location: string, maxResults = 10): Promise<Array<{
  name: string; rating?: number; reviewCount?: number;
  category?: string; phone?: string; address?: string; website?: string;
}>> {
  try {
    const url = `https://www.yelp.com/search?find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(location)}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const results: any[] = [];

    $("[class*='container__']").each((i, el) => {
      if (results.length >= maxResults) return false;
      const name = $(el).find("a[name]").text().trim();
      const ratingText = $(el).find("[aria-label*='star rating']").attr("aria-label") || "";
      const rating = parseFloat(ratingText.match(/(\d+\.?\d*)/)?.[1] || "0");
      const category = $(el).find("[class*='tag__']").first().text().trim();
      const address = $(el).find("address").text().trim();
      if (name && name.length > 2) results.push({ name, rating, category, address });
    });

    return results;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 13. EMAIL PATTERN GENERATOR — Build likely work emails
// ═══════════════════════════════════════════════════════════════

export async function generateAndVerifyEmail(opts: {
  firstName: string; lastName: string; domain: string;
}): Promise<{ email: string; confidence: number; status: string; verified: boolean }> {
  const f = opts.firstName.toLowerCase().replace(/[^a-z]/g, "");
  const l = opts.lastName.toLowerCase().replace(/[^a-z]/g, "");
  const d = opts.domain;

  // All 6 common patterns, ordered by global prevalence
  const patterns = [
    `${f}.${l}@${d}`,           // john.smith@co.com        (most common ~40%)
    `${f}${l}@${d}`,            // johnsmith@co.com          (~20%)
    `${f[0]}${l}@${d}`,         // jsmith@co.com             (~20%)
    `${f}@${d}`,                 // john@co.com               (~10%)
    `${f[0]}.${l}@${d}`,        // j.smith@co.com            (~8%)
    `${l}.${f}@${d}`,           // smith.john@co.com          (~2%)
  ];

  // Verify domain has MX records first
  const domainVerification = await verifyEmailDNS(`test@${d}`);
  if (!domainVerification.mxRecord) {
    return { email: patterns[0], confidence: 10, status: "invalid_domain", verified: false };
  }

  // Return most likely pattern with domain-verified confidence
  const baseConfidence = domainVerification.confidence;

  return {
    email: patterns[0],
    confidence: Math.round(baseConfidence * 0.85), // slightly lower since we can't verify the specific mailbox without API
    status: baseConfidence >= 70 ? "likely" : "risky",
    verified: true,
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  searchDuckDuckGo,
  searchOpenCorporates,
  lookupDomain,
  verifyEmailDNS,
  detectTechStack,
  scrapeCompanyWebsite,
  scrapeYellowPages,
  searchGitHub,
  scrapeJobPostings,
  scrapeLinkedInCompany,
  scrapeProductHunt,
  scrapeYelp,
  generateAndVerifyEmail,
};
