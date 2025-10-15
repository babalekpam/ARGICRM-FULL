import type { Backlink } from "@shared/schema";

const DATAFORSEO_API_URL = "https://api.dataforseo.com/v3";

interface DataForSEOCredentials {
  login: string;
  password: string;
}

interface BacklinkItem {
  domain_from: string;
  url_from: string;
  url_to: string;
  anchor: string | null;
  backlink_spam_score: number;
  rank: number;
  page_from_rank: number;
  domain_from_rank: number;
  is_dofollow: boolean;
  first_seen: string | null;
  last_seen: string | null;
}

interface DataForSEOResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    id: string;
    status_code: number;
    status_message: string;
    result?: Array<{
      items?: BacklinkItem[];
      items_count?: number;
    }>;
  }>;
}

export class DataForSEOService {
  private credentials: DataForSEOCredentials;

  constructor(login: string, password: string) {
    this.credentials = { login, password };
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(
      `${this.credentials.login}:${this.credentials.password}`
    ).toString("base64");
    return `Basic ${credentials}`;
  }

  async fetchBacklinks(
    targetDomain: string,
    limit: number = 100
  ): Promise<{
    backlinks: BacklinkItem[];
    totalCount: number;
  }> {
    try {
      const requestBody = [
        {
          target: targetDomain,
          limit: limit,
          order_by: ["rank,desc"],
          filters: [
            ["is_new", "=", false],
          ],
        },
      ];

      const response = await fetch(`${DATAFORSEO_API_URL}/backlinks/backlinks/live`, {
        method: "POST",
        headers: {
          "Authorization": this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data: DataForSEOResponse = await response.json();

      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${data.status_message}`);
      }

      const task = data.tasks?.[0];
      if (!task || task.status_code !== 20000) {
        throw new Error(`Task error: ${task?.status_message || "Unknown error"}`);
      }

      const result = task.result?.[0];
      const backlinks = result?.items || [];
      const totalCount = result?.items_count || 0;

      return {
        backlinks,
        totalCount,
      };
    } catch (error) {
      console.error("Error fetching backlinks from DataForSEO:", error);
      throw error;
    }
  }

  async fetchSummary(
    targetDomain: string
  ): Promise<{
    totalBacklinks: number;
    referringDomains: number;
    domainRank: number;
  }> {
    try {
      const requestBody = [
        {
          target: targetDomain,
        },
      ];

      const response = await fetch(`${DATAFORSEO_API_URL}/backlinks/summary/live`, {
        method: "POST",
        headers: {
          "Authorization": this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
      }

      const data: DataForSEOResponse = await response.json();

      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${data.status_message}`);
      }

      const task = data.tasks?.[0];
      if (!task || task.status_code !== 20000) {
        throw new Error(`Task error: ${task?.status_message || "Unknown error"}`);
      }

      const result = task.result?.[0] as any;

      return {
        totalBacklinks: result?.backlinks || 0,
        referringDomains: result?.referring_domains || 0,
        domainRank: result?.rank || 0,
      };
    } catch (error) {
      console.error("Error fetching summary from DataForSEO:", error);
      throw error;
    }
  }

  transformToBacklink(item: BacklinkItem, projectId: string): Omit<Backlink, "id" | "tenantId"> {
    const today = new Date().toISOString().split('T')[0];
    const dateFound = item.first_seen ? item.first_seen.split('T')[0] : today;
    
    return {
      projectId,
      url: item.url_from,
      domainScore: Math.round(item.domain_from_rank || 0),
      anchorText: item.anchor || null,
      date: dateFound,
    };
  }
}

export function createDataForSEOService(): DataForSEOService {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error("DataForSEO credentials not configured");
  }

  return new DataForSEOService(login, password);
}
