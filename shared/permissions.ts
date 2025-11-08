// Comprehensive Role-Based Permissions System for ARGILETTE Platform

// Permission Modules - Organized by feature area
export const PERMISSION_MODULES = {
  // CRM Core
  CONTACTS: 'contacts',
  LEADS: 'leads',
  DEALS: 'deals',
  ACCOUNTS: 'accounts',
  TASKS: 'tasks',
  ACTIVITIES: 'activities',
  
  // Marketing & Communications
  CAMPAIGNS: 'campaigns',
  EMAIL_MARKETING: 'email_marketing',
  SMS_MARKETING: 'sms_marketing',
  FORMS: 'forms',
  LANDING_PAGES: 'landing_pages',
  
  // E-commerce
  PRODUCTS: 'products',
  ORDERS: 'orders',
  INVENTORY: 'inventory',
  STORE_SETTINGS: 'store_settings',
  
  // SEO & Analytics
  SEO: 'seo',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  LINK_BUILDING: 'link_building',
  
  // AI & Automation
  AI_CAMPAIGNS: 'ai_campaigns',
  AI_AUTOMATION: 'ai_automation',
  CLOE_AI: 'cloe_ai',
  
  // Project Management & HR
  PROJECTS: 'projects',
  TEAM_MEMBERS: 'team_members',
  RESOURCES: 'resources',
  DOCUMENTS: 'documents',
  
  // Financial Management
  INVOICES: 'invoices',
  EXPENSES: 'expenses',
  TRANSACTIONS: 'transactions',
  FINANCIAL_REPORTS: 'financial_reports',
  
  // Enterprise Features
  AB_TESTING: 'ab_testing',
  CLIENT_PORTAL: 'client_portal',
  UNIFIED_ANALYTICS: 'unified_analytics',
  RESOURCE_MANAGEMENT: 'resource_management',
  
  // Administration
  USERS: 'users',
  ROLES: 'roles',
  SETTINGS: 'settings',
  BILLING: 'billing',
  WHITE_LABEL: 'white_label',
} as const;

// Permission Actions
export const PERMISSION_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ADMIN: 'admin',      // Full control over module
  EXPORT: 'export',    // Export data
  IMPORT: 'import',    // Import data
  SHARE: 'share',      // Share with others
} as const;

