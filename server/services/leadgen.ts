/**
 * ARGILETTE AUTONOMOUS LEAD GENERATION ENGINE
 * 
 * Orchestrates all scrapers into a full lead intelligence pipeline.
 * Zero paid APIs. Everything from public internet sources.
 * 
 * Pipeline stages:
 * 1. DISCOVER    → Find companies matching ICP via web search + directories
 * 2. ENRICH      → Pull firmographic data from website, OpenCorporates, GitHub
 * 3. CONTACTS    → AI-assisted contact discovery from company site + search
 * 4. VERIFY      → Validate emails via DNS MX records (no API)
 * 5. TECHNOGRAPH → Detect tech stack from real website HTML scanning
 * 6. INTENT      → Detect buying signals from job postings + news + reviews
 * 7. SCORE       → Multi-factor ICP scoring
 * 8. SEQUENCE    → Generate personalized outreach
 */

import { ask, askJSON, complete, isAIAvailable, getActiveProvider } from "./ai-adapter.js";
import { db } from "../db.js";
import {
  prospects, companies, intentSignals, technographics, sequences,
  type Prospect, type Company,
} from "@shared/schema-extended";
import { eq, and } from "drizzle-orm";
import {
  searchDuckDuckGo, searchOpenCorporates, lookupDomain,
  verifyEmailDNS, detectTechStack, scrapeCompanyWebsite,
  scrapeYellowPages, searchGitHub, scrapeJobPostings,
  scrapeLinkedInCompany, generateAndVerifyEmail
} from "./scraper.js";


// ═══════════════════════════════════════════════════════════════
// STAGE 1: COMPANY DISCOVERY
// ═══════════════════════════════════════════════════════════════

export async function discoverCompanies(opts: {
  tenantId: string;
  industry: string;
  location?: string;
  keywords?: string[];
  companySize?: string;
  limit?: number;
}): Promise<Company[]> {
  const limit = opts.limit || 20;
  const discovered: Company[] = [];

  // Query 1: DuckDuckGo search
  const queries = [
    `${opts.industry} companies ${opts.location || ""}`.trim(),
    `${opts.industry} startups ${opts.keywords?.join(" ") || ""}`.trim(),
    `best ${opts.industry} companies site:linkedin.com/company`,
    `${opts.industry} software company ${opts.location || ""}`.trim(),
  ];

  for (const query of queries) {
    if (discovered.length >= limit) break;

    const results = await searchDuckDuckGo(query, 10);

    for (const result of results) {
      if (discovered.length >= limit) break;

      try {
        // Extract domain from URL
        const url = new URL(result.url.startsWith("http") ? result.url : `https://${result.url}`);
        const domain = url.hostname.replace("www.", "");

        // Skip known non-company domains
        const skipDomains = ["linkedin.com", "facebook.com", "twitter.com", "youtube.com", "yelp.com",
          "yellowpages.com", "wikipedia.org", "indeed.com", "glassdoor.com", "reddit.com"];
        if (skipDomains.some(d => domain.endsWith(d))) continue;

        // Check domain is valid
        const domainInfo = await lookupDomain(domain);
        if (!domainInfo.exists) continue;

        // Scrape website for company details
        const websiteData = await scrapeCompanyWebsite(domain);

        // Save to companies DB
        const [company] = await db.insert(companies).values({
          tenantId: opts.tenantId,
          name: websiteData.name || result.title.split(/[|\-]/)[0].trim(),
          domain,
          website: `https://${domain}`,
          description: websiteData.description || result.snippet,
          hqCity: opts.location || undefined,
          industry: opts.industry,
          linkedinUrl: websiteData.socialLinks?.linkedin || undefined,
          twitterUrl: websiteData.socialLinks?.twitter || undefined,
          dataSource: "web_crawl",
          lastEnrichedAt: new Date(),
          keywords: opts.keywords || [],
        }).onConflictDoNothing().returning();

        if (company) discovered.push(company);
      } catch {
        continue;
      }
    }
  }

  // Query 2: Yellow Pages for local businesses
  if (opts.location) {
    const ypResults = await scrapeYellowPages(opts.industry, opts.location, Math.min(10, limit - discovered.length));
    for (const biz of ypResults) {
      if (discovered.length >= limit) break;
      if (!biz.name) continue;

      let domain: string | undefined;
      if (biz.website) {
        try { domain = new URL(biz.website).hostname.replace("www.", ""); } catch {}
      }

      const [company] = await db.insert(companies).values({
        tenantId: opts.tenantId,
        name: biz.name,
        domain: domain || undefined,
        website: biz.website || undefined,
        industry: opts.industry,
        hqCity: opts.location,
        dataSource: "yellow_pages",
        lastEnrichedAt: new Date(),
      }).onConflictDoNothing().returning();

      if (company) discovered.push(company);
    }
  }

  return discovered;
}

