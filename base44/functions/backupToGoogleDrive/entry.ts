import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { backupType, school_tenant_id } = body;

    if (!school_tenant_id) {
      return Response.json({ error: 'school_tenant_id required' }, { status: 400 });
    }

    // Validate school tenant ownership
    const schoolTenant = await base44.entities.SchoolTenant.read(school_tenant_id);
    if (!schoolTenant) {
      return Response.json({ error: 'School not found' }, { status: 404 });
    }

    // Gather data based on backup type
    let backupData = { school_id: school_tenant_id, timestamp: new Date().toISOString() };
    const timestamp = new Date().toISOString().split('T')[0];
    let fileName = `backup-${timestamp}`;

    if (backupType === 'full' || backupType === 'all') {
      const [students, teachers, classes, assignments, exams, attendance, invoices, payments] = await Promise.all([
        base44.entities.Student.filter({ school_tenant_id }),
        base44.entities.Teacher.filter({ school_tenant_id }),
        base44.entities.Class.filter({ school_tenant_id }),
        base44.entities.Assignment.filter({ school_tenant_id }),
        base44.entities.Exam.filter({ school_tenant_id }),
        base44.entities.Attendance.filter({ school_tenant_id }),
        base44.entities.FeeInvoice.filter({ school_tenant_id }),
        base44.entities.Payment.filter({ school_tenant_id }),
      ]);
      backupData = { ...backupData, students, teachers, classes, assignments, exams, attendance, invoices, payments };
      fileName += '-full.json';
    } else if (backupType === 'reports') {
      const [reportCards, submissionGroups] = await Promise.all([
        base44.entities.ReportCard.filter({ school_tenant_id }),
        base44.entities.SubmissionGroup.filter({ school_tenant_id }),
      ]);
      backupData = { ...backupData, reportCards, submissionGroups };
      fileName += '-reports.json';
    } else if (backupType === 'results') {
      const [examResults, examAttempts, submissions] = await Promise.all([
        base44.entities.ExamResult.filter({ school_tenant_id }),
        base44.entities.ExamAttempt.filter({ school_tenant_id }),
        base44.entities.Submission.filter({ school_tenant_id }),
      ]);
      backupData = { ...backupData, examResults, examAttempts, submissions };
      fileName += '-results.json';
    }

    return Response.json({
      success: true,
      message: `${backupType} backup completed successfully`,
      fileName,
      size: JSON.stringify(backupData).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});