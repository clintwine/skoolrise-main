import { createClientFromRequest } from 'npm:@base44/sdk@latest';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Revoke the Google Drive authorization
        await base44.asServiceRole.connectors.revokeAuthorization('googledrive');

        return Response.json({ success: true, message: 'Google Drive disconnected successfully.' });
    } catch (error) {
        console.error('Error disconnecting Google Drive:', error);
        return Response.json({ success: false, error: error.message || 'Failed to disconnect Google Drive.' }, { status: 500 });
    }
});