// ═══════════════════════════════════════════════════════════════
// STAGE 2: COMPANY ENRICHMENT
// ═══════════════════════════════════════════════════════════════

export async function enrichCompanyFull(company: Company): Promise<Company> {
  const updates: Partial<Company> = {};

  if (!company.domain) return company;

  // OpenCorporates — official registry data
  if (company.name) {
    const corpData = await searchOpenCorporates(company.name);
    if (corpData.length > 0) {
      const match = corpData[0];
      if (match.incorporatedAt) updates.founded = parseInt(match.incorporatedAt);
      if (match.jurisdiction) updates.hqCountry = match.jurisdiction.split("_")[0].toUpperCase();
    }
  }

  // GitHub — tech culture + stack signals
  const githubSlug = company.name?.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  if (githubSlug) {
    const github = await searchGitHub(githubSlug);
    if (github.exists && github.languages) {
      updates.techStack = [...(company.techStack || []), ...(github.languages || [])];
    }
  }

  // Tech stack from website scan
  const techStack = await detectTechStack(company.domain);
  if (techStack.length > 0) {
    const names = techStack.map(t => t.name);
    updates.techStack = [...new Set([...(updates.techStack || company.techStack || []), ...names])];
  }

  // LinkedIn (public company page)
  if (company.linkedinUrl) {
    const slug = company.linkedinUrl.split("/company/")[1]?.split("/")[0];
    if (slug) {
      const li = await scrapeLinkedInCompany(slug);
      if (li.found) {
        updates.description = updates.description || li.description;
        updates.industry = updates.industry || li.industry;
      }
    }
  }

  // Score the company
  updates.score = calculateCompanyScore({ ...company, ...updates });
  updates.lastEnrichedAt = new Date();

  const [updated] = await db.update(companies).set(updates)
    .where(eq(companies.id, company.id)).returning();

  return updated || company;
}

// ═══════════════════════════════════════════════════════════════
// STAGE 3: CONTACT DISCOVERY
// ═══════════════════════════════════════════════════════════════