// Complete permission list (module.action format)
export const PERMISSIONS = {
  // CRM Contacts
  CONTACTS_READ: 'contacts.read',
  CONTACTS_CREATE: 'contacts.create',
  CONTACTS_UPDATE: 'contacts.update',
  CONTACTS_DELETE: 'contacts.delete',
  CONTACTS_EXPORT: 'contacts.export',
  CONTACTS_IMPORT: 'contacts.import',
  
  // Leads
  LEADS_READ: 'leads.read',
  LEADS_CREATE: 'leads.create',
  LEADS_UPDATE: 'leads.update',
  LEADS_DELETE: 'leads.delete',
  LEADS_EXPORT: 'leads.export',
  
  // Deals
  DEALS_READ: 'deals.read',
  DEALS_CREATE: 'deals.create',
  DEALS_UPDATE: 'deals.update',
  DEALS_DELETE: 'deals.delete',
  DEALS_EXPORT: 'deals.export',
  
  // Accounts
  ACCOUNTS_READ: 'accounts.read',
  ACCOUNTS_CREATE: 'accounts.create',
  ACCOUNTS_UPDATE: 'accounts.update',
  ACCOUNTS_DELETE: 'accounts.delete',
  
  // Tasks
  TASKS_READ: 'tasks.read',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  
  // Marketing
  CAMPAIGNS_READ: 'campaigns.read',
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_UPDATE: 'campaigns.update',
  CAMPAIGNS_DELETE: 'campaigns.delete',
  CAMPAIGNS_ADMIN: 'campaigns.admin',
  
  EMAIL_MARKETING_READ: 'email_marketing.read',
  EMAIL_MARKETING_CREATE: 'email_marketing.create',
  EMAIL_MARKETING_UPDATE: 'email_marketing.update',
  EMAIL_MARKETING_DELETE: 'email_marketing.delete',
  
  SMS_MARKETING_READ: 'sms_marketing.read',
  SMS_MARKETING_CREATE: 'sms_marketing.create',
  SMS_MARKETING_UPDATE: 'sms_marketing.update',
  SMS_MARKETING_DELETE: 'sms_marketing.delete',
  
  FORMS_READ: 'forms.read',
  FORMS_CREATE: 'forms.create',
  FORMS_UPDATE: 'forms.update',
  FORMS_DELETE: 'forms.delete',
  FORMS_EXPORT: 'forms.export',
  
  // E-commerce
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_IMPORT: 'products.import',
  
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_EXPORT: 'orders.export',
  
  INVENTORY_READ: 'inventory.read',
  INVENTORY_UPDATE: 'inventory.update',
  INVENTORY_ADMIN: 'inventory.admin',
  
  STORE_SETTINGS_READ: 'store_settings.read',
  STORE_SETTINGS_UPDATE: 'store_settings.update',
  STORE_SETTINGS_ADMIN: 'store_settings.admin',
  
  // SEO & Analytics
  SEO_READ: 'seo.read',
  SEO_CREATE: 'seo.create',
  SEO_UPDATE: 'seo.update',
  SEO_ADMIN: 'seo.admin',
  
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_EXPORT: 'analytics.export',
  
  REPORTS_READ: 'reports.read',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',
  
  LINK_BUILDING_READ: 'link_building.read',
  LINK_BUILDING_CREATE: 'link_building.create',
  LINK_BUILDING_UPDATE: 'link_building.update',
  LINK_BUILDING_DELETE: 'link_building.delete',
  
  // AI Features
  AI_CAMPAIGNS_READ: 'ai_campaigns.read',
  AI_CAMPAIGNS_CREATE: 'ai_campaigns.create',
  AI_CAMPAIGNS_UPDATE: 'ai_campaigns.update',
  AI_CAMPAIGNS_DELETE: 'ai_campaigns.delete',
  
  AI_AUTOMATION_READ: 'ai_automation.read',
  AI_AUTOMATION_CREATE: 'ai_automation.create',
  AI_AUTOMATION_UPDATE: 'ai_automation.update',
  AI_AUTOMATION_DELETE: 'ai_automation.delete',
  
  CLOE_AI_READ: 'cloe_ai.read',
  CLOE_AI_ADMIN: 'cloe_ai.admin',
  
  // Projects
  PROJECTS_READ: 'projects.read',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',
  PROJECTS_ADMIN: 'projects.admin',
  
  TEAM_MEMBERS_READ: 'team_members.read',
  TEAM_MEMBERS_CREATE: 'team_members.create',
  TEAM_MEMBERS_UPDATE: 'team_members.update',
  TEAM_MEMBERS_DELETE: 'team_members.delete',
  
  RESOURCES_READ: 'resources.read',
  RESOURCES_CREATE: 'resources.create',
  RESOURCES_UPDATE: 'resources.update',
  RESOURCES_DELETE: 'resources.delete',
  
  DOCUMENTS_READ: 'documents.read',
  DOCUMENTS_CREATE: 'documents.create',
  DOCUMENTS_UPDATE: 'documents.update',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_SHARE: 'documents.share',
  
  // Financial
  INVOICES_READ: 'invoices.read',
  INVOICES_CREATE: 'invoices.create',
  INVOICES_UPDATE: 'invoices.update',
  INVOICES_DELETE: 'invoices.delete',
  INVOICES_EXPORT: 'invoices.export',
  
  EXPENSES_READ: 'expenses.read',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_UPDATE: 'expenses.update',
  EXPENSES_DELETE: 'expenses.delete',
  
  TRANSACTIONS_READ: 'transactions.read',
  TRANSACTIONS_ADMIN: 'transactions.admin',
  
  FINANCIAL_REPORTS_READ: 'financial_reports.read',
  FINANCIAL_REPORTS_EXPORT: 'financial_reports.export',
  
  // Enterprise Features
  AB_TESTING_READ: 'ab_testing.read',
  AB_TESTING_CREATE: 'ab_testing.create',
  AB_TESTING_UPDATE: 'ab_testing.update',
  AB_TESTING_DELETE: 'ab_testing.delete',
  AB_TESTING_ADMIN: 'ab_testing.admin',
  
  CLIENT_PORTAL_READ: 'client_portal.read',
  CLIENT_PORTAL_ADMIN: 'client_portal.admin',
  
  UNIFIED_ANALYTICS_READ: 'unified_analytics.read',
  
  RESOURCE_MANAGEMENT_READ: 'resource_management.read',
  RESOURCE_MANAGEMENT_CREATE: 'resource_management.create',
  RESOURCE_MANAGEMENT_UPDATE: 'resource_management.update',
  RESOURCE_MANAGEMENT_DELETE: 'resource_management.delete',
  
  // Administration
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ADMIN: 'users.admin',
  
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_ADMIN: 'roles.admin',
  
  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_ADMIN: 'settings.admin',
  
  BILLING_READ: 'billing.read',
  BILLING_UPDATE: 'billing.update',
  BILLING_ADMIN: 'billing.admin',
  
  WHITE_LABEL_READ: 'white_label.read',
  WHITE_LABEL_UPDATE: 'white_label.update',
  WHITE_LABEL_ADMIN: 'white_label.admin',
} as const;

