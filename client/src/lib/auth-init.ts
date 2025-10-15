// Authentication initialization utility
// Ensures proper authentication tokens are set for data access

export function initializeAuth() {
  // Check if we have stored user credentials but no longer auto-initialize as platform owner
  const storedEmail = localStorage.getItem('user_email');
  
  if (!storedEmail) {
    // No stored credentials - user needs to login manually
    console.log('No stored authentication - user needs to login');
  } else {
    console.log('Using stored authentication for:', storedEmail);
  }
}

export function isAuthenticated(): boolean {
  return !!(localStorage.getItem('user_email') && localStorage.getItem('auth_token'));
}

export function logout() {
  // Clear all authentication data
  localStorage.removeItem('user_email');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('isPlatformOwner');
  console.log('LOGOUT: Clearing all authentication data');
}

export function loginAsUser(email: string, authToken: string, isPlatformOwner: boolean = false) {
  // Clear all existing authentication first
  localStorage.removeItem('user_email');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('token');
  localStorage.removeItem('isPlatformOwner');
  
  // Set new user credentials with unique token
  const uniqueToken = `demo-auth-token-${email}-${Date.now()}`;
  localStorage.setItem('user_email', email);
  localStorage.setItem('userEmail', email);
  localStorage.setItem('auth_token', uniqueToken);
  localStorage.setItem('token', uniqueToken);
  localStorage.setItem('isPlatformOwner', isPlatformOwner.toString());
  console.log(`SWITCH: Logging in as: ${email}, Platform Owner: ${isPlatformOwner}`);
}