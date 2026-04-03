/**
 * ARGILETTE SEO CRAWLER
 * Fetches real pages, parses HTML with cheerio, and returns structured findings.
 */

import axios from "axios";
import * as cheerio from "cheerio";

const CRAWL_TIMEOUT = 10_000; // ms per page
const MAX_PAGES    = 12;      // pages to crawl (sitemap + fallback links)
const USER_AGENT   = "ArgiletteSEOBot/1.0 (+https://argilette.org/bot)";

interface PageResult {
  url: string;
  status: number;
  loadMs: number;
  title?: string;
  metaDescription?: string;
  h1s: string[];
  canonical?: string;
  imagesTotal: number;
  imagesMissingAlt: number;
  hasSchemaMarkup: boolean;
  hasViewportMeta: boolean;
  internalLinks: string[];
  isHttps: boolean;
}

interface CrawlReport {
  domain: string;
  pagesChecked: number;
  pages: PageResult[];
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  issues: AuditIssue[];
  score: number;
  summary: { critical: number; warnings: number; passed: number; totalPages: number };
}

export interface AuditIssue {
  type: string;
  severity: "critical" | "warning" | "passed";
  description: string;
  count: number;
  urls: string[];
  recommendation?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function normalise(domain: string): string {
  let d = domain.trim().toLowerCase().replace(/\/$/, "");
  if (!d.startsWith("http")) d = "https://" + d;
  return d;
}

async function fetchPage(url: string): Promise<{ html: string; status: number; loadMs: number } | null> {
  const t0 = Date.now();
  try {
    const res = await axios.get(url, {
      timeout: CRAWL_TIMEOUT,
      maxRedirects: 5,
      headers: { "User-Agent": USER_AGENT, "Accept": "text/html" },
      validateStatus: () => true,           // never throw on 4xx/5xx
    });
    return { html: typeof res.data === "string" ? res.data : JSON.stringify(res.data), status: res.status, loadMs: Date.now() - t0 };
  } catch {
    return null;
  }
}

async function checkExists(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, { timeout: 6000, headers: { "User-Agent": USER_AGENT }, validateStatus: () => true });
    return res.status < 400;
  } catch { return false; }
}

function parsePage(url: string, html: string, status: number, loadMs: number): PageResult {
  const $ = cheerio.load(html);
  const base = new URL(url);

  const title       = $("title").first().text().trim() || undefined;
  const metaDesc    = $('meta[name="description"]').attr("content")?.trim() || undefined;
  const canonical   = $('link[rel="canonical"]').attr("href")?.trim() || undefined;
  const h1s         = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const hasSchema   = $('script[type="application/ld+json"]').length > 0;
  const hasViewport = $('meta[name="viewport"]').length > 0;

  // Images
  const imgs = $("img");
  const imagesMissingAlt = imgs.filter((_, el) => !$(el).attr("alt")?.trim()).length;

  // Internal links (same origin, path only)
  const internalLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    try {
      const resolved = new URL(href, url);
      if (resolved.hostname === base.hostname && resolved.pathname !== base.pathname) {
        const clean = resolved.origin + resolved.pathname;
        if (!internalLinks.includes(clean) && internalLinks.length < 30) {
          internalLinks.push(clean);
        }
      }
    } catch { /* relative or invalid */ }
  });

  return {
    url,
    status,
    loadMs,
    title,
    metaDescription: metaDesc,
    h1s,
    canonical,
    imagesTotal: imgs.length,
    imagesMissingAlt,
    hasSchemaMarkup: hasSchema,
    hasViewportMeta: hasViewport,
    internalLinks,
    isHttps: url.startsWith("https://"),
  };
}