export async function discoverContacts(opts: {
  tenantId: string;
  company: Company;
  targetTitles: string[];
  targetSeniorities: string[];
  count?: number;
}): Promise<Prospect[]> {
  const count = opts.count || 3;
  const discovered: Prospect[] = [];

  if (!opts.company.domain) return [];

  // Search DuckDuckGo for executives at this company
  for (const title of opts.targetTitles.slice(0, 2)) {
    if (discovered.length >= count) break;

    const queries = [
      `"${opts.company.name}" "${title}" site:linkedin.com`,
      `"${opts.company.name}" "${title}" email contact`,
    ];

    for (const query of queries) {
      if (discovered.length >= count) break;
      const results = await searchDuckDuckGo(query, 5);

      for (const result of results) {
        if (discovered.length >= count) break;

        // Use Claude to extract person info from search result snippets
        if (!isAIAvailable()) continue;

        try {
          const msg = await complete({ messages: [{
              role: "user",
              content: `Extract person info from this search result if it's about a real professional at "${opts.company.name}".
Title: ${result.title}
Snippet: ${result.snippet}
URL: ${result.url}

Return ONLY JSON or null:
{"firstName":"","lastName":"","jobTitle":"","city":"","country":""}
Return null if not a real person or not at this company.`
            }], maxTokens: 200 });

          const text = msg.trim();
          if (text === "null" || !text.startsWith("{")) continue;

          const person = JSON.parse(text);
          if (!person.firstName || !person.lastName) continue;

          // Generate and verify email
          const emailResult = await generateAndVerifyEmail({
            firstName: person.firstName,
            lastName: person.lastName,
            domain: opts.company.domain!,
          });

          const [prospect] = await db.insert(prospects).values({
            tenantId: opts.tenantId,
            companyId: opts.company.id,
            firstName: person.firstName,
            lastName: person.lastName,
            jobTitle: person.jobTitle || title,
            company: opts.company.name!,
            companyDomain: opts.company.domain,
            email: emailResult.email,
            emailStatus: emailResult.status,
            city: person.city || opts.company.hqCity,
            country: person.country || opts.company.hqCountry,
            score: 50, // will be recalculated
            intentScore: 0,
            dataSource: "web_search",
            lastEnrichedAt: new Date(),
          }).onConflictDoNothing().returning();

          if (prospect) discovered.push(prospect);
        } catch {
          continue;
        }
      }
    }
  }

  // If Claude is unavailable or found nothing — direct website scrape
  if (discovered.length === 0 && opts.company.domain) {
    const siteData = await scrapeCompanyWebsite(opts.company.domain);
    for (const member of (siteData.teamMembers || []).slice(0, count)) {
      const emailResult = await generateAndVerifyEmail({
        firstName: member.name.split(" ")[0] || "",
        lastName: member.name.split(" ").slice(1).join(" ") || "",
        domain: opts.company.domain,
      });

      const [prospect] = await db.insert(prospects).values({
        tenantId: opts.tenantId,
        companyId: opts.company.id,
        firstName: member.name.split(" ")[0] || "",
        lastName: member.name.split(" ").slice(1).join(" ") || "",
        jobTitle: member.title,
        company: opts.company.name!,
        companyDomain: opts.company.domain,
        email: member.email || emailResult.email,
        emailStatus: member.email ? "valid" : emailResult.status,
        score: 45,
        dataSource: "website_scrape",
        lastEnrichedAt: new Date(),
      }).onConflictDoNothing().returning();

      if (prospect) discovered.push(prospect);
    }
  }

  return discovered;
}

// ═══════════════════════════════════════════════════════════════
// STAGE 4: INTENT SIGNAL DETECTION
// ═══════════════════════════════════════════════════════════════

