import { base44 } from '@base44/sdk';

export default async function backupToGoogleDrive(request) {
  const { backupType } = request.body;
  
  try {
    // Get Google Drive access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
    
    let fileData, fileName, mimeType;
    
    if (backupType === 'full') {
      // Fetch all entities data
      const entities = ['Student', 'Teacher', 'Class', 'Assignment', 'Submission', 'Exam', 'ExamResult', 
                       'ExamAttempt', 'Attendance', 'Behavior', 'FeeInvoice', 'Payment', 'ReportCard',
                       'BookInventory', 'BookSale', 'PurchaseOrder', 'Application', 'Conference'];
      
      const allData = {};
      
      for (const entityName of entities) {
        try {
          const data = await base44.asServiceRole.entities[entityName].list();
          allData[entityName] = data;
        } catch (e) {
          console.log(`Skipping ${entityName}:`, e.message);
        }
      }
      
      // Create backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fileName = `SchoolMIS_FullBackup_${timestamp}.json`;
      fileData = JSON.stringify(allData, null, 2);
      mimeType = 'application/json';
      
    } else if (backupType === 'reports') {
      // Fetch report cards
      const reportCards = await base44.asServiceRole.entities.ReportCard.list();
      const examResults = await base44.asServiceRole.entities.ExamResult.list();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fileName = `SchoolMIS_Reports_${timestamp}.json`;
      fileData = JSON.stringify({ reportCards, examResults }, null, 2);
      mimeType = 'application/json';
      
    } else if (backupType === 'results') {
      // Fetch exam results and attempts
      const examResults = await base44.asServiceRole.entities.ExamResult.list();
      const examAttempts = await base44.asServiceRole.entities.ExamAttempt.list();
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fileName = `SchoolMIS_ExamResults_${timestamp}.json`;
      fileData = JSON.stringify({ examResults, examAttempts }, null, 2);
      mimeType = 'application/json';
    }
    
    // Upload to Google Drive
    const metadata = {
      name: fileName,
      mimeType: mimeType
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileData], { type: mimeType }));
    
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
      message: 'Backup uploaded to Google Drive successfully'
    };
    
  } catch (error) {
    console.error('Backup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}