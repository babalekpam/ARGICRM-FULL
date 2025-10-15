import type { Express } from "express";

export function registerSeoRoutes(app: Express) {
  // Dynamic sitemap generation
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = 'https://argilette.org';
    const currentDate = new Date().toISOString().split('T')[0];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

    <!-- Homepage - Highest Priority -->
    <url>
        <loc>${baseUrl}/</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>

    <!-- Landing Page -->
    <url>
        <loc>${baseUrl}/landing</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <!-- Core User Journey Pages -->
    <url>
        <loc>${baseUrl}/signup</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>

    <url>
        <loc>${baseUrl}/login</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>

    <!-- Features and Product Pages -->
    <url>
        <loc>${baseUrl}/features</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}/pricing</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>

    <!-- Content and Support Pages -->
    <url>
        <loc>${baseUrl}/about</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <url>
        <loc>${baseUrl}/contact</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <url>
        <loc>${baseUrl}/help</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>

    <url>
        <loc>${baseUrl}/blog</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.6</priority>
    </url>

    <!-- Legal and Policy Pages -->
    <url>
        <loc>${baseUrl}/privacy</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
    </url>

    <url>
        <loc>${baseUrl}/terms</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
    </url>

    <!-- Industry-specific landing pages for better SEO targeting -->
    <url>
        <loc>${baseUrl}/crm-for-small-business</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <url>
        <loc>${baseUrl}/enterprise-crm</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

    <url>
        <loc>${baseUrl}/ai-powered-crm</loc>
        <lastmod>${currentDate}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>

</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // Robots.txt endpoint
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /

# Important pages for indexing
Allow: /
Allow: /signup
Allow: /login
Allow: /features
Allow: /pricing
Allow: /about
Allow: /contact
Allow: /blog
Allow: /help

# Prevent indexing of admin and private areas
Disallow: /admin
Disallow: /dashboard
Disallow: /settings
Disallow: /api/
Disallow: /auth/
Disallow: /*?token=
Disallow: /*?verification=
Disallow: /verify-email

# Allow crawling of assets
Allow: /assets/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.svg
Allow: /*.webp

# Sitemap location
Sitemap: https://argilette.org/sitemap.xml

# Crawl delay (optional - prevents overwhelming the server)
Crawl-delay: 1`;

    res.set('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Schema.org structured data for different pages
  app.get('/api/seo/schema/:page', (req, res) => {
    const { page } = req.params;
    const baseUrl = 'https://argilette.org';
    
    const schemas: Record<string, any> = {
      homepage: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "NODE CRM",
        "description": "AI-Powered Customer Relationship Management Platform with emotional intelligence and advanced automation for global businesses",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "14-day free trial available with payment method required"
        },
        "provider": {
          "@type": "Organization",
          "name": "Argilette",
          "url": baseUrl,
          "logo": `${baseUrl}/assets/colored-logo.png`
        },
        "featureList": [
          "AI-Powered Customer Management",
          "Real-time Sentiment Analysis", 
          "Automated Workflows",
          "Sales Pipeline Management",
          "Multi-currency Support",
          "Advanced Analytics",
          "Multi-language Support (20+ languages)",
          "Global Market Coverage (195+ countries)"
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "1250",
          "bestRating": "5"
        }
      },
      
      pricing: {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "NODE CRM Plans",
        "description": "Flexible CRM pricing plans for businesses of all sizes",
        "offers": [
          {
            "@type": "Offer",
            "name": "Starter Plan",
            "price": "0",
            "priceCurrency": "USD",
            "description": "14-day free trial with basic CRM features"
          },
          {
            "@type": "Offer", 
            "name": "Professional Plan",
            "price": "29",
            "priceCurrency": "USD",
            "billingIncrement": "Month",
            "description": "Advanced CRM features with AI sentiment analysis"
          },
          {
            "@type": "Offer",
            "name": "Enterprise Plan", 
            "price": "99",
            "priceCurrency": "USD",
            "billingIncrement": "Month",
            "description": "Complete CRM solution with unlimited features"
          }
        ]
      },

      features: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "NODE CRM Features",
        "description": "Comprehensive feature set including AI-powered sentiment analysis, multi-language support, and advanced automation",
        "mainEntity": {
          "@type": "SoftwareApplication",
          "name": "NODE CRM",
          "featureList": [
            "Emotional Intelligence Hub",
            "AI-Powered Sentiment Analysis",
            "Multi-Language Support (20+ Languages)",
            "Advanced Sales Pipeline Management", 
            "Real-time Team Collaboration",
            "Multi-Currency Financial Management",
            "Advanced Analytics and Reporting",
            "Enterprise-Grade Security"
          ]
        }
      }
    };

    const schema = schemas[page];
    if (schema) {
      res.json(schema);
    } else {
      res.status(404).json({ error: 'Schema not found' });
    }
  });

  // SEO metadata API for dynamic page optimization
  app.get('/api/seo/metadata/:page', (req, res) => {
    const { page } = req.params;
    const baseUrl = 'https://argilette.org';
    
    const metadata: Record<string, any> = {
      homepage: {
        title: "NODE CRM - The World's First Emotional Intelligence CRM Platform",
        description: "Transform your business relationships with NODE CRM's AI-powered sentiment analysis, multi-language support, and advanced automation. Start your free 14-day trial today.",
        keywords: "emotional intelligence CRM, AI customer management, sentiment analysis, multi-language CRM, business automation, global CRM solution",
        ogImage: `${baseUrl}/assets/node-crm-social-preview.png`,
        canonical: baseUrl
      },
      
      features: {
        title: "NODE CRM Features - Complete AI-Powered Customer Management Solution", 
        description: "Discover NODE CRM's comprehensive feature set including AI sentiment analysis, automated workflows, multi-language support, and enterprise security. Transform customer relationships today.",
        keywords: "CRM features, AI customer management, sentiment analysis, sales pipeline, marketing automation, multi-language support, enterprise CRM",
        canonical: `${baseUrl}/features`
      },
      
      pricing: {
        title: "NODE CRM Pricing - Affordable Plans for Every Business Size",
        description: "Choose the perfect NODE CRM plan for your business. From free trials to enterprise solutions with AI-powered features and 24/7 support. Start your free trial today.",
        keywords: "CRM pricing, business software pricing, affordable CRM, enterprise CRM cost, free CRM trial, professional CRM plans",
        canonical: `${baseUrl}/pricing`
      },
      
      signup: {
        title: "Sign Up for NODE CRM - Start Your Free 14-Day Trial",
        description: "Join thousands of businesses using NODE CRM's emotional intelligence platform. Sign up for your free 14-day trial with payment method required for trial abuse prevention.",
        keywords: "CRM signup, free CRM trial, business software registration, customer management signup",
        canonical: `${baseUrl}/signup`
      }
    };

    const meta = metadata[page];
    if (meta) {
      res.json(meta);
    } else {
      res.status(404).json({ error: 'Metadata not found' });
    }
  });
}