export async function detectBuyingIntent(opts: {
  tenantId: string;
  company: Company;
  targetKeywords: string[];
}): Promise<Array<{ signal: string; strength: number; type: string; description: string }>> {
  const signals: Array<{ signal: string; strength: number; type: string; description: string }> = [];

  // Signal 1: Job postings matching our keywords (strongest intent signal)
  if (opts.company.name) {
    const jobs = await scrapeJobPostings(opts.company.name, opts.targetKeywords[0]);

    for (const job of jobs) {
      const relevantKeyword = opts.targetKeywords.find(kw =>
        job.title.toLowerCase().includes(kw.toLowerCase()) ||
        job.description?.toLowerCase().includes(kw.toLowerCase())
      );

      if (relevantKeyword) {
        const signal = {
          signal: `Hiring: ${job.title}`,
          strength: 75,
          type: "job_posting",
          description: `${opts.company.name} posted "${job.title}" in ${job.location} — likely scaling team or implementing new tools`,
        };
        signals.push(signal);

        await db.insert(intentSignals).values({
          tenantId: opts.tenantId,
          companyDomain: opts.company.domain || "",
          companyName: opts.company.name,
          topic: relevantKeyword,
          signalType: "job_posting",
          strength: 75,
          description: signal.description,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        }).catch(() => {});
      }
    }
  }

  // Signal 2: Recent funding (from DuckDuckGo news search)
  if (opts.company.name) {
    const fundingResults = await searchDuckDuckGo(`"${opts.company.name}" funding raised investment 2024 2025`, 3);
    if (fundingResults.length > 0) {
      const signal = {
        signal: "Recent funding detected",
        strength: 85,
        type: "funding",
        description: `${opts.company.name} appears to have raised recent funding — high probability of expanding tech stack`,
      };
      signals.push(signal);

      await db.insert(intentSignals).values({
        tenantId: opts.tenantId,
        companyDomain: opts.company.domain || "",
        companyName: opts.company.name,
        topic: "expansion",
        signalType: "funding",
        strength: 85,
        description: signal.description,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      }).catch(() => {});
    }
  }

  // Signal 3: Tech stack signals (using competitors' tools = buying intent for alternatives)
  if (opts.company.domain) {
    const techStack = await detectTechStack(opts.company.domain);
    const competitorCRMs = techStack.filter(t =>
      ["Salesforce", "HubSpot", "Pipedrive", "Zoho CRM"].includes(t.name)
    );

    if (competitorCRMs.length > 0) {
      const signal = {
        signal: `Uses ${competitorCRMs[0].name}`,
        strength: 70,
        type: "technographic",
        description: `Currently using ${competitorCRMs[0].name} — actively using CRM solutions, switchable`,
      };
      signals.push(signal);
    }
  }

  // Signal 4: Recent news / web activity
  if (opts.company.name) {
    const newsResults = await searchDuckDuckGo(`"${opts.company.name}" news announcement 2025`, 3);
    if (newsResults.length > 0) {
      signals.push({
        signal: "Recent news activity",
        strength: 55,
        type: "news",
        description: `${opts.company.name} is active in news — growth phase company`,
      });
    }
  }

  return signals.sort((a, b) => b.strength - a.strength);
}

// ═══════════════════════════════════════════════════════════════
// STAGE 5: MULTI-FACTOR SCORING
// ═══════════════════════════════════════════════════════════════

function calculateCompanyScore(company: Partial<Company>): number {
  let score = 20;
  // Size
  const sizeMap: Record<string, number> = { "1-10": 8, "11-50": 15, "51-200": 22, "201-500": 25, "500-1000": 20, "1000+": 15 };
  score += sizeMap[company.size || ""] || 10;
  // Has website
  if (company.domain) score += 10;
  // Has LinkedIn
  if (company.linkedinUrl) score += 8;
  // Has description
  if (company.description) score += 5;
  // Has tech stack (means they invest in tools)
  if ((company.techStack || []).length > 2) score += 12;
  return Math.min(100, score);
}

export function scoreProspect(prospect: Partial<Prospect>, intentSignals: Array<{ strength: number }> = []): number {
  let score = 20;

  // Seniority map
  const seniorityMap: Record<string, number> = { "c-suite": 25, "ceo": 25, "cto": 23, "coo": 23, "cmo": 22, "vp": 20, "director": 16, "head": 16, "manager": 10, "senior": 8 };
  const titleLower = (prospect.jobTitle || "").toLowerCase();
  const seniorityBonus = Object.entries(seniorityMap).find(([k]) => titleLower.includes(k))?.[1] || 5;
  score += seniorityBonus;

  // Email quality
  const emailStatus = prospect.emailStatus;
  if (emailStatus === "valid") score += 15;
  else if (emailStatus === "likely") score += 10;
  else if (emailStatus === "risky") score += 3;

  // LinkedIn
  if (prospect.linkedinUrl) score += 8;

  // Phone
  if (prospect.directPhone || prospect.phone) score += 7;

  // Intent signal boost
  const maxIntentStrength = Math.max(0, ...intentSignals.map(s => s.strength));
  score += Math.round(maxIntentStrength * 0.1);

  return Math.min(100, Math.round(score));
}

