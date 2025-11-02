// Auth utility functions for API requests
export function getAuthHeaders(): Record<string, string> {
  // Get current user from localStorage or default to platform owner
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const email = user.email || 'abel@argilette.org';
  
  return {
    'Content-Type': 'application/json',
    'x-auth-email': email,
    'authorization': 'Bearer demo-token'
  };
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || '{}');
}

export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return Boolean(user.email);
}

export function isPlatformOwner(): boolean {
  const user = getCurrentUser();
  return user.email === 'abel@argilette.org' || user.email === 'admin@default.com';
}