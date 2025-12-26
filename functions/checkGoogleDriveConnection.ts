import { base44 } from '@base44/sdk';

export default async function checkGoogleDriveConnection(request) {
  try {
    // Try to get access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    
    // If we get here, connection is valid
    return {
      connected: true,
      hasToken: !!accessToken
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}