async function getSitemapUrls(base: string): Promise<string[]> {
  const candidates = [`${base}/sitemap.xml`, `${base}/sitemap_index.xml`, `${base}/sitemap`];
  for (const url of candidates) {
    try {
      const res = await axios.get(url, { timeout: 8000, headers: { "User-Agent": USER_AGENT }, validateStatus: () => true });
      if (res.status === 200 && typeof res.data === "string") {
        const $ = cheerio.load(res.data, { xmlMode: true });
        const locs: string[] = [];
        $("loc").each((_, el) => {
          const u = $(el).text().trim();
          if (u.startsWith("http") && !u.endsWith(".xml")) locs.push(u);
        });
        if (locs.length > 0) return locs.slice(0, MAX_PAGES);
      }
    } catch { /* try next */ }
  }
  return [];
}

// ─── Main crawl entry point ──────────────────────────────────────────────────

export async function crawlDomain(rawDomain: string): Promise<CrawlReport> {
  const base = normalise(rawDomain);
  const domain = rawDomain.replace(/^https?:\/\//, "").split("/")[0];

  // 1. Check robots.txt + sitemap
  const [robotsTxtFound, sitemapFound] = await Promise.all([
    checkExists(`${base}/robots.txt`),
    checkExists(`${base}/sitemap.xml`),
  ]);

  // 2. Collect URLs to crawl
  let urls: string[] = await getSitemapUrls(base);

  // Ensure homepage is always first
  if (!urls.includes(base) && !urls.includes(base + "/")) urls.unshift(base);

  // If sitemap empty, crawl homepage and extract links
  if (urls.length <= 1) {
    const home = await fetchPage(base);
    if (home) {
      const $ = cheerio.load(home.html);
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        try {
          const resolved = new URL(href, base);
          if (resolved.hostname === new URL(base).hostname) {
            const clean = resolved.origin + resolved.pathname;
            if (!urls.includes(clean) && urls.length < MAX_PAGES) urls.push(clean);
          }
        } catch { /* skip */ }
      });
    }
  }

  urls = Array.from(new Set(urls)).slice(0, MAX_PAGES);

  // 3. Crawl pages in parallel (4 at a time)
  const pages: PageResult[] = [];
  for (let i = 0; i < urls.length; i += 4) {
    const batch = urls.slice(i, i + 4);
    const results = await Promise.all(batch.map(async (url) => {
      const fetched = await fetchPage(url);
      if (!fetched) return null;
      return parsePage(url, fetched.html, fetched.status, fetched.loadMs);
    }));
    for (const r of results) if (r) pages.push(r);
  }

  if (pages.length === 0) {
    return {
      domain, pagesChecked: 0, pages: [], robotsTxtFound, sitemapFound,
      issues: [{ type: "unreachable", severity: "critical", description: `Could not reach ${base}. Check the domain is correct and publicly accessible.`, count: 1, urls: [base] }],
      score: 0,
      summary: { critical: 1, warnings: 0, passed: 0, totalPages: 0 },
    };
  }

  // 4. Analyse findings
  const issues: AuditIssue[] = [];
  const livePaths = pages.map(p => p.url.replace(base, "") || "/");

  // — Meta descriptions
  const missingMeta = pages.filter(p => p.status === 200 && !p.metaDescription);
  const shortMeta   = pages.filter(p => p.status === 200 && p.metaDescription && p.metaDescription.length < 50);
  const longMeta    = pages.filter(p => p.status === 200 && p.metaDescription && p.metaDescription.length > 160);
  if (missingMeta.length) issues.push({ type: "missing_meta_description", severity: "critical", description: `${missingMeta.length} page(s) missing meta description`, count: missingMeta.length, urls: missingMeta.map(p => p.url.replace(base, "") || "/"), recommendation: "Add a unique meta description (50–160 chars) to every page." });
  if (shortMeta.length) issues.push({ type: "short_meta_description", severity: "warning", description: `${shortMeta.length} page(s) have meta description shorter than 50 characters`, count: shortMeta.length, urls: shortMeta.map(p => p.url.replace(base, "") || "/"), recommendation: "Expand meta descriptions to 50–160 characters." });
  if (longMeta.length) issues.push({ type: "long_meta_description", severity: "warning", description: `${longMeta.length} page(s) have meta description over 160 characters (will be truncated in SERPs)`, count: longMeta.length, urls: longMeta.map(p => p.url.replace(base, "") || "/"), recommendation: "Shorten meta descriptions to under 160 characters." });

  // — Title tags
  const missingTitle = pages.filter(p => p.status === 200 && !p.title);
  const shortTitle   = pages.filter(p => p.status === 200 && p.title && p.title.length < 30);
  const longTitle    = pages.filter(p => p.status === 200 && p.title && p.title.length > 60);
  const titleCounts  = new Map<string, number>();
  pages.forEach(p => { if (p.title) titleCounts.set(p.title, (titleCounts.get(p.title) || 0) + 1); });
  const dupeTitles   = pages.filter(p => p.title && (titleCounts.get(p.title) || 0) > 1);
  if (missingTitle.length) issues.push({ type: "missing_title_tag", severity: "critical", description: `${missingTitle.length} page(s) missing title tag`, count: missingTitle.length, urls: missingTitle.map(p => p.url.replace(base, "") || "/"), recommendation: "Every page needs a unique, descriptive title tag (30–60 chars)." });
  if (dupeTitles.length) issues.push({ type: "duplicate_title_tags", severity: "critical", description: `${dupeTitles.length} page(s) share duplicate title tags`, count: dupeTitles.length, urls: dupeTitles.map(p => p.url.replace(base, "") || "/"), recommendation: "Each page must have a unique title tag." });
  if (shortTitle.length) issues.push({ type: "short_title_tag", severity: "warning", description: `${shortTitle.length} page(s) have titles under 30 characters`, count: shortTitle.length, urls: shortTitle.map(p => p.url.replace(base, "") || "/") });
  if (longTitle.length) issues.push({ type: "long_title_tag", severity: "warning", description: `${longTitle.length} page(s) have titles over 60 characters (truncated in SERPs)`, count: longTitle.length, urls: longTitle.map(p => p.url.replace(base, "") || "/") });

  // — H1 tags
  const missingH1 = pages.filter(p => p.status === 200 && p.h1s.length === 0);
  const multipleH1 = pages.filter(p => p.status === 200 && p.h1s.length > 1);
  if (missingH1.length) issues.push({ type: "missing_h1", severity: "critical", description: `${missingH1.length} page(s) missing H1 tag`, count: missingH1.length, urls: missingH1.map(p => p.url.replace(base, "") || "/"), recommendation: "Add exactly one H1 tag per page that describes the page topic." });
  if (multipleH1.length) issues.push({ type: "multiple_h1", severity: "warning", description: `${multipleH1.length} page(s) have more than one H1 tag`, count: multipleH1.length, urls: multipleH1.map(p => p.url.replace(base, "") || "/"), recommendation: "Use only one H1 per page. Use H2–H6 for sub-sections." });

  // — Images alt text
  const totalMissingAlt = pages.reduce((n, p) => n + p.imagesMissingAlt, 0);
  const pagesWithMissingAlt = pages.filter(p => p.imagesMissingAlt > 0);
  if (totalMissingAlt > 0) issues.push({ type: "missing_alt_text", severity: "warning", description: `${totalMissingAlt} image(s) missing alt text across ${pagesWithMissingAlt.length} page(s)`, count: totalMissingAlt, urls: pagesWithMissingAlt.map(p => p.url.replace(base, "") || "/"), recommendation: "Add descriptive alt attributes to all images for accessibility and image SEO." });

  // — Canonical tags
  const missingCanonical = pages.filter(p => p.status === 200 && !p.canonical);
  if (missingCanonical.length) issues.push({ type: "missing_canonical", severity: "warning", description: `${missingCanonical.length} page(s) missing canonical tag`, count: missingCanonical.length, urls: missingCanonical.map(p => p.url.replace(base, "") || "/"), recommendation: "Add <link rel='canonical'> to prevent duplicate content issues." });

  // — Schema markup
  const missingSchema = pages.filter(p => p.status === 200 && !p.hasSchemaMarkup);
  if (missingSchema.length) issues.push({ type: "missing_schema_markup", severity: "warning", description: `${missingSchema.length} page(s) missing structured data (JSON-LD)`, count: missingSchema.length, urls: missingSchema.map(p => p.url.replace(base, "") || "/"), recommendation: "Add JSON-LD structured data to help search engines understand your content." });

  // — Mobile viewport
  const missingViewport = pages.filter(p => p.status === 200 && !p.hasViewportMeta);
  if (missingViewport.length) issues.push({ type: "missing_viewport_meta", severity: "critical", description: `${missingViewport.length} page(s) missing mobile viewport meta tag`, count: missingViewport.length, urls: missingViewport.map(p => p.url.replace(base, "") || "/"), recommendation: `Add <meta name="viewport" content="width=device-width, initial-scale=1"> to all pages.` });

  // — Page speed (slow pages = >3s)
  const slowPages = pages.filter(p => p.status === 200 && p.loadMs > 3000);
  if (slowPages.length) issues.push({ type: "slow_page_speed", severity: "warning", description: `${slowPages.length} page(s) took over 3 seconds to respond`, count: slowPages.length, urls: slowPages.map(p => `${p.url.replace(base, "") || "/"} (${(p.loadMs / 1000).toFixed(1)}s)`), recommendation: "Optimise server response time, use caching, and compress images." });

  // — Broken pages (4xx/5xx)
  const brokenPages = pages.filter(p => p.status >= 400);
  if (brokenPages.length) issues.push({ type: "broken_pages", severity: "critical", description: `${brokenPages.length} page(s) returned error status codes`, count: brokenPages.length, urls: brokenPages.map(p => `${p.url.replace(base, "") || "/"} (${p.status})`), recommendation: "Fix or redirect broken pages to avoid crawl errors and link equity loss." });

  // — Robots.txt
  if (!robotsTxtFound) issues.push({ type: "missing_robots_txt", severity: "warning", description: "robots.txt not found", count: 1, urls: [`${base}/robots.txt`], recommendation: "Create a robots.txt to guide search engine crawlers." });

  // — Sitemap
  if (!sitemapFound) issues.push({ type: "missing_sitemap", severity: "warning", description: "XML sitemap not found at /sitemap.xml", count: 1, urls: [`${base}/sitemap.xml`], recommendation: "Create and submit an XML sitemap to Google Search Console." });

  // — HTTPS
  const httpPages = pages.filter(p => !p.isHttps);
  if (httpPages.length) issues.push({ type: "non_https", severity: "critical", description: `${httpPages.length} page(s) served over HTTP (not HTTPS)`, count: httpPages.length, urls: httpPages.map(p => p.url), recommendation: "Install an SSL certificate and redirect all HTTP traffic to HTTPS." });

  // — Passed checks (for summary count)
  const passed: string[] = [];
  if (!missingMeta.length && !shortMeta.length) passed.push("meta_descriptions");
  if (!missingTitle.length && !dupeTitles.length) passed.push("title_tags");
  if (!missingH1.length && !multipleH1.length) passed.push("h1_tags");
  if (totalMissingAlt === 0) passed.push("alt_text");
  if (!missingCanonical.length) passed.push("canonical_tags");
  if (!missingSchema.length) passed.push("schema_markup");
  if (!missingViewport.length) passed.push("viewport_meta");
  if (!slowPages.length) passed.push("page_speed");
  if (!brokenPages.length) passed.push("no_broken_pages");
  if (robotsTxtFound) passed.push("robots_txt");
  if (sitemapFound) passed.push("sitemap");
  if (!httpPages.length) passed.push("https");

  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const warningCount  = issues.filter(i => i.severity === "warning").length;

  // Score: start at 100, deduct for issues (critical -10, warning -4), min 0
  const score = Math.max(0, 100 - (criticalCount * 10) - (warningCount * 4));

  return {
    domain,
    pagesChecked: pages.length,
    pages,
    robotsTxtFound,
    sitemapFound,
    issues,
    score,
    summary: {
      critical: criticalCount,
      warnings: warningCount,
      passed: passed.length,
      totalPages: pages.length,
    },
  };
}
