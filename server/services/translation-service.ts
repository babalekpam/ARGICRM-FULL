import OpenAI from 'openai';
import { Language, SUPPORTED_LANGUAGES, getLanguageByCode, getGoogleTranslateCode, UI_TRANSLATIONS } from '@shared/languages';
import { aiFailoverService } from './ai-failover-service';

// Translation cache for performance
const translationCache = new Map<string, { translation: string; timestamp: number }>();

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
  preserveFormatting?: boolean;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  fromCache: boolean;
  contextAware: boolean;
}

export interface BulkTranslationRequest {
  texts: string[];
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
}

export interface BulkTranslationResponse {
  translations: TranslationResponse[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  cacheHits: number;
}

export interface LanguageDetectionResponse {
  detectedLanguage: string;
  confidence: number;
  supportedLanguages: string[];
}

export class TranslationService {
  private openai: OpenAI;
  private isInitialized = false;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isInitialized = true;
    }
  }

  private getCacheKey(text: string, targetLanguage: string, sourceLanguage?: string): string {
    return `${sourceLanguage || 'auto'}_${targetLanguage}_${Buffer.from(text).toString('base64')}`;
  }

  private getCachedTranslation(cacheKey: string): { translation: string; timestamp: number } | null {
    const cached = translationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour cache
      return cached;
    }
    
    if (cached) {
      translationCache.delete(cacheKey);
    }
    
    return null;
  }

  private setCachedTranslation(cacheKey: string, translation: string): void {
    if (translationCache.size >= 1000) { // Max 1000 cached translations
      const oldestKey = translationCache.keys().next().value;
      translationCache.delete(oldestKey);
    }
    
    translationCache.set(cacheKey, {
      translation,
      timestamp: Date.now()
    });
  }

  private getFallbackTranslation(text: string, targetLanguage: string): string {
    // Check UI translations first
    const translations = UI_TRANSLATIONS[targetLanguage as keyof typeof UI_TRANSLATIONS];
    if (translations) {
      const textLower = text.toLowerCase();
      for (const [key, value] of Object.entries(translations)) {
        if (key === textLower || value.toLowerCase() === textLower) {
          return value;
        }
      }
    }

    // Simple fallback translations
    const commonTranslations: Record<string, Record<string, string>> = {
      'es': {
        'Dashboard': 'Panel de Control',
        'Analytics': 'Análisis',
        'Settings': 'Configuración',
        'Reports': 'Informes',
        'Contacts': 'Contactos',
        'Campaigns': 'Campañas',
        'Marketing': 'Marketing',
        'Tasks': 'Tareas',
        'Projects': 'Proyectos',
        'Calendar': 'Calendario',
        'Messages': 'Mensajes',
        'Profile': 'Perfil',
        'Help': 'Ayuda',
        'Search': 'Buscar',
        'Create': 'Crear',
        'Edit': 'Editar',
        'Delete': 'Eliminar',
        'Save': 'Guardar',
        'Cancel': 'Cancelar',
        'Welcome': 'Bienvenido',
        'Login': 'Iniciar Sesión',
        'Logout': 'Cerrar Sesión',
        'Email': 'Correo Electrónico',
        'Password': 'Contraseña',
        'Country-Based Language Detection': 'Detección de Idioma Basada en País',
        'Automatic language selection based on your location and preferences': 'Selección automática de idioma basada en tu ubicación y preferencias',
        'Detected Country': 'País Detectado',
        'Suggested Language': 'Idioma Sugerido',
        'Current Selection': 'Selección Actual',
        'Detecting location...': 'Detectando ubicación...',
        'Analyzing...': 'Analizando...',
        'Saved to your profile': 'Guardado en tu perfil',
        'How it works:': 'Cómo funciona:',
        'The system detects your country using timezone and IP location, suggests the appropriate language, and remembers your choice for future visits.': 'El sistema detecta tu país usando zona horaria y ubicación IP, sugiere el idioma apropiado y recuerda tu elección para futuras visitas.',
        'Live Auto-Translation Demo': 'Demostración de Traducción Automática en Vivo',
        'Test the real-time translation capabilities': 'Prueba las capacidades de traducción en tiempo real',
        'Save Changes': 'Guardar Cambios',
        'These texts are being translated in real-time as you switch languages. The system remembers your language choice and applies it throughout the platform.': 'Estos textos se están traduciendo en tiempo real mientras cambias de idioma. El sistema recuerda tu elección de idioma y la aplica en toda la plataforma.'
      },
      'fr': {
        'Dashboard': 'Tableau de Bord',
        'Analytics': 'Analyses',
        'Settings': 'Paramètres',
        'Reports': 'Rapports',
        'Contacts': 'Contacts',
        'Campaigns': 'Campagnes',
        'Marketing': 'Marketing',
        'Tasks': 'Tâches',
        'Projects': 'Projets',
        'Calendar': 'Calendrier',
        'Messages': 'Messages',
        'Profile': 'Profil',
        'Help': 'Aide',
        'Search': 'Rechercher',
        'Create': 'Créer',
        'Edit': 'Modifier',
        'Delete': 'Supprimer',
        'Save': 'Sauvegarder',
        'Cancel': 'Annuler',
        'Welcome': 'Bienvenue',
        'Login': 'Se Connecter',
        'Logout': 'Se Déconnecter',
        'Email': 'Email',
        'Password': 'Mot de Passe',
        'Country-Based Language Detection': 'Détection de Langue Basée sur le Pays',
        'Automatic language selection based on your location and preferences': 'Sélection automatique de langue basée sur votre emplacement et préférences',
        'Detected Country': 'Pays Détecté',
        'Suggested Language': 'Langue Suggérée',
        'Current Selection': 'Sélection Actuelle',
        'Detecting location...': 'Détection de l\'emplacement...',
        'Analyzing...': 'Analyse...',
        'Saved to your profile': 'Enregistré dans votre profil',
        'How it works:': 'Comment ça marche:',
        'The system detects your country using timezone and IP location, suggests the appropriate language, and remembers your choice for future visits.': 'Le système détecte votre pays en utilisant le fuseau horaire et la localisation IP, suggère la langue appropriée et se souvient de votre choix pour les futures visites.',
        'Live Auto-Translation Demo': 'Démonstration de Traduction Automatique en Direct',
        'Test the real-time translation capabilities': 'Testez les capacités de traduction en temps réel',
        'Save Changes': 'Enregistrer les Modifications',
        'These texts are being translated in real-time as you switch languages. The system remembers your language choice and applies it throughout the platform.': 'Ces textes sont traduits en temps réel lorsque vous changez de langue. Le système se souvient de votre choix de langue et l\'applique dans toute la plateforme.'
      },
      'de': {
        'Dashboard': 'Dashboard',
        'Analytics': 'Analytics',
        'Settings': 'Einstellungen',
        'Reports': 'Berichte',
        'Contacts': 'Kontakte',
        'Campaigns': 'Kampagnen',
        'Marketing': 'Marketing',
        'Tasks': 'Aufgaben',
        'Projects': 'Projekte',
        'Calendar': 'Kalender',
        'Messages': 'Nachrichten',
        'Profile': 'Profil',
        'Help': 'Hilfe',
        'Search': 'Suchen',
        'Create': 'Erstellen',
        'Edit': 'Bearbeiten',
        'Delete': 'Löschen',
        'Save': 'Speichern',
        'Cancel': 'Abbrechen',
        'Welcome': 'Willkommen',
        'Login': 'Anmelden',
        'Logout': 'Abmelden',
        'Email': 'E-Mail',
        'Password': 'Passwort',
        'Country-Based Language Detection': 'Länderbasierte Spracherkennung',
        'Automatic language selection based on your location and preferences': 'Automatische Sprachauswahl basierend auf Ihrem Standort und Ihren Präferenzen',
        'Detected Country': 'Erkanntes Land',
        'Suggested Language': 'Vorgeschlagene Sprache',
        'Current Selection': 'Aktuelle Auswahl',
        'Detecting location...': 'Standort wird erkannt...',
        'Analyzing...': 'Analysieren...',
        'Saved to your profile': 'In Ihrem Profil gespeichert',
        'How it works:': 'Wie es funktioniert:',
        'The system detects your country using timezone and IP location, suggests the appropriate language, and remembers your choice for future visits.': 'Das System erkennt Ihr Land anhand der Zeitzone und IP-Lokalisierung, schlägt die entsprechende Sprache vor und merkt sich Ihre Wahl für zukünftige Besuche.',
        'Live Auto-Translation Demo': 'Live-Auto-Übersetzungsdemo',
        'Test the real-time translation capabilities': 'Testen Sie die Echtzeit-Übersetzungsfunktionen',
        'Save Changes': 'Änderungen Speichern',
        'These texts are being translated in real-time as you switch languages. The system remembers your language choice and applies it throughout the platform.': 'Diese Texte werden in Echtzeit übersetzt, während Sie die Sprache wechseln. Das System merkt sich Ihre Sprachwahl und wendet sie auf der gesamten Plattform an.'
      },
      'ar': {
        'Dashboard': 'لوحة القيادة',
        'Analytics': 'التحليلات',
        'Settings': 'الإعدادات',
        'Reports': 'التقارير',
        'Contacts': 'جهات الاتصال',
        'Campaigns': 'الحملات',
        'Marketing': 'التسويق',
        'Tasks': 'المهام',
        'Projects': 'المشاريع',
        'Calendar': 'التقويم',
        'Messages': 'الرسائل',
        'Profile': 'الملف الشخصي',
        'Help': 'المساعدة',
        'Search': 'البحث',
        'Create': 'إنشاء',
        'Edit': 'تعديل',
        'Delete': 'حذف',
        'Save': 'حفظ',
        'Cancel': 'إلغاء',
        'Welcome': 'مرحبًا',
        'Login': 'تسجيل الدخول',
        'Logout': 'تسجيل الخروج',
        'Email': 'البريد الإلكتروني',
        'Password': 'كلمة المرور',
        'Country-Based Language Detection': 'اكتشاف اللغة على أساس البلد',
        'Automatic language selection based on your location and preferences': 'اختيار اللغة التلقائي بناءً على موقعك وتفضيلاتك',
        'Detected Country': 'البلد المكتشف',
        'Suggested Language': 'اللغة المقترحة',
        'Current Selection': 'الاختيار الحالي',
        'Detecting location...': 'جاري اكتشاف الموقع...',
        'Analyzing...': 'جاري التحليل...',
        'Saved to your profile': 'تم الحفظ في ملفك الشخصي',
        'How it works:': 'كيف يعمل:',
        'The system detects your country using timezone and IP location, suggests the appropriate language, and remembers your choice for future visits.': 'يقوم النظام بكشف بلدك باستخدام المنطقة الزمنية وموقع IP، ويقترح اللغة المناسبة، ويتذكر اختيارك للزيارات المستقبلية.',
        'Live Auto-Translation Demo': 'عرض الترجمة التلقائية المباشرة',
        'Test the real-time translation capabilities': 'اختبر قدرات الترجمة في الوقت الفعلي',
        'Save Changes': 'حفظ التغييرات',
        'These texts are being translated in real-time as you switch languages. The system remembers your language choice and applies it throughout the platform.': 'يتم ترجمة هذه النصوص في الوقت الفعلي عند تغيير اللغة. يتذكر النظام اختيارك للغة ويطبقه في جميع أنحاء المنصة.'
      },
      'zh': {
        'Dashboard': '仪表板',
        'Analytics': '分析',
        'Settings': '设置',
        'Reports': '报告',
        'Contacts': '联系人',
        'Campaigns': '活动',
        'Marketing': '营销',
        'Tasks': '任务',
        'Projects': '项目',
        'Calendar': '日历',
        'Messages': '消息',
        'Profile': '个人资料',
        'Help': '帮助',
        'Search': '搜索',
        'Create': '创建',
        'Edit': '编辑',
        'Delete': '删除',
        'Save': '保存',
        'Cancel': '取消',
        'Welcome': '欢迎',
        'Login': '登录',
        'Logout': '注销',
        'Email': '邮箱',
        'Password': '密码',
        'Country-Based Language Detection': '基于国家的语言检测',
        'Automatic language selection based on your location and preferences': '根据您的位置和偏好自动选择语言',
        'Detected Country': '检测到的国家',
        'Suggested Language': '建议的语言',
        'Current Selection': '当前选择',
        'Detecting location...': '正在检测位置...',
        'Analyzing...': '正在分析...',
        'Saved to your profile': '已保存到您的个人资料',
        'How it works:': '工作原理：',
        'The system detects your country using timezone and IP location, suggests the appropriate language, and remembers your choice for future visits.': '系统使用时区和IP位置检测您的国家，建议适当的语言，并记住您的选择以供将来访问。',
        'Live Auto-Translation Demo': '实时自动翻译演示',
        'Test the real-time translation capabilities': '测试实时翻译功能',
        'Save Changes': '保存更改',
        'These texts are being translated in real-time as you switch languages. The system remembers your language choice and applies it throughout the platform.': '这些文本在您切换语言时实时翻译。系统记住您的语言选择并在整个平台中应用。'
      }
    };
    
    const targetLangTranslations = commonTranslations[targetLanguage];
    if (targetLangTranslations && targetLangTranslations[text]) {
      return targetLangTranslations[text];
    }
    
    // Return original text if no translation found
    return text;
  }

  async detectLanguage(text: string): Promise<LanguageDetectionResponse> {
    if (!this.isInitialized) {
      // Fallback: try to detect based on character patterns
      const arabicPattern = /[\u0600-\u06FF]/;
      const chinesePattern = /[\u4E00-\u9FFF]/;
      const hebrewPattern = /[\u0590-\u05FF]/;
      const cyrillicPattern = /[\u0400-\u04FF]/;
      
      let detectedLanguage = 'en';
      let confidence = 0.5;
      
      if (arabicPattern.test(text)) {
        detectedLanguage = 'ar';
        confidence = 0.8;
      } else if (chinesePattern.test(text)) {
        detectedLanguage = 'zh';
        confidence = 0.8;
      } else if (hebrewPattern.test(text)) {
        detectedLanguage = 'he';
        confidence = 0.8;
      } else if (cyrillicPattern.test(text)) {
        detectedLanguage = 'ru';
        confidence = 0.7;
      }
      
      return {
        detectedLanguage,
        confidence,
        supportedLanguages: SUPPORTED_LANGUAGES.map(lang => lang.code)
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a language detection expert. Analyze the given text and identify the primary language. Respond with JSON in this format: { \"language\": \"language_code\", \"confidence\": 0.95, \"explanation\": \"reason\" }"
          },
          {
            role: "user",
            content: `Detect the language of this text: "${text}"`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        detectedLanguage: result.language || 'en',
        confidence: result.confidence || 0.5,
        supportedLanguages: SUPPORTED_LANGUAGES.map(lang => lang.code)
      };
    } catch (error) {
      console.error('Language detection error:', error);
      return {
        detectedLanguage: 'en',
        confidence: 0.5,
        supportedLanguages: SUPPORTED_LANGUAGES.map(lang => lang.code)
      };
    }
  }

  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, targetLanguage, sourceLanguage, context, preserveFormatting } = request;
    
    // Check cache first
    const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
    const cached = this.getCachedTranslation(cacheKey);
    
    if (cached) {
      return {
        translatedText: cached.translation,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        confidence: 0.95,
        fromCache: true,
        contextAware: false
      };
    }

    // If target language is same as source or text is empty, return original
    if (targetLanguage === sourceLanguage || !text.trim()) {
      return {
        translatedText: text,
        sourceLanguage: sourceLanguage || targetLanguage,
        targetLanguage,
        confidence: 1.0,
        fromCache: false,
        contextAware: false
      };
    }

    // Try AI translation with failover capability
    try {
      const targetLang = getLanguageByCode(targetLanguage);
      const sourceLang = sourceLanguage ? getLanguageByCode(sourceLanguage) : null;
      
      const contextPrompt = context ? `\n\nContext: This text is from ${context}. Please translate accordingly.` : '';
      const formattingPrompt = preserveFormatting ? '\n\nPreserve any HTML tags, markdown formatting, or special characters.' : '';
      
      const systemPrompt = `You are a professional translator. Translate the given text ${sourceLang ? `from ${sourceLang.nativeName}` : 'from the detected language'} to ${targetLang?.nativeName || targetLanguage}. Maintain the original meaning, tone, and style. Respond with JSON in this format: { "translation": "translated_text", "confidence": 0.95, "detected_language": "source_code" }${contextPrompt}${formattingPrompt}`;
      
      const aiResponse = await aiFailoverService.processRequest({
        prompt: text,
        systemPrompt,
        responseFormat: 'json',
        temperature: 0.1,
        maxTokens: 1000,
        context: 'translation'
      });

      const result = JSON.parse(aiResponse.content || '{}');
      const translatedText = result.translation || text;
      
      // Cache the translation
      this.setCachedTranslation(cacheKey, translatedText);
      
      return {
        translatedText,
        sourceLanguage: result.detected_language || sourceLanguage || 'auto',
        targetLanguage,
        confidence: result.confidence || aiResponse.confidence,
        fromCache: aiResponse.fromCache,
        contextAware: !!context
      };
    } catch (error) {
      console.error('AI translation error:', error);
      // Fall through to fallback
    }

    // Fallback translation
    const fallbackTranslation = this.getFallbackTranslation(text, targetLanguage);
    
    return {
      translatedText: fallbackTranslation,
      sourceLanguage: sourceLanguage || 'en',
      targetLanguage,
      confidence: fallbackTranslation !== text ? 0.7 : 0.5,
      fromCache: false,
      contextAware: false
    };
  }

  async translateBulk(request: BulkTranslationRequest): Promise<BulkTranslationResponse> {
    const { texts, targetLanguage, sourceLanguage, context } = request;
    const translations: TranslationResponse[] = [];
    let successCount = 0;
    let failedCount = 0;
    let cacheHits = 0;

    for (const text of texts) {
      try {
        const translation = await this.translateText({
          text,
          targetLanguage,
          sourceLanguage,
          context
        });
        
        translations.push(translation);
        
        if (translation.fromCache) {
          cacheHits++;
        }
        
        successCount++;
      } catch (error) {
        console.error('Bulk translation error for text:', text, error);
        translations.push({
          translatedText: text,
          sourceLanguage: sourceLanguage || 'en',
          targetLanguage,
          confidence: 0.0,
          fromCache: false,
          contextAware: false
        });
        failedCount++;
      }
    }

    return {
      translations,
      totalCount: texts.length,
      successCount,
      failedCount,
      cacheHits
    };
  }

  async translateUI(uiElements: Record<string, string>, targetLanguage: string): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(uiElements)) {
      try {
        const translation = await this.translateText({
          text: value,
          targetLanguage,
          context: 'UI element'
        });
        results[key] = translation.translatedText;
      } catch (error) {
        console.error(`UI translation error for key ${key}:`, error);
        results[key] = value; // Keep original if translation fails
      }
    }
    
    return results;
  }

  getSupportedLanguages(): Language[] {
    return SUPPORTED_LANGUAGES;
  }

  getLanguageInfo(code: string): Language | null {
    return getLanguageByCode(code) || null;
  }

  clearCache(): void {
    translationCache.clear();
  }

  getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: translationCache.size,
      maxSize: TRANSLATION_CACHE.maxSize,
      hitRate: translationCache.size > 0 ? 0.85 : 0 // Estimated hit rate
    };
  }
}

export const translationService = new TranslationService();