// ═══════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR — Full autonomous pipeline
// ═══════════════════════════════════════════════════════════════

export async function runAutonomousLeadGen(opts: {
  tenantId: string;
  targetIndustry: string;
  targetTitles: string[];
  targetSeniorities: string[];
  targetLocation?: string;
  companySize?: string;
  keywords?: string[];
  targetCount?: number;
  enrichmentDepth?: "fast" | "standard" | "deep";
}): Promise<{
  companies: number;
  prospects: number;
  intentSignals: number;
  techFindings: number;
  emailsVerified: number;
  jobId: string;
}> {
  const jobId = `lg-${Date.now()}`;
  const targetCount = opts.targetCount || 10;
  let totalProspects = 0;
  let totalIntentSignals = 0;
  let totalTechFindings = 0;
  let totalEmailsVerified = 0;

  console.log(`[LeadGen ${jobId}] Starting: ${opts.targetIndustry} / ${opts.targetTitles.join(", ")}`);

  // STAGE 1: Discover companies
  const discoveredCompanies = await discoverCompanies({
    tenantId: opts.tenantId,
    industry: opts.targetIndustry,
    location: opts.targetLocation,
    keywords: opts.keywords,
    companySize: opts.companySize,
    limit: Math.ceil(targetCount / 2), // aim for ~2 prospects per company
  });

  console.log(`[LeadGen ${jobId}] Discovered ${discoveredCompanies.length} companies`);

  // STAGE 2-6: Enrich each company and find contacts
  for (const company of discoveredCompanies) {
    if (totalProspects >= targetCount) break;

    console.log(`[LeadGen ${jobId}] Enriching: ${company.name}`);

    // Enrich (skip deep enrichment for fast mode)
    let enrichedCompany = company;
    if (opts.enrichmentDepth !== "fast") {
      enrichedCompany = await enrichCompanyFull(company);

      // Detect tech stack
      if (company.domain) {
        const tech = await detectTechStack(company.domain);
        if (tech.length > 0) {
          totalTechFindings += tech.length;
          for (const t of tech) {
            await db.insert(technographics).values({
              tenantId: opts.tenantId,
              companyId: company.id,
              companyDomain: company.domain,
              technology: t.name,
              category: t.category,
              confidence: t.confidence,
            }).catch(() => {});
          }
        }
      }
    }

    // Discover contacts
    const contacts = await discoverContacts({
      tenantId: opts.tenantId,
      company: enrichedCompany,
      targetTitles: opts.targetTitles,
      targetSeniorities: opts.targetSeniorities,
      count: 2,
    });

    // Count verified emails
    totalEmailsVerified += contacts.filter(c => c.emailStatus === "valid" || c.emailStatus === "likely").length;

    // Detect intent signals (only in deep mode to save time)
    let signals: Array<{ strength: number }> = [];
    if (opts.enrichmentDepth === "deep") {
      const detected = await detectBuyingIntent({
        tenantId: opts.tenantId,
        company: enrichedCompany,
        targetKeywords: [...(opts.keywords || []), opts.targetIndustry],
      });
      signals = detected;
      totalIntentSignals += detected.length;
    }

    // Score and update each prospect
    for (const prospect of contacts) {
      const updatedScore = scoreProspect(prospect, signals);
      await db.update(prospects).set({ score: updatedScore, intentScore: Math.max(0, ...signals.map(s => s.strength)) })
        .where(eq(prospects.id, prospect.id)).catch(() => {});
      totalProspects++;
    }
  }

  console.log(`[LeadGen ${jobId}] Complete: ${totalProspects} prospects, ${totalIntentSignals} signals, ${totalEmailsVerified} verified emails`);

  return {
    companies: discoveredCompanies.length,
    prospects: totalProspects,
    intentSignals: totalIntentSignals,
    techFindings: totalTechFindings,
    emailsVerified: totalEmailsVerified,
    jobId,
  };
}
