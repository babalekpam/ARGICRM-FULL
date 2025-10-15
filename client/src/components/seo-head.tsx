import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  siteName?: string;
  locale?: string;
  structuredData?: object;
}

export default function SEOHead({
  title = "NODE CRM - AI-Powered Customer Relationship Management Platform",
  description = "Transform your business with NODE CRM's AI-powered emotional intelligence platform. Advanced CRM features, automated workflows, and comprehensive customer insights for enterprise success.",
  keywords = [
    "CRM software",
    "customer relationship management",
    "AI CRM",
    "emotional intelligence CRM",
    "business automation",
    "sales management",
    "customer analytics",
    "enterprise CRM",
    "lead management",
    "contact management"
  ],
  author = "NODE CRM Team",
  url = "https://nodecrm.com",
  image = "/assets/node-crm-og-image.jpg",
  type = "website",
  siteName = "NODE CRM",
  locale = "en_US",
  structuredData
}: SEOHeadProps) {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', author);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('language', locale);
    updateMetaTag('google-site-verification', 'vFsS5vsnFfymGEUv_IqspLYQ5ZMKh-CbnUccNqV0Ulk');
    updateMetaTag('google-site-verification', 'google9c7323ee98d28ee4');

    // Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:site_name', siteName, 'property');
    updateMetaTag('og:locale', locale, 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:site', '@nodecrm');
    updateMetaTag('twitter:creator', '@nodecrm');

    // Additional SEO tags
    updateMetaTag('theme-color', '#8B5CF6');
    updateMetaTag('msapplication-TileColor', '#8B5CF6');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    updateMetaTag('apple-mobile-web-app-title', siteName);

    // Canonical URL
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.rel = 'canonical';
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.href = url;

    // Structured data (JSON-LD)
    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    }

    // Preconnect to external domains for performance
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.openai.com',
      'https://api.anthropic.com'
    ];

    preconnectDomains.forEach(domain => {
      let linkElement = document.querySelector(`link[href="${domain}"]`) as HTMLLinkElement;
      if (!linkElement) {
        linkElement = document.createElement('link');
        linkElement.rel = 'preconnect';
        linkElement.href = domain;
        linkElement.crossOrigin = 'anonymous';
        document.head.appendChild(linkElement);
      }
    });

  }, [title, description, keywords, author, url, image, type, siteName, locale, structuredData]);

  return null; // This component only manipulates the document head
}

// SEO utility functions
export const generatePageSEO = (pageType: string, pageData?: any) => {
  const baseUrl = "https://nodecrm.com";
  
  const seoConfigs = {
    dashboard: {
      title: "Dashboard - NODE CRM | AI-Powered Business Intelligence",
      description: "Access your AI-powered CRM dashboard with real-time analytics, emotional intelligence insights, and comprehensive business metrics.",
      keywords: ["CRM dashboard", "business intelligence", "AI analytics", "customer insights"],
      url: `${baseUrl}/dashboard`
    },
    contacts: {
      title: "Contact Management - NODE CRM | Smart Customer Database",
      description: "Manage your contacts with AI-powered insights, emotional profiling, and intelligent relationship tracking in NODE CRM.",
      keywords: ["contact management", "customer database", "CRM contacts", "relationship tracking"],
      url: `${baseUrl}/contacts`
    },
    leads: {
      title: "Lead Management - NODE CRM | AI-Powered Lead Scoring",
      description: "Convert more leads with AI-powered lead scoring, automated nurturing, and intelligent qualification in NODE CRM.",
      keywords: ["lead management", "lead scoring", "sales leads", "lead conversion"],
      url: `${baseUrl}/leads`
    },
    deals: {
      title: "Deal Pipeline - NODE CRM | Sales Opportunity Management",
      description: "Track and close more deals with AI-powered pipeline management, predictive analytics, and automated workflows.",
      keywords: ["deal management", "sales pipeline", "opportunity tracking", "sales automation"],
      url: `${baseUrl}/deals`
    },
    analytics: {
      title: "Advanced Analytics - NODE CRM | AI Business Intelligence",
      description: "Unlock business insights with advanced analytics, predictive modeling, and emotional intelligence reporting.",
      keywords: ["business analytics", "CRM reporting", "predictive analytics", "business intelligence"],
      url: `${baseUrl}/analytics`
    },
    landing: {
      title: "NODE CRM - AI-Powered Emotional Intelligence CRM Platform",
      description: "The world's first emotional intelligence CRM. Transform customer relationships with AI-powered insights, automated workflows, and predictive analytics.",
      keywords: ["emotional intelligence CRM", "AI CRM platform", "customer relationship management", "business automation"],
      url: baseUrl
    }
  };

  return seoConfigs[pageType as keyof typeof seoConfigs] || seoConfigs.landing;
};

export const generateStructuredData = (type: string, data?: any) => {
  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NODE CRM",
    "description": "AI-Powered Customer Relationship Management Platform with Emotional Intelligence",
    "url": "https://nodecrm.com",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "17.99",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1247",
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@type": "Organization",
      "name": "NODE CRM Team",
      "url": "https://nodecrm.com"
    }
  };

  const typeSpecificData = {
    organization: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "NODE CRM",
      "url": "https://nodecrm.com",
      "logo": "https://nodecrm.com/assets/logo.png",
      "description": "Leading provider of AI-powered CRM solutions with emotional intelligence",
      "foundingDate": "2024",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+1-314-472-3839",
        "contactType": "customer service",
        "email": "support@nodecrm.com"
      }
    },
    product: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "NODE CRM Platform",
      "description": "Complete CRM solution with AI-powered emotional intelligence",
      "brand": {
        "@type": "Brand",
        "name": "NODE CRM"
      },
      "offers": {
        "@type": "Offer",
        "price": "17.99",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    }
  };

  return typeSpecificData[type as keyof typeof typeSpecificData] || baseStructuredData;
};