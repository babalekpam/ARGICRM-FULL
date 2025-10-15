interface TranslationData {
  [key: string]: string | TranslationData;
}

interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', rtl: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', rtl: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', rtl: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', rtl: false }
];

const translations: Record<string, TranslationData> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    contacts: 'Contacts',
    accounts: 'Accounts',
    leads: 'Leads',
    deals: 'Deals',
    tasks: 'Tasks',
    campaigns: 'Campaigns',
    tickets: 'Tickets',
    projects: 'Projects',
    invoices: 'Invoices',
    bookkeeping: 'Bookkeeping',
    employees: 'Employees',
    sentiment: 'Sentiment Analysis',
    emailMarketing: 'Email Marketing',
    smsMarketing: 'SMS Marketing',
    landingPages: 'Landing Pages',
    teamCollaboration: 'Team Collaboration',
    unifiedInbox: 'Unified Inbox',
    scheduling: 'Scheduling',
    funnelBuilder: 'Funnel Builder',
    formsSurveys: 'Forms & Surveys',
    reputationManagement: 'Reputation Management',
    security: 'Security',
    analytics: 'Analytics',
    workflows: 'Workflows',
    reports: 'Reports',
    roles: 'Roles & Permissions',

    // Common actions
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    import: 'Import',
    settings: 'Settings',
    logout: 'Logout',
    login: 'Login',
    signup: 'Sign Up',

    // Dashboard
    overview: 'Overview',
    totalRevenue: 'Total Revenue',
    activeDeals: 'Active Deals',
    newLeads: 'New Leads',
    completedTasks: 'Completed Tasks',
    recentActivity: 'Recent Activity',
    upcomingTasks: 'Upcoming Tasks',
    performanceMetrics: 'Performance Metrics',

    // Forms
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    status: 'Status',
    priority: 'Priority',
    description: 'Description',
    notes: 'Notes',
    assignedTo: 'Assigned To',
    dueDate: 'Due Date',
    amount: 'Amount',
    currency: 'Currency',

    // Status options
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    draft: 'Draft',
    published: 'Published',

    // Validation messages
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
    passwordMismatch: 'Passwords do not match',
    minimumLength: 'Minimum length is {length} characters',

    // Reputation Management
    reputationScore: 'Reputation Score',
    overallRating: 'Overall Rating',
    responseRate: 'Response Rate',
    avgResponseTime: 'Average Response Time',
    sentimentAnalysis: 'Sentiment Analysis',
    aiPredictor: 'AI Predictor',
    predictedRating: 'Predicted Rating',
    confidence: 'Confidence',
    recommendations: 'Recommendations',
    riskAssessment: 'Risk Assessment',
    opportunities: 'Opportunities',
    scenarioAnalysis: 'Scenario Analysis',
    bestCase: 'Best Case',
    worstCase: 'Worst Case',
    mostLikely: 'Most Likely',

    // Time periods
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',
    lastWeek: 'Last Week',
    lastMonth: 'Last Month',
    lastYear: 'Last Year',

    // Messages
    successMessage: 'Operation completed successfully',
    errorMessage: 'An error occurred. Please try again.',
    confirmDelete: 'Are you sure you want to delete this item?',
    noDataAvailable: 'No data available',
    loadingData: 'Loading data...',
    
    // SaaS specific
    subscriptionPlan: 'Subscription Plan',
    billingCycle: 'Billing Cycle',
    nextBilling: 'Next Billing',
    upgradeAccount: 'Upgrade Account',
    manageSubscription: 'Manage Subscription',
    accountLimits: 'Account Limits',
    usageStatistics: 'Usage Statistics',
    planFeatures: 'Plan Features'
  },

  es: {
    dashboard: 'Panel de Control',
    contacts: 'Contactos',
    accounts: 'Cuentas',
    leads: 'Prospectos',
    deals: 'Tratos',
    tasks: 'Tareas',
    campaigns: 'Campañas',
    tickets: 'Tickets',
    projects: 'Proyectos',
    invoices: 'Facturas',
    bookkeeping: 'Contabilidad',
    employees: 'Empleados',
    sentiment: 'Análisis de Sentimiento',
    emailMarketing: 'Marketing por Email',
    smsMarketing: 'Marketing por SMS',
    landingPages: 'Páginas de Destino',
    teamCollaboration: 'Colaboración en Equipo',
    unifiedInbox: 'Bandeja Unificada',
    scheduling: 'Programación',
    funnelBuilder: 'Constructor de Embudos',
    formsSurveys: 'Formularios y Encuestas',
    reputationManagement: 'Gestión de Reputación',
    security: 'Seguridad',
    analytics: 'Analíticas',
    workflows: 'Flujos de Trabajo',
    reports: 'Informes',
    roles: 'Roles y Permisos',

    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    submit: 'Enviar',
    search: 'Buscar',
    filter: 'Filtrar',
    export: 'Exportar',
    import: 'Importar',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',

    overview: 'Resumen',
    totalRevenue: 'Ingresos Totales',
    activeDeals: 'Tratos Activos',
    newLeads: 'Nuevos Prospectos',
    completedTasks: 'Tareas Completadas',
    recentActivity: 'Actividad Reciente',
    upcomingTasks: 'Tareas Próximas',
    performanceMetrics: 'Métricas de Rendimiento',

    name: 'Nombre',
    email: 'Correo Electrónico',
    phone: 'Teléfono',
    company: 'Empresa',
    status: 'Estado',
    priority: 'Prioridad',
    description: 'Descripción',
    notes: 'Notas',
    assignedTo: 'Asignado a',
    dueDate: 'Fecha de Vencimiento',
    amount: 'Cantidad',
    currency: 'Moneda',

    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
    completed: 'Completado',
    cancelled: 'Cancelado',
    draft: 'Borrador',
    published: 'Publicado',

    required: 'Este campo es obligatorio',
    invalidEmail: 'Por favor ingrese un email válido',
    invalidPhone: 'Por favor ingrese un teléfono válido',
    passwordMismatch: 'Las contraseñas no coinciden',
    minimumLength: 'La longitud mínima es {length} caracteres',

    successMessage: 'Operación completada exitosamente',
    errorMessage: 'Ocurrió un error. Por favor intente de nuevo.',
    confirmDelete: '¿Está seguro de que desea eliminar este elemento?',
    noDataAvailable: 'No hay datos disponibles',
    loadingData: 'Cargando datos...',

    subscriptionPlan: 'Plan de Suscripción',
    billingCycle: 'Ciclo de Facturación',
    nextBilling: 'Próxima Facturación',
    upgradeAccount: 'Actualizar Cuenta',
    manageSubscription: 'Gestionar Suscripción',
    accountLimits: 'Límites de Cuenta',
    usageStatistics: 'Estadísticas de Uso',
    planFeatures: 'Características del Plan'
  },

  fr: {
    dashboard: 'Tableau de Bord',
    contacts: 'Contacts',
    accounts: 'Comptes',
    leads: 'Prospects',
    deals: 'Affaires',
    tasks: 'Tâches',
    campaigns: 'Campagnes',
    tickets: 'Tickets',
    projects: 'Projets',
    invoices: 'Factures',
    bookkeeping: 'Comptabilité',
    employees: 'Employés',
    sentiment: 'Analyse de Sentiment',
    emailMarketing: 'Marketing par Email',
    smsMarketing: 'Marketing par SMS',
    landingPages: 'Pages de Destination',
    teamCollaboration: 'Collaboration d\'Équipe',
    unifiedInbox: 'Boîte de Réception Unifiée',
    scheduling: 'Planification',
    funnelBuilder: 'Constructeur d\'Entonnoir',
    formsSurveys: 'Formulaires et Enquêtes',
    reputationManagement: 'Gestion de Réputation',
    security: 'Sécurité',
    analytics: 'Analytiques',
    workflows: 'Flux de Travail',
    reports: 'Rapports',
    roles: 'Rôles et Permissions',

    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    submit: 'Soumettre',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    import: 'Importer',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    login: 'Connexion',
    signup: 'S\'inscrire',

    subscriptionPlan: 'Plan d\'Abonnement',
    billingCycle: 'Cycle de Facturation',
    nextBilling: 'Prochaine Facturation',
    upgradeAccount: 'Mettre à Niveau le Compte',
    manageSubscription: 'Gérer l\'Abonnement',
    accountLimits: 'Limites du Compte',
    usageStatistics: 'Statistiques d\'Utilisation',
    planFeatures: 'Fonctionnalités du Plan'
  },

  ar: {
    dashboard: 'لوحة القيادة',
    contacts: 'جهات الاتصال',
    accounts: 'الحسابات',
    leads: 'العملاء المحتملون',
    deals: 'الصفقات',
    tasks: 'المهام',
    campaigns: 'الحملات',
    tickets: 'التذاكر',
    projects: 'المشاريع',
    invoices: 'الفواتير',
    bookkeeping: 'مسك الدفاتر',
    employees: 'الموظفون',
    sentiment: 'تحليل المشاعر',
    emailMarketing: 'التسويق عبر البريد الإلكتروني',
    smsMarketing: 'التسويق عبر الرسائل النصية',
    landingPages: 'صفحات الهبوط',
    teamCollaboration: 'التعاون الجماعي',
    unifiedInbox: 'صندوق الوارد الموحد',
    scheduling: 'الجدولة',
    funnelBuilder: 'منشئ القمع',
    formsSurveys: 'النماذج والاستطلاعات',
    reputationManagement: 'إدارة السمعة',
    security: 'الأمان',
    analytics: 'التحليلات',
    workflows: 'تدفق العمل',
    reports: 'التقارير',
    roles: 'الأدوار والصلاحيات',

    create: 'إنشاء',
    edit: 'تحرير',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    submit: 'إرسال',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    import: 'استيراد',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    login: 'تسجيل الدخول',
    signup: 'اشتراك',

    subscriptionPlan: 'خطة الاشتراك',
    billingCycle: 'دورة الفوترة',
    nextBilling: 'الفوترة التالية',
    upgradeAccount: 'ترقية الحساب',
    manageSubscription: 'إدارة الاشتراك',
    accountLimits: 'حدود الحساب',
    usageStatistics: 'إحصائيات الاستخدام',
    planFeatures: 'ميزات الخطة'
  }
};

