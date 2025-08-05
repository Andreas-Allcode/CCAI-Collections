import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6887c7f436d0e3d08261cbc1", 
  requiresAuth: true // Ensure authentication is required for all operations
});
