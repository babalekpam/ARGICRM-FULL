// Analytics Configuration
// Replace with your actual tracking IDs before deployment

export const ANALYTICS_CONFIG = {
  // Google Analytics & Ads
  googleAdsId: process.env.VITE_GOOGLE_ADS_ID || 'AW-XXXXXXXXX',
  ga4Id: process.env.VITE_GA4_ID || 'G-XXXXXXXXX',
  
  // Meta/Facebook
  metaPixelId: process.env.VITE_META_PIXEL_ID || 'XXXXXXXXXXXXXXX',
  
  // LinkedIn
  linkedinPartnerId: process.env.VITE_LINKEDIN_PARTNER_ID || 'XXXXXXX',
  linkedinConversionId: process.env.VITE_LINKEDIN_CONVERSION_ID || 'XXXXXXX',
  
  // B2B CRM Platform Configuration
  platform: {
    name: 'NODE CRM',
    domain: 'argilette.org',
    serviceType: 'all_in_one_crm_platform',
    targetAudience: 'business_owners_managers'
  },

  // Conversion Values (in USD)
  conversionValues: {
    trial_signup: 50,
    demo_request: 200,
    consultation_request: 300,
    paid_signup_professional: 200,
    paid_signup_enterprise: 500,
    enterprise_inquiry: 1000
  },

  // High-intent pages for enhanced tracking
  highIntentPages: [
    '/pricing',
    '/demo', 
    '/trial',
    '/signup',
    '/features',
    '/contact',
    '/get-started',
    '/consultation-booking',
    '/request-demo'
  ],

  // Business targeting keywords
  businessKeywords: {
    small_business: ['small business', 'startup', 'entrepreneur', 'freelance', 'solo', '1-10 employees'],
    medium_business: ['medium business', 'growing company', '10-50 employees', 'scale', 'expand'],
    enterprise: ['enterprise', 'corporation', '50+ employees', 'large company', 'organization']
  },

  // Industry targeting keywords  
  industryKeywords: {
    real_estate: ['real estate', 'realtor', 'property', 'mortgage', 'broker'],
    healthcare: ['healthcare', 'medical', 'dental', 'clinic', 'physician'],
    professional_services: ['consulting', 'legal', 'accounting', 'agency', 'services'],
    ecommerce: ['ecommerce', 'online store', 'retail', 'shopify', 'amazon'],
    technology: ['tech', 'software', 'saas', 'app', 'development']
  },

  // CRM need assessment keywords
  crmKeywords: [
    'crm', 'customer management', 'sales pipeline', 'lead tracking',
    'contact management', 'sales automation', 'customer database'
  ],

  urgencyKeywords: [
    'need now', 'urgent', 'asap', 'immediately', 'today',
    'frustrated with current', 'looking for new', 'switching from'
  ]
};

export default ANALYTICS_CONFIG;