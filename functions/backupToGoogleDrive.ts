import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Check if user is authenticated and is admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get request body
        const { backupType } = await req.json();

        // Get Google Drive access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledrive');
        if (!accessToken) {
            return Response.json({ 
                success: false, 
                error: 'Google Drive not connected' 
            }, { status: 400 });
        }

        // Collect data based on backup type
        let backupData = {};
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let fileName = '';

        if (backupType === 'full') {
            fileName = `SchoolMIS_FullBackup_${timestamp}.json`;
            
            // Fetch all entities
            const [students, teachers, classes, assignments, submissions, exams, 
                   examResults, attendance, fees, payments, behavior, enrollments] = await Promise.all([
                base44.asServiceRole.entities.Student.list(),
                base44.asServiceRole.entities.Teacher.list(),
                base44.asServiceRole.entities.Class.list(),
                base44.asServiceRole.entities.Assignment.list(),
                base44.asServiceRole.entities.Submission.list(),
                base44.asServiceRole.entities.Exam.list(),
                base44.asServiceRole.entities.ExamResult.list(),
                base44.asServiceRole.entities.Attendance.list(),
                base44.asServiceRole.entities.FeeInvoice.list(),
                base44.asServiceRole.entities.Payment.list(),
                base44.asServiceRole.entities.Behavior.list(),
                base44.asServiceRole.entities.Enrollment.list(),
            ]);

            backupData = {
                backupType: 'full',
                timestamp: new Date().toISOString(),
                data: {
                    students,
                    teachers,
                    classes,
                    assignments,
                    submissions,
                    exams,
                    examResults,
                    attendance,
                    fees,
                    payments,
                    behavior,
                    enrollments
                }
            };
        } else if (backupType === 'reports') {
            fileName = `SchoolMIS_ReportsBackup_${timestamp}.json`;
            
            const reportCards = await base44.asServiceRole.entities.ReportCard.list();
            
            backupData = {
                backupType: 'reports',
                timestamp: new Date().toISOString(),
                data: {
                    reportCards
                }
            };
        } else if (backupType === 'results') {
            fileName = `SchoolMIS_ResultsBackup_${timestamp}.json`;
            
            const [examResults, examAttempts, exams] = await Promise.all([
                base44.asServiceRole.entities.ExamResult.list(),
                base44.asServiceRole.entities.ExamAttempt.list(),
                base44.asServiceRole.entities.Exam.list(),
            ]);
            
            backupData = {
                backupType: 'results',
                timestamp: new Date().toISOString(),
                data: {
                    examResults,
                    examAttempts,
                    exams
                }
            };
        } else {
            return Response.json({ 
                success: false, 
                error: 'Invalid backup type' 
            }, { status: 400 });
        }

        // Convert data to JSON
        const jsonData = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });

        // Upload to Google Drive
        const metadata = {
            name: fileName,
            mimeType: 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const uploadResponse = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: form
            }
        );

        if (!uploadResponse.ok) {
            const error = await uploadResponse.text();
            return Response.json({ 
                success: false, 
                error: `Failed to upload to Google Drive: ${error}` 
            }, { status: 500 });
        }

        const uploadResult = await uploadResponse.json();

        return Response.json({
            success: true,
            message: `Backup completed successfully`,
            fileName: fileName,
            fileId: uploadResult.id,
            recordCount: backupType === 'full' 
                ? Object.values(backupData.data).flat().length 
                : backupData.data[Object.keys(backupData.data)[0]].length
        });

    } catch (error) {
        console.error('Backup error:', error);
        return Response.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
});