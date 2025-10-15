import { useEffect } from 'react';

// Tracking configuration - replace with actual IDs
const TRACKING_CONFIG = {
  googleAdsId: 'AW-XXXXXXXXX', // Replace with actual Google Ads ID
  ga4Id: 'G-XXXXXXXXX', // Replace with actual GA4 ID
  linkedinPartnerId: 'XXXXXXX', // Replace with actual LinkedIn Partner ID
  metaPixelId: 'XXXXXXXXXXXXXXX', // Replace with actual Meta Pixel ID
  linkedinConversionId: 'XXXXXXX' // Replace with actual LinkedIn Conversion ID
};

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    lintrk: (...args: any[]) => void;
    _linkedin_data_partner_ids: any[];
    ArgiletteContext: {
      platform: string;
      domain: string;
      serviceType: string;
      targetAudience: string;
      currentPage: string;
      sessionStart: number;
      userProfile: {
        businessSize: string;
        industryType: string;
        crmNeedLevel: string;
        featureInterests: string[];
        signupIntent: string;
        engagementLevel: string;
        qualificationScore: number;
        touchpoints: number;
      };
    };
  }
}

export default function TrackingScripts() {
  useEffect(() => {
    // Initialize tracking scripts
    initializeTracking();
    
    // Set up form enhancement
    enhanceSignupForms();
    
    // Fire initial page view
    fireCrmPlatformPageView();
  }, []);

  const initializeTracking = () => {
    // Initialize Google Analytics & Ads
    if (!document.querySelector('#gtag-script')) {
      const script = document.createElement('script');
      script.id = 'gtag-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${TRACKING_CONFIG.googleAdsId}`;
      document.head.appendChild(script);

      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function(...args) { window.dataLayer.push(args); };
        window.gtag('js', new Date());
        
        // Google Ads Configuration
        window.gtag('config', TRACKING_CONFIG.googleAdsId, {
          allow_enhanced_conversions: true,
          send_page_view: false,
          conversion_linker: true,
          custom_map: {
            'custom_parameter_1': 'business_size',
            'custom_parameter_2': 'industry_type',
            'custom_parameter_3': 'crm_need_level'
          }
        });
        
        // GA4 Configuration
        window.gtag('config', TRACKING_CONFIG.ga4Id, {
          send_page_view: false,
          custom_map: {
            'custom_parameter_1': 'user_type',
            'custom_parameter_2': 'signup_intent',
            'custom_parameter_3': 'feature_interest'
          }
        });
      };
    }

    // Initialize Meta Pixel
    if (!document.querySelector('#meta-pixel-script')) {
      const script = document.createElement('script');
      script.id = 'meta-pixel-script';
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', '${TRACKING_CONFIG.metaPixelId}');
        fbq('consent', 'grant');
      `;
      document.head.appendChild(script);
    }

    // Initialize LinkedIn Insight Tag
    if (!document.querySelector('#linkedin-script')) {
      (window as any)._linkedin_partner_id = TRACKING_CONFIG.linkedinPartnerId;
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push((window as any)._linkedin_partner_id);

      const script = document.createElement('script');
      script.id = 'linkedin-script';
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://snap.licdn.com/li.lms-analytics/insight.js';
      script.onload = () => {
        if (!window.lintrk) {
          window.lintrk = function(a, b) { 
            (window.lintrk as any).q = (window.lintrk as any).q || []; 
            (window.lintrk as any).q.push([a, b]); 
          };
        }
      };
      document.head.appendChild(script);
    }

    // Initialize Argilette Context
    initializeArgiletteContext();
  };

  const initializeArgiletteContext = () => {
    // UTM & Attribution Tracking
    const params = new URLSearchParams(location.search);
    const trackingParams = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','li_fat_id'];
    
    trackingParams.forEach(key => {
      const value = params.get(key);
      if (value) {
        try {
          localStorage.setItem('arg_' + key, value);
          localStorage.setItem('arg_' + key + '_timestamp', Date.now().toString());
        } catch(e) {}
      }
    });

    // Initialize Argilette Context
    window.ArgiletteContext = {
      platform: 'NODE CRM',
      domain: 'argilette.org',
      serviceType: 'all_in_one_crm_platform',
      targetAudience: 'business_owners_managers',
      currentPage: window.location.pathname,
      sessionStart: Date.now(),
      userProfile: {
        businessSize: 'unknown',
        industryType: 'unknown',
        crmNeedLevel: 'unknown',
        featureInterests: [],
        signupIntent: 'low',
        engagementLevel: 'low',
        qualificationScore: 0,
        touchpoints: 0
      }
    };

    // Detect business profile
    detectBusinessProfile();
    assessCrmNeedLevel();
  };

  const detectBusinessProfile = () => {
    const BUSINESS_TARGETING = {
      'small_business': {
        keywords: ['small business', 'startup', 'entrepreneur', 'freelance', 'solo', '1-10 employees'],
        businessSize: 'small_business'
      },
      'medium_business': {
        keywords: ['medium business', 'growing company', '10-50 employees', 'scale', 'expand'],
        businessSize: 'medium_business'
      },
      'enterprise': {
        keywords: ['enterprise', 'corporation', '50+ employees', 'large company', 'organization'],
        businessSize: 'enterprise'
      }
    };

    const INDUSTRY_TARGETING = {
      'real_estate': {
        keywords: ['real estate', 'realtor', 'property', 'mortgage', 'broker'],
        industryType: 'real_estate'
      },
      'healthcare': {
        keywords: ['healthcare', 'medical', 'dental', 'clinic', 'physician'],
        industryType: 'healthcare'
      },
      'professional_services': {
        keywords: ['consulting', 'legal', 'accounting', 'agency', 'services'],
        industryType: 'professional_services'
      },
      'ecommerce': {
        keywords: ['ecommerce', 'online store', 'retail', 'shopify', 'amazon'],
        industryType: 'ecommerce'
      },
      'technology': {
        keywords: ['tech', 'software', 'saas', 'app', 'development'],
        industryType: 'technology'
      }
    };

    const pageContent = (document.body.textContent || '').toLowerCase();
    const referrer = document.referrer.toLowerCase();
    const searchTerms = new URLSearchParams(location.search).get('q') || '';
    const combinedContent = (pageContent + ' ' + referrer + ' ' + searchTerms).toLowerCase();

    // Detect business size
    for (const [size, config] of Object.entries(BUSINESS_TARGETING)) {
      const matches = config.keywords.filter(keyword => combinedContent.includes(keyword));
      if (matches.length > 0) {
        window.ArgiletteContext.userProfile.businessSize = config.businessSize;
        window.ArgiletteContext.userProfile.qualificationScore += matches.length * 15;
        break;
      }
    }

    // Detect industry
    for (const [industry, config] of Object.entries(INDUSTRY_TARGETING)) {
      const matches = config.keywords.filter(keyword => combinedContent.includes(keyword));
      if (matches.length > 0) {
        window.ArgiletteContext.userProfile.industryType = config.industryType;
        window.ArgiletteContext.userProfile.qualificationScore += matches.length * 20;
        break;
      }
    }
  };

  const assessCrmNeedLevel = () => {
    const crmKeywords = [
      'crm', 'customer management', 'sales pipeline', 'lead tracking',
      'contact management', 'sales automation', 'customer database'
    ];
    
    const urgencyKeywords = [
      'need now', 'urgent', 'asap', 'immediately', 'today',
      'frustrated with current', 'looking for new', 'switching from'
    ];

    const pageContent = (document.body.textContent || '').toLowerCase();
    let needLevel = 'low';
    let crmMatches = 0;
    let urgencyMatches = 0;

    crmKeywords.forEach(keyword => {
      if (pageContent.includes(keyword)) crmMatches++;
    });

    urgencyKeywords.forEach(keyword => {
      if (pageContent.includes(keyword)) urgencyMatches++;
    });

    if (crmMatches >= 3) needLevel = 'medium';
    if (crmMatches >= 5 || urgencyMatches >= 2) needLevel = 'high';
    if (urgencyMatches >= 3) needLevel = 'urgent';

    window.ArgiletteContext.userProfile.crmNeedLevel = needLevel;
    window.ArgiletteContext.userProfile.qualificationScore += (crmMatches * 10) + (urgencyMatches * 25);
  };

  const fireCrmPlatformPageView = () => {
    setTimeout(() => {
      if (window.fbq) {
        // Standard page view
        window.fbq('track', 'PageView');

        // Enhanced page view with business context
        if (window.gtag) {
          window.gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            business_size: window.ArgiletteContext.userProfile.businessSize,
            industry_type: window.ArgiletteContext.userProfile.industryType,
            crm_need_level: window.ArgiletteContext.userProfile.crmNeedLevel,
            platform_type: 'crm_saas'
          });
        }

        // Track qualified CRM prospect visit
        window.fbq('trackCustom', 'CrmProspectVisit', {
          business_size: window.ArgiletteContext.userProfile.businessSize,
          industry_type: window.ArgiletteContext.userProfile.industryType,
          crm_need_level: window.ArgiletteContext.userProfile.crmNeedLevel,
          qualification_score: window.ArgiletteContext.userProfile.qualificationScore
        });

        // Track high-intent CRM pages
        const highIntentPages = ['/pricing', '/demo', '/trial', '/signup', '/features', '/contact', '/get-started'];
        const currentPath = window.location.pathname.toLowerCase();

        if (highIntentPages.some(page => currentPath.includes(page))) {
          window.ArgiletteContext.userProfile.qualificationScore += 35;
          window.ArgiletteContext.userProfile.signupIntent = 'high';
          window.ArgiletteContext.userProfile.engagementLevel = 'high';

          window.fbq('trackCustom', 'HighIntentCrmPageView', {
            page_type: currentPath,
            business_size: window.ArgiletteContext.userProfile.businessSize,
            qualification_score: window.ArgiletteContext.userProfile.qualificationScore
          });

          if (currentPath.includes('pricing')) {
            window.fbq('trackCustom', 'PricingPageView', {
              business_size: window.ArgiletteContext.userProfile.businessSize,
              industry_type: window.ArgiletteContext.userProfile.industryType
            });
          }

          if (currentPath.includes('demo')) {
            window.fbq('trackCustom', 'DemoPageView', {
              business_size: window.ArgiletteContext.userProfile.businessSize,
              crm_need_level: window.ArgiletteContext.userProfile.crmNeedLevel
            });
          }
        }
      }

      // LinkedIn professional page view
      if (window.lintrk) {
        window.lintrk('track', { conversion_id: TRACKING_CONFIG.linkedinConversionId });
      }
    }, 1000);
  };

  const enhanceSignupForms = () => {
    setTimeout(() => {
      const forms = document.querySelectorAll('form');
      
      forms.forEach(form => {
        if (form.hasAttribute('data-arg-enhanced')) return;
        form.setAttribute('data-arg-enhanced', 'true');
        
        // Add business context hidden fields
        const businessSizeInput = document.createElement('input');
        businessSizeInput.type = 'hidden';
        businessSizeInput.name = 'detected_business_size';
        businessSizeInput.value = window.ArgiletteContext?.userProfile?.businessSize || 'unknown';
        form.appendChild(businessSizeInput);
        
        const industryInput = document.createElement('input');
        industryInput.type = 'hidden';
        industryInput.name = 'detected_industry';
        industryInput.value = window.ArgiletteContext?.userProfile?.industryType || 'unknown';
        form.appendChild(industryInput);
        
        const qualificationInput = document.createElement('input');
        qualificationInput.type = 'hidden';
        qualificationInput.name = 'qualification_score';
        qualificationInput.value = window.ArgiletteContext?.userProfile?.qualificationScore?.toString() || '0';
        form.appendChild(qualificationInput);
        
        // Track form field engagement
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          input.addEventListener('focus', function() {
            if (window.fbq) {
              window.fbq('trackCustom', 'SignupFormEngagement', {
                form_field: (input as HTMLInputElement).name || (input as HTMLInputElement).id || 'unknown',
                business_size: window.ArgiletteContext?.userProfile?.businessSize,
                signup_intent: 'medium'
              });
            }
          });
          
          // Track email domain for B2B qualification
          if ((input as HTMLInputElement).type === 'email') {
            input.addEventListener('blur', function() {
              const email = (input as HTMLInputElement).value.toLowerCase();
              const domain = email.split('@')[1];
              
              if (domain) {
                const businessDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
                const isBusinessEmail = !businessDomains.includes(domain);
                
                if (isBusinessEmail && window.ArgiletteContext) {
                  window.ArgiletteContext.userProfile.qualificationScore += 30;
                  if (window.fbq) {
                    window.fbq('trackCustom', 'BusinessEmailDetected', {
                      email_domain: domain,
                      business_size: window.ArgiletteContext.userProfile.businessSize
                    });
                  }
                }
              }
            });
          }
        });
        
        // Track form initiation
        let formStarted = false;
        form.addEventListener('input', function() {
          if (!formStarted) {
            formStarted = true;
            
            if (window.fbq) {
              window.fbq('trackCustom', 'SignupFormStarted', {
                form_type: getCrmFormType(form),
                business_size: window.ArgiletteContext?.userProfile?.businessSize,
                qualification_score: window.ArgiletteContext?.userProfile?.qualificationScore
              });
            }
          }
        });
        
        // Track successful form submission
        form.addEventListener('submit', function() {
          form.setAttribute('data-submitted', 'true');
          
          if (window.ArgiletteContext) {
            window.ArgiletteContext.userProfile.qualificationScore += 100;
          }
          
          if (window.fbq) {
            window.fbq('trackCustom', 'QualifiedCrmLead', {
              form_type: getCrmFormType(form),
              business_size: window.ArgiletteContext?.userProfile?.businessSize,
              industry_type: window.ArgiletteContext?.userProfile?.industryType,
              final_qualification_score: window.ArgiletteContext?.userProfile?.qualificationScore
            });
          }
        });
      });
    }, 2000);
  };

  const getCrmFormType = (form: HTMLFormElement) => {
    const action = form.action.toLowerCase();
    const formText = form.textContent?.toLowerCase() || '';
    
    if (action.includes('trial') || formText.includes('free trial')) return 'trial_signup';
    if (action.includes('demo') || formText.includes('demo')) return 'demo_request';
    if (action.includes('consultation') || formText.includes('consultation')) return 'consultation_request';
    if (action.includes('enterprise') || formText.includes('enterprise')) return 'enterprise_inquiry';
    if (formText.includes('newsletter') || formText.includes('updates')) return 'newsletter_signup';
    
    return 'general_signup';
  };

  return null; // This component doesn't render anything
}

// Export tracking functions for use in other components
export const trackCrmSignupAction = (actionType: string, signupValue = 0) => {
  if (!window.ArgiletteContext || !window.fbq) return;

  const userData = {
    signup_type: actionType,
    business_size: window.ArgiletteContext.userProfile.businessSize,
    industry_type: window.ArgiletteContext.userProfile.industryType,
    crm_need_level: window.ArgiletteContext.userProfile.crmNeedLevel,
    qualification_score: window.ArgiletteContext.userProfile.qualificationScore,
    source_page: window.location.pathname
  };
  
  // Determine signup value based on action type
  let leadValue = signupValue || 50;
  if (actionType === 'paid_signup') leadValue = 500;
  else if (actionType === 'demo_request') leadValue = 200;
  else if (actionType === 'consultation_request') leadValue = 300;
  else if (actionType === 'enterprise_inquiry') leadValue = 1000;
  
  // Track signup/trial conversion
  window.fbq('track', 'CompleteRegistration', {
    content_category: 'crm_platform_signup',
    value: leadValue,
    currency: 'USD',
    ...userData
  });
  
  // Google Ads conversion
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${TRACKING_CONFIG.googleAdsId}/YOUR_SIGNUP_CONVERSION_LABEL`,
      value: leadValue,
      currency: 'USD',
      transaction_id: 'ARG_' + Date.now(),
      ...userData
    });
  }
};

export const trackBusinessAction = (actionType: string, actionValue?: any) => {
  if (!window.fbq || !window.ArgiletteContext) return;

  window.fbq('trackCustom', actionType, {
    business_size: window.ArgiletteContext.userProfile.businessSize,
    industry_type: window.ArgiletteContext.userProfile.industryType,
    qualification_score: window.ArgiletteContext.userProfile.qualificationScore,
    ...actionValue
  });
};