// Role Definitions - Predefined system roles
export const SYSTEM_ROLES = {
  PLATFORM_OWNER: 'platform_owner', // Unrestricted super admin (abel@argilette.com only)
  ADMIN: 'admin',                    // Full tenant admin access
  MANAGER: 'manager',                // Department/team manager
  USER: 'user',                      // Standard user
  VIEWER: 'viewer',                  // Read-only access
} as const;

// Default permissions for each system role
export const DEFAULT_ROLE_PERMISSIONS = {
  [SYSTEM_ROLES.PLATFORM_OWNER]: ['*'], // Wildcard grants unrestricted access to everything
  
  [SYSTEM_ROLES.ADMIN]: [
    // CRM - Full access
    ...Object.values(PERMISSIONS).filter(p => 
      p.startsWith('contacts.') || p.startsWith('leads.') || 
      p.startsWith('deals.') || p.startsWith('accounts.') || p.startsWith('tasks.')
    ),
    // Marketing - Full access
    ...Object.values(PERMISSIONS).filter(p => 
      p.startsWith('campaigns.') || p.startsWith('email_marketing.') || 
      p.startsWith('sms_marketing.') || p.startsWith('forms.')
    ),
    // E-commerce - Full access
    ...Object.values(PERMISSIONS).filter(p => 
      p.startsWith('products.') || p.startsWith('orders.') || 
      p.startsWith('inventory.') || p.startsWith('store_settings.')
    ),
    // SEO - Full access
    ...Object.values(PERMISSIONS).filter(p => 
      p.startsWith('seo.') || p.startsWith('analytics.') || 
      p.startsWith('reports.') || p.startsWith('link_building.')
    ),
    // AI Features - Full access
    ...Object.values(PERMISSIONS).filter(p => 
      p.startsWith('ai_campaigns.') || p.startsWith('ai_automation.') || p.startsWith('cloe_ai.')
    ),
    // Projects - Full access
    ...Object.values(PERMISSIONS).filter(p => 
      p.startsWith('projects.') || p.startsWith('team_members.') || 
      p.startsWith('resources.') || p.startsWith('documents.')
    ),
    // Financial - Read & Create
    PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_CREATE, PERMISSIONS.INVOICES_UPDATE, PERMISSIONS.INVOICES_EXPORT,
    PERMISSIONS.EXPENSES_READ, PERMISSIONS.EXPENSES_CREATE, PERMISSIONS.EXPENSES_UPDATE,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.FINANCIAL_REPORTS_READ, PERMISSIONS.FINANCIAL_REPORTS_EXPORT,
    // Enterprise Features - Read access
    PERMISSIONS.AB_TESTING_READ, PERMISSIONS.AB_TESTING_CREATE, PERMISSIONS.AB_TESTING_UPDATE,
    PERMISSIONS.CLIENT_PORTAL_READ,
    PERMISSIONS.UNIFIED_ANALYTICS_READ,
    PERMISSIONS.RESOURCE_MANAGEMENT_READ, PERMISSIONS.RESOURCE_MANAGEMENT_CREATE, PERMISSIONS.RESOURCE_MANAGEMENT_UPDATE,
    // Admin functions
    PERMISSIONS.USERS_READ, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_ADMIN,
    PERMISSIONS.ROLES_READ, PERMISSIONS.ROLES_CREATE, PERMISSIONS.ROLES_UPDATE,
    PERMISSIONS.SETTINGS_READ, PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.BILLING_READ,
  ],
  
  [SYSTEM_ROLES.MANAGER]: [
    // CRM - Full access
    PERMISSIONS.CONTACTS_READ, PERMISSIONS.CONTACTS_CREATE, PERMISSIONS.CONTACTS_UPDATE, PERMISSIONS.CONTACTS_EXPORT,
    PERMISSIONS.LEADS_READ, PERMISSIONS.LEADS_CREATE, PERMISSIONS.LEADS_UPDATE, PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.DEALS_READ, PERMISSIONS.DEALS_CREATE, PERMISSIONS.DEALS_UPDATE, PERMISSIONS.DEALS_EXPORT,
    PERMISSIONS.ACCOUNTS_READ, PERMISSIONS.ACCOUNTS_CREATE, PERMISSIONS.ACCOUNTS_UPDATE,
    PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_UPDATE, PERMISSIONS.TASKS_DELETE,
    // Marketing - Full access
    PERMISSIONS.CAMPAIGNS_READ, PERMISSIONS.CAMPAIGNS_CREATE, PERMISSIONS.CAMPAIGNS_UPDATE,
    PERMISSIONS.EMAIL_MARKETING_READ, PERMISSIONS.EMAIL_MARKETING_CREATE, PERMISSIONS.EMAIL_MARKETING_UPDATE,
    PERMISSIONS.SMS_MARKETING_READ, PERMISSIONS.SMS_MARKETING_CREATE, PERMISSIONS.SMS_MARKETING_UPDATE,
    PERMISSIONS.FORMS_READ, PERMISSIONS.FORMS_CREATE, PERMISSIONS.FORMS_UPDATE, PERMISSIONS.FORMS_EXPORT,
    // E-commerce - Read & Update
    PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_UPDATE, PERMISSIONS.ORDERS_EXPORT,
    PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_UPDATE,
    // SEO - Read & Create
    PERMISSIONS.SEO_READ, PERMISSIONS.SEO_CREATE, PERMISSIONS.SEO_UPDATE,
    PERMISSIONS.ANALYTICS_READ, PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_CREATE, PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.LINK_BUILDING_READ, PERMISSIONS.LINK_BUILDING_CREATE, PERMISSIONS.LINK_BUILDING_UPDATE,
    // AI Features - Read & Create
    PERMISSIONS.AI_CAMPAIGNS_READ, PERMISSIONS.AI_CAMPAIGNS_CREATE, PERMISSIONS.AI_CAMPAIGNS_UPDATE,
    PERMISSIONS.AI_AUTOMATION_READ, PERMISSIONS.AI_AUTOMATION_CREATE, PERMISSIONS.AI_AUTOMATION_UPDATE,
    PERMISSIONS.CLOE_AI_READ,
    // Projects - Full access
    PERMISSIONS.PROJECTS_READ, PERMISSIONS.PROJECTS_CREATE, PERMISSIONS.PROJECTS_UPDATE, PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.TEAM_MEMBERS_READ, PERMISSIONS.TEAM_MEMBERS_CREATE, PERMISSIONS.TEAM_MEMBERS_UPDATE,
    PERMISSIONS.RESOURCES_READ, PERMISSIONS.RESOURCES_CREATE, PERMISSIONS.RESOURCES_UPDATE,
    PERMISSIONS.DOCUMENTS_READ, PERMISSIONS.DOCUMENTS_CREATE, PERMISSIONS.DOCUMENTS_UPDATE, PERMISSIONS.DOCUMENTS_SHARE,
    // Financial - Read only
    PERMISSIONS.INVOICES_READ, PERMISSIONS.INVOICES_EXPORT,
    PERMISSIONS.EXPENSES_READ,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.FINANCIAL_REPORTS_READ, PERMISSIONS.FINANCIAL_REPORTS_EXPORT,
    // Enterprise Features - Read only
    PERMISSIONS.AB_TESTING_READ,
    PERMISSIONS.CLIENT_PORTAL_READ,
    PERMISSIONS.UNIFIED_ANALYTICS_READ,
    PERMISSIONS.RESOURCE_MANAGEMENT_READ, PERMISSIONS.RESOURCE_MANAGEMENT_CREATE, PERMISSIONS.RESOURCE_MANAGEMENT_UPDATE,
    // Limited admin
    PERMISSIONS.USERS_READ,
    PERMISSIONS.SETTINGS_READ,
  ],
  
  [SYSTEM_ROLES.USER]: [
    // CRM - Read & Create
    PERMISSIONS.CONTACTS_READ, PERMISSIONS.CONTACTS_CREATE, PERMISSIONS.CONTACTS_UPDATE,
    PERMISSIONS.LEADS_READ, PERMISSIONS.LEADS_CREATE, PERMISSIONS.LEADS_UPDATE,
    PERMISSIONS.DEALS_READ, PERMISSIONS.DEALS_CREATE, PERMISSIONS.DEALS_UPDATE,
    PERMISSIONS.ACCOUNTS_READ,
    PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_CREATE, PERMISSIONS.TASKS_UPDATE,
    // Marketing - Read & Create
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.EMAIL_MARKETING_READ, PERMISSIONS.EMAIL_MARKETING_CREATE,
    PERMISSIONS.SMS_MARKETING_READ, PERMISSIONS.SMS_MARKETING_CREATE,
    PERMISSIONS.FORMS_READ, PERMISSIONS.FORMS_CREATE,
    // E-commerce - Read only
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.INVENTORY_READ,
    // SEO - Read only
    PERMISSIONS.SEO_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.LINK_BUILDING_READ,
    // AI Features - Read & Create
    PERMISSIONS.AI_CAMPAIGNS_READ, PERMISSIONS.AI_CAMPAIGNS_CREATE,
    PERMISSIONS.AI_AUTOMATION_READ,
    PERMISSIONS.CLOE_AI_READ,
    // Projects - Read & Create own
    PERMISSIONS.PROJECTS_READ, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.TEAM_MEMBERS_READ,
    PERMISSIONS.RESOURCES_READ,
    PERMISSIONS.DOCUMENTS_READ, PERMISSIONS.DOCUMENTS_CREATE, PERMISSIONS.DOCUMENTS_UPDATE,
    // Financial - Read only
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.EXPENSES_READ,
    // Enterprise Features - Read only
    PERMISSIONS.UNIFIED_ANALYTICS_READ,
    PERMISSIONS.RESOURCE_MANAGEMENT_READ,
  ],
  
  [SYSTEM_ROLES.VIEWER]: [
    // CRM - Read only
    PERMISSIONS.CONTACTS_READ,
    PERMISSIONS.LEADS_READ,
    PERMISSIONS.DEALS_READ,
    PERMISSIONS.ACCOUNTS_READ,
    PERMISSIONS.TASKS_READ,
    // Marketing - Read only
    PERMISSIONS.CAMPAIGNS_READ,
    PERMISSIONS.EMAIL_MARKETING_READ,
    PERMISSIONS.SMS_MARKETING_READ,
    PERMISSIONS.FORMS_READ,
    // E-commerce - Read only
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.ORDERS_READ,
    // SEO - Read only
    PERMISSIONS.SEO_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_READ,
    // AI Features - Read only
    PERMISSIONS.AI_CAMPAIGNS_READ,
    PERMISSIONS.CLOE_AI_READ,
    // Projects - Read only
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.TEAM_MEMBERS_READ,
    PERMISSIONS.RESOURCES_READ,
    PERMISSIONS.DOCUMENTS_READ,
    // Financial - Read only
    PERMISSIONS.INVOICES_READ,
    // Enterprise Features - Read only
    PERMISSIONS.UNIFIED_ANALYTICS_READ,
  ],
};

