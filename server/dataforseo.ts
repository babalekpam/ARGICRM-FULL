import type { Backlink } from "@shared/schema";

const DATAFORSEO_API_URL = "https://api.dataforseo.com/v3";

// Business Listings types
interface BusinessListingItem {
  title: string;
  domain?: string;
  url?: string;
  phone?: string;
  address?: string;
  address_info?: {
    city?: string;
    region?: string;
    country_code?: string;
    zip?: string;
  };
  category?: string;
  additional_categories?: string[];
  description?: string;
  rating?: {
    value?: number;
    votes_count?: number;
  };
  work_time?: any;
  attributes?: any;
}

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

  // Fetch business listings from DataForSEO using Google Maps SERP
  async fetchBusinessListings(
    keyword: string,
    location: string = "United States",
    limit: number = 20
  ): Promise<{
    businesses: BusinessListingItem[];
    totalCount: number;
  }> {
    try {
      // Use Google Maps SERP API which is more reliable for business searches
      // Location code 2840 = United States
      let locationCode = 2840;
      
      // Map common location names to codes
      const locationMap: Record<string, number> = {
        'united states': 2840,
        'usa': 2840,
        'california': 21137,
        'new york': 21167,
        'texas': 21176,
        'florida': 21139,
        'illinois': 21146,
        'uk': 2826,
        'united kingdom': 2826,
        'canada': 2124,
        'australia': 2036,
        'germany': 2276,
        'france': 2250,
      };
      
      const normalizedLocation = location.toLowerCase().trim();
      if (locationMap[normalizedLocation]) {
        locationCode = locationMap[normalizedLocation];
      }

      const requestBody = [
        {
          keyword: keyword,
          location_code: locationCode,
          language_code: "en",
          depth: Math.min(limit, 20),
        },
      ];

      const response = await fetch(`${DATAFORSEO_API_URL}/serp/google/maps/live/advanced`, {
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

      const data = await response.json();

      if (data.status_code !== 20000) {
        throw new Error(`DataForSEO error: ${data.status_message}`);
      }

      const task = data.tasks?.[0];
      if (!task || task.status_code !== 20000) {
        throw new Error(`Task error: ${task?.status_message || "Unknown error"}`);
      }

      // Extract business listings from SERP result
      const result = task.result?.[0];
      const items = result?.items || [];
      
      // The items array contains business listings directly with type 'maps_search'
      const businesses: BusinessListingItem[] = [];
      for (const item of items) {
        if (item.type === 'maps_search') {
          businesses.push({
            title: item.title || '',
            domain: item.domain || '',
            url: item.url || '',
            phone: item.phone || '',
            address: item.address || '',
            address_info: {
              city: item.address_info?.city || '',
              region: item.address_info?.region || '',
              country_code: item.address_info?.country_code || 'US',
            },
            category: item.category || '',
            rating: item.rating ? { value: item.rating.value, votes_count: item.rating.votes_count } : undefined,
          });
        }
      }

      return {
        businesses: businesses.slice(0, limit),
        totalCount: businesses.length,
      };
    } catch (error) {
      console.error("Error fetching business listings from DataForSEO:", error);
      throw error;
    }
  }

  // Transform business listing to prospect format
  transformToProspect(item: BusinessListingItem, tenantId: string): any {
    // Determine industry from category
    const category = item.category || '';
    let industry = 'Other';
    let department = 'operations';
    
    if (category.toLowerCase().includes('software') || category.toLowerCase().includes('technology')) {
      industry = 'Technology';
      department = 'engineering';
    } else if (category.toLowerCase().includes('marketing') || category.toLowerCase().includes('advertising')) {
      industry = 'Marketing';
      department = 'marketing';
    } else if (category.toLowerCase().includes('financial') || category.toLowerCase().includes('bank')) {
      industry = 'Finance';
      department = 'finance';
    } else if (category.toLowerCase().includes('health') || category.toLowerCase().includes('medical')) {
      industry = 'Healthcare';
    } else if (category.toLowerCase().includes('retail') || category.toLowerCase().includes('shop')) {
      industry = 'Retail';
      department = 'sales';
    } else if (category.toLowerCase().includes('real estate')) {
      industry = 'Real Estate';
      department = 'sales';
    } else if (category.toLowerCase().includes('restaurant') || category.toLowerCase().includes('food')) {
      industry = 'Food & Beverage';
    } else if (category.toLowerCase().includes('construction')) {
      industry = 'Construction';
    } else if (category.toLowerCase().includes('legal') || category.toLowerCase().includes('lawyer')) {
      industry = 'Legal';
      department = 'legal';
    } else if (category.toLowerCase().includes('education') || category.toLowerCase().includes('school')) {
      industry = 'Education';
    }

    return {
      tenantId,
      companyName: item.title || 'Unknown Company',
      companyDomain: item.domain || null,
      phone: item.phone || null,
      city: item.address_info?.city || null,
      state: item.address_info?.region || null,
      country: item.address_info?.country_code || 'US',
      industry,
      department,
      seniority: 'manager',
      title: 'Business Contact',
      fullName: item.title || 'Unknown',
      firstName: item.title?.split(' ')[0] || 'Business',
      lastName: 'Contact',
      importedToCrm: false,
      emailVerified: false,
      leadScore: Math.round((item.rating?.value || 3) * 20),
      intentScore: Math.round((item.rating?.votes_count || 0) / 10),
      dataSource: 'dataforseo',
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
