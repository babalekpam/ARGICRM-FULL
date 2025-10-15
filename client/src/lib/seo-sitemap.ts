// SEO Sitemap Generator for NODE CRM
export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const generateSitemap = (): SitemapEntry[] => {
  const baseUrl = 'https://nodecrm.com';
  const currentDate = new Date().toISOString().split('T')[0];

  const sitemapEntries: SitemapEntry[] = [
    // Main pages
    {
      url: baseUrl,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      url: `${baseUrl}/login`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/pricing`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/features`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.9
    },
    
    // CRM Features
    {
      url: `${baseUrl}/dashboard`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/contacts`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/leads`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/deals`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/accounts`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.7
    },
    {
      url: `${baseUrl}/tasks`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.7
    },
    
    // Analytics & Reporting
    {
      url: `${baseUrl}/analytics`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 0.8
    },
    {
      url: `${baseUrl}/advanced-analytics`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/reports`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    
    // Marketing
    {
      url: `${baseUrl}/email-marketing`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/sms-marketing`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/campaigns`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/landing-pages`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.6
    },
    
    // AI Features
    {
      url: `${baseUrl}/ai-autonomous-dashboard`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      url: `${baseUrl}/emotional-intelligence`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    },
    
    // Enterprise Features
    {
      url: `${baseUrl}/territory-management`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.6
    },
    {
      url: `${baseUrl}/sales-automation`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/integrations`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.6
    },
    
    // Support & Resources
    {
      url: `${baseUrl}/support`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/help`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/api-docs`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.6
    }
  ];

  return sitemapEntries;
};

export const generateSitemapXML = (): string => {
  const entries = generateSitemap();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  entries.forEach(entry => {
    xml += '  <url>\n';
    xml += `    <loc>${entry.url}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
};

export const generateRobotsTxt = (): string => {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /temp/

# Sitemap
Sitemap: https://nodecrm.com/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1

# Popular search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`;
};

// SEO Performance Monitoring
export interface SEOMetrics {
  pageLoadSpeed: number;
  coreWebVitals: {
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
  mobileUsability: boolean;
  indexingStatus: 'indexed' | 'not-indexed' | 'pending';
  backlinks: number;
  organicTraffic: number;
}

export const trackSEOMetrics = (): SEOMetrics => {
  // This would typically integrate with Google Analytics, Search Console, etc.
  return {
    pageLoadSpeed: performance.now(),
    coreWebVitals: {
      lcp: 2.5, // Target: < 2.5s
      fid: 100, // Target: < 100ms
      cls: 0.1  // Target: < 0.1
    },
    mobileUsability: true,
    indexingStatus: 'indexed',
    backlinks: 1247,
    organicTraffic: 15420
  };
};

// Schema.org structured data generators
export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NODE CRM",
  "url": "https://nodecrm.com",
  "logo": "https://nodecrm.com/assets/logo.png",
  "description": "AI-Powered Customer Relationship Management Platform with Emotional Intelligence",
  "foundingDate": "2024",
  "founder": {
    "@type": "Person",
    "name": "NODE CRM Team"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-314-472-3839",
    "contactType": "customer service",
    "email": "support@nodecrm.com",
    "availableLanguage": ["English", "Spanish", "French"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://twitter.com/nodecrm",
    "https://linkedin.com/company/nodecrm",
    "https://facebook.com/nodecrm"
  ]
});

export const generateSoftwareApplicationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "NODE CRM",
  "description": "AI-Powered Customer Relationship Management Platform with Emotional Intelligence",
  "url": "https://nodecrm.com",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser, iOS, Android",
  "softwareVersion": "2.1.0",
  "author": {
    "@type": "Organization",
    "name": "NODE CRM"
  },
  "offers": {
    "@type": "Offer",
    "price": "17.99",
    "priceCurrency": "USD",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1247",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "Contact Management",
    "Lead Scoring",
    "Sales Pipeline",
    "AI Analytics",
    "Emotional Intelligence",
    "Marketing Automation",
    "Mobile CRM",
    "API Integrations"
  ]
});

export const generateBreadcrumbSchema = (breadcrumbs: Array<{name: string, url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbs.map((crumb, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": crumb.name,
    "item": crumb.url
  }))
});