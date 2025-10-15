export interface Translation {
  language: string;
  code: string;
  flag: string;
  translations: Record<string, string>;
}

export interface FormTranslation {
  formId: number;
  originalLanguage: string;
  translations: Translation[];
  autoTranslate: boolean;
  lastUpdated: Date;
}

export class TranslationService {
  private static instance: TranslationService;
  private translations: Map<number, FormTranslation> = new Map();

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // Supported languages with flags and native names
  getSupportedLanguages(): { code: string; name: string; nativeName: string; flag: string }[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
      { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
      { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' }
    ];
  }

  // Auto-translate text using mock translation service
  async translateText(text: string, targetLanguage: string): Promise<string> {
    // In a real implementation, this would use Google Translate API, Azure Translator, or similar
    const translations: Record<string, Record<string, string>> = {
      'Full Name': {
        'es': 'Nombre Completo',
        'fr': 'Nom Complet',
        'de': 'Vollständiger Name',
        'it': 'Nome Completo',
        'pt': 'Nome Completo',
        'ru': 'Полное имя',
        'ja': 'フルネーム',
        'ko': '성명',
        'zh': '全名',
        'ar': 'الاسم الكامل',
        'hi': 'पूरा नाम',
        'nl': 'Volledige Naam',
        'sv': 'Fullständigt Namn',
        'no': 'Fullt Navn',
        'da': 'Fulde Navn',
        'fi': 'Koko Nimi',
        'pl': 'Pełne Imię',
        'tr': 'Tam Ad',
        'th': 'ชื่อเต็ม'
      },
      'Email Address': {
        'es': 'Dirección de Correo',
        'fr': 'Adresse E-mail',
        'de': 'E-Mail-Adresse',
        'it': 'Indirizzo Email',
        'pt': 'Endereço de Email',
        'ru': 'Адрес электронной почты',
        'ja': 'メールアドレス',
        'ko': '이메일 주소',
        'zh': '电子邮件地址',
        'ar': 'عنوان البريد الإلكتروني',
        'hi': 'ईमेल पता',
        'nl': 'E-mailadres',
        'sv': 'E-postadress',
        'no': 'E-postadresse',
        'da': 'E-mailadresse',
        'fi': 'Sähköpostiosoite',
        'pl': 'Adres E-mail',
        'tr': 'E-posta Adresi',
        'th': 'ที่อยู่อีเมล'
      },
      'Phone Number': {
        'es': 'Número de Teléfono',
        'fr': 'Numéro de Téléphone',
        'de': 'Telefonnummer',
        'it': 'Numero di Telefono',
        'pt': 'Número de Telefone',
        'ru': 'Номер телефона',
        'ja': '電話番号',
        'ko': '전화번호',
        'zh': '电话号码',
        'ar': 'رقم الهاتف',
        'hi': 'फोन नंबर',
        'nl': 'Telefoonnummer',
        'sv': 'Telefonnummer',
        'no': 'Telefonnummer',
        'da': 'Telefonnummer',
        'fi': 'Puhelinnumero',
        'pl': 'Numer Telefonu',
        'tr': 'Telefon Numarası',
        'th': 'หมายเลขโทรศัพท์'
      },
      'Submit': {
        'es': 'Enviar',
        'fr': 'Soumettre',
        'de': 'Einreichen',
        'it': 'Invia',
        'pt': 'Enviar',
        'ru': 'Отправить',
        'ja': '送信',
        'ko': '제출',
        'zh': '提交',
        'ar': 'إرسال',
        'hi': 'जमा करें',
        'nl': 'Verzenden',
        'sv': 'Skicka',
        'no': 'Send',
        'da': 'Send',
        'fi': 'Lähetä',
        'pl': 'Wyślij',
        'tr': 'Gönder',
        'th': 'ส่ง'
      },
      'Message': {
        'es': 'Mensaje',
        'fr': 'Message',
        'de': 'Nachricht',
        'it': 'Messaggio',
        'pt': 'Mensagem',
        'ru': 'Сообщение',
        'ja': 'メッセージ',
        'ko': '메시지',
        'zh': '消息',
        'ar': 'رسالة',
        'hi': 'संदेश',
        'nl': 'Bericht',
        'sv': 'Meddelande',
        'no': 'Melding',
        'da': 'Besked',
        'fi': 'Viesti',
        'pl': 'Wiadomość',
        'tr': 'Mesaj',
        'th': 'ข้อความ'
      },
      'Company Size': {
        'es': 'Tamaño de Empresa',
        'fr': 'Taille de l\'Entreprise',
        'de': 'Unternehmensgröße',
        'it': 'Dimensione Azienda',
        'pt': 'Tamanho da Empresa',
        'ru': 'Размер компании',
        'ja': '会社規模',
        'ko': '회사 규모',
        'zh': '公司规模',
        'ar': 'حجم الشركة',
        'hi': 'कंपनी का आकार',
        'nl': 'Bedrijfsgrootte',
        'sv': 'Företagsstorlek',
        'no': 'Bedriftsstørrelse',
        'da': 'Virksomhedsstørrelse',
        'fi': 'Yrityksen Koko',
        'pl': 'Rozmiar Firmy',
        'tr': 'Şirket Büyüklüğü',
        'th': 'ขนาดบริษัท'
      }
    };

    // Return translated text if available, otherwise return original
    return translations[text]?.[targetLanguage] || text;
  }

  // Translate an entire form
  async translateForm(formId: number, targetLanguages: string[]): Promise<FormTranslation> {
    const existingTranslation = this.translations.get(formId);
    const translations: Translation[] = [];

    for (const langCode of targetLanguages) {
      const language = this.getSupportedLanguages().find(l => l.code === langCode);
      if (!language) continue;

      // Mock translation data - in real implementation, this would call translation API
      const translationData: Translation = {
        language: language.name,
        code: langCode,
        flag: language.flag,
        translations: {
          'formTitle': await this.translateText('Contact Form', langCode),
          'formDescription': await this.translateText('Please fill out this form to get in touch', langCode),
          'requiredField': await this.translateText('This field is required', langCode),
          'submitButton': await this.translateText('Submit', langCode),
          'thankYouMessage': await this.translateText('Thank you for your submission!', langCode),
          'errorMessage': await this.translateText('Please check your information and try again', langCode)
        }
      };

      translations.push(translationData);
    }

    const formTranslation: FormTranslation = {
      formId,
      originalLanguage: 'en',
      translations,
      autoTranslate: true,
      lastUpdated: new Date()
    };

    this.translations.set(formId, formTranslation);
    return formTranslation;
  }

  // Get translations for a specific form
  getFormTranslations(formId: number): FormTranslation | undefined {
    return this.translations.get(formId);
  }

  // Get translated field label
  getTranslatedField(formId: number, fieldLabel: string, languageCode: string): string {
    const formTranslations = this.translations.get(formId);
    if (!formTranslations) return fieldLabel;

    const translation = formTranslations.translations.find(t => t.code === languageCode);
    if (!translation) return fieldLabel;

    // Check for direct translation or fallback to auto-translate
    return translation.translations[fieldLabel] || fieldLabel;
  }

  // Auto-detect language from browser
  detectBrowserLanguage(): string {
    const browserLang = navigator.language.split('-')[0];
    const supportedCodes = this.getSupportedLanguages().map(l => l.code);
    return supportedCodes.includes(browserLang) ? browserLang : 'en';
  }

  // Get RTL languages
  isRTLLanguage(languageCode: string): boolean {
    return ['ar', 'he', 'fa', 'ur'].includes(languageCode);
  }

  // Export translations for external use
  exportTranslations(formId: number): string {
    const translations = this.translations.get(formId);
    if (!translations) return '';

    return JSON.stringify(translations, null, 2);
  }

  // Import translations from JSON
  importTranslations(formId: number, translationsJson: string): boolean {
    try {
      const parsedTranslations = JSON.parse(translationsJson) as FormTranslation;
      parsedTranslations.formId = formId;
      parsedTranslations.lastUpdated = new Date();
      this.translations.set(formId, parsedTranslations);
      return true;
    } catch (error) {
      console.error('Error importing translations:', error);
      return false;
    }
  }
}

export const translationService = TranslationService.getInstance();