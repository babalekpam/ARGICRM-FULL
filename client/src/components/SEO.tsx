import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: object;
}

export function SEO({
  title = "NODE CRM - AI-Powered Customer Relationship Management Platform",
  description = "Transform your business relationships with NODE CRM's intelligent customer management, automated workflows, and real-time sentiment analysis. Start your free 14-day trial today.",
  keywords = "CRM software, customer relationship management, AI CRM, business automation, sales management, lead tracking, customer analytics, enterprise CRM, small business CRM, cloud CRM",
  canonical,
  ogTitle,
  ogDescription,
  ogImage = "/assets/node-crm-social-preview.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  twitterTitle,
  twitterDescription,
  twitterImage,
  structuredData
}: SEOProps) {
  
  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.querySelector(selector) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };

    // Helper function to update or create link tags
    const updateLinkTag = (rel: string, href: string) => {
      let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', rel);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('href', href);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('author', 'Argilette');
    updateMetaTag('generator', 'NODE CRM Platform');

    // Canonical URL
    if (canonical) {
      updateLinkTag('canonical', canonical);
    }

    // Open Graph tags
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', window.location.href, true);
    updateMetaTag('og:site_name', 'NODE CRM', true);
    updateMetaTag('og:locale', 'en_US', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCard);
    updateMetaTag('twitter:title', twitterTitle || ogTitle || title);
    updateMetaTag('twitter:description', twitterDescription || ogDescription || description);
    updateMetaTag('twitter:image', twitterImage || ogImage);
    updateMetaTag('twitter:site', '@NodeCRM');
    updateMetaTag('twitter:creator', '@Argilette');

    // Additional SEO meta tags
    updateMetaTag('theme-color', '#3B82F6');
    updateMetaTag('msapplication-TileColor', '#3B82F6');
    
    // Schema.org structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      
      script.textContent = JSON.stringify(structuredData);
    }

    // Default organization schema
    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "NODE CRM",
      "description": description,
      "url": "https://argilette.org",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "14-day free trial available"
      },
      "provider": {
        "@type": "Organization",
        "name": "Argilette",
        "url": "https://argilette.org"
      },
      "featureList": [
        "AI-Powered Customer Management",
        "Real-time Sentiment Analysis",
        "Automated Workflows",
        "Sales Pipeline Management",
        "Multi-currency Support",
        "Advanced Analytics",
        "Team Collaboration",
        "Enterprise Security"
      ]
    };

    if (!structuredData) {
      let defaultScript = document.querySelector('script[data-schema="default"]') as HTMLScriptElement;
      
      if (!defaultScript) {
        defaultScript = document.createElement('script');
        defaultScript.type = 'application/ld+json';
        defaultScript.setAttribute('data-schema', 'default');
        document.head.appendChild(defaultScript);
      }
      
      defaultScript.textContent = JSON.stringify(defaultSchema);
    }

  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, twitterCard, twitterTitle, twitterDescription, twitterImage, structuredData]);

  return null; // This component doesn't render anything
}