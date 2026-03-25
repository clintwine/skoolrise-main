import { base44 } from '@base44/sdk';

export default async function uploadFileToGoogleDrive(request) {
  const { fileUrl, fileName, mimeType } = request.body;
  
  try {
    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    
    // Fetch the file from the URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file');
    }
    
    const fileData = await fileResponse.blob();
    
    // Upload to Google Drive
    const metadata = {
      name: fileName,
      mimeType: mimeType || 'application/octet-stream'
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileData);
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload to Google Drive');
    }
    
    const result = await response.json();
    
    return {
      success: true,
      fileId: result.id,
      fileName: fileName,
      message: 'File uploaded to Google Drive successfully'
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}