// Helper function to check if user has specific permission
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // Platform owner bypasses all permission checks
  if (userPermissions.includes('*') || userPermissions.includes('platform_owner.*')) {
    return true;
  }
  
  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }
  
  // Check for wildcard module permissions (e.g., "contacts.*" grants all contact permissions)
  const [module] = requiredPermission.split('.');
  if (userPermissions.includes(`${module}.*`)) {
    return true;
  }
  
  return false;
}

// Helper function to check if user has any of the required permissions
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

// Helper function to check if user has all required permissions
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

// Helper function to get all permissions for a specific module
export function getModulePermissions(module: string): string[] {
  return Object.values(PERMISSIONS).filter(p => p.startsWith(`${module}.`));
}

// Helper function to check if user is platform owner
export function isPlatformOwner(email: string): boolean {
  return email === 'abel@argilette.com';
}

// Helper function to check if user has admin role
export function isAdmin(role: string): boolean {
  return role === SYSTEM_ROLES.PLATFORM_OWNER || role === SYSTEM_ROLES.ADMIN;
}

// Helper function to get permission label (for UI display)
export function getPermissionLabel(permission: string): string {
  const [module, action] = permission.split('.');
  const moduleLabel = module.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
  return `${moduleLabel} - ${actionLabel}`;
}

// Export types
export type PermissionModule = typeof PERMISSION_MODULES[keyof typeof PERMISSION_MODULES];
export type PermissionAction = typeof PERMISSION_ACTIONS[keyof typeof PERMISSION_ACTIONS];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];
