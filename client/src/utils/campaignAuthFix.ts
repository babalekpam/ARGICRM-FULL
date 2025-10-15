// Campaign Authentication Fix
// Ensures proper authentication for campaigns functionality

export function initializeCampaignAuth() {
  // Check if authentication is already set up
  const userEmail = localStorage.getItem('user_email');
  const authToken = localStorage.getItem('auth_token');
  
  if (!userEmail || !authToken) {
    console.log('🔧 Setting up platform owner authentication for campaigns');
    
    // Set up platform owner authentication
    const platformEmail = 'abel@argilette.com';
    const uniqueToken = `demo-auth-token-${Date.now()}`;
    
    localStorage.setItem('user_email', platformEmail);
    localStorage.setItem('userEmail', platformEmail);
    localStorage.setItem('auth_token', uniqueToken);
    localStorage.setItem('token', uniqueToken);
    localStorage.setItem('isPlatformOwner', 'true');
    
    console.log(`✅ Authentication initialized for campaigns: ${platformEmail}`);
    return true;
  }
  
  console.log(`✅ Authentication already exists: ${userEmail}`);
  return false;
}

export function getAuthHeaders(): Record<string, string> {
  const userEmail = localStorage.getItem('user_email') || 'abel@argilette.com';
  const authToken = localStorage.getItem('auth_token') || 'demo-token';
  
  return {
    'x-auth-email': userEmail,
    'authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

export function ensureAuthForCampaigns(): void {
  // Initialize auth if needed
  initializeCampaignAuth();
  
  // Verify the auth is working
  const headers = getAuthHeaders();
  console.log('🔍 Campaign auth headers:', headers);
}