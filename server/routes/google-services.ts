import { Router } from 'express';
import { googleAPIService } from '../services/google-api.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Google Maps API endpoints
router.post('/maps/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ 
        success: false, 
        error: 'Address is required' 
      });
    }

    const location = await googleAPIService.geocodeAddress(address);
    
    if (location) {
      res.json({ 
        success: true, 
        location 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Location not found' 
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Geocoding service unavailable' 
    });
  }
});

router.post('/maps/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid latitude and longitude are required' 
      });
    }

    const location = await googleAPIService.reverseGeocode(lat, lng);
    
    if (location) {
      res.json({ 
        success: true, 
        location 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Address not found' 
      });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Reverse geocoding service unavailable' 
    });
  }
});

router.post('/maps/nearby', async (req, res) => {
  try {
    const { lat, lng, type = 'business', radius = 1000 } = req.body;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid latitude and longitude are required' 
      });
    }

    const places = await googleAPIService.findNearbyPlaces(lat, lng, type, radius);
    
    res.json({ 
      success: true, 
      places 
    });
  } catch (error) {
    console.error('Places search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Places search service unavailable' 
    });
  }
});

// Google Translate API endpoints
router.post('/translate/text', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text and target language are required' 
      });
    }

    const translation = await googleAPIService.translateText(text, targetLanguage, sourceLanguage);
    
    if (translation) {
      res.json({ 
        success: true, 
        translation 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Translation failed' 
      });
    }
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Translation service unavailable' 
    });
  }
});

router.post('/translate/detect', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required' 
      });
    }

    const language = await googleAPIService.detectLanguage(text);
    
    if (language) {
      res.json({ 
        success: true, 
        detectedLanguage: language 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Language detection failed' 
      });
    }
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Language detection service unavailable' 
    });
  }
});

router.get('/translate/languages', async (req, res) => {
  try {
    const languages = await googleAPIService.getSupportedLanguages();
    
    res.json({ 
      success: true, 
      languages 
    });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unable to fetch supported languages' 
    });
  }
});

// Google Gemini AI endpoints for CRM intelligence
router.post('/ai/customer-insights', async (req, res) => {
  try {
    const { customerData } = req.body;
    
    if (!customerData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer data is required' 
      });
    }

    const insights = await googleAPIService.generateCustomerInsights(customerData);
    
    res.json({ 
      success: true, 
      insights 
    });
  } catch (error) {
    console.error('Customer insights error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI insights service unavailable' 
    });
  }
});

router.post('/ai/generate-email', async (req, res) => {
  try {
    const { context } = req.body;
    
    if (!context) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email context is required' 
      });
    }

    const emailContent = await googleAPIService.generateEmailContent(context);
    
    res.json({ 
      success: true, 
      emailContent 
    });
  } catch (error) {
    console.error('Email generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI email generation service unavailable' 
    });
  }
});

router.post('/ai/analyze-sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Text is required for sentiment analysis' 
      });
    }

    const analysis = await googleAPIService.analyzeSentiment(text);
    
    res.json({ 
      success: true, 
      analysis 
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'AI sentiment analysis service unavailable' 
    });
  }
});

// Calendar integration endpoint
router.post('/calendar/create-event', async (req, res) => {
  try {
    const { event } = req.body;
    
    if (!event || !event.summary || !event.start || !event.end) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event summary, start time, and end time are required' 
      });
    }

    const eventId = await googleAPIService.createCalendarEvent(event);
    
    res.json({ 
      success: true, 
      eventId 
    });
  } catch (error) {
    console.error('Calendar event creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Calendar service unavailable' 
    });
  }
});

// Service health check endpoint
router.get('/health', async (req, res) => {
  try {
    const connectionTest = await googleAPIService.testConnection();
    
    res.json({ 
      success: connectionTest.success,
      availableServices: connectionTest.services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unable to check service health',
      availableServices: [],
      timestamp: new Date().toISOString()
    });
  }
});

export { router as googleServicesRouter };