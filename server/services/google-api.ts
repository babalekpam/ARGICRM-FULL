import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GoogleMapsLocation {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  formattedAddress?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
}

export class GoogleAPIService {
  private apiKey: string;
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  // Google Maps Integration
  async geocodeAddress(address: string): Promise<GoogleMapsLocation | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          placeId: result.place_id,
          formattedAddress: result.formatted_address
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<GoogleMapsLocation | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          address: result.formatted_address,
          latitude: lat,
          longitude: lng,
          placeId: result.place_id,
          formattedAddress: result.formatted_address
        };
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  async findNearbyPlaces(lat: number, lng: number, type: string = 'business', radius: number = 1000): Promise<any[]> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        return data.results.map((place: any) => ({
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity,
          rating: place.rating,
          types: place.types,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          }
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Places search error:', error);
      return [];
    }
  }

  // Google Translate Integration
  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult | null> {
    try {
      let url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
      
      const body: any = {
        q: text,
        target: targetLanguage
      };
      
      if (sourceLanguage) {
        body.source = sourceLanguage;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.data && data.data.translations && data.data.translations.length > 0) {
        const translation = data.data.translations[0];
        return {
          translatedText: translation.translatedText,
          detectedSourceLanguage: translation.detectedSourceLanguage
        };
      }
      
      return null;
    } catch (error) {
      console.error('Translation error:', error);
      return null;
    }
  }

  async detectLanguage(text: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: text })
        }
      );
      
      const data = await response.json();
      
      if (data.data && data.data.detections && data.data.detections.length > 0) {
        return data.data.detections[0][0].language;
      }
      
      return null;
    } catch (error) {
      console.error('Language detection error:', error);
      return null;
    }
  }

  async getSupportedLanguages(): Promise<Array<{code: string, name: string}>> {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/languages?key=${this.apiKey}&target=en`
      );
      
      const data = await response.json();
      
      if (data.data && data.data.languages) {
        return data.data.languages.map((lang: any) => ({
          code: lang.language,
          name: lang.name
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Get languages error:', error);
      return [];
    }
  }

  // Google Gemini AI Integration for Enhanced CRM Intelligence
  async generateCustomerInsights(customerData: any): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Analyze this customer data and provide actionable business insights:
        
        Customer: ${customerData.name || 'Unknown'}
        Company: ${customerData.company || 'Unknown'}
        Industry: ${customerData.industry || 'Unknown'}
        Recent Interactions: ${JSON.stringify(customerData.interactions || [])}
        Purchase History: ${JSON.stringify(customerData.purchases || [])}
        
        Provide:
        1. Customer behavior pattern analysis
        2. Next best action recommendations
        3. Upselling/cross-selling opportunities
        4. Risk assessment and retention strategies
        5. Personalized communication suggestions
        
        Format the response as actionable bullet points.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI insights generation error:', error);
      return 'Unable to generate insights at this time.';
    }
  }

  async generateEmailContent(context: any): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Generate a professional email based on this context:
        
        Recipient: ${context.customerName || 'Valued Customer'}
        Company: ${context.company || ''}
        Purpose: ${context.purpose || 'follow-up'}
        Tone: ${context.tone || 'professional'}
        Key Points: ${JSON.stringify(context.keyPoints || [])}
        Previous Interactions: ${JSON.stringify(context.previousInteractions || [])}
        
        Create a personalized, engaging email that:
        - Uses appropriate professional tone
        - References relevant context
        - Includes clear call-to-action
        - Maintains brand consistency
        
        Return only the email content without subject line.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Email generation error:', error);
      return 'Unable to generate email content at this time.';
    }
  }

  async analyzeSentiment(text: string): Promise<{sentiment: string, confidence: number, keywords: string[]}> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Analyze the sentiment of this text and provide insights:
        
        Text: "${text}"
        
        Provide analysis in this exact JSON format:
        {
          "sentiment": "positive|negative|neutral",
          "confidence": 0.85,
          "keywords": ["keyword1", "keyword2"],
          "reasoning": "brief explanation"
        }
        
        Return only valid JSON.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      try {
        const analysis = JSON.parse(response.text());
        return {
          sentiment: analysis.sentiment || 'neutral',
          confidence: analysis.confidence || 0.5,
          keywords: analysis.keywords || []
        };
      } catch (parseError) {
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          keywords: []
        };
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        keywords: []
      };
    }
  }

  // Calendar Integration (Basic implementation - would need OAuth for full functionality)
  async createCalendarEvent(event: Partial<GoogleCalendarEvent>): Promise<string> {
    // This is a placeholder - full Calendar API requires OAuth2 authentication
    // For now, we'll return a simulated event ID
    const eventId = `crm_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Calendar event created (simulated):', {
      id: eventId,
      summary: event.summary,
      start: event.start,
      end: event.end
    });
    
    return eventId;
  }

  // Utility method to check API connectivity
  async testConnection(): Promise<{success: boolean, services: string[]}> {
    const results = {
      success: false,
      services: [] as string[]
    };

    // Test Google Maps
    try {
      const testLocation = await this.geocodeAddress('1600 Amphitheatre Parkway, Mountain View, CA');
      if (testLocation) {
        results.services.push('Google Maps');
      }
    } catch (error) {
      console.log('Google Maps test failed:', error);
    }

    // Test Google Translate
    try {
      const testTranslation = await this.translateText('Hello', 'es');
      if (testTranslation) {
        results.services.push('Google Translate');
      }
    } catch (error) {
      console.log('Google Translate test failed:', error);
    }

    // Test Google Gemini AI
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent('Test connection');
      if (result) {
        results.services.push('Google Gemini AI');
      }
    } catch (error) {
      console.log('Google Gemini AI test failed:', error);
    }

    results.success = results.services.length > 0;
    return results;
  }
}

export const googleAPIService = new GoogleAPIService();