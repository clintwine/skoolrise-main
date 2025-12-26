import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is authenticated
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to get the Google Drive access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
        
        return Response.json({ 
            connected: !!accessToken,
            message: accessToken ? 'Connected to Google Drive' : 'Not connected'
        });
    } catch (error) {
        return Response.json({ 
            connected: false,
            error: error.message 
        }, { status: 500 });
    }
});