export class InternationalizationService {
  private static instance: InternationalizationService;
  private currentLanguage: string = 'en';
  private fallbackLanguage: string = 'en';
  private languageChangeListeners: Array<(language: string) => void> = [];

  static getInstance(): InternationalizationService {
    if (!InternationalizationService.instance) {
      InternationalizationService.instance = new InternationalizationService();
    }
    return InternationalizationService.instance;
  }

  constructor() {
    this.initializeLanguage();
  }

  private initializeLanguage() {
    // Get language from localStorage or browser preference
    const savedLanguage = localStorage.getItem('argilette-language');
    const browserLanguage = navigator.language.split('-')[0];
    
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      this.currentLanguage = savedLanguage;
    } else if (this.isLanguageSupported(browserLanguage)) {
      this.currentLanguage = browserLanguage;
    }
    
    this.applyLanguageDirection();
  }

  public getAvailableLanguages(): LanguageConfig[] {
    return languages;
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public getCurrentLanguageConfig(): LanguageConfig {
    return languages.find(lang => lang.code === this.currentLanguage) || languages[0];
  }

  public setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.currentLanguage = languageCode;
      localStorage.setItem('argilette-language', languageCode);
      this.applyLanguageDirection();
      this.notifyLanguageChange();
    }
  }

  private isLanguageSupported(languageCode: string): boolean {
    return languages.some(lang => lang.code === languageCode);
  }

  private applyLanguageDirection(): void {
    const config = this.getCurrentLanguageConfig();
    document.documentElement.dir = config.rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = config.code;
  }

  public translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let translation: any = translations[this.currentLanguage];
    
    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to English if key not found
        translation = translations[this.fallbackLanguage];
        for (const fallbackK of keys) {
          if (translation && typeof translation === 'object' && fallbackK in translation) {
            translation = translation[fallbackK];
          } else {
            return key; // Return key if translation not found
          }
        }
        break;
      }
    }
    
    if (typeof translation !== 'string') {
      return key;
    }
    
    // Replace parameters
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, value]) => str.replace(`{${param}}`, String(value)),
        translation
      );
    }
    
    return translation;
  }

  public addLanguageChangeListener(listener: (language: string) => void): void {
    this.languageChangeListeners.push(listener);
  }

  public removeLanguageChangeListener(listener: (language: string) => void): void {
    const index = this.languageChangeListeners.indexOf(listener);
    if (index > -1) {
      this.languageChangeListeners.splice(index, 1);
    }
  }

  private notifyLanguageChange(): void {
    this.languageChangeListeners.forEach(listener => listener(this.currentLanguage));
  }

  public formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLanguage, options).format(number);
  }

  public formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat(this.currentLanguage, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  public formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.currentLanguage, options).format(date);
  }

  public formatRelativeTime(date: Date): string {
    const rtf = new Intl.RelativeTimeFormat(this.currentLanguage, { numeric: 'auto' });
    const diffTime = date.getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      if (Math.abs(diffHours) < 1) {
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        return rtf.format(diffMinutes, 'minute');
      }
      return rtf.format(diffHours, 'hour');
    }
    
    if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day');
    }
    
    if (Math.abs(diffDays) < 30) {
      const diffWeeks = Math.ceil(diffDays / 7);
      return rtf.format(diffWeeks, 'week');
    }
    
    const diffMonths = Math.ceil(diffDays / 30);
    return rtf.format(diffMonths, 'month');
  }
}

export const i18n = InternationalizationService.getInstance();