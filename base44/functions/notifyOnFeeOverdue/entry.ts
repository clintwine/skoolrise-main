import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { school_tenant_id } = body;

    if (!school_tenant_id) {
      return Response.json({ error: 'school_tenant_id required' }, { status: 400 });
    }

    // Get overdue invoices
    const overdueInvoices = await base44.asServiceRole.entities.FeeInvoice.filter({
      school_tenant_id,
      status: 'Overdue',
    });

    // Get parent profiles and student links
    const notifications = [];
    for (const invoice of overdueInvoices) {
      const student = await base44.asServiceRole.entities.Student.get(invoice.student_id);
      if (student && student.parent_of_student_ids) {
        const parentIds = JSON.parse(student.parent_of_student_ids || '[]');
        for (const parentId of parentIds) {
          const parent = await base44.asServiceRole.entities.Parent.get(parentId);
          if (parent && parent.user_id) {
            notifications.push({
              school_tenant_id,
              user_id: parent.user_id,
              user_email: parent.email,
              title: `Fee Payment Overdue: ${invoice.student_name}`,
              message: `Invoice #${invoice.invoice_number} for ${invoice.student_name} is overdue. Balance: ${invoice.balance}`,
              type: 'fee',
              entity_type: 'FeeInvoice',
              entity_id: invoice.id,
              is_read: false,
            });
          }
        }
      }
    }

    if (notifications.length > 0) {
      await base44.asServiceRole.entities.InAppNotification.bulkCreate(notifications);
    }

    return Response.json({
      success: true,
      message: 'Fee overdue notifications sent',
      count: notifications.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});