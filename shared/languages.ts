export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  googleTranslateCode: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false, googleTranslateCode: 'en', region: 'North America' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false, googleTranslateCode: 'es', region: 'Europe' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false, googleTranslateCode: 'fr', region: 'Europe' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false, googleTranslateCode: 'de', region: 'Europe' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true, googleTranslateCode: 'ar', region: 'Middle East' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false, googleTranslateCode: 'zh-cn', region: 'Asia' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false, googleTranslateCode: 'ja', region: 'Asia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false, googleTranslateCode: 'hi', region: 'Asia' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false, googleTranslateCode: 'pt', region: 'Europe' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false, googleTranslateCode: 'ru', region: 'Europe' }
];

export const DEFAULT_LANGUAGE = 'en';

export const UI_TRANSLATIONS = {
  en: {
    welcome: 'Welcome',
    dashboard: 'Dashboard',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    save: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add New',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information'
  },
  es: {
    welcome: 'Bienvenido',
    dashboard: 'Tablero',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    save: 'Guardar Cambios',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Agregar Nuevo',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información'
  },
  fr: {
    welcome: 'Bienvenue',
    dashboard: 'Tableau de Bord',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
    save: 'Enregistrer les Modifications',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter Nouveau',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    info: 'Information'
  },
  de: {
    welcome: 'Willkommen',
    dashboard: 'Dashboard',
    settings: 'Einstellungen',
    profile: 'Profil',
    logout: 'Abmelden',
    save: 'Änderungen Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Neu Hinzufügen',
    search: 'Suchen',
    filter: 'Filtern',
    sort: 'Sortieren',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    warning: 'Warnung',
    info: 'Information'
  },
  ar: {
    welcome: 'مرحباً',
    dashboard: 'لوحة التحكم',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    add: 'إضافة جديد',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    loading: 'جارٍ التحميل...',
    error: 'خطأ',
    success: 'نجح',
    warning: 'تحذير',
    info: 'معلومات'
  }
};

export const RTL_LANGUAGES = ['ar', 'he', 'fa'];

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getLanguagesByRegion = (region: string): Language[] => {
  return SUPPORTED_LANGUAGES.filter(lang => lang.region === region);
};

export const isRTLLanguage = (code: string): boolean => {
  return RTL_LANGUAGES.includes(code);
};

export const getGoogleTranslateCode = (code: string): string => {
  const language = getLanguageByCode(code);
  return language?.googleTranslateCode || code;
};

export const getBrowserLanguage = (): string => {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || (navigator as any).userLanguage;
    return lang.substring(0, 2);
  }
  return DEFAULT_LANGUAGE;
};

export const getStoredLanguage = (): string => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('preferred-language') || DEFAULT_LANGUAGE;
  }
  return DEFAULT_LANGUAGE;
};

export const setStoredLanguage = (code: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('preferred-language', code);
  }
};